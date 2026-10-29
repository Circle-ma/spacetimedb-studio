import { createStore } from "solid-js";
import { DbConnectionBuilder, DbConnectionImpl } from "spacetimedb";
import {
  clearStoredToken,
  getDefaultDatabase,
  getDefaultHost,
  getStoredToken,
  saveConnectionPreferences,
} from "./storage";
import type { ConnectionConfig, ConnectionState, HostPingResult } from "./types";

/**
 * Normalized URL utility
 */
export function normalizeHost(host: string): string {
  let trimmed = host.trim();
  if (!trimmed) return "http://127.0.0.1:3000";
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, "");
}

/**
 * Initial reactive state
 */
const initialHost = getDefaultHost();
const initialDatabase = getDefaultDatabase();
const initialToken = getStoredToken(initialHost, initialDatabase);

export const [connectionState, setConnectionState] = createStore<ConnectionState>({
  status: "disconnected",
  host: initialHost,
  database: initialDatabase,
  token: initialToken,
  identity: null,
  connectionId: null,
  latencyMs: null,
  hostOnline: null,
  hostLatencyMs: null,
  isReconnecting: false,
  connectedAt: null,
  lastPingAt: null,
  httpHealthy: false,
  wsConnected: false,
  error: null,
});

// Fine-grained selector helpers
export const isConnected = () => connectionState.status === "connected";
export const isConnecting = () => connectionState.status === "connecting";
export const isError = () => connectionState.status === "error";
export const clientIdentity = () => connectionState.identity;
export const currentHost = () => connectionState.host;
export const currentDatabase = () => connectionState.database;
export const isHostOnline = () => connectionState.hostOnline;

let activeDbConnection: DbConnectionImpl<any> | null = null;
let pingIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Test host reachability via GET /v1/ping
 * Checks if the SpacetimeDB engine itself is running, independent of database.
 */
export async function pingHost(hostTarget?: string): Promise<HostPingResult> {
  const normHost = normalizeHost(hostTarget ?? connectionState.host);
  const startTime = performance.now();
  const pingUrl = `${normHost}/v1/ping`;

  try {
    const res = await fetch(pingUrl, {
      method: "GET",
      headers: { Accept: "*/*" },
    });
    const latency = Math.round(performance.now() - startTime);
    const ok = res.ok || res.status === 200;

    setConnectionState((s) => {
      s.hostOnline = ok;
      s.hostLatencyMs = latency;
      s.lastPingAt = new Date().toLocaleTimeString();
    });

    return { ok, latencyMs: latency, statusCode: res.status };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : String(err);

    setConnectionState((s) => {
      s.hostOnline = false;
      s.hostLatencyMs = latency;
    });

    return { ok: false, latencyMs: latency, statusCode: 0, error: errorMsg };
  }
}

/**
 * Test HTTP endpoint to inspect database health & schema
 */
export async function testHttpHealth(
  host: string,
  database: string,
  token?: string | null,
): Promise<{ ok: boolean; status: number; latencyMs: number; error?: string; raw?: unknown }> {
  const normHost = normalizeHost(host);
  const startTime = performance.now();
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const endpoint = `${normHost}/v1/database/${encodeURIComponent(database)}/schema?version=9`;

  try {
    let res = await fetch(endpoint, {
      method: "GET",
      headers,
    });

    if (!res.ok && res.status === 400) {
      const fallbackEndpoint = `${normHost}/v1/database/${encodeURIComponent(database)}/schema`;
      const fallbackRes = await fetch(fallbackEndpoint, {
        method: "GET",
        headers,
      });
      if (fallbackRes.ok) {
        res = fallbackRes;
      }
    }
    const latency = Math.round(performance.now() - startTime);

    if (res.ok) {
      let raw: unknown = null;
      try {
        raw = await res.json();
      } catch {
        // schema may not be json in older builds
      }
      return { ok: true, status: res.status, latencyMs: latency, raw };
    }

    const errText = await res.text().catch(() => "");
    return { ok: false, status: res.status, latencyMs: latency, error: errText || res.statusText };
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - startTime);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, latencyMs: latency, error: message };
  }
}

/**
 * Connect to SpacetimeDB 2.x
 */
export async function connectToDatabase(config?: Partial<ConnectionConfig>): Promise<boolean> {
  const host = normalizeHost(config?.host ?? connectionState.host);
  const database = (config?.database ?? connectionState.database).trim();

  if (!database) {
    setConnectionState((s) => {
      s.status = "error";
      s.error = {
        title: "Database Name Required",
        message: "Please specify a database name or identity to connect to.",
        timestamp: new Date().toLocaleTimeString(),
        troubleshootingSteps: [
          "Enter the name of your SpacetimeDB database module.",
          "If you haven't published a database yet, run `spacetime publish <name>` in your module directory.",
          "Run `spacetime list` to inspect local databases.",
        ],
      };
    });
    return false;
  }

  // Teardown any existing active connection
  disconnectFromDatabase();

  const token =
    config?.token !== undefined ? config.token : (getStoredToken(host, database) ?? null);

  // Set connecting state
  setConnectionState((s) => {
    s.status = "connecting";
    s.host = host;
    s.database = database;
    s.token = token;
    s.isReconnecting = false;
    s.error = null;
    s.httpHealthy = false;
    s.wsConnected = false;
  });

  // Stage 1: Isolated Host Ping via /v1/ping
  const hostPing = await pingHost(host);
  if (!hostPing.ok) {
    setConnectionState((s) => {
      s.status = "error";
      s.hostOnline = false;
      s.error = {
        title: "SpacetimeDB Instance Unreachable",
        message: `Unable to connect to SpacetimeDB host at ${host}. The daemon is not responding to /v1/ping.`,
        statusCode: 0,
        endpoint: `${host}/v1/ping`,
        timestamp: new Date().toLocaleTimeString(),
        troubleshootingSteps: [
          "Start your local SpacetimeDB instance: run `spacetime start` in your terminal.",
          `Verify the host URL and port (configured: ${host}). Default is http://127.0.0.1:3000.`,
          "Ensure port 3000 is not blocked by a firewall or occupied by another conflicting process.",
          "If SpacetimeDB is running inside Docker or WSL, ensure port 3000 is mapped to host (0.0.0.0:3000).",
        ],
      };
    });
    return false;
  }

  // Stage 2: Database Schema & Existence Probe
  const probe = await testHttpHealth(host, database, token);
  setConnectionState((s) => {
    s.latencyMs = probe.latencyMs;
    s.lastPingAt = new Date().toLocaleTimeString();
  });

  if (!probe.ok) {
    if (probe.status === 404) {
      setConnectionState((s) => {
        s.status = "error";
        s.error = {
          title: `Database "${database}" Not Found`,
          message: `The SpacetimeDB instance at ${host} is online (${hostPing.latencyMs}ms RTT), but no module named "${database}" has been published.`,
          statusCode: 404,
          endpoint: `${host}/v1/database/${database}/schema`,
          timestamp: new Date().toLocaleTimeString(),
          troubleshootingSteps: [
            `Publish your module: \`spacetime publish ${database}\` inside your module project directory.`,
            "Check the list of published databases: run `spacetime list` in terminal.",
            "Verify case sensitivity and correct spelling of the database name.",
          ],
        };
      });
      return false;
    }

    if (probe.status === 401 || probe.status === 403) {
      setConnectionState((s) => {
        s.status = "error";
        s.error = {
          title: "Authentication Rejected",
          message: `The database rejected the credentials provided: ${probe.error ?? "Unauthorized"}`,
          statusCode: probe.status,
          endpoint: `${host}/v1/database/${database}/schema`,
          timestamp: new Date().toLocaleTimeString(),
          troubleshootingSteps: [
            "Click 'Reset to Anonymous Identity' to clear the invalid token and obtain a fresh identity.",
            "Verify that your token was generated for this specific SpacetimeDB instance and database.",
            "Check that your token has not expired.",
          ],
        };
      });
      return false;
    }
  }

  // Pre-flight passed: HTTP is healthy
  setConnectionState((s) => {
    s.httpHealthy = true;
  });

  // Stage 3: Establish SpacetimeDB WebSocket Connection (with Automatic Reconnect)
  try {
    const dynamicModule = {
      tables: {},
      reducers: [],
      procedures: [],
      versionInfo: { cliVersion: "2.13.0" },
    };

    let builder = new DbConnectionBuilder(dynamicModule, (cfg) => new DbConnectionImpl(cfg))
      .withUri(host)
      .withDatabaseName(database)
      .withAutomaticReconnect()
      .withCompression("none");

    if (token) {
      builder = builder.withToken(token);
    }

    builder
      .onConnect((conn, identity, serverToken) => {
        const hexIdentity = identity.toHexString();
        const connectionIdStr = conn.connectionId?.toHexString?.() ?? "conn_active";

        setConnectionState((s) => {
          s.status = "connected";
          s.isReconnecting = false;
          s.identity = hexIdentity;
          s.connectionId = connectionIdStr;
          s.token = serverToken;
          s.wsConnected = true;
          s.connectedAt = new Date().toLocaleTimeString();
          s.error = null;
        });

        // Persist token & preferences
        saveConnectionPreferences({
          host,
          database,
          token: serverToken,
        });

        // Start periodic latency ping
        startPingTimer();
      })
      .onAutomaticReconnect((_conn, identity, serverToken) => {
        setConnectionState((s) => {
          s.status = "connected";
          s.isReconnecting = false;
          s.identity = identity.toHexString();
          s.token = serverToken;
          s.wsConnected = true;
          s.error = null;
        });
      })
      .onConnectError((_conn, error) => {
        const errMsg = error?.message ?? String(error);
        setConnectionState((s) => {
          s.status = "error";
          s.wsConnected = false;
          s.error = {
            title: "WebSocket Connection Failed",
            message: `Could not establish WebSocket subscription with SpacetimeDB: ${errMsg}`,
            endpoint: `${host}/v1/database/${database}/subscribe`,
            timestamp: new Date().toLocaleTimeString(),
            troubleshootingSteps: [
              "Verify that WebSocket connections to SpacetimeDB are not intercepted by an upstream proxy.",
              "If an authentication token was provided, try resetting to an anonymous identity.",
              `Check server logs with \`spacetime logs ${database}\`.`,
            ],
          };
        });
      })
      .onDisconnect((error: unknown) => {
        const errorMsg =
          error instanceof Error
            ? error.message
            : typeof error === "object" && error !== null && "message" in error
              ? String((error as { message: unknown }).message)
              : "";

        setConnectionState((s) => {
          s.wsConnected = false;
          if (s.status === "connected") {
            s.status = "disconnected";
            if (errorMsg) {
              s.error = {
                title: "Connection Closed",
                message: errorMsg,
                timestamp: new Date().toLocaleTimeString(),
                troubleshootingSteps: [
                  "Check if the SpacetimeDB instance stopped or restarted.",
                  "Click 'Reconnect' to re-establish the connection.",
                ],
              };
            }
          }
        });
        stopPingTimer();
      });

    activeDbConnection = builder.build();
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    setConnectionState((s) => {
      s.status = "error";
      s.error = {
        title: "Connection Initialization Error",
        message: errorMsg,
        timestamp: new Date().toLocaleTimeString(),
        troubleshootingSteps: [
          "Check that the SpacetimeDB server URI and Database name are properly formatted.",
          "Inspect browser developer console for detailed network logs.",
        ],
      };
    });
    return false;
  }
}

/**
 * Disconnect from SpacetimeDB
 */
export function disconnectFromDatabase(): void {
  stopPingTimer();
  if (activeDbConnection) {
    try {
      activeDbConnection.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    activeDbConnection = null;
  }
  setConnectionState((s) => {
    s.status = "disconnected";
    s.wsConnected = false;
    s.httpHealthy = false;
    s.connectionId = null;
  });
}

/**
 * Reset Identity: Clears the stored token and reconnects as a new anonymous user
 */
export async function resetIdentity(): Promise<void> {
  const host = connectionState.host;
  const database = connectionState.database;
  clearStoredToken(host, database);

  setConnectionState((s) => {
    s.token = null;
    s.identity = null;
  });

  if (database) {
    await connectToDatabase({ host, database, token: null });
  }
}

/**
 * Apply Custom Token: Simulates/impersonates a specific identity token
 */
export async function applyCustomToken(customToken: string): Promise<void> {
  const host = connectionState.host;
  const database = connectionState.database;
  const cleanToken = customToken.trim();

  if (database) {
    await connectToDatabase({ host, database, token: cleanToken || null });
  }
}

/**
 * Ping / RTT Measurement
 */
export async function pingInstance(): Promise<number | null> {
  const host = connectionState.host;
  const database = connectionState.database;
  if (!host) return null;

  if (database) {
    const probe = await testHttpHealth(host, database, connectionState.token);
    setConnectionState((s) => {
      s.latencyMs = probe.latencyMs;
      s.lastPingAt = new Date().toLocaleTimeString();
      if (probe.ok) s.httpHealthy = true;
    });
    return probe.latencyMs;
  }

  const hostPing = await pingHost(host);
  return hostPing.latencyMs;
}

function startPingTimer(): void {
  stopPingTimer();
  pingIntervalId = setInterval(async () => {
    if (connectionState.status === "connected") {
      await pingInstance();
    }
  }, 15000);
}

function stopPingTimer(): void {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
}

/**
 * Get active connection object
 */
export function getActiveDbConnection(): DbConnectionImpl<any> | null {
  return activeDbConnection;
}

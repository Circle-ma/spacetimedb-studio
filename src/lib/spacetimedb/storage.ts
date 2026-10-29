import type { ConnectionConfig, RecentConnection } from "./types";

const STORAGE_KEYS = {
  HOST: "stdb_studio_host",
  DATABASE: "stdb_studio_database",
  RECENT: "stdb_studio_recent_connections",
  TOKEN_PREFIX: "stdb_studio_token_",
};

export function cleanHost(host: string): string {
  let trimmed = host.trim();
  if (!trimmed) return "http://127.0.0.1:3000";
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, "");
}

export function getDefaultHost(): string {
  if (typeof window === "undefined") return "http://127.0.0.1:3000";
  const raw = localStorage.getItem(STORAGE_KEYS.HOST);
  return raw ? cleanHost(raw) : "http://127.0.0.1:3000";
}

export function getDefaultDatabase(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.DATABASE) || "";
}

export function getStoredToken(host: string, database: string): string | null {
  if (typeof window === "undefined" || !host || !database) return null;
  const key = `${STORAGE_KEYS.TOKEN_PREFIX}${encodeURIComponent(cleanHost(host))}_${encodeURIComponent(database.trim())}`;
  return localStorage.getItem(key);
}

export function saveStoredToken(host: string, database: string, token: string | null): void {
  if (typeof window === "undefined" || !host || !database) return;
  const key = `${STORAGE_KEYS.TOKEN_PREFIX}${encodeURIComponent(cleanHost(host))}_${encodeURIComponent(database.trim())}`;
  if (token) {
    localStorage.setItem(key, token.trim());
  } else {
    localStorage.removeItem(key);
  }
}

export function clearStoredToken(host: string, database: string): void {
  saveStoredToken(host, database, null);
}

export function saveConnectionPreferences(config: ConnectionConfig): void {
  if (typeof window === "undefined") return;
  const normHost = cleanHost(config.host);
  const cleanDb = config.database.trim();
  if (normHost) localStorage.setItem(STORAGE_KEYS.HOST, normHost);
  if (cleanDb) localStorage.setItem(STORAGE_KEYS.DATABASE, cleanDb);
  if (config.token !== undefined) {
    saveStoredToken(normHost, cleanDb, config.token);
  }
  recordRecentConnection(normHost, cleanDb);
}

export function getRecentConnections(): RecentConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearRecentConnections(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.RECENT);
}

export function recordRecentConnection(host: string, database: string): void {
  if (typeof window === "undefined" || !host || !database) return;
  try {
    const normHost = cleanHost(host);
    const cleanDb = database.trim();
    const recent = getRecentConnections().filter(
      (c) => !(c.host === normHost && c.database === cleanDb),
    );
    recent.unshift({
      host: normHost,
      database: cleanDb,
      lastConnected: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recent.slice(0, 8)));
  } catch {
    // Ignore storage quota or parsing errors
  }
}

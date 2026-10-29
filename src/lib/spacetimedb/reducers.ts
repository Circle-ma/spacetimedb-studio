import { createStore } from "solid-js";
import { connectionState, normalizeHost } from "./client";
import type { ReducerMeta, ReducerParamMeta } from "./schema";
import { tableExplorerState } from "./tables";

export interface TransactionRecord {
  id: string;
  reducerName: string;
  database: string;
  host: string;
  senderIdentity: string | null;
  status: "committed" | "failed" | "pending";
  args: unknown[];
  payloadRaw: string;
  durationMs: number | null;
  error: string | null;
  timestamp: string;
  timestampMs: number;
}

export interface ReducerStudioState {
  selectedReducerName: string | null;
  inputMode: "form" | "json";
  formValues: Record<string, string>;
  jsonInput: string;
  jsonValidationError: string | null;
  isDispatching: boolean;
  lastResult: TransactionRecord | null;
  transactionFeed: TransactionRecord[];
  filterTerm: string;
  statusFilter: "all" | "committed" | "failed";
}

const STORAGE_KEY_FEED = "stdb_studio_tx_feed";

function loadPersistedFeed(): TransactionRecord[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_FEED);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage errors
  }
  return [];
}

function persistFeed(feed: TransactionRecord[]) {
  try {
    // Retain up to latest 100 transaction records
    const sliced = feed.slice(0, 100);
    sessionStorage.setItem(STORAGE_KEY_FEED, JSON.stringify(sliced));
  } catch {
    // Ignore storage errors
  }
}

export const [reducerStudioState, setReducerStudioState] = createStore<ReducerStudioState>({
  selectedReducerName: null,
  inputMode: "form",
  formValues: {},
  jsonInput: "[]",
  jsonValidationError: null,
  isDispatching: false,
  lastResult: null,
  transactionFeed: loadPersistedFeed(),
  filterTerm: "",
  statusFilter: "all",
});

/**
 * Generate sensible default value for a parameter based on SATS category
 */
export function getDefaultParamValue(
  param: ReducerParamMeta,
  currentIdentity?: string | null,
): string {
  if (param.nullable) return "";
  if (param.category === "identity") {
    return currentIdentity || "0000000000000000000000000000000000000000000000000000000000000000";
  }
  if (param.category === "timestamp") {
    return String(Date.now() * 1000); // Microsecond or millisecond timestamp
  }
  if (param.typeDisplay.toLowerCase().includes("bool")) {
    return "false";
  }
  if (param.category === "primitive") {
    const td = param.typeDisplay.toLowerCase();
    if (td.includes("string")) return "";
    return "0";
  }
  if (param.category === "array") {
    return "[]";
  }
  if (param.category === "struct") {
    return "{}";
  }
  return "";
}

/**
 * Generate default JSON array payload for a reducer
 */
export function buildDefaultJsonArgs(
  reducer: ReducerMeta,
  currentIdentity?: string | null,
): string {
  const defaults = reducer.params.map((p) => {
    if (p.nullable) return null;
    if (p.category === "identity") {
      return currentIdentity || "0000000000000000000000000000000000000000000000000000000000000000";
    }
    if (p.category === "timestamp") {
      return Date.now() * 1000;
    }
    if (p.typeDisplay.toLowerCase().includes("bool")) {
      return false;
    }
    if (p.category === "primitive") {
      const td = p.typeDisplay.toLowerCase();
      if (td.includes("string")) return "";
      return 0;
    }
    if (p.category === "array") return [];
    if (p.category === "struct") return {};
    return "";
  });

  return JSON.stringify(defaults, null, 2);
}

/**
 * Select a reducer and prepopulate form and JSON fields
 */
export function selectReducer(reducer: ReducerMeta, currentIdentity?: string | null): void {
  const formVals: Record<string, string> = {};
  for (const p of reducer.params) {
    formVals[p.name] = getDefaultParamValue(p, currentIdentity);
  }

  const jsonStr = buildDefaultJsonArgs(reducer, currentIdentity);

  setReducerStudioState((s) => {
    s.selectedReducerName = reducer.name;
    s.formValues = formVals;
    s.jsonInput = jsonStr;
    s.jsonValidationError = null;
  });
}

/**
 * Parse Form Mode string values into typed arguments matching ReducerParamMeta
 */
export function parseFormArgs(
  params: ReducerParamMeta[],
  formValues: Record<string, string>,
): unknown[] {
  return params.map((p) => {
    const rawVal = formValues[p.name] ?? "";

    if (p.nullable && (rawVal === "" || rawVal === "null" || rawVal === "undefined")) {
      return null;
    }

    const typeLower = p.typeDisplay.toLowerCase().trim();

    // 1. Boolean
    if (typeLower.includes("bool")) {
      return rawVal === "true" || rawVal === "1";
    }

    // 2. Identity (32-byte hex or connection id)
    if (p.category === "identity" || typeLower === "identity" || typeLower === "connectionid") {
      return rawVal.trim();
    }

    // 3. String
    if (typeLower === "string") {
      return rawVal;
    }

    // 4. Exact Numeric Primitives (u8-u256, i8-i256, f32, f64)
    const isNumeric =
      p.category === "primitive" &&
      /^(u8|u16|u32|u64|u128|u256|i8|i16|i32|i64|i128|i256|f32|f64)$/i.test(p.typeDisplay.trim());
    if (isNumeric) {
      if (rawVal.trim() === "") return 0;
      const num = Number(rawVal);
      return Number.isNaN(num) ? 0 : num;
    }

    // 5. Timestamp
    if (p.category === "timestamp") {
      const num = Number(rawVal);
      return Number.isNaN(num) ? Date.now() * 1000 : num;
    }

    // 6. Complex Objects (Array, Struct)
    if (p.category === "struct" || p.category === "array") {
      try {
        return JSON.parse(rawVal);
      } catch {
        return p.category === "array" ? [] : {};
      }
    }

    // Default string
    return rawVal;
  });
}

/**
 * Dispatch transaction to SpacetimeDB HTTP endpoint:
 * POST /v1/database/:database/call/:reducer?confirmed=true
 */
export async function dispatchTransaction(
  reducerName: string,
  args: unknown[],
): Promise<TransactionRecord> {
  const host = connectionState.host;
  const database = connectionState.database;
  const token = connectionState.token;
  const identity = connectionState.identity;

  if (!host || !database) {
    throw new Error("No active SpacetimeDB database connected.");
  }

  const normHost = normalizeHost(host);
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const startTime = performance.now();
  const timestamp = new Date().toLocaleTimeString();
  const timestampMs = Date.now();
  const payloadFormatted = JSON.stringify(args, null, 2);

  setReducerStudioState((s) => {
    s.isDispatching = true;
  });

  const record: TransactionRecord = {
    id: txId,
    reducerName,
    database,
    host: normHost,
    senderIdentity: identity,
    status: "pending",
    args,
    payloadRaw: payloadFormatted,
    durationMs: null,
    error: null,
    timestamp,
    timestampMs,
  };

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${normHost}/v1/database/${encodeURIComponent(database)}/call/${encodeURIComponent(reducerName)}?confirmed=true`;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(args),
    });

    const durationMs = Math.round(performance.now() - startTime);
    record.durationMs = durationMs;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let parsedError = errText;
      try {
        const errJson = JSON.parse(errText);
        if (typeof errJson === "object" && errJson !== null) {
          parsedError =
            (errJson as { error?: string; message?: string }).error ||
            (errJson as { error?: string; message?: string }).message ||
            errText;
        }
      } catch {
        // use raw errText
      }
      record.status = "failed";
      record.error = parsedError || `Transaction rejected (HTTP status ${res.status})`;
    } else {
      record.status = "committed";
    }
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    record.durationMs = durationMs;
    record.status = "failed";
    record.error =
      err instanceof Error ? err.message : `Network or connection failure: ${String(err)}`;
  } finally {
    setReducerStudioState((s) => {
      s.isDispatching = false;
      s.lastResult = record;
      const updatedFeed = [record, ...s.transactionFeed];
      s.transactionFeed = updatedFeed;
      persistFeed(updatedFeed);
    });
  }

  return record;
}

/**
 * Load a past transaction record back into the studio editor for inspection / re-dispatch
 */
export function reloadTransactionIntoStudio(tx: TransactionRecord): void {
  const schema = tableExplorerState.schema;
  const reducer = schema?.reducers.find((r) => r.name === tx.reducerName);

  const formVals: Record<string, string> = {};
  if (reducer) {
    reducer.params.forEach((p, idx) => {
      const val = tx.args[idx];
      if (val === undefined || val === null) {
        formVals[p.name] = val === null ? "null" : "";
      } else if (typeof val === "object") {
        formVals[p.name] = JSON.stringify(val);
      } else {
        formVals[p.name] = String(val);
      }
    });
  }

  setReducerStudioState((s) => {
    s.selectedReducerName = tx.reducerName;
    s.jsonInput = tx.payloadRaw;
    s.formValues = formVals;
    s.lastResult = null;
    s.jsonValidationError = null;
  });
}

/**
 * Resets Reducer Studio state (used on database switch or disconnect)
 */
export function resetReducerState(): void {
  setReducerStudioState((s) => {
    s.selectedReducerName = null;
    s.formValues = {};
    s.jsonInput = "[]";
    s.lastResult = null;
    s.jsonValidationError = null;
  });
}

/**
 * Clear the audit feed
 */
export function clearTransactionFeed(): void {
  setReducerStudioState((s) => {
    s.transactionFeed = [];
    s.lastResult = null;
  });
  sessionStorage.removeItem(STORAGE_KEY_FEED);
}

/**
 * Export the audit feed as JSON
 */
export function exportTransactionFeedAsJson(): void {
  const feed = reducerStudioState.transactionFeed;
  const blob = new Blob([JSON.stringify(feed, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

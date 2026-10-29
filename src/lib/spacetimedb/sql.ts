import { createStore } from "solid-js";
import { connectionState } from "./client";
import { executeSqlQuery, type SqlQueryResult } from "./tables";

export interface SqlHistoryItem {
  id: string;
  query: string;
  executedAt: string;
  timestampMs: number;
  durationMs: number;
  rowCount: number;
  status: "success" | "error";
  error?: string | null;
}

export interface SqlRunnerState {
  query: string;
  isExecuting: boolean;
  result: SqlQueryResult | null;
  error: string | null;
  history: SqlHistoryItem[];
  selectedHistoryId: string | null;
}

const STORAGE_KEY_SQL_HISTORY = "stdb_studio_sql_history";

function loadPersistedHistory(): SqlHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_SQL_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistHistory(history: SqlHistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_SQL_HISTORY, JSON.stringify(history.slice(0, 50)));
  } catch {
    // Ignore storage quota
  }
}

export const [sqlRunnerState, setSqlRunnerState] = createStore<SqlRunnerState>({
  query: "",
  isExecuting: false,
  result: null,
  error: null,
  history: loadPersistedHistory(),
  selectedHistoryId: null,
});

/**
 * Execute the currently configured SQL query
 */
export async function runActiveQuery(): Promise<SqlQueryResult | null> {
  const host = connectionState.host;
  const database = connectionState.database;
  const token = connectionState.token;
  const rawQuery = sqlRunnerState.query.trim();

  if (!host || !database) {
    setSqlRunnerState((s) => {
      s.error = "No active SpacetimeDB database connected.";
    });
    return null;
  }

  if (!rawQuery) {
    setSqlRunnerState((s) => {
      s.error = "SQL query string cannot be empty.";
    });
    return null;
  }

  setSqlRunnerState((s) => {
    s.isExecuting = true;
    s.error = null;
  });

  const startTime = performance.now();
  const executedAt = new Date().toLocaleTimeString();
  const id = `sql_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const res = await executeSqlQuery(host, database, rawQuery, token);
    const durationMs = res.durationMs || Math.round(performance.now() - startTime);

    const historyItem: SqlHistoryItem = {
      id,
      query: rawQuery,
      executedAt,
      timestampMs: Date.now(),
      durationMs,
      rowCount: res.rowCount,
      status: "success",
    };

    setSqlRunnerState((s) => {
      s.isExecuting = false;
      s.result = res;
      s.error = null;
      const updatedHistory = [historyItem, ...s.history.filter((h) => h.query !== rawQuery)];
      s.history = updatedHistory;
      persistHistory(updatedHistory);
    });

    return res;
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : String(err);

    const historyItem: SqlHistoryItem = {
      id,
      query: rawQuery,
      executedAt,
      timestampMs: Date.now(),
      durationMs,
      rowCount: 0,
      status: "error",
      error: errorMsg,
    };

    setSqlRunnerState((s) => {
      s.isExecuting = false;
      s.error = errorMsg;
      const updatedHistory = [historyItem, ...s.history];
      s.history = updatedHistory;
      persistHistory(updatedHistory);
    });

    return null;
  }
}

/**
 * Reset SQL Runner state on connection/disconnection
 */
export function resetSqlState(): void {
  setSqlRunnerState((s) => {
    s.isExecuting = false;
    s.result = null;
    s.error = null;
    s.selectedHistoryId = null;
  });
}

/**
 * Load a past query from history into the editor
 */
export function loadHistoryQuery(item: SqlHistoryItem): void {
  setSqlRunnerState((s) => {
    s.query = item.query;
    s.selectedHistoryId = item.id;
    s.error = null;
  });
}

/**
 * Insert or replace query with a template
 */
export function setQueryText(text: string): void {
  setSqlRunnerState((s) => {
    s.query = text;
    s.selectedHistoryId = null;
    s.error = null;
  });
}

/**
 * Clear query history
 */
export function clearSqlHistory(): void {
  setSqlRunnerState((s) => {
    s.history = [];
    s.selectedHistoryId = null;
  });
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY_SQL_HISTORY);
  }
}

/**
 * Export SQL Result as JSON
 */
export function exportSqlResultAsJson(): void {
  const result = sqlRunnerState.result;
  if (!result || result.rows.length === 0) return;

  const cleanRows = result.rows.map((r) => {
    const clean = { ...r };
    delete clean.__rowId;
    delete clean.__rowKey;
    return clean;
  });

  const blob = new Blob([JSON.stringify(cleanRows, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `query_result_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export SQL Result as CSV
 */
export function exportSqlResultAsCsv(): void {
  const result = sqlRunnerState.result;
  if (!result || result.rows.length === 0 || result.columns.length === 0) return;

  const cols = result.columns;
  const header = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
  const lines = result.rows.map((row) =>
    cols
      .map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  const csvContent = [header, ...lines].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `query_result_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

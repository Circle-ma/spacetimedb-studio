import { createSignal, createStore } from "solid-js";
import { connectionState, normalizeHost } from "./client";
import type { ColumnMeta, ParsedModuleSchema } from "./schema";

export interface SqlQueryResult {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  durationMs: number;
  rawSchema?: unknown;
}

export interface TableExplorerState {
  schema: ParsedModuleSchema | null;
  selectedTableName: string | null;
  rows: Array<Record<string, unknown>>;
  columns: ColumnMeta[];
  primaryKeyName: string | null;
  isLoadingSchema: boolean;
  isLoadingRows: boolean;
  schemaError: string | null;
  queryError: string | null;
  lastUpdated: string | null;
  durationMs: number | null;
  filterText: string;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  isLiveSync: boolean;
  syncIntervalMs: number;
  currentPage: number;
  pageSize: number;
}

export const [tableExplorerState, setTableExplorerState] = createStore<TableExplorerState>({
  schema: null,
  selectedTableName: null,
  rows: [],
  columns: [],
  primaryKeyName: null,
  isLoadingSchema: false,
  isLoadingRows: false,
  schemaError: null,
  queryError: null,
  lastUpdated: null,
  durationMs: null,
  filterText: "",
  sortColumn: null,
  sortDirection: "asc",
  isLiveSync: true,
  syncIntervalMs: 2000,
  currentPage: 1,
  pageSize: 50,
});

// Set of cell keys currently animating: "rowKey:columnName"
export const [updatedCells, setUpdatedCells] = createSignal<Set<string>>(new Set());

let liveSyncTimer: ReturnType<typeof setInterval> | null = null;
let previousRowsCache = new Map<string, Record<string, unknown>>();
let isFetchingRows = false;

/**
 * Execute arbitrary SQL query via SpacetimeDB HTTP endpoint POST /v1/database/:database/sql
 */
export async function executeSqlQuery(
  host: string,
  database: string,
  sql: string,
  token?: string | null,
): Promise<SqlQueryResult> {
  const normHost = normalizeHost(host);
  const startTime = performance.now();

  const headers: HeadersInit = {
    "Content-Type": "text/plain",
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${normHost}/v1/database/${encodeURIComponent(database)}/sql`, {
    method: "POST",
    headers,
    body: sql.trim(),
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let cleanMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.error === "string") cleanMsg = parsed.error;
        else if (typeof parsed.message === "string") cleanMsg = parsed.message;
      }
    } catch {
      // Keep raw errText
    }
    throw new Error(cleanMsg || `SQL Execution failed (HTTP ${res.status})`);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { columns: [], rows: [], rowCount: 0, durationMs };
  }

  return normalizeSqlResponse(json, durationMs);
}

/**
 * Normalizes SpacetimeDB SQL response into uniform structured rows
 */
function normalizeSqlResponse(json: unknown, durationMs: number): SqlQueryResult {
  if (!json || typeof json !== "object") {
    return { columns: [], rows: [], rowCount: 0, durationMs };
  }

  const obj = json as Record<string, unknown>;

  // Format 1: { schema: [{ name: "col1" }, ...], rows: [[val1, val2], ...] }
  if (Array.isArray(obj.schema) && Array.isArray(obj.rows)) {
    const colNames = obj.schema.map((c, i) => {
      if (typeof c === "object" && c !== null && "name" in c) {
        return String((c as { name: unknown }).name);
      }
      if (typeof c === "string") {
        return c;
      }
      return `col_${i}`;
    });

    const rows = obj.rows.map((rowArr, rowIdx) => {
      const record: Record<string, unknown> = {};
      if (Array.isArray(rowArr)) {
        colNames.forEach((col, cIdx) => {
          record[col] = rowArr[cIdx];
        });
      } else if (typeof rowArr === "object" && rowArr !== null) {
        Object.assign(record, rowArr);
      }
      if (!record.__rowId) {
        record.__rowId = `row_${rowIdx}`;
      }
      return record;
    });

    return {
      columns: colNames,
      rows,
      rowCount: rows.length,
      durationMs,
      rawSchema: obj.schema,
    };
  }

  // Format 2: Array of objects
  if (Array.isArray(json)) {
    const colSet = new Set<string>();
    for (const item of json) {
      if (typeof item === "object" && item !== null) {
        for (const k of Object.keys(item)) {
          if (!k.startsWith("__")) colSet.add(k);
        }
      }
    }
    const columns = Array.from(colSet);
    const rows = json.map((r, i) => {
      const record = typeof r === "object" && r !== null ? { ...r } : { value: r };
      if (!record.__rowId) record.__rowId = `row_${i}`;
      return record;
    });
    return {
      columns,
      rows,
      rowCount: rows.length,
      durationMs,
    };
  }

  return { columns: [], rows: [], rowCount: 0, durationMs };
}

/**
 * Loads and subscribes to a specific table's live mirror
 */
export async function loadTableRows(tableName: string, highlightChanges = true): Promise<void> {
  const host = connectionState.host;
  const database = connectionState.database;
  const token = connectionState.token;

  if (!host || !database || !tableName) return;
  if (isFetchingRows) return; // Prevent re-entrancy / overlapping polling calls

  isFetchingRows = true;
  setTableExplorerState((s) => {
    s.isLoadingRows = true;
    s.queryError = null;
  });

  try {
    // SpacetimeDB SQL requires double quotes around identifiers to safely handle reserved keywords & case-sensitivity
    const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
    const query = `SELECT * FROM ${safeTableName};`;
    const result = await executeSqlQuery(host, database, query, token);

    // Stale target guard: If user navigated to another table while request was in-flight, discard
    if (tableExplorerState.selectedTableName !== tableName) {
      return;
    }

    // Look up primary key from cached schema
    const currentTableMeta = tableExplorerState.schema?.tables.find((t) => t.name === tableName);
    const pkName = currentTableMeta?.primaryKeyName ?? null;

    // Assign canonical row keys based on PK or row contents
    const rowsWithKeys = result.rows.map((row, idx) => {
      const pkVal = pkName && row[pkName] !== undefined ? String(row[pkName]) : null;
      const canonicalKey = pkVal || `row_${idx}`;
      return {
        ...row,
        __rowKey: canonicalKey,
      };
    });

    // Detect cell-level updates and trigger millisecond highlights
    if (highlightChanges && previousRowsCache.size > 0) {
      const newUpdatedKeys = new Set<string>();

      for (const row of rowsWithKeys) {
        const rowKey = String(row.__rowKey);
        const prevRow = previousRowsCache.get(rowKey);

        if (!prevRow) {
          // Brand new row: highlight all cells
          for (const col of result.columns) {
            newUpdatedKeys.add(`${rowKey}:${col}`);
          }
        } else {
          // Existing row: compare values
          for (const col of result.columns) {
            const oldVal = prevRow[col];
            const newVal = (row as Record<string, unknown>)[col];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              newUpdatedKeys.add(`${rowKey}:${col}`);
            }
          }
        }
      }

      if (newUpdatedKeys.size > 0) {
        setUpdatedCells(newUpdatedKeys);
        setTimeout(() => {
          setUpdatedCells((curr) => {
            const next = new Set(curr);
            for (const k of newUpdatedKeys) next.delete(k);
            return next;
          });
        }, 1200);
      }
    }

    // Update row cache
    previousRowsCache.clear();
    for (const r of rowsWithKeys) {
      previousRowsCache.set(String(r.__rowKey), r);
    }

    setTableExplorerState((s) => {
      s.rows = rowsWithKeys;
      s.selectedTableName = tableName;
      s.primaryKeyName = pkName;
      s.columns = currentTableMeta?.columns || [];
      s.lastUpdated = new Date().toLocaleTimeString();
      s.durationMs = result.durationMs;
      s.isLoadingRows = false;
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    setTableExplorerState((s) => {
      s.isLoadingRows = false;
      s.queryError = msg;
    });
  } finally {
    isFetchingRows = false;
  }
}

/**
 * Set active table and start tracking
 */
export async function selectTable(tableName: string): Promise<void> {
  previousRowsCache.clear();
  setUpdatedCells(new Set<string>());
  setTableExplorerState((s) => {
    s.selectedTableName = tableName;
    s.filterText = "";
    s.sortColumn = null;
    s.currentPage = 1; // Explicitly reset to page 1 on table switch
  });
  await loadTableRows(tableName, false);
}

/**
 * Resets table explorer state (used on database switch or disconnect)
 */
export function resetTableState(): void {
  stopLiveSync();
  previousRowsCache.clear();
  setUpdatedCells(new Set<string>());
  setTableExplorerState((s) => {
    s.schema = null;
    s.selectedTableName = null;
    s.rows = [];
    s.columns = [];
    s.primaryKeyName = null;
    s.currentPage = 1;
    s.queryError = null;
    s.schemaError = null;
    s.filterText = "";
    s.sortColumn = null;
  });
}

/**
 * Toggle live subscription stream
 */
export function toggleLiveSubscription(enable?: boolean): void {
  const shouldEnable = enable !== undefined ? enable : !tableExplorerState.isLiveSync;
  setTableExplorerState((s) => {
    s.isLiveSync = shouldEnable;
  });

  if (shouldEnable) {
    startLiveSync();
  } else {
    stopLiveSync();
  }
}

export function startLiveSync(): void {
  stopLiveSync();
  if (!tableExplorerState.isLiveSync) return;

  liveSyncTimer = setInterval(async () => {
    const table = tableExplorerState.selectedTableName;
    if (table && connectionState.status === "connected") {
      await loadTableRows(table, true);
    }
  }, tableExplorerState.syncIntervalMs);
}

export function stopLiveSync(): void {
  if (liveSyncTimer) {
    clearInterval(liveSyncTimer);
    liveSyncTimer = null;
  }
}

/**
 * Export current view rows as JSON
 */
export function exportTableRowsAsJson(customRows?: Array<Record<string, unknown>>): void {
  const tableName = tableExplorerState.selectedTableName || "table";
  const sourceRows = customRows || tableExplorerState.rows;
  const rows = sourceRows.map((r) => {
    const clean = { ...r };
    delete clean.__rowKey;
    delete clean.__rowId;
    return clean;
  });

  const blob = new Blob([JSON.stringify(rows, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tableName}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

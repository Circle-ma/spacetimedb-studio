/**
 * SpacetimeDB Studio Types & Protocol Definitions (SpacetimeDB 2.x)
 */

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface ConnectionConfig {
  host: string;
  database: string;
  token?: string | null;
}

export interface ConnectionErrorInfo {
  title: string;
  message: string;
  statusText?: string;
  statusCode?: number;
  timestamp: string;
  endpoint?: string;
  details?: string;
  troubleshootingSteps: string[];
}

export interface HostPingResult {
  ok: boolean;
  latencyMs: number;
  statusCode: number;
  error?: string;
}

export interface ConnectionState {
  status: ConnectionStatus;
  host: string;
  database: string;
  token: string | null;
  identity: string | null;
  connectionId: string | null;
  latencyMs: number | null;
  hostOnline: boolean | null;
  hostLatencyMs: number | null;
  isReconnecting: boolean;
  connectedAt: string | null;
  lastPingAt: string | null;
  httpHealthy: boolean;
  wsConnected: boolean;
  error: ConnectionErrorInfo | null;
}

export interface RecentConnection {
  host: string;
  database: string;
  lastConnected: string;
}

/**
 * SpacetimeDB 2.x Introspected Schema Definitions
 */
export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  nullable?: boolean;
}

export interface TableDefinition {
  name: string;
  sourceName?: string;
  columns: ColumnDefinition[];
  primaryKey?: string;
  rowCount?: number;
}

export interface ReducerDefinition {
  name: string;
  params: Array<{
    name: string;
    type: string;
  }>;
}

export interface DatabaseSchema {
  tables: Record<string, TableDefinition>;
  reducers: Record<string, ReducerDefinition>;
  raw?: unknown;
}

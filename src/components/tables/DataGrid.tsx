import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Code,
  Copy,
  Download,
  Eye,
  Key,
  Pause,
  Play,
  RefreshCw,
} from "lucide-solid";
import { createEffect, createMemo, createSignal, For, Match, Show, Switch } from "solid-js";
import { css, cx } from "styled-system/css";
import { Badge, Box, Button, HStack, Input, Text, VStack } from "~/components/ui";
import type { ColumnMeta, TableMeta } from "~/lib/spacetimedb/schema";
import {
  exportTableRowsAsJson,
  loadTableRows,
  tableExplorerState,
  toggleLiveSubscription,
  updatedCells,
} from "~/lib/spacetimedb/tables";
import { RowDetailModal } from "./RowDetailModal";
import { SchemaViewerModal } from "./SchemaViewerModal";

const spinAnimation = css({
  animation: "spin",
});

interface DataGridProps {
  tableMeta: TableMeta | null;
}

export function DataGrid(props: DataGridProps) {
  const [filterQuery, setFilterQuery] = createSignal("");
  const [sortCol, setSortCol] = createSignal<string | null>(null);
  const [sortAsc, setSortAsc] = createSignal(true);
  const [copiedCellKey, setCopiedCellKey] = createSignal<string | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = createSignal(false);

  // Pagination & Row Detail Modal State
  const [currentPage, setCurrentPage] = createSignal(1);
  const [pageSize, setPageSize] = createSignal(50);
  const [selectedRowForDetail, setSelectedRowForDetail] = createSignal<Record<
    string,
    unknown
  > | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = createSignal(false);

  // Reset filters and sorting on table switch to avoid cross-table state pollution (Solid 2.0 compute + effect)
  createEffect(
    () => props.tableMeta?.name,
    () => {
      setFilterQuery("");
      setSortCol(null);
      setSortAsc(true);
      setCurrentPage(1);
    },
  );

  const fallbackCopy = (text: string) => {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    } catch {
      // Ignore
    }
  };

  const copyCell = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopiedCellKey(key);
    setTimeout(() => {
      setCopiedCellKey((curr) => (curr === key ? null : curr));
    }, 1500);
  };

  const handleSort = (colName: string) => {
    if (sortCol() === colName) {
      if (sortAsc()) {
        setSortAsc(false);
      } else {
        setSortCol(null);
        setSortAsc(true);
      }
    } else {
      setSortCol(colName);
      setSortAsc(true);
    }
  };

  // 1. Filtered & Sorted Rows
  const processedRows = createMemo(() => {
    let rows = tableExplorerState.rows || [];
    const term = filterQuery().trim().toLowerCase();

    // Text filter
    if (term) {
      rows = rows.filter((r) =>
        Object.entries(r).some(([key, val]) => {
          if (key.startsWith("__")) return false;
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        }),
      );
    }

    // Sort
    const col = sortCol();
    if (col) {
      const asc = sortAsc();
      rows = [...rows].sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return asc ? 1 : -1;
        if (valB === null || valB === undefined) return asc ? -1 : 1;
        if (typeof valA === "number" && typeof valB === "number") {
          return asc ? valA - valB : valB - valA;
        }
        return asc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  });

  // 2. Client-side Pagination Slicing
  const totalFilteredCount = createMemo(() => processedRows().length);
  const totalPages = createMemo(() => Math.max(1, Math.ceil(totalFilteredCount() / pageSize())));

  const paginatedRows = createMemo(() => {
    const page = Math.min(currentPage(), totalPages());
    const size = pageSize();
    const start = (page - 1) * size;
    return processedRows().slice(start, start + size);
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages()) {
      setCurrentPage(newPage);
    }
  };

  const openRowDetail = (row: Record<string, unknown>) => {
    setSelectedRowForDetail(row);
    setIsDetailModalOpen(true);
  };

  const columns = () => {
    if (props.tableMeta && props.tableMeta.columns.length > 0) {
      return props.tableMeta.columns;
    }
    const firstRow = tableExplorerState.rows[0];
    if (firstRow) {
      return Object.keys(firstRow)
        .filter((k) => !k.startsWith("__"))
        .map((k) => ({
          name: k,
          typeDisplay: "Unknown",
          category: "other" as const,
          isPrimaryKey: k.toLowerCase() === "id",
          nullable: true,
          rawType: null,
        }));
    }
    return [];
  };

  return (
    <VStack gap="4" alignItems="stretch" w="full">
      {/* 1. Data Grid Control Toolbar */}
      <div
        class={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "3",
          p: "3",
          bg: "bg.subtle",
          borderRadius: "md",
          borderWidth: "1px",
          borderColor: "border.subtle",
        })}
      >
        {/* Left: Table Title & Quick Filter */}
        <div class={css({ display: "flex", alignItems: "center", gap: "3", flexWrap: "wrap" })}>
          <HStack gap="2" alignItems="center">
            <Text size="sm" fontWeight="bold">
              {props.tableMeta?.name || "Table View"}
            </Text>
            <Badge variant="subtle" size="sm">
              {totalFilteredCount()} {totalFilteredCount() === 1 ? "row" : "rows"}
            </Badge>
          </HStack>

          <div class={css({ position: "relative", minW: "[180px]", maxW: "[260px]" })}>
            <Input
              size="sm"
              placeholder="Filter table rows..."
              value={filterQuery()}
              onInput={(e) => {
                setFilterQuery(e.currentTarget.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div class={css({ display: "flex", gap: "2", alignItems: "center", flexWrap: "wrap" })}>
          {/* Live Subscription Toggle */}
          <Button
            variant={tableExplorerState.isLiveSync ? "solid" : "outline"}
            size="sm"
            onClick={() => toggleLiveSubscription()}
            title="Toggle live periodic SQL subscription"
            class={css({ minW: "[116px]", justifyContent: "center" })}
          >
            <Show
              when={tableExplorerState.isLiveSync}
              fallback={
                <HStack gap="1.5" alignItems="center">
                  <Play size={12} />
                  <span>Resume Sync</span>
                </HStack>
              }
            >
              <HStack gap="1.5" alignItems="center">
                <Box
                  w="2"
                  h="2"
                  borderRadius="full"
                  bg="emerald.400"
                  class={css({
                    boxShadow: "[0_0_6px_rgba(52,211,153,0.8)]",
                  })}
                />
                <Pause size={12} />
                <span>Live (2s)</span>
              </HStack>
            </Show>
          </Button>

          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (props.tableMeta) loadTableRows(props.tableMeta.name, true, false);
            }}
            disabled={tableExplorerState.isLoadingRows}
            title="Refresh table snapshot"
            class={css({ minW: "[90px]", justifyContent: "center" })}
          >
            <RefreshCw size={13} class={tableExplorerState.isLoadingRows ? spinAnimation : ""} />
            <span>Refresh</span>
          </Button>

          {/* View Schema Modal Trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSchemaModalOpen(true)}
            title="Inspect Table Schema and SATS AST"
          >
            <Code size={13} />
            Schema
          </Button>

          {/* Export JSON (Full Filtered Set) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportTableRowsAsJson(processedRows())}
            disabled={totalFilteredCount() === 0}
            title={`Export ${totalFilteredCount()} rows as JSON`}
          >
            <Download size={13} />
            Export
          </Button>
        </div>
      </div>

      {/* Query Error Alert */}
      <Show when={tableExplorerState.queryError}>
        <div
          class={css({
            p: "3",
            borderRadius: "md",
            borderWidth: "1px",
            bg: "danger.subtle",
            borderColor: "danger.border",
          })}
        >
          <Text size="xs" fontWeight="semibold" color="danger.default">
            Query Error: {tableExplorerState.queryError}
          </Text>
        </div>
      </Show>

      {/* 2. Interactive Solid 2.0 Fine-Grained Reactive Data Grid */}
      <div
        class={css({
          w: "full",
          overflowX: "auto",
          borderWidth: "1px",
          borderColor: "border.subtle",
          borderRadius: "md",
          bg: "bg.default",
          overflowY: "auto",
          maxH: "[65vh]",
        })}
      >
        <table
          class={css({
            w: "full",
            fontSize: "xs",
            textAlign: "left",
            borderCollapse: "collapse",
          })}
        >
          {/* Header Row */}
          <thead class={css({ position: "sticky", top: "0", bg: "bg.subtle", zIndex: "[10]" })}>
            <tr class={css({ borderBottomWidth: "1px", borderColor: "border.default" })}>
              <th
                class={css({
                  p: "2.5",
                  fontWeight: "semibold",
                  color: "fg.muted",
                  w: "14",
                  textAlign: "center",
                })}
              >
                #
              </th>
              <For each={columns()}>
                {(col) => {
                  const isSorted = () => sortCol() === col.name;
                  return (
                    <th
                      class={css({
                        p: "2.5",
                        fontWeight: "semibold",
                        borderRightWidth: "1px",
                        borderColor: "border.subtle",
                        cursor: "pointer",
                        userSelect: "none",
                        minW: "[130px]",
                        _hover: { bg: "bg.muted" },
                      })}
                      onClick={() => handleSort(col.name)}
                    >
                      <HStack gap="2" justifyContent="space-between" alignItems="center">
                        <HStack gap="1.5" alignItems="center">
                          <Show when={col.isPrimaryKey}>
                            <span title="Primary Key">
                              <Key size={12} color="var(--colors-accent-default)" />
                            </span>
                          </Show>
                          <span class={css({ fontWeight: col.isPrimaryKey ? "bold" : "medium" })}>
                            {col.name}
                          </span>
                        </HStack>

                        <HStack gap="1" alignItems="center">
                          <Badge variant="subtle" size="sm">
                            {col.typeDisplay}
                          </Badge>
                          <Show
                            when={isSorted()}
                            fallback={<ArrowUpDown size={11} color="var(--colors-fg-muted)" />}
                          >
                            <Show
                              when={sortAsc()}
                              fallback={
                                <ArrowDown size={12} color="var(--colors-accent-default)" />
                              }
                            >
                              <ArrowUp size={12} color="var(--colors-accent-default)" />
                            </Show>
                          </Show>
                        </HStack>
                      </HStack>
                    </th>
                  );
                }}
              </For>
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody>
            <Show
              when={paginatedRows().length > 0}
              fallback={
                <tr>
                  <td
                    colspan={columns().length + 1}
                    class={css({
                      p: "8",
                      textAlign: "center",
                      color: "fg.muted",
                    })}
                  >
                    <Show
                      when={tableExplorerState.isLoadingRows}
                      fallback={
                        <VStack gap="2" alignItems="center">
                          <Text size="sm">No rows found in this table.</Text>
                          <Show when={filterQuery()}>
                            <Text size="xs" color="fg.muted">
                              Try clearing your search filter.
                            </Text>
                          </Show>
                        </VStack>
                      }
                    >
                      <HStack gap="2" justifyContent="center">
                        <RefreshCw size={16} class={spinAnimation} />
                        <Text size="xs">Loading table rows...</Text>
                      </HStack>
                    </Show>
                  </td>
                </tr>
              }
            >
              <For each={paginatedRows()}>
                {(row, rowIdx) => {
                  const absoluteIndex = () => (currentPage() - 1) * pageSize() + rowIdx() + 1;
                  const rowKey = () => String(row.__rowKey || `row_${absoluteIndex()}`);

                  return (
                    <tr
                      class={css({
                        borderBottomWidth: "1px",
                        borderColor: "border.subtle",
                        _hover: { bg: "bg.subtle" },
                        transitionProperty: "colors",
                        transitionDuration: "fast",
                      })}
                    >
                      {/* Row Index & Detail Trigger */}
                      <td
                        class={css({
                          p: "2",
                          textAlign: "center",
                          color: "fg.muted",
                          fontFamily: "mono",
                          fontSize: "2xs",
                        })}
                      >
                        <HStack gap="1" justifyContent="center" alignItems="center">
                          <button
                            type="button"
                            class={css({
                              cursor: "pointer",
                              p: "1",
                              bg: "transparent",
                              border: "none",
                              color: "fg.muted",
                              _hover: { color: "accent.default" },
                            })}
                            onClick={() => openRowDetail(row)}
                            title="Inspect full row details & JSON"
                          >
                            <Eye size={12} />
                          </button>
                          <span>{absoluteIndex()}</span>
                        </HStack>
                      </td>

                      {/* Data Cells */}
                      <For each={columns()}>
                        {(col) => {
                          const cellKey = () => `${rowKey()}:${col.name}`;
                          const isHighlighted = () => updatedCells().has(cellKey());
                          const val = () => row[col.name];

                          return (
                            <td
                              class={cx(
                                css({
                                  p: "2.5",
                                  borderRightWidth: "1px",
                                  borderColor: "border.subtle",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxW: "[320px]",
                                }),
                                isHighlighted() && "cell-highlight-active",
                              )}
                            >
                              <CellRenderer
                                value={val()}
                                column={col}
                                onCopy={(text) => copyCell(text, cellKey())}
                                isCopied={copiedCellKey() === cellKey()}
                              />
                            </td>
                          );
                        }}
                      </For>
                    </tr>
                  );
                }}
              </For>
            </Show>
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Controls Toolbar */}
      <Show when={totalFilteredCount() > 0}>
        <div
          class={css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "3",
            p: "2.5",
            bg: "bg.subtle",
            borderRadius: "md",
            borderWidth: "1px",
            borderColor: "border.subtle",
          })}
        >
          {/* Left: Row Range & Page Size Buttons */}
          <div class={css({ display: "flex", alignItems: "center", gap: "3", flexWrap: "wrap" })}>
            <Text size="xs" color="fg.muted">
              Showing{" "}
              <span class={css({ fontWeight: "semibold", color: "fg.default" })}>
                {(currentPage() - 1) * pageSize() + 1}
              </span>
              {" - "}
              <span class={css({ fontWeight: "semibold", color: "fg.default" })}>
                {Math.min(currentPage() * pageSize(), totalFilteredCount())}
              </span>{" "}
              of{" "}
              <span class={css({ fontWeight: "semibold", color: "fg.default" })}>
                {totalFilteredCount()}
              </span>{" "}
              rows
            </Text>

            <HStack gap="1.5" alignItems="center">
              <Text size="xs" color="fg.muted">
                Per page:
              </Text>
              <For each={[25, 50, 100, 200]}>
                {(size) => (
                  <button
                    type="button"
                    class={css({
                      px: "1.5",
                      py: "0.5",
                      fontSize: "2xs",
                      borderRadius: "sm",
                      cursor: "pointer",
                      borderWidth: "1px",
                      borderColor: pageSize() === size ? "accent.default" : "border.subtle",
                      bg: pageSize() === size ? "accent.default" : "bg.default",
                      color: pageSize() === size ? "white" : "fg.default",
                      fontWeight: pageSize() === size ? "bold" : "normal",
                    })}
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                  >
                    {size}
                  </button>
                )}
              </For>
            </HStack>
          </div>

          {/* Right: Page Navigation */}
          <HStack gap="2" alignItems="center">
            <Button
              variant="outline"
              size="xs"
              onClick={() => handlePageChange(currentPage() - 1)}
              disabled={currentPage() <= 1}
              title="Previous page"
            >
              <ChevronLeft size={13} />
              Prev
            </Button>

            <Text size="xs" color="fg.muted" class={css({ px: "1" })}>
              Page{" "}
              <span class={css({ fontWeight: "semibold", color: "fg.default" })}>
                {currentPage()}
              </span>{" "}
              / {totalPages()}
            </Text>

            <Button
              variant="outline"
              size="xs"
              onClick={() => handlePageChange(currentPage() + 1)}
              disabled={currentPage() >= totalPages()}
              title="Next page"
            >
              Next
              <ChevronRight size={13} />
            </Button>
          </HStack>
        </div>
      </Show>

      {/* 4. Footer Telemetry */}
      <div
        class={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          px: "1",
        })}
      >
        <HStack gap="3" alignItems="center">
          <Text size="xs" color="fg.muted">
            Last sync: {tableExplorerState.lastUpdated || "Never"}
          </Text>
          <Show when={tableExplorerState.durationMs !== null}>
            <Text size="xs" color="fg.muted">
              RTT: {tableExplorerState.durationMs}ms
            </Text>
          </Show>
        </HStack>

        <Text size="xs" color="fg.muted">
          Solid 2.0 Zero-VDOM Reactive Table Mirror
        </Text>
      </div>

      {/* Modals */}
      <SchemaViewerModal
        table={props.tableMeta}
        isOpen={isSchemaModalOpen()}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <RowDetailModal
        isOpen={isDetailModalOpen()}
        onClose={() => setIsDetailModalOpen(false)}
        tableName={props.tableMeta?.name || "Table"}
        row={selectedRowForDetail()}
        columns={columns()}
        primaryKeyName={props.tableMeta?.primaryKeyName ?? null}
      />
    </VStack>
  );
}

/**
 * Intelligent Cell Formatter
 */
interface CellRendererProps {
  value: unknown;
  column: ColumnMeta;
  onCopy: (text: string) => void;
  isCopied: boolean;
}

function CellRenderer(props: CellRendererProps) {
  const valueType = createMemo(() => {
    const v = props.value;
    if (v === null || v === undefined) return "null";
    if (v === "") return "empty_string";
    if (typeof v === "boolean") return "boolean";

    const unwrapped = Array.isArray(v) && v.length === 1 ? v[0] : v;

    if (
      props.column.category === "identity" ||
      (typeof unwrapped === "string" &&
        (unwrapped.startsWith("0x") || unwrapped.length >= 32) &&
        /^[0-9a-fA-Fx]+$/.test(unwrapped))
    ) {
      return "identity";
    }

    const num = Number(unwrapped);
    if (!Number.isNaN(num) && (props.column.category === "timestamp" || num > 1000000000000)) {
      return "timestamp";
    }

    if (typeof v === "object") return "object";
    if (typeof v === "bigint" || (typeof v === "number" && !Number.isNaN(v))) {
      return "number";
    }
    return "string";
  });

  return (
    <Switch>
      <Match when={valueType() === "null"}>
        <span class={css({ color: "fg.muted", opacity: 0.45, fontStyle: "italic" })}>null</span>
      </Match>

      <Match when={valueType() === "empty_string"}>
        <span
          class={css({
            color: "fg.muted",
            opacity: 0.4,
            fontStyle: "italic",
            fontSize: "2xs",
          })}
        >
          (empty)
        </span>
      </Match>

      <Match when={valueType() === "boolean"}>
        <Badge variant={props.value ? "solid" : "subtle"} size="sm">
          {props.value ? "true" : "false"}
        </Badge>
      </Match>

      <Match when={valueType() === "identity"}>
        {(() => {
          const rawVal =
            Array.isArray(props.value) && props.value.length === 1
              ? String(props.value[0])
              : String(props.value);
          const cleanHex = rawVal.replace(/^0x/, "");
          const displayHex = `0x${cleanHex.slice(0, 8)}...${cleanHex.slice(-6)}`;
          return (
            <HStack gap="1" alignItems="center">
              <span
                class={css({
                  fontFamily: "mono",
                  color: "accent.default",
                  fontSize: "2xs",
                })}
                title={rawVal}
              >
                {displayHex}
              </span>
              <button
                type="button"
                class={css({
                  cursor: "pointer",
                  p: "0.5",
                  bg: "transparent",
                  border: "none",
                  color: "fg.muted",
                  _hover: { color: "fg.default" },
                })}
                onClick={() => props.onCopy(rawVal)}
                title="Copy full Identity"
              >
                <Show when={props.isCopied} fallback={<Copy size={11} />}>
                  <Check size={11} color="var(--colors-accent-default)" />
                </Show>
              </button>
            </HStack>
          );
        })()}
      </Match>

      <Match when={valueType() === "timestamp"}>
        {(() => {
          const rawVal =
            Array.isArray(props.value) && props.value.length === 1 ? props.value[0] : props.value;
          const num = Number(rawVal);
          const dateMs = num > 100000000000000 ? Math.floor(num / 1000) : num;
          const d = new Date(dateMs);
          return (
            <span class={css({ fontFamily: "mono", fontSize: "2xs" })} title={String(rawVal)}>
              {Number.isNaN(d.getTime()) ? String(rawVal) : d.toLocaleString()}
            </span>
          );
        })()}
      </Match>

      <Match when={valueType() === "object"}>
        <HStack gap="1" alignItems="center">
          <span
            class={css({
              fontFamily: "mono",
              fontSize: "2xs",
              color: "fg.muted",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxW: "[200px]",
            })}
            title={JSON.stringify(props.value)}
          >
            {JSON.stringify(props.value)}
          </span>
          <button
            type="button"
            class={css({
              cursor: "pointer",
              p: "0.5",
              bg: "transparent",
              border: "none",
              color: "fg.muted",
              _hover: { color: "fg.default" },
            })}
            onClick={() => props.onCopy(JSON.stringify(props.value))}
            title="Copy JSON"
          >
            <Show when={props.isCopied} fallback={<Copy size={11} />}>
              <Check size={11} color="var(--colors-accent-default)" />
            </Show>
          </button>
        </HStack>
      </Match>

      <Match when={valueType() === "number"}>
        <span class={css({ fontFamily: "mono", fontWeight: "medium" })}>{String(props.value)}</span>
      </Match>

      <Match when={valueType() === "string"}>
        <span>{String(props.value)}</span>
      </Match>
    </Switch>
  );
}

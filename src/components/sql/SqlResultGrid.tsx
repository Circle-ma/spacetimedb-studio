import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Table as TableIcon,
} from "lucide-solid";
import { createEffect, createMemo, createSignal, For, Match, Show, Switch } from "solid-js";
import { css } from "styled-system/css";
import { RowDetailModal } from "~/components/tables/RowDetailModal";
import { Badge, Button, HStack, Input, Text, VStack } from "~/components/ui";
import { exportSqlResultAsCsv, exportSqlResultAsJson, sqlRunnerState } from "~/lib/spacetimedb/sql";

const spinAnimation = css({
  animation: "spin",
});

export function SqlResultGrid() {
  const [currentPage, setCurrentPage] = createSignal(1);
  const pageSize = 50;
  const [sortCol, setSortCol] = createSignal<string | null>(null);
  const [sortAsc, setSortAsc] = createSignal(true);
  const [filterText, setFilterText] = createSignal("");
  const [copiedKey, setCopiedKey] = createSignal<string | null>(null);
  const [selectedRowForDetail, setSelectedRowForDetail] = createSignal<Record<
    string,
    unknown
  > | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = createSignal(false);

  // Automatically reset pagination, sorting, and filter whenever a new query finishes
  createEffect(
    () => sqlRunnerState.result,
    () => {
      setCurrentPage(1);
      setSortCol(null);
      setSortAsc(true);
      setFilterText("");
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
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
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

  const processedRows = createMemo(() => {
    let rows = sqlRunnerState.result?.rows || [];

    // 1. Text filter search
    const query = filterText().trim().toLowerCase();
    if (query) {
      rows = rows.filter((row) =>
        Object.entries(row).some(([key, val]) => {
          if (key.startsWith("__")) return false;
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        }),
      );
    }

    // 2. Column sorting
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

  const totalRowsCount = createMemo(() => processedRows().length);
  const totalPages = createMemo(() => Math.max(1, Math.ceil(totalRowsCount() / pageSize)));

  const pagedRows = createMemo(() => {
    const page = Math.min(currentPage(), totalPages());
    const size = pageSize;
    const start = (page - 1) * size;
    return processedRows().slice(start, start + size);
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages()) {
      setCurrentPage(newPage);
    }
  };

  return (
    <VStack gap="3" alignItems="stretch" w="full">
      {/* 1. Header Metrics, Search & Export Toolbar */}
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
        {/* Left: Metrics */}
        <HStack gap="2.5" alignItems="center">
          <TableIcon size={16} color="var(--colors-accent-default)" />
          <Text size="xs" fontWeight="bold">
            Query Results
          </Text>

          <Show when={sqlRunnerState.result}>
            {(res) => (
              <HStack gap="2" alignItems="center">
                <Badge variant="solid" size="sm">
                  {res().rowCount} {res().rowCount === 1 ? "row" : "rows"}
                </Badge>
                <Badge variant="subtle" size="sm">
                  {res().columns.length} cols
                </Badge>
                <Badge variant="subtle" size="sm">
                  RTT {res().durationMs}ms
                </Badge>
              </HStack>
            )}
          </Show>
        </HStack>

        {/* Center: Search Filter (if results exist) */}
        <Show when={sqlRunnerState.result && sqlRunnerState.result.rows.length > 0}>
          <HStack gap="1.5" alignItems="center" maxW="[240px]" class={css({ flex: "1" })}>
            <Search size={13} color="var(--colors-fg-muted)" />
            <Input
              size="sm"
              placeholder="Filter results..."
              value={filterText()}
              onInput={(e) => {
                setFilterText(e.currentTarget.value);
                setCurrentPage(1);
              }}
            />
          </HStack>
        </Show>

        {/* Right: Export Actions */}
        <HStack gap="2" alignItems="center">
          <Button
            variant="ghost"
            size="xs"
            onClick={exportSqlResultAsJson}
            disabled={!sqlRunnerState.result || sqlRunnerState.result.rows.length === 0}
            title="Export query result as JSON"
          >
            <Download size={13} />
            Export JSON
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={exportSqlResultAsCsv}
            disabled={!sqlRunnerState.result || sqlRunnerState.result.rows.length === 0}
            title="Export query result as CSV"
          >
            <FileSpreadsheet size={13} />
            Export CSV
          </Button>
        </HStack>
      </div>

      {/* 2. Error Feedback Alert */}
      <Show when={sqlRunnerState.error}>
        {(err) => (
          <div
            class={css({
              p: "3.5",
              borderRadius: "md",
              borderWidth: "1px",
              display: "flex",
              flexDirection: "column",
              gap: "2",
              bg: "danger.subtle",
              borderColor: "danger.border",
            })}
          >
            <HStack gap="2" alignItems="center">
              <AlertCircle size={16} class={css({ color: "danger.default" })} />
              <Text size="xs" fontWeight="bold" color="danger.default">
                SQL Execution Error
              </Text>
            </HStack>
            <pre
              class={css({
                p: "2.5",
                borderRadius: "sm",
                fontFamily: "mono",
                fontSize: "2xs",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                bg: "black/25",
                color: "red.400",
              })}
            >
              {err()}
            </pre>
            <Text size="xs" color="fg.muted">
              Tip: In SpacetimeDB SQL, table names must be enclosed in double quotes (e.g. SELECT *
              FROM "my_table";).
            </Text>
          </div>
        )}
      </Show>

      {/* 3. In-flight Loading Indicator */}
      <Show when={sqlRunnerState.isExecuting}>
        <div
          class={css({
            p: "8",
            borderWidth: "1px",
            borderColor: "border.subtle",
            borderRadius: "md",
            bg: "bg.default",
            textAlign: "center",
          })}
        >
          <HStack gap="2" justifyContent="center">
            <RefreshCw size={16} class={spinAnimation} />
            <Text size="xs">Executing SQL query on SpacetimeDB instance...</Text>
          </HStack>
        </div>
      </Show>

      {/* 4. Results Data Grid */}
      <Show
        when={!sqlRunnerState.isExecuting && sqlRunnerState.result}
        fallback={
          <Show when={!sqlRunnerState.isExecuting && !sqlRunnerState.error}>
            <div
              class={css({
                p: "10",
                borderWidth: "1px",
                borderColor: "border.subtle",
                borderRadius: "md",
                bg: "bg.default",
                textAlign: "center",
              })}
            >
              <VStack gap="2" alignItems="center">
                <Clock size={24} color="var(--colors-fg-muted)" />
                <Text size="sm" fontWeight="medium">
                  Ready to Run Query
                </Text>
                <Text size="xs" color="fg.muted" class={css({ maxW: "sm" })}>
                  Enter a SQL SELECT statement above and click "Run Query" (or press Cmd+Enter) to
                  inspect live results.
                </Text>
              </VStack>
            </div>
          </Show>
        }
      >
        <Show
          when={sqlRunnerState.result && sqlRunnerState.result.columns.length > 0}
          fallback={
            <div
              class={css({
                p: "8",
                borderWidth: "1px",
                borderColor: "border.subtle",
                borderRadius: "md",
                bg: "bg.default",
                textAlign: "center",
              })}
            >
              <Text size="xs" color="fg.muted">
                Query executed successfully, but returned 0 columns or 0 rows.
              </Text>
            </div>
          }
        >
          <Show
            when={processedRows().length > 0}
            fallback={
              <div
                class={css({
                  p: "8",
                  borderWidth: "1px",
                  borderColor: "border.subtle",
                  borderRadius: "md",
                  bg: "bg.default",
                  textAlign: "center",
                })}
              >
                <Text size="xs" color="fg.muted">
                  No rows matching filter "{filterText()}".
                </Text>
              </div>
            }
          >
            <div
              class={css({
                w: "full",
                overflowX: "auto",
                borderWidth: "1px",
                borderColor: "border.subtle",
                borderRadius: "md",
                bg: "bg.default",
                overflowY: "auto",
                maxH: "[55vh]",
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
                <thead
                  class={css({ position: "sticky", top: "0", bg: "bg.subtle", zIndex: "[10]" })}
                >
                  <tr class={css({ borderBottomWidth: "1px", borderColor: "border.default" })}>
                    <th
                      class={css({
                        p: "2.5",
                        fontWeight: "semibold",
                        color: "fg.muted",
                        w: "16",
                        textAlign: "center",
                      })}
                    >
                      #
                    </th>
                    <For each={sqlRunnerState.result?.columns}>
                      {(col) => {
                        const isSorted = () => sortCol() === col;
                        return (
                          <th
                            class={css({
                              p: "2.5",
                              fontWeight: "semibold",
                              borderRightWidth: "1px",
                              borderColor: "border.subtle",
                              cursor: "pointer",
                              userSelect: "none",
                              minW: "[120px]",
                              _hover: { bg: "bg.muted" },
                            })}
                            onClick={() => handleSort(col)}
                          >
                            <HStack gap="2" justifyContent="space-between" alignItems="center">
                              <span class={css({ fontFamily: "mono" })}>{col}</span>
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
                          </th>
                        );
                      }}
                    </For>
                  </tr>
                </thead>

                <tbody>
                  <For each={pagedRows()}>
                    {(row, rowIdx) => {
                      const absIdx = () => (currentPage() - 1) * pageSize + rowIdx() + 1;
                      return (
                        <tr
                          class={css({
                            borderBottomWidth: "1px",
                            borderColor: "border.subtle",
                            _hover: { bg: "bg.subtle" },
                          })}
                        >
                          <td
                            class={css({
                              p: "2",
                              textAlign: "center",
                              color: "fg.muted",
                              w: "16",
                            })}
                          >
                            <HStack gap="1" justifyContent="center" alignItems="center">
                              <span class={css({ fontFamily: "mono", fontSize: "2xs" })}>
                                {absIdx()}
                              </span>
                              <button
                                type="button"
                                class={css({
                                  cursor: "pointer",
                                  p: "1",
                                  bg: "transparent",
                                  border: "none",
                                  color: "fg.muted",
                                  borderRadius: "sm",
                                  _hover: { color: "fg.default", bg: "bg.muted" },
                                })}
                                onClick={() => {
                                  setSelectedRowForDetail(row);
                                  setIsDetailModalOpen(true);
                                }}
                                title="Inspect row details & JSON"
                              >
                                <Eye size={12} />
                              </button>
                            </HStack>
                          </td>

                          <For each={sqlRunnerState.result?.columns}>
                            {(col) => {
                              const val = () => row[col];
                              const cellKey = () => `sql_cell_${absIdx()}_${col}`;
                              return (
                                <td
                                  class={css({
                                    p: "2.5",
                                    borderRightWidth: "1px",
                                    borderColor: "border.subtle",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxW: "[300px]",
                                  })}
                                >
                                  <SqlCellRenderer
                                    value={val()}
                                    onCopy={(txt) => copyCell(txt, cellKey())}
                                    isCopied={copiedKey() === cellKey()}
                                  />
                                </td>
                              );
                            }}
                          </For>
                        </tr>
                      );
                    }}
                  </For>
                </tbody>
              </table>
            </div>

            {/* 5. Pagination Controls (if total rows > 25) */}
            <Show when={totalRowsCount() > 25}>
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
                <Text size="xs" color="fg.muted">
                  Showing {(currentPage() - 1) * pageSize + 1} -{" "}
                  {Math.min(currentPage() * pageSize, totalRowsCount())} of {totalRowsCount()} rows
                </Text>

                <HStack gap="2" alignItems="center">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handlePageChange(currentPage() - 1)}
                    disabled={currentPage() <= 1}
                  >
                    <ChevronLeft size={13} />
                    Prev
                  </Button>
                  <Text size="xs" color="fg.muted">
                    Page {currentPage()} / {totalPages()}
                  </Text>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handlePageChange(currentPage() + 1)}
                    disabled={currentPage() >= totalPages()}
                  >
                    Next
                    <ChevronRight size={13} />
                  </Button>
                </HStack>
              </div>
            </Show>
          </Show>
        </Show>
      </Show>

      {/* Row Detail Inspector Modal */}
      <RowDetailModal
        isOpen={isDetailModalOpen()}
        onClose={() => setIsDetailModalOpen(false)}
        tableName="SQL Query Result"
        row={selectedRowForDetail()}
        columns={[]}
        primaryKeyName={null}
      />
    </VStack>
  );
}

interface SqlCellRendererProps {
  value: unknown;
  onCopy: (text: string) => void;
  isCopied: boolean;
}

function SqlCellRenderer(props: SqlCellRendererProps) {
  const valueType = createMemo(() => {
    const v = props.value;
    if (v === null || v === undefined) return "null";
    if (v === "") return "empty";
    if (typeof v === "boolean") return "boolean";
    if (typeof v === "string" && v.length >= 32 && /^[0-9a-fA-F]+$/.test(v)) return "identity";
    if (typeof v === "object") return "object";
    if (typeof v === "number" || typeof v === "bigint") return "number";
    return "string";
  });

  return (
    <Switch>
      <Match when={valueType() === "null"}>
        <span class={css({ color: "fg.muted", opacity: 0.45, fontStyle: "italic" })}>null</span>
      </Match>

      <Match when={valueType() === "empty"}>
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
        <HStack gap="1" alignItems="center">
          <span
            class={css({
              fontFamily: "mono",
              color: "accent.default",
              fontSize: "2xs",
            })}
            title={String(props.value)}
          >
            {String(props.value).slice(0, 8)}...{String(props.value).slice(-6)}
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
            onClick={() => props.onCopy(String(props.value))}
            title="Copy identity"
          >
            <Show when={props.isCopied} fallback={<Copy size={11} />}>
              <Check size={11} color="var(--colors-accent-default)" />
            </Show>
          </button>
        </HStack>
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
              maxW: "[220px]",
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
        <span class={css({ fontFamily: "mono" })}>{String(props.value)}</span>
      </Match>

      <Match when={valueType() === "string"}>
        <span>{String(props.value)}</span>
      </Match>
    </Switch>
  );
}

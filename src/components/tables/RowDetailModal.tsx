import { Check, Copy, Eye, Key, TerminalSquare, X } from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import { css } from "styled-system/css";
import { Badge, Button, Heading, HStack, Text, VStack } from "~/components/ui";
import type { ColumnMeta } from "~/lib/spacetimedb/schema";
import { setQueryText } from "~/lib/spacetimedb/sql";

interface RowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  row: Record<string, unknown> | null;
  columns: ColumnMeta[];
  primaryKeyName: string | null;
}

export function RowDetailModal(props: RowDetailModalProps) {
  const [copiedField, setCopiedField] = createSignal<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<"fields" | "json">("fields");

  const cleanRow = createMemo(() => {
    if (!props.row) return {};
    const copy = { ...props.row };
    delete copy.__rowKey;
    delete copy.__rowId;
    return copy;
  });

  const rowKeyDisplay = createMemo(() => {
    if (!props.row) return "";
    if (props.primaryKeyName && props.row[props.primaryKeyName] !== undefined) {
      return `${props.primaryKeyName}: ${String(props.row[props.primaryKeyName])}`;
    }
    return String(props.row.__rowKey || "Row");
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField((curr) => (curr === fieldName ? null : curr));
    }, 1500);
  };

  const copyAllJson = () => {
    const jsonStr = JSON.stringify(cleanRow(), null, 2);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(jsonStr).catch(() => {});
    }
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 1500);
  };

  const columnsList = createMemo(() => {
    if (props.columns.length > 0) return props.columns;
    const r = cleanRow();
    return Object.keys(r).map((key) => ({
      name: key,
      typeDisplay: typeof r[key],
      category: "other" as const,
      isPrimaryKey: key.toLowerCase() === "id",
      nullable: true,
      rawType: null,
    }));
  });

  return (
    <Show when={props.isOpen && props.row}>
      <div
        class={css({
          position: "fixed",
          inset: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: "4",
          zIndex: "modal",
          bg: "black/75",
        })}
        onClick={() => props.onClose()}
      >
        <div
          class={css({
            bg: "bg.default",
            borderRadius: "lg",
            borderWidth: "1px",
            borderColor: "border.default",
            maxW: "3xl",
            w: "full",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "2xl",
            maxH: "[85vh]",
          })}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            class={css({
              p: "4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottomWidth: "1px",
              borderColor: "border.subtle",
              bg: "bg.subtle",
            })}
          >
            <HStack gap="2.5" alignItems="center">
              <Eye size={18} color="var(--colors-accent-default)" />
              <VStack gap="0" alignItems="flex-start">
                <HStack gap="2" alignItems="center">
                  <Heading as="h3" size="md">
                    Row Details: {props.tableName}
                  </Heading>
                  <Badge variant="subtle" size="sm">
                    {rowKeyDisplay()}
                  </Badge>
                </HStack>
                <Text size="xs" color="fg.muted">
                  Inspect structured field values and raw JSON representation
                </Text>
              </VStack>
            </HStack>

            <HStack gap="2" alignItems="center">
              <Show when={props.tableName && props.tableName !== "SQL Query Result"}>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    const r = cleanRow();
                    const pkCol = props.primaryKeyName || Object.keys(r)[0];
                    if (pkCol && r[pkCol] !== undefined) {
                      const pkVal = r[pkCol];
                      const formattedVal =
                        typeof pkVal === "number" || typeof pkVal === "bigint"
                          ? String(pkVal)
                          : `'${String(pkVal).replace(/'/g, "''")}'`;
                      setQueryText(
                        `SELECT * FROM "${props.tableName}" WHERE "${pkCol}" = ${formattedVal};`,
                      );
                    } else {
                      setQueryText(`SELECT * FROM "${props.tableName}" LIMIT 50;`);
                    }
                    props.onClose();
                    window.location.href = "/sql";
                  }}
                  title="Query this specific record in SQL Runner"
                >
                  <TerminalSquare size={13} />
                  Query in SQL
                </Button>
              </Show>

              <Button variant="outline" size="xs" onClick={copyAllJson}>
                <Show when={isCopiedAll()} fallback={<Copy size={13} />}>
                  <Check size={13} color="var(--colors-accent-default)" />
                </Show>
                <Show when={isCopiedAll()} fallback="Copy JSON">
                  Copied!
                </Show>
              </Button>
              <Button variant="ghost" size="xs" onClick={props.onClose}>
                <X size={16} />
              </Button>
            </HStack>
          </div>

          {/* Sub-Header Tabs */}
          <div
            class={css({
              display: "flex",
              gap: "2",
              px: "4",
              pt: "3",
              borderBottomWidth: "1px",
              borderColor: "border.subtle",
            })}
          >
            <button
              type="button"
              class={css({
                pb: "2",
                px: "2",
                fontSize: "xs",
                fontWeight: "semibold",
                cursor: "pointer",
                bg: "transparent",
                border: "none",
                borderBottomWidth: "2px",
                borderColor: activeTab() === "fields" ? "accent.default" : "transparent",
                color: activeTab() === "fields" ? "accent.default" : "fg.muted",
              })}
              onClick={() => setActiveTab("fields")}
            >
              Structured Fields ({columnsList().length})
            </button>
            <button
              type="button"
              class={css({
                pb: "2",
                px: "2",
                fontSize: "xs",
                fontWeight: "semibold",
                cursor: "pointer",
                bg: "transparent",
                border: "none",
                borderBottomWidth: "2px",
                borderColor: activeTab() === "json" ? "accent.default" : "transparent",
                color: activeTab() === "json" ? "accent.default" : "fg.muted",
              })}
              onClick={() => setActiveTab("json")}
            >
              Raw JSON
            </button>
          </div>

          {/* Body Content */}
          <div class={css({ p: "5", overflowY: "auto", flex: "1" })}>
            <Show
              when={activeTab() === "fields"}
              fallback={
                <pre
                  class={css({
                    p: "4",
                    bg: "bg.muted",
                    borderRadius: "md",
                    fontSize: "xs",
                    fontFamily: "mono",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  })}
                >
                  {JSON.stringify(cleanRow(), null, 2)}
                </pre>
              }
            >
              <div
                class={css({
                  borderWidth: "1px",
                  borderColor: "border.subtle",
                  borderRadius: "md",
                  overflow: "hidden",
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
                  <thead>
                    <tr class={css({ bg: "bg.subtle" })}>
                      <th class={css({ p: "2.5", fontWeight: "semibold", w: "36" })}>Column</th>
                      <th class={css({ p: "2.5", fontWeight: "semibold", w: "32" })}>Type</th>
                      <th class={css({ p: "2.5", fontWeight: "semibold" })}>Value</th>
                      <th
                        class={css({
                          p: "2.5",
                          fontWeight: "semibold",
                          w: "16",
                          textAlign: "right",
                        })}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={columnsList()}>
                      {(col) => {
                        const val = () => (props.row ? props.row[col.name] : undefined);
                        const strVal = () => {
                          const v = val();
                          if (v === null) return "null";
                          if (v === undefined) return "undefined";
                          if (typeof v === "object") return JSON.stringify(v, null, 2);
                          return String(v);
                        };
                        const isCopied = () => copiedField() === col.name;

                        return (
                          <tr
                            class={css({
                              borderTopWidth: "1px",
                              borderColor: "border.subtle",
                              _hover: { bg: "bg.subtle" },
                            })}
                          >
                            {/* Column Name */}
                            <td class={css({ p: "2.5", fontFamily: "mono" })}>
                              <HStack gap="1.5" alignItems="center">
                                <Show when={col.isPrimaryKey}>
                                  <span title="Primary Key">
                                    <Key size={12} color="var(--colors-accent-default)" />
                                  </span>
                                </Show>
                                <span
                                  class={css({ fontWeight: col.isPrimaryKey ? "bold" : "medium" })}
                                >
                                  {col.name}
                                </span>
                              </HStack>
                            </td>

                            {/* Column Type */}
                            <td class={css({ p: "2.5" })}>
                              <Badge variant="subtle" size="sm">
                                {col.typeDisplay}
                              </Badge>
                            </td>

                            {/* Value Display */}
                            <td class={css({ p: "2.5" })}>
                              <Show
                                when={val() !== null && val() !== undefined}
                                fallback={
                                  <span
                                    class={css({
                                      color: "fg.muted",
                                      opacity: 0.5,
                                      fontStyle: "italic",
                                    })}
                                  >
                                    {val() === null ? "null" : "undefined"}
                                  </span>
                                }
                              >
                                <Show
                                  when={val() !== ""}
                                  fallback={
                                    <span
                                      class={css({
                                        color: "fg.muted",
                                        opacity: 0.5,
                                        fontStyle: "italic",
                                      })}
                                    >
                                      (empty string)
                                    </span>
                                  }
                                >
                                  <Show
                                    when={typeof val() === "object"}
                                    fallback={
                                      <span
                                        class={css({
                                          fontFamily:
                                            col.category === "identity" ||
                                            col.category === "primitive"
                                              ? "mono"
                                              : "inherit",
                                          wordBreak: "break-all",
                                        })}
                                      >
                                        {String(val())}
                                      </span>
                                    }
                                  >
                                    <pre
                                      class={css({
                                        p: "2",
                                        bg: "bg.subtle",
                                        borderRadius: "sm",
                                        fontSize: "2xs",
                                        fontFamily: "mono",
                                        whiteSpace: "pre-wrap",
                                        maxH: "36",
                                        overflowY: "auto",
                                      })}
                                    >
                                      {JSON.stringify(val(), null, 2)}
                                    </pre>
                                  </Show>
                                </Show>
                              </Show>
                            </td>

                            {/* Copy Action */}
                            <td class={css({ p: "2.5", textAlign: "right" })}>
                              <button
                                type="button"
                                class={css({
                                  cursor: "pointer",
                                  p: "1",
                                  bg: "transparent",
                                  border: "none",
                                  color: "fg.muted",
                                  _hover: { color: "fg.default" },
                                })}
                                onClick={() => copyToClipboard(strVal(), col.name)}
                                title={`Copy ${col.name}`}
                              >
                                <Show when={isCopied()} fallback={<Copy size={13} />}>
                                  <Check size={13} color="var(--colors-accent-default)" />
                                </Show>
                              </button>
                            </td>
                          </tr>
                        );
                      }}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}

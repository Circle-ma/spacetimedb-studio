import { Code, Key, X } from "lucide-solid";
import { For, Show } from "solid-js";
import { css } from "styled-system/css";
import { Badge, Button, Heading, HStack, Text, VStack } from "~/components/ui";
import type { TableMeta } from "~/lib/spacetimedb/schema";

interface SchemaViewerModalProps {
  table: TableMeta | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SchemaViewerModal(props: SchemaViewerModalProps) {
  return (
    <Show when={props.isOpen && props.table}>
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
            maxW: "2xl",
            w: "full",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "2xl",
            maxH: "[80vh]",
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
            })}
          >
            <HStack gap="2.5" alignItems="center">
              <Code size={18} color="var(--colors-accent-default)" />
              <VStack gap="0" alignItems="flex-start">
                <Heading as="h3" size="md">
                  Schema: {props.table?.name}
                </Heading>
                <Text size="xs" color="fg.muted">
                  SpacetimeDB SATS (Algebraic Type System) Definition
                </Text>
              </VStack>
            </HStack>

            <Button variant="ghost" size="xs" onClick={props.onClose}>
              <X size={16} />
            </Button>
          </div>

          {/* Body */}
          <div class={css({ p: "5", overflowY: "auto", flex: "1" })}>
            <VStack gap="5" alignItems="stretch">
              {/* Columns Table */}
              <VStack gap="2" alignItems="stretch">
                <Text size="xs" fontWeight="semibold" color="fg.muted">
                  COLUMN DEFINITIONS ({props.table?.columns.length})
                </Text>
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
                        <th class={css({ p: "2.5", fontWeight: "semibold" })}>Column</th>
                        <th class={css({ p: "2.5", fontWeight: "semibold" })}>Type (SATS)</th>
                        <th class={css({ p: "2.5", fontWeight: "semibold" })}>Primary Key</th>
                        <th class={css({ p: "2.5", fontWeight: "semibold" })}>Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={props.table?.columns}>
                        {(col) => (
                          <tr
                            class={css({
                              borderTopWidth: "1px",
                              borderColor: "border.subtle",
                            })}
                          >
                            <td class={css({ p: "2.5", fontFamily: "mono" })}>
                              <HStack gap="1.5">
                                <Show when={col.isPrimaryKey}>
                                  <Key size={12} color="var(--colors-accent-default)" />
                                </Show>
                                <span
                                  class={css({ fontWeight: col.isPrimaryKey ? "bold" : "normal" })}
                                >
                                  {col.name}
                                </span>
                              </HStack>
                            </td>
                            <td class={css({ p: "2.5" })}>
                              <Badge variant="subtle" size="sm">
                                {col.typeDisplay}
                              </Badge>
                            </td>
                            <td class={css({ p: "2.5" })}>
                              {col.isPrimaryKey ? (
                                <Badge variant="solid" size="sm">
                                  YES
                                </Badge>
                              ) : (
                                <Text size="xs" color="fg.muted">
                                  -
                                </Text>
                              )}
                            </td>
                            <td class={css({ p: "2.5" })}>
                              <Text size="xs" color={col.nullable ? "accent.default" : "fg.muted"}>
                                {col.nullable ? "YES" : "NO"}
                              </Text>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </VStack>

              {/* Raw JSON AST */}
              <VStack gap="2" alignItems="stretch">
                <Text size="xs" fontWeight="semibold" color="fg.muted">
                  RAW SATS MODULE AST
                </Text>
                <div
                  class={css({
                    p: "3",
                    bg: "bg.canvas",
                    borderRadius: "md",
                    borderWidth: "1px",
                    borderColor: "border.subtle",
                    fontFamily: "mono",
                    fontSize: "xs",
                    overflowY: "auto",
                    color: "fg.muted",
                    maxH: "[200px]",
                  })}
                >
                  <pre>{JSON.stringify(props.table?.raw, null, 2)}</pre>
                </div>
              </VStack>
            </VStack>
          </div>

          {/* Footer */}
          <div
            class={css({
              p: "3",
              display: "flex",
              justifyContent: "flex-end",
              borderTopWidth: "1px",
              borderColor: "border.subtle",
            })}
          >
            <Button variant="outline" size="sm" onClick={props.onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
}

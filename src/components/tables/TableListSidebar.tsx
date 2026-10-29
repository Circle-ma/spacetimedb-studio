import { ChevronDown, ChevronRight, Database, Key, Layers, Table as TableIcon } from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import { css, cx } from "styled-system/css";
import { Badge, Box, HStack, Input, Text, VStack } from "~/components/ui";
import type { ParsedModuleSchema } from "~/lib/spacetimedb/schema";
import { selectTable, tableExplorerState } from "~/lib/spacetimedb/tables";

const tableItemBaseClass = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  w: "full",
  px: "3",
  py: "2",
  borderRadius: "md",
  cursor: "pointer",
  transitionProperty: "colors",
  transitionDuration: "fast",
  textAlign: "left",
  borderWidth: "1px",
  borderColor: "transparent",
  bg: "transparent",
  _hover: {
    bg: "bg.subtle",
    borderColor: "border.subtle",
  },
});

const tableItemActiveClass = css({
  bg: "bg.subtle",
  borderColor: "accent.default",
  color: "accent.default",
  fontWeight: "semibold",
});

interface TableListSidebarProps {
  schema: ParsedModuleSchema | null;
}

export function TableListSidebar(props: TableListSidebarProps) {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [showSystemTables, setShowSystemTables] = createSignal(false);

  const filteredUserTables = createMemo(() => {
    const list = props.schema?.userTables || [];
    const term = searchTerm().toLowerCase().trim();
    if (!term) return list;
    return list.filter((t) => t.name.toLowerCase().includes(term));
  });

  const filteredSystemTables = createMemo(() => {
    const list = props.schema?.systemTables || [];
    const term = searchTerm().toLowerCase().trim();
    if (!term) return list;
    return list.filter((t) => t.name.toLowerCase().includes(term));
  });

  const isSelected = (tableName: string) => tableExplorerState.selectedTableName === tableName;

  return (
    <VStack gap="4" alignItems="stretch" w="full">
      {/* Table Search Input */}
      <div class={css({ position: "relative", w: "full" })}>
        <Input
          size="sm"
          placeholder="Filter tables..."
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
        />
      </div>

      {/* User Tables Section */}
      <VStack gap="1.5" alignItems="stretch">
        <HStack justifyContent="space-between" px="1">
          <HStack gap="1.5" alignItems="center">
            <Layers size={13} color="var(--colors-fg-muted)" />
            <Text size="xs" fontWeight="semibold" color="fg.muted">
              USER TABLES
            </Text>
          </HStack>
          <Badge variant="subtle" size="sm">
            {filteredUserTables().length}
          </Badge>
        </HStack>

        <Show
          when={filteredUserTables().length > 0}
          fallback={
            <Box p="3" borderRadius="md" bg="bg.subtle">
              <Text size="xs" color="fg.muted">
                {searchTerm()
                  ? "No matching user tables."
                  : "No user tables published in this module."}
              </Text>
            </Box>
          }
        >
          <For each={filteredUserTables()}>
            {(table) => {
              const active = () => isSelected(table.name);
              return (
                <button
                  type="button"
                  class={cx(tableItemBaseClass, active() && tableItemActiveClass)}
                  onClick={() => selectTable(table.name)}
                >
                  <HStack gap="2" alignItems="center">
                    <TableIcon
                      size={15}
                      color={active() ? "var(--colors-accent-default)" : "var(--colors-fg-muted)"}
                    />
                    <Text size="xs" color={active() ? "accent.default" : "fg.default"}>
                      {table.name}
                    </Text>
                  </HStack>

                  <HStack gap="1" alignItems="center">
                    <Show when={table.primaryKeyName}>
                      <span title={`Primary Key: ${table.primaryKeyName}`}>
                        <Key size={11} color="var(--colors-fg-muted)" />
                      </span>
                    </Show>
                    <Text size="xs" color="fg.muted">
                      {table.columns.length} col
                    </Text>
                  </HStack>
                </button>
              );
            }}
          </For>
        </Show>
      </VStack>

      {/* System Tables Section (Collapsible) */}
      <div class={css({ pt: "2" })}>
        <VStack gap="1.5" alignItems="stretch">
          <button
            type="button"
            class={css({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              w: "full",
              px: "1",
              cursor: "pointer",
              bg: "transparent",
              border: "none",
            })}
            onClick={() => setShowSystemTables((v) => !v)}
          >
            <HStack gap="1.5" alignItems="center">
              <Database size={13} color="var(--colors-fg-muted)" />
              <Text size="xs" fontWeight="semibold" color="fg.muted">
                SYSTEM TABLES
              </Text>
              <Show when={showSystemTables()} fallback={<ChevronRight size={12} />}>
                <ChevronDown size={12} />
              </Show>
            </HStack>
            <Badge variant="outline" size="sm">
              {filteredSystemTables().length}
            </Badge>
          </button>

          <Show when={showSystemTables()}>
            <VStack gap="1" alignItems="stretch">
              <For each={filteredSystemTables()}>
                {(table) => {
                  const active = () => isSelected(table.name);
                  return (
                    <button
                      type="button"
                      class={cx(tableItemBaseClass, active() && tableItemActiveClass)}
                      onClick={() => selectTable(table.name)}
                    >
                      <HStack gap="2" alignItems="center">
                        <TableIcon
                          size={14}
                          color={
                            active() ? "var(--colors-accent-default)" : "var(--colors-fg-muted)"
                          }
                        />
                        <Text
                          size="xs"
                          class={css({ fontFamily: "mono" })}
                          color={active() ? "accent.default" : "fg.muted"}
                        >
                          {table.name}
                        </Text>
                      </HStack>
                      <Text size="xs" color="fg.muted">
                        {table.columns.length} col
                      </Text>
                    </button>
                  );
                }}
              </For>
            </VStack>
          </Show>
        </VStack>
      </div>
    </VStack>
  );
}

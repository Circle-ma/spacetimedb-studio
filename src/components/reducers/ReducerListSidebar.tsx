import { ChevronDown, ChevronRight, Layers, Sparkles, Terminal, Zap } from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import { css, cx } from "styled-system/css";
import { Badge, Box, HStack, Input, Text, VStack } from "~/components/ui";
import { connectionState } from "~/lib/spacetimedb/client";
import { reducerStudioState, selectReducer } from "~/lib/spacetimedb/reducers";
import type { ParsedModuleSchema, ReducerMeta } from "~/lib/spacetimedb/schema";

const reducerItemBaseClass = css({
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

const reducerItemActiveClass = css({
  bg: "bg.subtle",
  borderColor: "accent.default",
  color: "accent.default",
  fontWeight: "semibold",
});

interface ReducerListSidebarProps {
  schema: ParsedModuleSchema | null;
}

export function ReducerListSidebar(props: ReducerListSidebarProps) {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [showSystemReducers, setShowSystemReducers] = createSignal(false);

  const filteredUserReducers = createMemo(() => {
    const list = props.schema?.userReducers || [];
    const term = searchTerm().toLowerCase().trim();
    if (!term) return list;
    return list.filter((r) => r.name.toLowerCase().includes(term));
  });

  const filteredSystemReducers = createMemo(() => {
    const list = props.schema?.systemReducers || [];
    const term = searchTerm().toLowerCase().trim();
    if (!term) return list;
    return list.filter((r) => r.name.toLowerCase().includes(term));
  });

  const isSelected = (reducerName: string) =>
    reducerStudioState.selectedReducerName === reducerName;

  const handleSelect = (reducer: ReducerMeta) => {
    selectReducer(reducer, connectionState.identity);
  };

  return (
    <VStack gap="4" alignItems="stretch" w="full">
      {/* Search Input */}
      <div class={css({ position: "relative", w: "full" })}>
        <Input
          size="sm"
          placeholder="Filter reducers..."
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
        />
      </div>

      {/* User Reducers Section */}
      <VStack gap="1.5" alignItems="stretch">
        <HStack justifyContent="space-between" px="1">
          <HStack gap="1.5" alignItems="center">
            <Zap size={13} color="var(--colors-accent-default)" />
            <Text size="xs" fontWeight="semibold" color="fg.muted">
              USER REDUCERS
            </Text>
          </HStack>
          <Badge variant="subtle" size="sm">
            {filteredUserReducers().length}
          </Badge>
        </HStack>

        <Show
          when={filteredUserReducers().length > 0}
          fallback={
            <Box p="3" borderRadius="md" bg="bg.subtle">
              <Text size="xs" color="fg.muted">
                {searchTerm()
                  ? "No matching user reducers."
                  : "No user reducers declared in this module."}
              </Text>
            </Box>
          }
        >
          <For each={filteredUserReducers()}>
            {(reducer) => {
              const active = () => isSelected(reducer.name);
              return (
                <button
                  type="button"
                  class={cx(reducerItemBaseClass, active() && reducerItemActiveClass)}
                  onClick={() => handleSelect(reducer)}
                >
                  <HStack gap="2" alignItems="center">
                    <Terminal
                      size={14}
                      color={active() ? "var(--colors-accent-default)" : "var(--colors-fg-muted)"}
                    />
                    <Text size="xs" color={active() ? "accent.default" : "fg.default"}>
                      {reducer.name}
                    </Text>
                  </HStack>

                  <Badge variant={active() ? "solid" : "subtle"} size="sm">
                    {reducer.params.length} {reducer.params.length === 1 ? "arg" : "args"}
                  </Badge>
                </button>
              );
            }}
          </For>
        </Show>
      </VStack>

      {/* System / Lifecycle Reducers Section (Collapsible) */}
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
            onClick={() => setShowSystemReducers((v) => !v)}
          >
            <HStack gap="1.5" alignItems="center">
              <Layers size={13} color="var(--colors-fg-muted)" />
              <Text size="xs" fontWeight="semibold" color="fg.muted">
                LIFECYCLE HOOKS
              </Text>
            </HStack>
            <HStack gap="1.5" alignItems="center">
              <Badge variant="subtle" size="sm">
                {filteredSystemReducers().length}
              </Badge>
              <Show
                when={showSystemReducers()}
                fallback={<ChevronRight size={13} color="var(--colors-fg-muted)" />}
              >
                <ChevronDown size={13} color="var(--colors-fg-muted)" />
              </Show>
            </HStack>
          </button>

          <Show when={showSystemReducers()}>
            <VStack gap="1" alignItems="stretch">
              <For each={filteredSystemReducers()}>
                {(reducer) => {
                  const active = () => isSelected(reducer.name);
                  return (
                    <button
                      type="button"
                      class={cx(reducerItemBaseClass, active() && reducerItemActiveClass)}
                      onClick={() => handleSelect(reducer)}
                    >
                      <HStack gap="2" alignItems="center">
                        <Sparkles size={13} color="var(--colors-fg-muted)" />
                        <Text size="xs" color="fg.muted" class={css({ fontFamily: "mono" })}>
                          {reducer.name}
                        </Text>
                      </HStack>
                      <Text size="xs" color="fg.muted">
                        {reducer.params.length}
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

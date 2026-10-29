import { CheckCircle2, History, Trash2, XCircle } from "lucide-solid";
import { For, Show } from "solid-js";
import { css, cx } from "styled-system/css";
import { Badge, Box, Button, HStack, Text, VStack } from "~/components/ui";
import {
  clearSqlHistory,
  loadHistoryQuery,
  type SqlHistoryItem,
  sqlRunnerState,
} from "~/lib/spacetimedb/sql";

const historyItemBaseClass = css({
  display: "flex",
  flexDirection: "column",
  gap: "1",
  w: "full",
  p: "2.5",
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

const historyItemActiveClass = css({
  bg: "bg.subtle",
  borderColor: "accent.default",
});

export function SqlHistorySidebar() {
  const isSelected = (item: SqlHistoryItem) => sqlRunnerState.selectedHistoryId === item.id;

  return (
    <VStack gap="3" alignItems="stretch" w="full">
      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center" px="1">
        <HStack gap="1.5" alignItems="center">
          <History size={14} color="var(--colors-accent-default)" />
          <Text size="xs" fontWeight="bold">
            History
          </Text>
          <Badge variant="subtle" size="sm">
            {sqlRunnerState.history.length}
          </Badge>
        </HStack>

        <Button
          variant="ghost"
          size="xs"
          onClick={clearSqlHistory}
          disabled={sqlRunnerState.history.length === 0}
          title="Clear query history"
        >
          <Trash2 size={12} />
        </Button>
      </HStack>

      {/* History List */}
      <Show
        when={sqlRunnerState.history.length > 0}
        fallback={
          <Box p="4" bg="bg.subtle" borderRadius="md" class={css({ textAlign: "center" })}>
            <Text size="xs" color="fg.muted">
              No queries executed yet.
            </Text>
          </Box>
        }
      >
        <div
          class={css({
            display: "flex",
            flexDirection: "column",
            gap: "1.5",
            maxH: "[75vh]",
            overflowY: "auto",
          })}
        >
          <For each={sqlRunnerState.history}>
            {(item) => {
              const active = () => isSelected(item);
              const isSuccess = () => item.status === "success";

              return (
                <button
                  type="button"
                  class={cx(historyItemBaseClass, active() && historyItemActiveClass)}
                  onClick={() => loadHistoryQuery(item)}
                >
                  <HStack justifyContent="space-between" alignItems="center" w="full">
                    <HStack gap="1" alignItems="center">
                      <Show
                        when={isSuccess()}
                        fallback={<XCircle size={12} class={css({ color: "danger.default" })} />}
                      >
                        <CheckCircle2 size={12} class={css({ color: "success.default" })} />
                      </Show>
                      <Text size="xs" color="fg.muted">
                        {item.executedAt}
                      </Text>
                    </HStack>

                    <HStack gap="1" alignItems="center">
                      <Show when={isSuccess()}>
                        <Text size="xs" color="fg.muted">
                          {item.rowCount}r
                        </Text>
                      </Show>
                      <Badge variant="subtle" size="sm">
                        {item.durationMs}ms
                      </Badge>
                    </HStack>
                  </HStack>

                  <span
                    class={css({
                      fontFamily: "mono",
                      fontSize: "2xs",
                      color: active() ? "accent.default" : "fg.default",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      w: "full",
                    })}
                    title={item.query}
                  >
                    {item.query}
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </Show>
    </VStack>
  );
}

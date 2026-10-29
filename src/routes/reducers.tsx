import { RefreshCw, Terminal, WifiOff } from "lucide-solid";
import { createMemo, createSignal, onSettled, Show } from "solid-js";
import { css } from "styled-system/css";
import { ReducerFormView } from "~/components/reducers/ReducerFormView";
import { ReducerListSidebar } from "~/components/reducers/ReducerListSidebar";
import { TransactionFeed } from "~/components/reducers/TransactionFeed";
import { Button, Card, Heading, HStack, Text, VStack } from "~/components/ui";
import {
  connectionState,
  introspectModuleSchema,
  isConnected,
  reducerStudioState,
  selectReducer,
  setTableExplorerState,
  tableExplorerState,
} from "~/lib/spacetimedb";

const spinAnimation = css({
  animation: "spin",
});

export default function ReducersRoute() {
  const [isRefreshingSchema, setIsRefreshingSchema] = createSignal(false);

  const loadSchema = async () => {
    if (!isConnected()) return;
    setIsRefreshingSchema(true);
    try {
      const parsed = await introspectModuleSchema(
        connectionState.host,
        connectionState.database,
        connectionState.token,
      );
      setTableExplorerState((s) => {
        s.schema = parsed;
      });

      // Auto-select first user reducer if none selected
      const firstReducer = parsed.userReducers[0] || parsed.reducers[0];
      if (firstReducer && !reducerStudioState.selectedReducerName) {
        selectReducer(firstReducer, connectionState.identity);
      }
    } catch (err: unknown) {
      console.error("Failed to load schema for Reducer Studio:", err);
    } finally {
      setIsRefreshingSchema(false);
    }
  };

  onSettled(() => {
    if (isConnected()) {
      if (!tableExplorerState.schema) {
        void loadSchema();
      } else if (!reducerStudioState.selectedReducerName) {
        const firstReducer =
          tableExplorerState.schema.userReducers[0] || tableExplorerState.schema.reducers[0];
        if (firstReducer) {
          selectReducer(firstReducer, connectionState.identity);
        }
      }
    }
  });

  const activeReducerMeta = createMemo(() => {
    const name = reducerStudioState.selectedReducerName;
    if (!name || !tableExplorerState.schema) return null;
    return tableExplorerState.schema.reducers.find((r) => r.name === name) ?? null;
  });

  return (
    <VStack gap="6" alignItems="stretch" w="full">
      <Show
        when={isConnected()}
        fallback={
          <Card.Root>
            <Card.Body>
              <VStack gap="4" p="10" alignItems="center" bg="bg.subtle" borderRadius="md">
                <WifiOff size={36} color="var(--colors-fg-muted)" />
                <Heading as="h3" size="lg">
                  Not Connected to SpacetimeDB
                </Heading>
                <Text size="sm" color="fg.muted" class={css({ textAlign: "center", maxW: "md" })}>
                  Reducer Studio requires an active connection to introspect available reducers,
                  inspect parameter signatures, and dispatch transactions.
                </Text>
                <a href="/">
                  <Button variant="solid" size="md">
                    Go to Connection Hub
                  </Button>
                </a>
              </VStack>
            </Card.Body>
          </Card.Root>
        }
      >
        {/* Main 2-Column Reducer Studio Layout */}
        <div
          class={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "260px 1fr" },
            gap: "6",
            alignItems: "start",
            w: "full",
          })}
        >
          {/* Left Column: Reducers List Sidebar */}
          <div
            class={css({
              bg: "bg.default",
              borderWidth: "1px",
              borderColor: "border.subtle",
              borderRadius: "lg",
              p: "4",
            })}
          >
            <VStack gap="3" alignItems="stretch">
              <HStack justifyContent="space-between" alignItems="center">
                <HStack gap="2" alignItems="center">
                  <Terminal size={16} color="var(--colors-accent-default)" />
                  <Heading as="h4" size="sm">
                    Reducers
                  </Heading>
                </HStack>

                <Button
                  variant="ghost"
                  size="xs"
                  onClick={loadSchema}
                  disabled={isRefreshingSchema()}
                  title="Reload schema from SpacetimeDB"
                >
                  <RefreshCw size={12} class={isRefreshingSchema() ? spinAnimation : ""} />
                </Button>
              </HStack>

              <ReducerListSidebar schema={tableExplorerState.schema} />
            </VStack>
          </div>

          {/* Right Column: Reducer Dispatcher & Live Transaction Feed */}
          <VStack gap="6" alignItems="stretch" w="full">
            {/* Top: Active Reducer Dispatcher */}
            <div
              class={css({
                bg: "bg.default",
                borderWidth: "1px",
                borderColor: "border.subtle",
                borderRadius: "lg",
                p: "5",
              })}
            >
              <ReducerFormView reducer={activeReducerMeta()} />
            </div>

            {/* Bottom: Live Transaction Feed */}
            <div
              class={css({
                bg: "bg.default",
                borderWidth: "1px",
                borderColor: "border.subtle",
                borderRadius: "lg",
                p: "5",
              })}
            >
              <TransactionFeed />
            </div>
          </VStack>
        </div>
      </Show>
    </VStack>
  );
}

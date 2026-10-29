import { WifiOff } from "lucide-solid";
import { onSettled, Show } from "solid-js";
import { css } from "styled-system/css";
import { SqlEditor } from "~/components/sql/SqlEditor";
import { SqlHistorySidebar } from "~/components/sql/SqlHistorySidebar";
import { SqlResultGrid } from "~/components/sql/SqlResultGrid";
import { Button, Card, Heading, Text, VStack } from "~/components/ui";
import {
  connectionState,
  introspectModuleSchema,
  isConnected,
  setTableExplorerState,
  tableExplorerState,
} from "~/lib/spacetimedb";

export default function SqlRunnerRoute() {
  const loadSchemaIfEmpty = async () => {
    if (!isConnected() || tableExplorerState.schema) return;
    try {
      const parsed = await introspectModuleSchema(
        connectionState.host,
        connectionState.database,
        connectionState.token,
      );
      setTableExplorerState((s) => {
        s.schema = parsed;
      });
    } catch {
      // Ignore background schema introspect error in SQL runner
    }
  };

  onSettled(() => {
    void loadSchemaIfEmpty();
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
                  SQL Runner requires an active connection to execute queries against your
                  SpacetimeDB database module.
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
        {/* 2-Column SQL Runner Layout */}
        <div
          class={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", lg: "1fr 280px" },
            gap: "6",
            alignItems: "start",
            w: "full",
          })}
        >
          {/* Main Area: Editor + Result Data Grid */}
          <VStack gap="5" alignItems="stretch" w="full">
            <div
              class={css({
                bg: "bg.default",
                borderWidth: "1px",
                borderColor: "border.subtle",
                borderRadius: "lg",
                p: "4",
              })}
            >
              <SqlEditor />
            </div>

            <div
              class={css({
                bg: "bg.default",
                borderWidth: "1px",
                borderColor: "border.subtle",
                borderRadius: "lg",
                p: "4",
              })}
            >
              <SqlResultGrid />
            </div>
          </VStack>

          {/* Right Sidebar: Query History */}
          <div
            class={css({
              bg: "bg.default",
              borderWidth: "1px",
              borderColor: "border.subtle",
              borderRadius: "lg",
              p: "4",
            })}
          >
            <SqlHistorySidebar />
          </div>
        </div>
      </Show>
    </VStack>
  );
}

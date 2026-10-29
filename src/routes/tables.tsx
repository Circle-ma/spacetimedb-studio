import { Database, RefreshCw, Table as TableIcon, WifiOff } from "lucide-solid";
import { createSignal, onCleanup, onSettled, Show } from "solid-js";
import { css } from "styled-system/css";
import { DataGrid } from "~/components/tables/DataGrid";
import { TableListSidebar } from "~/components/tables/TableListSidebar";
import { Button, Card, Heading, HStack, Text, VStack } from "~/components/ui";
import {
  connectionState,
  introspectModuleSchema,
  isConnected,
  selectTable,
  setTableExplorerState,
  startLiveSync,
  stopLiveSync,
  tableExplorerState,
} from "~/lib/spacetimedb";

const spinAnimation = css({
  animation: "spin",
});

export default function TablesRoute() {
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
      // Select first table if none selected
      const firstTable = parsed.userTables[0] || parsed.tables[0];
      if (firstTable && !tableExplorerState.selectedTableName) {
        await selectTable(firstTable.name);
      }
      startLiveSync();
    } catch (err: unknown) {
      console.error("Failed to load schema:", err);
    } finally {
      setIsRefreshingSchema(false);
    }
  };

  onSettled(() => {
    if (isConnected()) {
      if (!tableExplorerState.schema) {
        void loadSchema();
      } else {
        const firstTable =
          tableExplorerState.schema.userTables[0] || tableExplorerState.schema.tables[0];
        if (firstTable && !tableExplorerState.selectedTableName) {
          void selectTable(firstTable.name);
        } else if (tableExplorerState.selectedTableName) {
          startLiveSync();
        }
      }
    }
  });

  onCleanup(() => {
    stopLiveSync();
  });

  const activeTableMeta = () => {
    const name = tableExplorerState.selectedTableName;
    if (!name || !tableExplorerState.schema) return null;
    return tableExplorerState.schema.tables.find((t) => t.name === name) ?? null;
  };

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
                  Live Table Explorer requires an active connection to inspect module schemas and
                  stream live tables.
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
        {/* Main 2-Column Explorer Layout */}
        <div
          class={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "260px 1fr" },
            gap: "6",
            alignItems: "start",
            w: "full",
          })}
        >
          {/* Left Column: Tables Sidebar */}
          <Card.Root>
            <Card.Header>
              <HStack justifyContent="space-between" alignItems="center">
                <HStack gap="2" alignItems="center">
                  <Database size={16} color="var(--colors-accent-default)" />
                  <Card.Title>Tables</Card.Title>
                </HStack>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={loadSchema}
                  disabled={isRefreshingSchema()}
                  title="Reload Schema"
                >
                  <RefreshCw size={12} class={isRefreshingSchema() ? spinAnimation : ""} />
                </Button>
              </HStack>
              <Card.Description>{connectionState.database}</Card.Description>
            </Card.Header>
            <Card.Body>
              <TableListSidebar schema={tableExplorerState.schema} />
            </Card.Body>
          </Card.Root>

          {/* Right Column: Active Live Data Grid */}
          <Card.Root>
            <Card.Body>
              <Show
                when={tableExplorerState.selectedTableName}
                fallback={
                  <VStack gap="3" p="12" alignItems="center" bg="bg.subtle" borderRadius="md">
                    <TableIcon size={32} color="var(--colors-fg-muted)" />
                    <Heading as="h3" size="md">
                      Select a Table
                    </Heading>
                    <Text size="xs" color="fg.muted">
                      Choose a table from the sidebar to inspect its live data stream.
                    </Text>
                  </VStack>
                }
              >
                <DataGrid tableMeta={activeTableMeta()} />
              </Show>
            </Card.Body>
          </Card.Root>
        </div>
      </Show>
    </VStack>
  );
}

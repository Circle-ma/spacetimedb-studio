import { createRouter, defineRoute, defineRoutes, useLocation } from "@solidjs/router";
import { Activity, Database, Server, Table, Terminal, TerminalSquare, User } from "lucide-solid";
import { For, Show } from "solid-js";
import { css } from "styled-system/css";
import "./index.css";
import { Badge, Box, Container, Divider, Heading, HStack, Text, VStack } from "~/components/ui";
import { clientIdentity, connectionState, isConnected } from "~/lib/spacetimedb";
import Overview from "~/routes/overview";
import ReducersRoute from "~/routes/reducers";
import SqlRunnerRoute from "~/routes/sql";
import TablesRoute from "~/routes/tables";

export const routes = defineRoutes([
  defineRoute({
    path: "/",
    component: Overview,
  }),
  defineRoute({
    path: "/tables",
    component: TablesRoute,
  }),
  defineRoute({
    path: "/reducers",
    component: ReducersRoute,
  }),
  defineRoute({
    path: "/sql",
    component: SqlRunnerRoute,
  }),
]);

export const Router = createRouter({ routes });

const navLinkClass = css({
  textDecoration: "none",
  color: "inherit",
  cursor: "pointer",
  display: "inline-flex",
});

function NavigationBar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Connection & Hub", icon: Server },
    { path: "/tables", label: "Live Tables", icon: Table },
    { path: "/reducers", label: "Reducer Studio", icon: Terminal },
    { path: "/sql", label: "SQL Runner", icon: TerminalSquare },
  ];

  return (
    <HStack gap="1" p="1" bg="bg.subtle" borderRadius="md" w="fit">
      <For each={navItems}>
        {(item) => {
          const isActive = () => location.pathname === item.path;
          const IconComponent = item.icon;
          return (
            <a href={item.path} class={navLinkClass}>
              <Box
                px="3"
                py="1.5"
                borderRadius="sm"
                bg={isActive() ? "bg.default" : "transparent"}
                color={isActive() ? "fg.default" : "fg.muted"}
              >
                <HStack gap="1.5" alignItems="center">
                  <IconComponent
                    size={14}
                    color={isActive() ? "var(--colors-accent-default)" : "currentColor"}
                  />
                  <Text size="xs" fontWeight={isActive() ? "semibold" : "normal"}>
                    {item.label}
                  </Text>
                </HStack>
              </Box>
            </a>
          );
        }}
      </For>
    </HStack>
  );
}

export default function App() {
  return (
    <Router>
      {(props) => (
        <Box minH="100vh" bg="bg.canvas" color="fg.default" p={{ base: "4", md: "8", lg: "10" }}>
          <Container maxW="6xl" p="0">
            <VStack gap="6" alignItems="stretch">
              {/* Top Studio Brand & Navigation Header */}
              <div
                class={css({
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "4",
                })}
              >
                <HStack gap="3" alignItems="center">
                  <div
                    class={css({
                      p: "2",
                      borderRadius: "md",
                      bg: "accent.default",
                      color: "accent.fg",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    <Database size={20} />
                  </div>
                  <VStack gap="0" alignItems="flex-start">
                    <HStack gap="2" alignItems="center">
                      <Heading as="h1" size="xl" letterSpacing="tight">
                        SpacetimeDB Studio
                      </Heading>
                      <Badge variant="subtle">v2.x</Badge>
                    </HStack>
                    <Text size="xs" color="fg.muted">
                      Universal Real-time Admin & Visualization Suite
                    </Text>
                  </VStack>
                </HStack>

                <div
                  class={css({
                    display: "flex",
                    gap: "3",
                    alignItems: "center",
                    flexWrap: "wrap",
                  })}
                >
                  {/* Status Pills */}
                  <Show when={connectionState.hostOnline !== null}>
                    <HStack
                      gap="1.5"
                      px="2.5"
                      py="1"
                      borderRadius="full"
                      bg="bg.subtle"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      alignItems="center"
                    >
                      <Box
                        w="2"
                        h="2"
                        borderRadius="full"
                        bg={connectionState.hostOnline ? "accent.default" : "fg.muted"}
                      />
                      <Text size="xs" color="fg.muted">
                        {connectionState.hostOnline ? "Node 200 OK" : "Node Offline"}
                      </Text>
                    </HStack>
                  </Show>

                  <Show when={isConnected()}>
                    <HStack
                      gap="1.5"
                      px="2.5"
                      py="1"
                      borderRadius="full"
                      bg="bg.subtle"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      alignItems="center"
                    >
                      <Box w="2" h="2" borderRadius="full" bg="accent.default" />
                      <Text size="xs" fontWeight="medium">
                        {connectionState.database}
                      </Text>
                    </HStack>
                  </Show>

                  <Show when={connectionState.latencyMs !== null}>
                    <HStack
                      gap="1"
                      px="2.5"
                      py="1"
                      borderRadius="full"
                      bg="bg.subtle"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      alignItems="center"
                    >
                      <Activity size={12} color="var(--colors-accent-default)" />
                      <Text size="xs" fontWeight="medium">
                        {connectionState.latencyMs}ms
                      </Text>
                    </HStack>
                  </Show>

                  <NavigationBar />
                </div>
              </div>

              <Divider borderColor="border.subtle" />

              {/* Routed Page View */}
              {props.children}

              <Divider borderColor="border.subtle" />

              {/* Footer */}
              <div
                class={css({
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "2",
                })}
              >
                <HStack gap="3" alignItems="center">
                  <Text size="xs" color="fg.muted">
                    SpacetimeDB Studio · Solid 2.0 · Panda CSS 2.4 · Ark UI · Port 5173
                  </Text>
                </HStack>
                <HStack gap="3" alignItems="center">
                  <Text size="xs" color="fg.muted">
                    Target: {connectionState.host}
                  </Text>
                  <Show when={clientIdentity()}>
                    <HStack gap="1" alignItems="center">
                      <User size={12} color="var(--colors-fg-muted)" />
                      <Text size="xs" class={css({ fontFamily: "mono" })} color="fg.muted">
                        {clientIdentity()?.slice(0, 6)}...
                      </Text>
                    </HStack>
                  </Show>
                </HStack>
              </div>
            </VStack>
          </Container>
        </Box>
      )}
    </Router>
  );
}

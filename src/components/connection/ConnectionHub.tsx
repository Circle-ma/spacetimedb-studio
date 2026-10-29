import {
  Activity,
  AlertCircle,
  Check,
  Copy,
  Database,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Server,
  Sparkles,
  Table as TableIcon,
  Terminal,
  TerminalSquare,
  Trash2,
  User,
  Wifi,
  WifiOff,
} from "lucide-solid";
import { createSignal, For, onSettled, Show } from "solid-js";
import { css } from "styled-system/css";
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from "~/components/ui";
import {
  applyCustomToken,
  clearRecentConnections,
  clientIdentity,
  connectionState,
  connectToDatabase,
  disconnectFromDatabase,
  getRecentConnections,
  isConnected,
  isConnecting,
  isError,
  pingHost,
  pingInstance,
  resetIdentity,
  resetReducerState,
  resetSqlState,
  resetTableState,
} from "~/lib/spacetimedb";

const pulseGreenStyle = css({
  animation: "spin",
});

const codeBlockStyle = css({
  fontFamily: "mono",
  fontSize: "xs",
  bg: "bg.canvas",
  p: "2.5",
  borderRadius: "md",
  borderWidth: "1px",
  borderColor: "border.subtle",
  color: "accent.default",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  w: "full",
  wordBreak: "break-all",
});

export function ConnectionHub() {
  const [hostInput, setHostInput] = createSignal(connectionState.host);
  const [dbInput, setDbInput] = createSignal(connectionState.database);
  const [tokenInput, setTokenInput] = createSignal(connectionState.token ?? "");
  const [showToken, setShowToken] = createSignal(false);
  const [showTokenModal, setShowTokenModal] = createSignal(false);
  const [copiedKey, setCopiedKey] = createSignal<string | null>(null);
  const [isProbingHost, setIsProbingHost] = createSignal(false);

  // Proactive background check on mount (Solid 2.0 onSettled)
  onSettled(() => {
    if (connectionState.hostOnline === null) {
      void handlePingHost();
    }
  });

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

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const handlePingHost = async () => {
    setIsProbingHost(true);
    await pingHost(hostInput());
    setIsProbingHost(false);
  };

  const handleConnect = async (e?: Event) => {
    e?.preventDefault();
    const targetDb = dbInput().trim();
    if (targetDb !== connectionState.database) {
      resetTableState();
      resetReducerState();
      resetSqlState();
    }
    await connectToDatabase({
      host: hostInput(),
      database: targetDb,
      token: tokenInput().trim() || null,
    });
  };

  const handleDisconnect = () => {
    resetTableState();
    resetReducerState();
    resetSqlState();
    disconnectFromDatabase();
  };

  const handleApplyCustomToken = async () => {
    await applyCustomToken(tokenInput());
    setShowTokenModal(false);
  };

  const handleResetIdentity = async () => {
    setTokenInput("");
    await resetIdentity();
  };

  const recentList = () => getRecentConnections();

  return (
    <VStack gap="6" alignItems="stretch">
      {/* 1. Status Overview Header Banner */}
      <Card.Root>
        <Card.Body>
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
              <Box
                p="2.5"
                borderRadius="md"
                bg="bg.subtle"
                color={isConnected() ? "accent.default" : "fg.muted"}
              >
                <Show
                  when={isConnected()}
                  fallback={
                    <Show when={isConnecting()} fallback={<WifiOff size={22} />}>
                      <RefreshCw size={22} class={pulseGreenStyle} />
                    </Show>
                  }
                >
                  <Wifi size={22} color="var(--colors-accent-default)" />
                </Show>
              </Box>

              <VStack gap="1" alignItems="flex-start">
                <HStack gap="2" alignItems="center">
                  <Heading as="h2" size="lg">
                    SpacetimeDB Instance Hub
                  </Heading>
                  <Show when={isConnected()}>
                    <Badge variant="solid">
                      <HStack gap="1.5" alignItems="center">
                        <Box w="2" h="2" borderRadius="full" bg="bg.default" />
                        Connected
                      </HStack>
                    </Badge>
                  </Show>
                  <Show when={isConnecting()}>
                    <Badge variant="subtle">
                      <HStack gap="1.5" alignItems="center">
                        <Box
                          w="2"
                          h="2"
                          borderRadius="full"
                          bg="accent.default"
                          class={pulseGreenStyle}
                        />
                        Connecting...
                      </HStack>
                    </Badge>
                  </Show>
                  <Show when={connectionState.status === "disconnected"}>
                    <Badge variant="outline">Disconnected</Badge>
                  </Show>
                  <Show when={isError()}>
                    <Badge variant="subtle">
                      <HStack gap="1.5" alignItems="center">
                        <AlertCircle size={12} />
                        Connection Error
                      </HStack>
                    </Badge>
                  </Show>
                </HStack>

                <Text size="xs" color="fg.muted">
                  {connectionState.host} / {connectionState.database || "No database selected"}
                </Text>
              </VStack>
            </HStack>

            {/* Quick Metrics Bar */}
            <HStack gap="3" alignItems="center">
              <Show when={connectionState.latencyMs !== null}>
                <HStack
                  gap="1.5"
                  px="3"
                  py="1.5"
                  bg="bg.subtle"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  alignItems="center"
                >
                  <Activity size={14} color="var(--colors-accent-default)" />
                  <Text size="xs" fontWeight="medium">
                    {connectionState.latencyMs} ms RTT
                  </Text>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => pingInstance()}
                    title="Probe latency"
                  >
                    <RefreshCw size={12} />
                  </Button>
                </HStack>
              </Show>

              <Show when={clientIdentity()}>
                <HStack
                  gap="1.5"
                  px="3"
                  py="1.5"
                  bg="bg.subtle"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  alignItems="center"
                >
                  <User size={14} color="var(--colors-fg-muted)" />
                  <Text size="xs" class={css({ fontFamily: "mono" })}>
                    {clientIdentity()?.slice(0, 8)}...{clientIdentity()?.slice(-6)}
                  </Text>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => copyToClipboard(clientIdentity()!, "identity_bar")}
                    title="Copy full identity"
                  >
                    <Show when={copiedKey() === "identity_bar"} fallback={<Copy size={12} />}>
                      <Check size={12} color="var(--colors-accent-default)" />
                    </Show>
                  </Button>
                </HStack>
              </Show>
            </HStack>
          </div>
        </Card.Body>
      </Card.Root>

      {/* 2. Diagnostic & Troubleshooting Alert Box (Shown when error occurs) */}
      <Show when={isError() && connectionState.error}>
        <Card.Root class={css({ borderColor: "danger.border", bg: "danger.subtle" })}>
          <Card.Header>
            <HStack gap="2" alignItems="center">
              <AlertCircle size={20} class={css({ color: "danger.default" })} />
              <Card.Title class={css({ color: "danger.default" })}>
                {connectionState.error?.title}
              </Card.Title>
            </HStack>
            <Card.Description>{connectionState.error?.message}</Card.Description>
          </Card.Header>
          <Card.Body>
            <VStack gap="4" alignItems="stretch">
              <Show when={connectionState.error?.endpoint}>
                <VStack gap="1" alignItems="flex-start">
                  <Text size="xs" color="fg.muted" fontWeight="semibold">
                    FAILED TARGET ENDPOINT:
                  </Text>
                  <Box class={codeBlockStyle}>
                    <code>{connectionState.error?.endpoint}</code>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        copyToClipboard(connectionState.error!.endpoint!, "err_endpoint")
                      }
                    >
                      <Show when={copiedKey() === "err_endpoint"} fallback={<Copy size={12} />}>
                        <Check size={12} />
                      </Show>
                    </Button>
                  </Box>
                </VStack>
              </Show>

              <VStack gap="2" alignItems="stretch">
                <Text size="xs" color="fg.muted" fontWeight="semibold">
                  RECOMMENDED TROUBLESHOOTING ACTIONS:
                </Text>
                <For each={connectionState.error?.troubleshootingSteps}>
                  {(step, idx) => (
                    <div
                      class={css({
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "3",
                        p: "2.5",
                        bg: "bg.default",
                        borderRadius: "md",
                        borderWidth: "1px",
                        borderColor: "border.subtle",
                      })}
                    >
                      <HStack gap="2.5" alignItems="center">
                        <Badge variant="subtle" size="sm">
                          {idx() + 1}
                        </Badge>
                        <Text size="xs" color="fg.default">
                          {step}
                        </Text>
                      </HStack>
                      {step.includes("`") && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            const cmd = step.split("`")[1];
                            if (cmd) copyToClipboard(cmd, `cmd_${idx()}`);
                          }}
                          title="Copy command"
                        >
                          <Show when={copiedKey() === `cmd_${idx()}`} fallback={<Copy size={12} />}>
                            <Check size={12} />
                          </Show>
                        </Button>
                      )}
                    </div>
                  )}
                </For>
              </VStack>

              <div class={css({ display: "flex", justifyContent: "flex-end", pt: "2" })}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectToDatabase({ host: hostInput(), database: dbInput() })}
                  disabled={isConnecting()}
                >
                  <RefreshCw size={14} />
                  Retry Connection
                </Button>
              </div>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Show>

      {/* 3. Main Connection Config & Identity Hub Grid */}
      <Grid columns={2} gap="6">
        {/* Left Column: Instance & Database Parameters */}
        <Card.Root>
          <Card.Header>
            <HStack gap="2" alignItems="center">
              <Server size={18} color="var(--colors-accent-default)" />
              <Card.Title>Instance & Database</Card.Title>
            </HStack>
            <Card.Description>
              Direct connection parameters for SpacetimeDB HTTP & WebSocket channels.
            </Card.Description>
          </Card.Header>

          <Card.Body>
            <form onSubmit={handleConnect}>
              <VStack gap="4" alignItems="stretch">
                <VStack gap="1.5" alignItems="flex-start">
                  <div
                    class={css({
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      w: "full",
                    })}
                  >
                    <HStack gap="2" alignItems="center">
                      <Text size="xs" fontWeight="semibold" color="fg.muted">
                        HOST URL
                      </Text>
                      {/* Host Liveness indicator */}
                      <Show when={connectionState.hostOnline !== null}>
                        <Badge variant={connectionState.hostOnline ? "solid" : "subtle"} size="sm">
                          {connectionState.hostOnline
                            ? `Daemon Online (${connectionState.hostLatencyMs}ms)`
                            : "Daemon Offline"}
                        </Badge>
                      </Show>
                    </HStack>

                    <HStack gap="1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={handlePingHost}
                        disabled={isProbingHost()}
                        title="Ping host /v1/ping"
                      >
                        <RefreshCw size={10} class={isProbingHost() ? pulseGreenStyle : ""} />
                        Ping Host
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          setHostInput("http://127.0.0.1:3000");
                          pingHost("http://127.0.0.1:3000");
                        }}
                      >
                        127.0.0.1:3000
                      </Button>
                    </HStack>
                  </div>
                  <Input
                    type="text"
                    placeholder="http://127.0.0.1:3000"
                    value={hostInput()}
                    onInput={(e) => setHostInput(e.currentTarget.value)}
                    disabled={isConnecting()}
                  />
                </VStack>

                <VStack gap="1.5" alignItems="flex-start">
                  <Text size="xs" fontWeight="semibold" color="fg.muted">
                    DATABASE NAME OR IDENTITY
                  </Text>
                  <Input
                    type="text"
                    placeholder="e.g. quickstart_chat, my_database"
                    value={dbInput()}
                    onInput={(e) => setDbInput(e.currentTarget.value)}
                    disabled={isConnecting()}
                  />
                  <Text size="xs" color="fg.muted">
                    Database module published on your SpacetimeDB node.
                  </Text>
                </VStack>

                {/* Recent Databases Quick Access */}
                <Show when={recentList().length > 0}>
                  <VStack gap="1.5" alignItems="flex-start">
                    <div
                      class={css({
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        w: "full",
                      })}
                    >
                      <Text size="xs" fontWeight="semibold" color="fg.muted">
                        RECENT DATABASES:
                      </Text>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => clearRecentConnections()}
                      >
                        Clear
                      </Button>
                    </div>
                    <div class={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
                      <For each={recentList()}>
                        {(recent) => (
                          <Button
                            type="button"
                            variant="subtle"
                            size="xs"
                            onClick={() => {
                              setHostInput(recent.host);
                              setDbInput(recent.database);
                              connectToDatabase({ host: recent.host, database: recent.database });
                            }}
                          >
                            <Database size={12} />
                            {recent.database}
                          </Button>
                        )}
                      </For>
                    </div>
                  </VStack>
                </Show>

                <Divider borderColor="border.subtle" />

                <div
                  class={css({
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  })}
                >
                  <Show
                    when={isConnected()}
                    fallback={
                      <Button
                        type="submit"
                        variant="solid"
                        disabled={isConnecting() || !dbInput().trim()}
                      >
                        <Show
                          when={isConnecting()}
                          fallback={
                            <>
                              <Wifi size={14} />
                              Connect to Database
                            </>
                          }
                        >
                          <RefreshCw size={14} class={pulseGreenStyle} />
                          Connecting...
                        </Show>
                      </Button>
                    }
                  >
                    <Button type="button" variant="outline" onClick={handleDisconnect}>
                      <WifiOff size={14} />
                      Disconnect
                    </Button>
                    <Button type="submit" variant="solid" disabled={isConnecting()}>
                      <RefreshCw size={14} />
                      Reconnect
                    </Button>
                  </Show>
                </div>
              </VStack>
            </form>
          </Card.Body>
        </Card.Root>

        {/* Right Column: Identity & Token Center */}
        <Card.Root>
          <Card.Header>
            <HStack gap="2" alignItems="center">
              <User size={18} color="var(--colors-accent-default)" />
              <Card.Title>Identity & Authentication</Card.Title>
            </HStack>
            <Card.Description>
              Local persistent token, anonymous identity lifecycle & credential simulation.
            </Card.Description>
          </Card.Header>

          <Card.Body>
            <VStack gap="4" alignItems="stretch">
              {/* Identity Display */}
              <VStack gap="1.5" alignItems="flex-start">
                <Text size="xs" fontWeight="semibold" color="fg.muted">
                  CLIENT IDENTITY (HEX)
                </Text>
                <Show
                  when={clientIdentity()}
                  fallback={
                    <Box p="2.5" borderRadius="md" bg="bg.subtle" w="full">
                      <Text size="xs" color="fg.muted">
                        Not connected. Identity is generated upon connecting.
                      </Text>
                    </Box>
                  }
                >
                  <Box class={codeBlockStyle}>
                    <code>{clientIdentity()}</code>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => copyToClipboard(clientIdentity()!, "identity_full")}
                    >
                      <Show when={copiedKey() === "identity_full"} fallback={<Copy size={12} />}>
                        <Check size={12} color="var(--colors-accent-default)" />
                      </Show>
                    </Button>
                  </Box>
                </Show>
              </VStack>

              {/* Token Display & Actions */}
              <VStack gap="1.5" alignItems="flex-start">
                <div
                  class={css({
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    w: "full",
                  })}
                >
                  <Text size="xs" fontWeight="semibold" color="fg.muted">
                    AUTHENTICATION TOKEN (LOCALSTORAGE)
                  </Text>
                  <Show when={connectionState.token}>
                    <Button variant="ghost" size="xs" onClick={() => setShowToken((v) => !v)}>
                      <Show when={showToken()} fallback={<Eye size={12} />}>
                        <EyeOff size={12} />
                      </Show>
                      {showToken() ? "Hide" : "Reveal"}
                    </Button>
                  </Show>
                </div>

                <Show
                  when={connectionState.token}
                  fallback={
                    <Box p="2.5" borderRadius="md" bg="bg.subtle" w="full">
                      <Text size="xs" color="fg.muted">
                        Anonymous connection (no custom token provided). SpacetimeDB assigns an
                        anonymous identity.
                      </Text>
                    </Box>
                  }
                >
                  <Box class={codeBlockStyle}>
                    <code>
                      {showToken()
                        ? connectionState.token
                        : `${connectionState.token?.slice(0, 10)}••••••••••••••••••••••••••••`}
                    </code>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => copyToClipboard(connectionState.token!, "token_full")}
                    >
                      <Show when={copiedKey() === "token_full"} fallback={<Copy size={12} />}>
                        <Check size={12} color="var(--colors-accent-default)" />
                      </Show>
                    </Button>
                  </Box>
                </Show>
              </VStack>

              <Divider borderColor="border.subtle" />

              {/* Identity Actions */}
              <VStack gap="2" alignItems="stretch">
                <div
                  class={css({
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "2",
                  })}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetIdentity}
                    disabled={isConnecting()}
                    title="Clear saved token and generate a fresh anonymous identity"
                  >
                    <Trash2 size={14} />
                    Reset to Anonymous Identity
                  </Button>

                  <Button variant="subtle" size="sm" onClick={() => setShowTokenModal((v) => !v)}>
                    <Key size={14} />
                    {showTokenModal() ? "Cancel Custom Token" : "Impersonate Token"}
                  </Button>
                </div>

                {/* Token Simulation / Impersonation form */}
                <Show when={showTokenModal()}>
                  <Box p="3" borderRadius="md" bg="bg.subtle">
                    <VStack gap="2.5" alignItems="stretch">
                      <Text size="xs" fontWeight="semibold">
                        Input Custom / Admin Token:
                      </Text>
                      <Input
                        size="sm"
                        placeholder="Paste SpacetimeDB token string here..."
                        value={tokenInput()}
                        onInput={(e) => setTokenInput(e.currentTarget.value)}
                      />
                      <HStack gap="2" justifyContent="flex-end">
                        <Button variant="ghost" size="xs" onClick={() => setShowTokenModal(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="solid"
                          size="xs"
                          onClick={handleApplyCustomToken}
                          disabled={!tokenInput().trim()}
                        >
                          Apply & Authenticate
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                </Show>
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Grid>

      {/* Connected Studio Tool Suite Quick-Launch */}
      <Show when={isConnected()}>
        <Card.Root>
          <Card.Header>
            <HStack gap="2" alignItems="center">
              <Sparkles size={18} color="var(--colors-accent-default)" />
              <Card.Title>Connected Studio Suite</Card.Title>
            </HStack>
            <Card.Description>
              Launch real-time introspection and management tools for database "
              {connectionState.database}".
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <div
              class={css({
                display: "grid",
                gridTemplateColumns: { base: "1fr", md: "repeat(3, 1fr)" },
                gap: "4",
              })}
            >
              <a href="/tables" class={css({ textDecoration: "none", color: "inherit" })}>
                <Box
                  p="4"
                  borderRadius="md"
                  bg="bg.subtle"
                  class={css({
                    borderWidth: "1px",
                    borderColor: "border.subtle",
                    _hover: { borderColor: "accent.default", bg: "bg.muted" },
                    transitionProperty: "colors",
                    transitionDuration: "fast",
                  })}
                >
                  <VStack gap="2" alignItems="flex-start">
                    <HStack gap="2" alignItems="center">
                      <TableIcon size={16} color="var(--colors-accent-default)" />
                      <Text size="sm" fontWeight="bold">
                        Live Tables
                      </Text>
                    </HStack>
                    <Text size="xs" color="fg.muted">
                      Inspect reactive tables, SATS schema, cell diffs, and live WebSocket updates.
                    </Text>
                  </VStack>
                </Box>
              </a>

              <a href="/reducers" class={css({ textDecoration: "none", color: "inherit" })}>
                <Box
                  p="4"
                  borderRadius="md"
                  bg="bg.subtle"
                  class={css({
                    borderWidth: "1px",
                    borderColor: "border.subtle",
                    _hover: { borderColor: "accent.default", bg: "bg.muted" },
                    transitionProperty: "colors",
                    transitionDuration: "fast",
                  })}
                >
                  <VStack gap="2" alignItems="flex-start">
                    <HStack gap="2" alignItems="center">
                      <Terminal size={16} color="var(--colors-accent-default)" />
                      <Text size="sm" fontWeight="bold">
                        Reducer Studio
                      </Text>
                    </HStack>
                    <Text size="xs" color="fg.muted">
                      Dispatch transactions with Form/JSON modes, inspect latency, and audit logs.
                    </Text>
                  </VStack>
                </Box>
              </a>

              <a href="/sql" class={css({ textDecoration: "none", color: "inherit" })}>
                <Box
                  p="4"
                  borderRadius="md"
                  bg="bg.subtle"
                  class={css({
                    borderWidth: "1px",
                    borderColor: "border.subtle",
                    _hover: { borderColor: "accent.default", bg: "bg.muted" },
                    transitionProperty: "colors",
                    transitionDuration: "fast",
                  })}
                >
                  <VStack gap="2" alignItems="flex-start">
                    <HStack gap="2" alignItems="center">
                      <TerminalSquare size={16} color="var(--colors-accent-default)" />
                      <Text size="sm" fontWeight="bold">
                        SQL Runner
                      </Text>
                    </HStack>
                    <Text size="xs" color="fg.muted">
                      Execute ad-hoc SELECT queries, inspect row details, and export JSON/CSV.
                    </Text>
                  </VStack>
                </Box>
              </a>
            </div>
          </Card.Body>
        </Card.Root>
      </Show>

      {/* 4. Protocol & Architecture Telemetry Footer Card */}
      <Card.Root>
        <Card.Body>
          <div
            class={css({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "4",
            })}
          >
            <div
              class={css({
                display: "flex",
                gap: "6",
                alignItems: "center",
                flexWrap: "wrap",
              })}
            >
              <VStack gap="0" alignItems="flex-start">
                <Text size="xs" color="fg.muted">
                  HTTP SCHEMA INTROSPECTION
                </Text>
                <HStack gap="1.5" alignItems="center">
                  <Box
                    w="2"
                    h="2"
                    borderRadius="full"
                    bg={connectionState.httpHealthy ? "accent.default" : "fg.muted"}
                  />
                  <Text size="xs" fontWeight="semibold">
                    {connectionState.httpHealthy
                      ? "Active (GET /v1/database/:db/schema)"
                      : "Standby"}
                  </Text>
                </HStack>
              </VStack>

              <VStack gap="0" alignItems="flex-start">
                <Text size="xs" color="fg.muted">
                  WEBSOCKET SUBSCRIPTION CHANNEL
                </Text>
                <HStack gap="1.5" alignItems="center">
                  <Box
                    w="2"
                    h="2"
                    borderRadius="full"
                    bg={connectionState.wsConnected ? "accent.default" : "fg.muted"}
                  />
                  <Text size="xs" fontWeight="semibold">
                    {connectionState.wsConnected ? "Active (v3/v2.bsatn.spacetimedb)" : "Standby"}
                  </Text>
                </HStack>
              </VStack>

              <VStack gap="0" alignItems="flex-start">
                <Text size="xs" color="fg.muted">
                  FRONTEND PORT
                </Text>
                <Text size="xs" fontWeight="semibold" class={css({ fontFamily: "mono" })}>
                  http://localhost:5173
                </Text>
              </VStack>
            </div>

            <Text size="xs" color="fg.muted">
              SpacetimeDB 2.x Universal Studio · Zero Codegen Dependency
            </Text>
          </div>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}

import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import { css } from "styled-system/css";
import { Badge, Button, HStack, Input, Text, VStack } from "~/components/ui";
import {
  clearTransactionFeed,
  exportTransactionFeedAsJson,
  reducerStudioState,
  reloadTransactionIntoStudio,
} from "~/lib/spacetimedb/reducers";

export function TransactionFeed() {
  const [filterTerm, setFilterTerm] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal<"all" | "committed" | "failed">("all");
  const [expandedTxId, setExpandedTxId] = createSignal<string | null>(null);
  const [copiedTxId, setCopiedTxId] = createSignal<string | null>(null);

  const filteredFeed = createMemo(() => {
    let list = reducerStudioState.transactionFeed || [];
    const term = filterTerm().toLowerCase().trim();
    const status = statusFilter();

    if (status !== "all") {
      list = list.filter((tx) => tx.status === status);
    }

    if (term) {
      list = list.filter(
        (tx) =>
          tx.reducerName.toLowerCase().includes(term) ||
          (tx.senderIdentity && tx.senderIdentity.toLowerCase().includes(term)) ||
          (tx.error && tx.error.toLowerCase().includes(term)),
      );
    }

    return list;
  });

  const toggleExpand = (txId: string) => {
    setExpandedTxId((curr) => (curr === txId ? null : txId));
  };

  const copyPayload = (payload: string, txId: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
    setCopiedTxId(txId);
    setTimeout(() => {
      setCopiedTxId((curr) => (curr === txId ? null : curr));
    }, 1500);
  };

  return (
    <VStack gap="4" alignItems="stretch" w="full">
      {/* 1. Feed Header & Controls */}
      <div
        class={css({
          p: "3.5",
          bg: "bg.subtle",
          borderRadius: "md",
          borderWidth: "1px",
          borderColor: "border.subtle",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "3",
        })}
      >
        {/* Left: Title & Counters */}
        <HStack gap="2.5" alignItems="center">
          <Activity size={18} color="var(--colors-accent-default)" />
          <HStack gap="2" alignItems="center">
            <Text size="sm" fontWeight="bold">
              Transaction Feed
            </Text>
            <Badge variant="subtle" size="sm">
              {filteredFeed().length} {filteredFeed().length === 1 ? "event" : "events"}
            </Badge>
          </HStack>
        </HStack>

        {/* Right: Filters & Clear */}
        <HStack gap="2" alignItems="center" class={css({ flexWrap: "wrap" })}>
          {/* Status Filter Tabs */}
          <div
            class={css({
              display: "flex",
              p: "0.5",
              bg: "bg.default",
              borderRadius: "md",
              borderWidth: "1px",
              borderColor: "border.subtle",
            })}
          >
            <For each={["all", "committed", "failed"] as const}>
              {(st) => (
                <button
                  type="button"
                  class={css({
                    px: "2.5",
                    py: "1",
                    fontSize: "2xs",
                    borderRadius: "sm",
                    cursor: "pointer",
                    border: "none",
                    textTransform: "capitalize",
                    bg: statusFilter() === st ? "accent.default" : "transparent",
                    color: statusFilter() === st ? "white" : "fg.muted",
                    fontWeight: statusFilter() === st ? "semibold" : "normal",
                  })}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              )}
            </For>
          </div>

          {/* Quick Search */}
          <div class={css({ minW: "[140px]", maxW: "[180px]" })}>
            <Input
              size="sm"
              placeholder="Filter logs..."
              value={filterTerm()}
              onInput={(e) => setFilterTerm(e.currentTarget.value)}
            />
          </div>

          {/* Export JSON */}
          <Button
            variant="ghost"
            size="xs"
            onClick={exportTransactionFeedAsJson}
            disabled={reducerStudioState.transactionFeed.length === 0}
            title="Export transaction log as JSON"
          >
            <Download size={13} />
            Export
          </Button>

          {/* Clear Feed */}
          <Button
            variant="ghost"
            size="xs"
            onClick={clearTransactionFeed}
            disabled={reducerStudioState.transactionFeed.length === 0}
            title="Clear transaction feed"
          >
            <Trash2 size={13} />
            Clear
          </Button>
        </HStack>
      </div>

      {/* 2. Transaction Stream List */}
      <Show
        when={filteredFeed().length > 0}
        fallback={
          <div
            class={css({
              p: "8",
              borderWidth: "1px",
              borderColor: "border.subtle",
              borderRadius: "md",
              bg: "bg.default",
              textAlign: "center",
            })}
          >
            <VStack gap="2" alignItems="center">
              <Clock size={24} color="var(--colors-fg-muted)" />
              <Text size="xs" color="fg.muted">
                {filterTerm() || statusFilter() !== "all"
                  ? "No transactions match your filter criteria."
                  : "No transactions dispatched yet in this session."}
              </Text>
            </VStack>
          </div>
        }
      >
        <div
          class={css({
            display: "flex",
            flexDirection: "column",
            gap: "2",
            overflowY: "auto",
            p: "0.5",
            maxH: "[60vh]",
          })}
        >
          <For each={filteredFeed()}>
            {(tx) => {
              const isCommitted = () => tx.status === "committed";
              const isExpanded = () => expandedTxId() === tx.id;
              const isCopied = () => copiedTxId() === tx.id;

              return (
                <div
                  class={css({
                    p: "3",
                    bg: "bg.default",
                    borderWidth: "1px",
                    borderLeftWidth: "4px",
                    borderLeftColor: isCommitted() ? "success.default" : "danger.default",
                    borderRadius: "md",
                    transitionProperty: "colors",
                    transitionDuration: "fast",
                    _hover: { borderColor: "border.default" },
                  })}
                >
                  <div
                    class={css({
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "2",
                    })}
                  >
                    {/* Left: Status Icon, Reducer Name, Arguments summary */}
                    <HStack gap="2.5" alignItems="center">
                      <Show
                        when={isCommitted()}
                        fallback={<XCircle size={16} class={css({ color: "danger.default" })} />}
                      >
                        <CheckCircle2 size={16} class={css({ color: "success.default" })} />
                      </Show>

                      <HStack gap="2" alignItems="center">
                        <span
                          class={css({ fontFamily: "mono", fontWeight: "bold", fontSize: "xs" })}
                        >
                          {tx.reducerName}
                        </span>
                        <Badge
                          variant={isCommitted() ? "solid" : "subtle"}
                          size="sm"
                          class={css({
                            bg: isCommitted() ? "success.subtle" : "danger.subtle",
                            color: isCommitted() ? "success.default" : "danger.default",
                            borderColor: isCommitted() ? "success.border" : "danger.border",
                          })}
                        >
                          {tx.status.toUpperCase()}
                        </Badge>
                      </HStack>

                      {/* Args preview */}
                      <span
                        class={css({
                          fontFamily: "mono",
                          fontSize: "2xs",
                          color: "fg.muted",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxW: "[280px]",
                        })}
                        title={JSON.stringify(tx.args)}
                      >
                        ({JSON.stringify(tx.args).slice(1, -1)})
                      </span>
                    </HStack>

                    {/* Right: Sender, RTT, Timestamp & Expand Toggle */}
                    <HStack gap="3" alignItems="center">
                      <Show when={tx.senderIdentity}>
                        <span
                          class={css({
                            fontFamily: "mono",
                            fontSize: "2xs",
                            color: "accent.default",
                          })}
                          title={`Caller Identity: ${tx.senderIdentity}`}
                        >
                          {tx.senderIdentity?.slice(0, 6)}...{tx.senderIdentity?.slice(-4)}
                        </span>
                      </Show>

                      <Show when={tx.durationMs !== null}>
                        <Badge variant="subtle" size="sm">
                          {tx.durationMs}ms
                        </Badge>
                      </Show>

                      <Text size="xs" color="fg.muted">
                        {tx.timestamp}
                      </Text>

                      <button
                        type="button"
                        class={css({
                          p: "1",
                          cursor: "pointer",
                          bg: "transparent",
                          border: "none",
                          color: "fg.muted",
                          _hover: { color: "fg.default" },
                        })}
                        onClick={() => toggleExpand(tx.id)}
                        title="Toggle payload details"
                      >
                        <Show when={isExpanded()} fallback={<ChevronDown size={14} />}>
                          <ChevronUp size={14} />
                        </Show>
                      </button>
                    </HStack>
                  </div>

                  {/* Expanded Details Pane */}
                  <Show when={isExpanded()}>
                    <div
                      class={css({
                        mt: "3",
                        pt: "3",
                        borderTopWidth: "1px",
                        borderColor: "border.subtle",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2.5",
                      })}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <Text size="xs" fontWeight="semibold" color="fg.muted">
                          DISPATCHED ARGUMENTS (JSON)
                        </Text>
                        <HStack gap="2" alignItems="center">
                          <button
                            type="button"
                            class={css({
                              display: "flex",
                              alignItems: "center",
                              gap: "1",
                              px: "2",
                              py: "0.5",
                              fontSize: "2xs",
                              borderRadius: "sm",
                              cursor: "pointer",
                              bg: "bg.subtle",
                              borderWidth: "1px",
                              borderColor: "border.subtle",
                              color: "accent.default",
                              _hover: { bg: "bg.muted" },
                            })}
                            onClick={() => {
                              reloadTransactionIntoStudio(tx);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            title="Load this transaction payload into the Studio form"
                          >
                            <RotateCcw size={11} />
                            <span>Load into Studio</span>
                          </button>

                          <button
                            type="button"
                            class={css({
                              display: "flex",
                              alignItems: "center",
                              gap: "1",
                              px: "2",
                              py: "0.5",
                              fontSize: "2xs",
                              borderRadius: "sm",
                              cursor: "pointer",
                              bg: "bg.subtle",
                              borderWidth: "1px",
                              borderColor: "border.subtle",
                              color: "fg.muted",
                              _hover: { color: "fg.default" },
                            })}
                            onClick={() => copyPayload(tx.payloadRaw, tx.id)}
                          >
                            <Show when={isCopied()} fallback={<Copy size={11} />}>
                              <Check size={11} color="var(--colors-accent-default)" />
                            </Show>
                            <span>{isCopied() ? "Copied" : "Copy Payload"}</span>
                          </button>
                        </HStack>
                      </HStack>

                      <pre
                        class={css({
                          p: "2.5",
                          bg: "bg.subtle",
                          borderRadius: "sm",
                          fontSize: "2xs",
                          fontFamily: "mono",
                          overflowX: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        })}
                      >
                        {tx.payloadRaw}
                      </pre>

                      <Show when={tx.error}>
                        <VStack gap="1" alignItems="stretch">
                          <HStack gap="1" alignItems="center">
                            <AlertCircle size={12} class={css({ color: "danger.default" })} />
                            <Text size="xs" fontWeight="semibold" color="danger.default">
                              TRANSACTION ERROR
                            </Text>
                          </HStack>
                          <pre
                            class={css({
                              p: "2.5",
                              borderWidth: "1px",
                              borderRadius: "sm",
                              fontSize: "2xs",
                              fontFamily: "mono",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                              bg: "danger.subtle",
                              borderColor: "danger.border",
                              color: "danger.default",
                            })}
                          >
                            {tx.error}
                          </pre>
                        </VStack>
                      </Show>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </VStack>
  );
}

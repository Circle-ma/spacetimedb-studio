import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Code,
  FormInput,
  Key,
  RotateCcw,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-solid";
import { createMemo, createSignal, For, Show } from "solid-js";
import { css } from "styled-system/css";
import { Badge, Button, HStack, Input, Text, Textarea, VStack } from "~/components/ui";
import { connectionState } from "~/lib/spacetimedb/client";
import {
  buildDefaultJsonArgs,
  dispatchTransaction,
  parseFormArgs,
  reducerStudioState,
  setReducerStudioState,
} from "~/lib/spacetimedb/reducers";
import type { ReducerMeta } from "~/lib/spacetimedb/schema";

const spinAnimation = css({
  animation: "spin",
});

interface ReducerFormViewProps {
  reducer: ReducerMeta | null;
}

export function ReducerFormView(props: ReducerFormViewProps) {
  const [jsonError, setJsonError] = createSignal<string | null>(null);

  const isFormMode = () => reducerStudioState.inputMode === "form";

  const handleModeChange = (mode: "form" | "json") => {
    if (mode === "json" && isFormMode() && props.reducer) {
      // Sync form values into JSON
      try {
        const parsed = parseFormArgs(props.reducer.params, reducerStudioState.formValues);
        setReducerStudioState((s) => {
          s.jsonInput = JSON.stringify(parsed, null, 2);
          s.inputMode = "json";
        });
        setJsonError(null);
        return;
      } catch {
        // Keep existing json input
      }
    } else if (mode === "form" && !isFormMode() && props.reducer) {
      // Sync JSON array back into Form values
      try {
        const parsed = JSON.parse(reducerStudioState.jsonInput);
        if (Array.isArray(parsed)) {
          const newFormVals: Record<string, string> = {};
          props.reducer.params.forEach((p, idx) => {
            const val = parsed[idx];
            if (val === undefined || val === null) {
              newFormVals[p.name] = val === null ? "null" : "";
            } else if (typeof val === "object") {
              newFormVals[p.name] = JSON.stringify(val);
            } else {
              newFormVals[p.name] = String(val);
            }
          });
          setReducerStudioState((s) => {
            s.formValues = newFormVals;
            s.inputMode = "form";
          });
          setJsonError(null);
          return;
        }
      } catch {
        // Keep existing form values
      }
    }

    setReducerStudioState((s) => {
      s.inputMode = mode;
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleDispatch();
    }
  };

  const handleResetDefaults = () => {
    if (!props.reducer) return;
    const defaults = buildDefaultJsonArgs(props.reducer, connectionState.identity);
    const formVals: Record<string, string> = {};
    for (const p of props.reducer.params) {
      if (p.category === "identity" && connectionState.identity) {
        formVals[p.name] = connectionState.identity;
      } else if (p.category === "timestamp") {
        formVals[p.name] = String(Date.now() * 1000);
      } else if (p.typeDisplay.toLowerCase().includes("bool")) {
        formVals[p.name] = "false";
      } else {
        formVals[p.name] = "";
      }
    }
    setReducerStudioState((s) => {
      s.formValues = formVals;
      s.jsonInput = defaults;
      s.lastResult = null;
    });
    setJsonError(null);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(reducerStudioState.jsonInput);
      setReducerStudioState((s) => {
        s.jsonInput = JSON.stringify(parsed, null, 2);
      });
      setJsonError(null);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON syntax");
    }
  };

  const handleFormInputChange = (paramName: string, value: string) => {
    setReducerStudioState((s) => {
      s.formValues[paramName] = value;
    });
  };

  const insertMyIdentity = (paramName: string) => {
    if (connectionState.identity) {
      setReducerStudioState((s) => {
        s.formValues[paramName] = connectionState.identity || "";
      });
    }
  };

  const insertCurrentTimestamp = (paramName: string) => {
    setReducerStudioState((s) => {
      s.formValues[paramName] = String(Date.now() * 1000);
    });
  };

  const handleDispatch = async () => {
    if (!props.reducer || reducerStudioState.isDispatching) return;

    let argsToDispatch: unknown[];

    if (isFormMode()) {
      argsToDispatch = parseFormArgs(props.reducer.params, reducerStudioState.formValues);
    } else {
      try {
        const parsed = JSON.parse(reducerStudioState.jsonInput);
        if (!Array.isArray(parsed)) {
          setJsonError('Reducer arguments payload must be a JSON array (e.g. ["val1", 42])');
          return;
        }
        argsToDispatch = parsed;
        setJsonError(null);
      } catch (err: unknown) {
        setJsonError(err instanceof Error ? err.message : "Malformed JSON syntax");
        return;
      }
    }

    await dispatchTransaction(props.reducer.name, argsToDispatch);
  };

  const lastTxResult = createMemo(() => {
    if (
      reducerStudioState.lastResult &&
      reducerStudioState.lastResult.reducerName === props.reducer?.name
    ) {
      return reducerStudioState.lastResult;
    }
    return null;
  });

  return (
    <Show
      when={props.reducer}
      fallback={
        <div
          class={css({
            p: "12",
            borderWidth: "1px",
            borderColor: "border.subtle",
            borderRadius: "lg",
            bg: "bg.subtle",
            textAlign: "center",
          })}
        >
          <VStack gap="3" alignItems="center">
            <Terminal size={32} color="var(--colors-fg-muted)" />
            <Text size="sm" fontWeight="semibold">
              Select a Reducer to Begin
            </Text>
            <Text size="xs" color="fg.muted" class={css({ maxW: "sm" })}>
              Pick a reducer from the sidebar to inspect its typed parameter signatures, build
              transaction payloads, and dispatch calls directly to SpacetimeDB.
            </Text>
          </VStack>
        </div>
      }
    >
      <VStack gap="4" alignItems="stretch" w="full">
        {/* 1. Header Toolbar */}
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
          {/* Left: Reducer Title & Signature */}
          <HStack gap="2.5" alignItems="center">
            <Zap size={18} color="var(--colors-accent-default)" />
            <VStack gap="0" alignItems="flex-start">
              <HStack gap="2" alignItems="center">
                <Text size="sm" fontWeight="bold">
                  {props.reducer?.name}
                </Text>
                <Badge variant={props.reducer?.isSystem ? "subtle" : "solid"} size="sm">
                  {props.reducer?.isSystem ? "Lifecycle Hook" : "User Reducer"}
                </Badge>
              </HStack>
              <Text size="xs" color="fg.muted">
                {props.reducer?.params.length === 0
                  ? "Takes no arguments (void)"
                  : `${props.reducer?.params.length} parameters: (${props.reducer?.params.map((p) => `${p.name}: ${p.typeDisplay}`).join(", ")})`}
              </Text>
            </VStack>
          </HStack>

          {/* Right: Mode Switcher & Reset */}
          <HStack gap="2" alignItems="center">
            {/* Input Mode Pill */}
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
              <button
                type="button"
                class={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5",
                  px: "2.5",
                  py: "1",
                  fontSize: "xs",
                  borderRadius: "sm",
                  cursor: "pointer",
                  border: "none",
                  bg: isFormMode() ? "accent.default" : "transparent",
                  color: isFormMode() ? "white" : "fg.muted",
                  fontWeight: isFormMode() ? "semibold" : "normal",
                })}
                onClick={() => handleModeChange("form")}
              >
                <FormInput size={13} />
                Form Mode
              </button>
              <button
                type="button"
                class={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5",
                  px: "2.5",
                  py: "1",
                  fontSize: "xs",
                  borderRadius: "sm",
                  cursor: "pointer",
                  border: "none",
                  bg: !isFormMode() ? "accent.default" : "transparent",
                  color: !isFormMode() ? "white" : "fg.muted",
                  fontWeight: !isFormMode() ? "semibold" : "normal",
                })}
                onClick={() => handleModeChange("json")}
              >
                <Code size={13} />
                JSON Mode
              </button>
            </div>

            <Button
              variant="ghost"
              size="xs"
              onClick={handleResetDefaults}
              title="Reset parameters to defaults"
            >
              <RotateCcw size={13} />
              Reset
            </Button>
          </HStack>
        </div>

        {/* 2. Interactive Input Workspace */}
        <div
          class={css({
            p: "4",
            bg: "bg.default",
            borderRadius: "md",
            borderWidth: "1px",
            borderColor: "border.subtle",
          })}
          onKeyDown={handleKeyDown}
        >
          <Show
            when={isFormMode()}
            fallback={
              /* JSON Mode Editor */
              <VStack gap="3" alignItems="stretch">
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack gap="1.5" alignItems="center">
                    <Code size={14} color="var(--colors-accent-default)" />
                    <Text size="xs" fontWeight="semibold" color="fg.muted">
                      RAW ARGUMENTS (JSON ARRAY)
                    </Text>
                  </HStack>
                  <Button variant="outline" size="xs" onClick={formatJson}>
                    Prettify JSON
                  </Button>
                </HStack>

                <div class={css({ position: "relative" })}>
                  <Textarea
                    rows={8}
                    class={css({
                      fontFamily: "mono",
                      fontSize: "xs",
                      bg: "bg.subtle",
                    })}
                    value={reducerStudioState.jsonInput}
                    onInput={(e) => {
                      const val = e.currentTarget.value;
                      setReducerStudioState((s) => {
                        s.jsonInput = val;
                      });
                      setJsonError(null);
                    }}
                    placeholder='[\n  "hello",\n  42\n]'
                  />
                </div>

                <Show when={jsonError()}>
                  <div
                    class={css({
                      p: "2.5",
                      borderWidth: "1px",
                      borderRadius: "md",
                      bg: "danger.subtle",
                      borderColor: "danger.border",
                    })}
                  >
                    <HStack gap="2" alignItems="center">
                      <AlertCircle size={14} class={css({ color: "danger.default" })} />
                      <Text size="xs" color="danger.default">
                        {jsonError()}
                      </Text>
                    </HStack>
                  </div>
                </Show>
              </VStack>
            }
          >
            {/* Form Mode Dynamic Fields */}
            <VStack gap="4" alignItems="stretch">
              <Show
                when={props.reducer && props.reducer.params.length > 0}
                fallback={
                  <div
                    class={css({
                      p: "4",
                      bg: "bg.subtle",
                      borderRadius: "md",
                      textAlign: "center",
                    })}
                  >
                    <Text size="xs" color="fg.muted">
                      This reducer does not accept any arguments. Click Dispatch below to trigger
                      it.
                    </Text>
                  </div>
                }
              >
                <For each={props.reducer?.params}>
                  {(param) => {
                    const val = () => reducerStudioState.formValues[param.name] ?? "";
                    const isBool = () => param.typeDisplay.toLowerCase().includes("bool");
                    const isIdentity = () => param.category === "identity";
                    const isTimestamp = () => param.category === "timestamp";
                    const isComplex = () =>
                      param.category === "struct" || param.category === "array";

                    return (
                      <VStack gap="1.5" alignItems="stretch">
                        <HStack justifyContent="space-between" alignItems="center">
                          <HStack gap="2" alignItems="center">
                            <span
                              class={css({
                                fontFamily: "mono",
                                fontSize: "xs",
                                fontWeight: "bold",
                              })}
                            >
                              {param.name}
                            </span>
                            <Badge variant="subtle" size="sm">
                              {param.typeDisplay}
                            </Badge>
                            <Show when={param.nullable}>
                              <Text size="xs" color="fg.muted">
                                (optional)
                              </Text>
                            </Show>
                          </HStack>

                          {/* Quick Fill Shortcuts */}
                          <HStack gap="1.5" alignItems="center">
                            <Show when={isIdentity() && connectionState.identity}>
                              <button
                                type="button"
                                class={css({
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "1",
                                  px: "1.5",
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
                                onClick={() => insertMyIdentity(param.name)}
                                title="Autofill with active connection Identity"
                              >
                                <Key size={10} />
                                My Identity
                              </button>
                            </Show>

                            <Show when={isTimestamp()}>
                              <button
                                type="button"
                                class={css({
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "1",
                                  px: "1.5",
                                  py: "0.5",
                                  fontSize: "2xs",
                                  borderRadius: "sm",
                                  cursor: "pointer",
                                  bg: "bg.subtle",
                                  borderWidth: "1px",
                                  borderColor: "border.subtle",
                                  color: "fg.muted",
                                  _hover: { bg: "bg.muted" },
                                })}
                                onClick={() => insertCurrentTimestamp(param.name)}
                                title="Autofill with current timestamp"
                              >
                                <Clock size={10} />
                                Now
                              </button>
                            </Show>
                          </HStack>
                        </HStack>

                        {/* Input Control according to Type */}
                        <Show
                          when={!isBool()}
                          fallback={
                            /* Boolean Toggle */
                            <HStack gap="2">
                              <button
                                type="button"
                                class={css({
                                  px: "3",
                                  py: "1.5",
                                  fontSize: "xs",
                                  borderRadius: "sm",
                                  cursor: "pointer",
                                  borderWidth: "1px",
                                  borderColor:
                                    val() === "true" ? "accent.default" : "border.subtle",
                                  bg: val() === "true" ? "accent.default" : "bg.subtle",
                                  color: val() === "true" ? "white" : "fg.default",
                                  fontWeight: val() === "true" ? "bold" : "normal",
                                })}
                                onClick={() => handleFormInputChange(param.name, "true")}
                              >
                                true
                              </button>
                              <button
                                type="button"
                                class={css({
                                  px: "3",
                                  py: "1.5",
                                  fontSize: "xs",
                                  borderRadius: "sm",
                                  cursor: "pointer",
                                  borderWidth: "1px",
                                  borderColor:
                                    val() === "false" ? "accent.default" : "border.subtle",
                                  bg: val() === "false" ? "accent.default" : "bg.subtle",
                                  color: val() === "false" ? "white" : "fg.default",
                                  fontWeight: val() === "false" ? "bold" : "normal",
                                })}
                                onClick={() => handleFormInputChange(param.name, "false")}
                              >
                                false
                              </button>
                            </HStack>
                          }
                        >
                          <Show
                            when={!isComplex()}
                            fallback={
                              /* Complex Struct / Array JSON Input */
                              <Textarea
                                rows={3}
                                class={css({ fontFamily: "mono", fontSize: "xs" })}
                                value={val()}
                                onInput={(e) =>
                                  handleFormInputChange(param.name, e.currentTarget.value)
                                }
                                placeholder={param.category === "array" ? "[]" : "{}"}
                              />
                            }
                          >
                            <Input
                              size="sm"
                              class={css({
                                fontFamily: isIdentity() || isTimestamp() ? "mono" : "inherit",
                              })}
                              value={val()}
                              onInput={(e) =>
                                handleFormInputChange(param.name, e.currentTarget.value)
                              }
                              placeholder={`Enter ${param.name} (${param.typeDisplay})`}
                            />
                          </Show>
                        </Show>
                      </VStack>
                    );
                  }}
                </For>
              </Show>
            </VStack>
          </Show>
        </div>

        {/* 3. Dispatch Button & Result Telemetry */}
        <div
          class={css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "3",
          })}
        >
          <Button
            variant="solid"
            size="md"
            onClick={handleDispatch}
            disabled={reducerStudioState.isDispatching}
            class={css({ minW: "[180px]" })}
            title="Dispatch Transaction (Cmd + Enter / Ctrl + Enter)"
          >
            <Show
              when={reducerStudioState.isDispatching}
              fallback={
                <HStack gap="2">
                  <Zap size={16} />
                  <span>Dispatch Transaction</span>
                  <span
                    class={css({
                      fontSize: "2xs",
                      opacity: 0.75,
                      fontFamily: "mono",
                      ml: "1",
                    })}
                  >
                    ⌘↵
                  </span>
                </HStack>
              }
            >
              <HStack gap="2">
                <Sparkles size={16} class={spinAnimation} />
                <span>Executing Reducer...</span>
              </HStack>
            </Show>
          </Button>

          <Text size="xs" color="fg.muted">
            Target:{" "}
            <span class={css({ fontFamily: "mono", color: "fg.default" })}>
              {connectionState.database}
            </span>{" "}
            via POST /call/{props.reducer?.name}
          </Text>
        </div>

        {/* 4. Real-time Transaction Result Feedback Banner */}
        <Show when={lastTxResult()}>
          {(res) => {
            const isSuccess = () => res().status === "committed";
            return (
              <div
                class={css({
                  p: "3.5",
                  borderRadius: "md",
                  borderWidth: "1px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2",
                  bg: isSuccess() ? "success.subtle" : "danger.subtle",
                  borderColor: isSuccess() ? "success.border" : "danger.border",
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
                  <HStack gap="2" alignItems="center">
                    <Show
                      when={isSuccess()}
                      fallback={<AlertCircle size={16} class={css({ color: "danger.default" })} />}
                    >
                      <CheckCircle2 size={16} class={css({ color: "success.default" })} />
                    </Show>
                    <Text
                      size="xs"
                      fontWeight="bold"
                      color={isSuccess() ? "success.default" : "danger.default"}
                    >
                      {isSuccess()
                        ? "Transaction Successfully Committed"
                        : "Transaction Rejected / Failed"}
                    </Text>
                  </HStack>

                  <HStack gap="2" alignItems="center">
                    <Show when={res().durationMs !== null}>
                      <Badge variant="subtle" size="sm">
                        RTT {res().durationMs}ms
                      </Badge>
                    </Show>
                    <Text size="xs" color="fg.muted">
                      {res().timestamp}
                    </Text>
                  </HStack>
                </div>

                <Show when={res().error}>
                  <div
                    class={css({
                      p: "2.5",
                      borderRadius: "sm",
                      fontFamily: "mono",
                      fontSize: "2xs",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      bg: "black/25",
                      color: "danger.default",
                    })}
                  >
                    {res().error}
                  </div>
                </Show>
              </div>
            );
          }}
        </Show>
      </VStack>
    </Show>
  );
}

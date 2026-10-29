import { Play, RotateCcw, Sparkles, Terminal } from "lucide-solid";
import { createEffect, For, Show } from "solid-js";
import { css } from "styled-system/css";
import { Badge, Button, HStack, Text, Textarea, VStack } from "~/components/ui";
import { connectionState } from "~/lib/spacetimedb/client";
import { runActiveQuery, setQueryText, sqlRunnerState } from "~/lib/spacetimedb/sql";
import { tableExplorerState } from "~/lib/spacetimedb/tables";

const spinAnimation = css({
  animation: "spin",
});

export function SqlEditor() {
  const availableTables = () => tableExplorerState.schema?.tables || [];

  // Auto-suggest first table query if query is empty upon schema load
  createEffect(
    () => tableExplorerState.schema?.tables,
    (tables) => {
      if (tables && tables.length > 0 && !sqlRunnerState.query.trim()) {
        const first = tables[0];
        setQueryText(`SELECT * FROM "${first.name}" LIMIT 50;`);
      }
    },
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd + Enter or Ctrl + Enter to run
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void runActiveQuery();
      return;
    }

    // Tab key indent
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const newVal = `${val.substring(0, start)}  ${val.substring(end)}`;
      setQueryText(newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const applyTableTemplate = (tableName: string, templateType: "select" | "count") => {
    if (!tableName) return;
    const safeName = `"${tableName.replace(/"/g, '""')}"`;
    if (templateType === "count") {
      setQueryText(`SELECT count(*) FROM ${safeName};`);
    } else {
      setQueryText(`SELECT * FROM ${safeName} LIMIT 50;`);
    }
  };

  return (
    <VStack gap="3" alignItems="stretch" w="full">
      {/* 1. Editor Toolbar */}
      <div
        class={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "3",
          p: "3",
          bg: "bg.subtle",
          borderRadius: "md",
          borderWidth: "1px",
          borderColor: "border.subtle",
        })}
      >
        {/* Left: Target and Table Templates */}
        <HStack gap="3" alignItems="center" class={css({ flexWrap: "wrap" })}>
          <HStack gap="2" alignItems="center">
            <Terminal size={16} color="var(--colors-accent-default)" />
            <Text size="xs" fontWeight="bold">
              SQL Runner
            </Text>
            <Badge variant="subtle" size="sm">
              {connectionState.database || "No DB"}
            </Badge>
          </HStack>

          {/* Quick Table Query Template Dropdown */}
          <Show when={availableTables().length > 0}>
            <HStack gap="1.5" alignItems="center">
              <Text size="xs" color="fg.muted">
                Template:
              </Text>
              <select
                class={css({
                  fontSize: "xs",
                  p: "1",
                  borderRadius: "sm",
                  borderWidth: "1px",
                  borderColor: "border.subtle",
                  bg: "bg.default",
                  color: "fg.default",
                  cursor: "pointer",
                })}
                value=""
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  if (val) {
                    const [name, mode] = val.split(":");
                    applyTableTemplate(name, (mode as "select" | "count") || "select");
                  }
                  e.currentTarget.value = "";
                }}
              >
                <option value="">-- Quick Query Templates --</option>
                <For each={availableTables()}>
                  {(tbl) => (
                    <>
                      <option value={`${tbl.name}:select`}>
                        SELECT * FROM "{tbl.name}" LIMIT 50
                      </option>
                      <option value={`${tbl.name}:count`}>SELECT count(*) FROM "{tbl.name}"</option>
                    </>
                  )}
                </For>
              </select>
            </HStack>
          </Show>
        </HStack>

        {/* Right: Actions */}
        <HStack gap="2" alignItems="center">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setQueryText("")}
            title="Clear SQL Editor"
          >
            <RotateCcw size={12} />
            Clear
          </Button>

          {/* Run Query Button */}
          <Button
            variant="solid"
            size="sm"
            onClick={() => runActiveQuery()}
            disabled={sqlRunnerState.isExecuting || !sqlRunnerState.query.trim()}
            class={css({ minW: "[140px]" })}
            title="Execute query (Cmd + Enter / Ctrl + Enter)"
          >
            <Show
              when={sqlRunnerState.isExecuting}
              fallback={
                <HStack gap="1.5">
                  <Play size={13} />
                  <span>Run Query</span>
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
              <HStack gap="1.5">
                <Sparkles size={13} class={spinAnimation} />
                <span>Running...</span>
              </HStack>
            </Show>
          </Button>
        </HStack>
      </div>

      {/* 2. SQL Input Textarea */}
      <div class={css({ position: "relative", w: "full" })}>
        <Textarea
          rows={6}
          class={css({
            fontFamily: "mono",
            fontSize: "xs",
            bg: "bg.default",
            p: "3.5",
            lineHeight: "relaxed",
          })}
          value={sqlRunnerState.query}
          onInput={(e) => setQueryText(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder='SELECT * FROM "my_table" WHERE id = 1;'
        />
      </div>
    </VStack>
  );
}

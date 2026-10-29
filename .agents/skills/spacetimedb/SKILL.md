---

name: spacetimedb
description: Guide for building real-time apps with SpacetimeDB 2.x and Solid.js 2.0. Use when setting up subscriptions, calling reducers, or binding database tables to Solid reactive signals.
---

# SpacetimeDB with Solid.js 2.0

SpacetimeDB is a relational database and serverless execution engine combined into one.
Clients connect via WebSocket and synchronize local cache state in real time.

## 1. Package & Tooling

- **SDK**: `spacetimedb` (unified package, version `^2.13.0`). Do NOT use the legacy `@spacetimedb/sdk`.
- **CLI**: `spacetime` (located in `~/.local/bin/spacetime`).
- **MCP Server**: `spacetime mcp` (available in `.mcp.json`).

## 2. Code Generation Workflow

SpacetimeDB generates type-safe TypeScript interfaces from your backend module:
```bash
spacetime generate --lang typescript --out-dir src/module_bindings
```

This generates:
- Typed table interfaces (`tables`)
- Typed reducers (`reducers`)
- Typed connection builder (`DbConnection`)

## 3. Connecting to Solid 2.0 Signals

SpacetimeDB event callbacks push data reactively into Solid signals or stores:

```typescript
import { createStore } from "solid-js";
import { DbConnection, tables } from "~/module_bindings";

// Global or module-level reactive store
export const [todos, setTodos] = createStore<any[]>([]);

export const conn = DbConnection.builder()
  .withUri(import.meta.env.VITE_SPACETIMEDB_URI || "ws://localhost:3000")
  .withDatabaseName("my_module")
  .withAutomaticReconnect()
  .onConnect((connection) => {
    // 1. Subscribe to queries
    connection
      .subscriptionBuilder()
      .onApplied((ctx) => {
        // Initial bulk load into store
        setTodos(ctx.db.todos.all());
      })
      .subscribe([tables.todos]);

    // 2. Hook incremental real-time mutations
    connection.db.todos.onInsert((_ctx, newTodo) => {
      setTodos((draft) => {
        draft.push(newTodo);
      });
    });

    connection.db.todos.onDelete((_ctx, deletedTodo) => {
      setTodos((draft) => draft.filter((t) => t.id !== deletedTodo.id));
    });
  })
  .build();
```

## 4. Invoking Transactions (Reducers)

Reducers execute ACID transactions on the server:
```typescript
export async function addTodo(text: string) {
  await conn.reducers.addTodo({ text });
}
```

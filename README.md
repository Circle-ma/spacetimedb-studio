# SpacetimeDB Studio (SpacetimeDB 2.x)

A universal, real-time visual database management suite for [SpacetimeDB](https://spacetimedb.com/) 2.x. Built with Solid 2.0, Panda CSS 2.4, Ark UI 5.x, Bun, Oxlint, and Biome.

Like **Supabase Studio** or **Prisma Studio**, SpacetimeDB Studio is designed as a **universal administrative interface** that does not depend on module-specific static code generation (`spacetime generate`). It dynamically introspects schemas, establishes live WebSocket subscriptions, and dispatches reducer transactions.

---

## ⚡ Technical Foundations

| Domain                   | Technology               | Version       | Purpose                                                         |
| :----------------------- | :----------------------- | :------------ | :-------------------------------------------------------------- |
| **Framework**            | Solid 2.0 Start-Mode SPA | `2.0.0-rc.19` | Fine-grained reactivity, Zero-VDOM, instant cell-level updates  |
| **Styling**              | Panda CSS                | `2.4.x`       | Zero-runtime CSS tokens & recipes                               |
| **Component Primitives** | Ark UI                   | `5.39.x`      | Accessible headless components powered by Zag.js                |
| **Runtime & Tooling**    | Bun                      | `1.4.x`       | Blazing-fast execution, packaging, and scripts                  |
| **Bundler & Dev Server** | Vite                     | `8.3.x`       | Studio running strictly on `http://localhost:5173`              |
| **Lint & Format**        | Oxlint & Biome           | Latest        | Strict Solid 2.0 reactive diagnostics and import formatting     |
| **Database SDK**         | SpacetimeDB              | `2.13.x`      | Dual-channel HTTP introspection + WebSocket BSATN subscriptions |

---

## 🌐 Port Architecture

- **SpacetimeDB Node (Default)**: `http://127.0.0.1:3000`
- **SpacetimeDB Studio UI**: `http://localhost:5173`
  - Strict port configuration prevents collisions with local SpacetimeDB runtime nodes.

---

## 🚀 Implemented Capabilities (Step 1: Connection & Identity Hub)

1. **Dual-Channel Connection Hub**:
   - Host selector (default `http://127.0.0.1:3000`, toggleable to `localhost:3000` or custom endpoints).
   - Database name or hex identity selector.
   - Pre-flight HTTP schema probe (`GET /v1/database/:database/schema`) to measure latency and test instance health.
   - Real-time WebSocket connection (`ws://.../v1/database/:database/subscribe`) with BSATN protocol negotiation.

2. **Zero-Mock & Actionable Diagnostic Assistant**:
   - Direct connection to real SpacetimeDB instances (no fake mock state).
   - In-depth, contextual troubleshooting guides for:
     - **Instance offline**: Step-by-step guidance (`spacetime start`, verify port, firewall checks).
     - **Module not found (404)**: Guidance to run `spacetime publish <name>`.
     - **Auth rejection (401/403)**: Token invalidity notifications.
     - One-click copy for troubleshooting terminal commands.

3. **Identity & Credential Management**:
   - Displays real client `Identity` (hexadecimal string) with one-click copy.
   - Persistent authentication token storage in browser `localStorage`.
   - **Reset to Anonymous Identity**: Clears token and re-establishes connection to obtain a fresh anonymous identity.
   - **Token Impersonation**: Input custom admin/user tokens to simulate authenticated personas.
   - Recent databases list for quick switching.

---

## 🚀 Implemented Capabilities (Step 2: Live Table Explorer)

1. **Dynamic SATS Schema Introspection**:
   - Parses SpacetimeDB SATS (Spacetime Algebraic Type System) AST via `GET /v1/database/:database/schema`.
   - Intelligent categorizer & formatter for Primitives, `Option<T>`, `Enum(...)`, `Struct(...)`, `Array<T>`, `Identity`, and `Timestamp`.
   - Automatic identification of Primary Keys (`Key` icon) and table segmentation into **User Tables** and **System Tables** (`st_table`, etc.).

2. **Fine-Grained Reactive Data Grid**:
   - Powered by Solid 2.0 fine-grained reactivity (zero virtual DOM overhead).
   - **Localized Millisecond Cell Highlighting**: Diff-engine tracks modified cells `rowKey:colName` across sync frames and triggers smooth emerald flash animations (`cell-highlight-active`).
   - Column-level sorting (ascending / descending) and interactive in-memory text filtering across all table records.
   - Intelligent cell renderers:
     - **Identity**: Truncated hex representation with full-string click-to-copy.
     - **Timestamp**: Human-readable date-time conversion.
     - **Option / Null**: Distinct muted representation.
     - **Booleans**: Semantic color-coded pill.
     - **Structs / JSON**: Truncated JSON with expandable click-to-copy.

3. **Live Sync & Streaming Controls**:
   - One-click toggle for periodic live SQL streaming (`SELECT * FROM <table>;`).
   - Instant manual snapshot refresh with RTT latency telemetry.
   - **Export JSON**: One-click download of the active table's dataset.
   - **Schema Modal**: In-depth inspection of raw column definitions and AST.

---

## 🚀 Implemented Capabilities (Step 3: Reducer Studio & Live Transaction Feed)

1. **Dynamic Parameter Form & JSON Generators**:
   - Introspects reducer signatures from the SATS schema, categorizing into **User Reducers** and **Lifecycle Hooks** (`__init__`, `__identity_connected__`, etc.).
   - Dual-mode input: Typed Form generator (primitives, numbers, booleans, JSON fields) and raw JSON editor with bidirectional real-time synchronization.
   - Shortcut support: Press `Cmd + Enter` or `Ctrl + Enter` to dispatch immediately.

2. **Transaction Dispatch & Immediate Feedback**:
   - Direct transaction submission to `POST /v1/database/:database/call/:reducer`.
   - Real-time RTT latency measurement and resilient error unpacking.

3. **Live Transaction Audit Feed**:
   - Chronological transaction audit trail with status indicators (`COMMITTED` / `FAILED`), caller identities, and timestamp.
   - **Load into Studio**: One-click re-population of past transaction arguments back into the Reducer Studio for replay and debugging.

---

## 🚀 Implemented Capabilities (Step 4: Interactive SQL Runner)

1. **Zero-Monaco Lightweight SQL Editor**:
   - Monospace editor with native `Tab` 2-space indentation and `Cmd + Enter` / `Ctrl + Enter` execution shortcut.
   - Dynamic table query templates: Instant insertion of `SELECT * FROM "table" LIMIT 50;` or `SELECT count(*) FROM "table";`.

2. **Interactive Read-Only Results Grid**:
   - Column sorting, client-side real-time substring search filter, and client pagination (50 rows/page).
   - **Row Inspector Modal**: Inspect structured field-by-field definitions and raw JSON representation.
   - RFC 4180 compliant **CSV Export** and clean **JSON Export**.

3. **Query History Sidebar**:
   - Persisted session history tracking query text, RTT latency, returned row count, and execution timestamp.
   - Click to load previous queries directly into the editor.

---

## 🛠️ Development & Verification Commands

```bash
# Start development server on http://localhost:5173
bun run dev

# Run Oxlint and Biome checks
bun run check

# TypeScript typechecking
bun run typecheck

# Production build
bun run build

# Preview production build on port 5173
bun run preview
```

---

## 🗺️ Roadmap & Phase Completion

- [x] **Phase 1: Connection & Identity Hub** (HTTP/WS probe, token persistence, identity simulation)
- [x] **Phase 2: Live Table Explorer** (Dynamic SATS AST, fine-grained reactive grid, cell highlight animation, schema viewer)
- [x] **Phase 3: Reducer Studio & Live Transaction Feed** (Form/JSON dual modes, RTT telemetry, audit logs, 1-click replay)
- [x] **Phase 4: Interactive SQL Runner** (Ad-hoc query terminal, smart templates, history drawer, CSV/JSON export)

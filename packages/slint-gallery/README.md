# Primer gallery

Standalone Slint window for browsing Primer components. This package is split as **`ui/`** (Slint), **`node/`** (TypeScript + `slint-ui` entry), and **`rust/`** (native Skia / wasm runner). The **`primer-slint`** design system lives in the sibling package [`primer-slint`](../primer-slint/). Component demos are not embedded in the main github-app window; use this app (or browse `ui/views/*-page.slint`).

**Content:** **Buttons** (`gallery-buttons-page.slint`), **Checkbox** (`gallery-checkbox-page.slint`), **Counter label** (`gallery-counter-label-page.slint`), **Navs** (`gallery-navs-page.slint`), **Radio** (`gallery-radio-page.slint`), **Data** (`gallery-data-page.slint` — DataTable, Pagination), **Action list** (`gallery-action-list-page.slint` — ActionList, Storybook Features demos).

**`PopupWindow`:** [`ui/views/anchored-popupwindow.md`](ui/views/anchored-popupwindow.md) — parent-relative coordinates, vertical flip, and references to app patterns.

**Direction:** evolve toward a Storybook-like experience: named demos per component, optional metadata (variants, tokens), and room for visual or manual QA notes in later PRs.

Run from the monorepo root:

```bash
pnpm dev:gallery
```

## Rust gallery + embedded Slint MCP

The native Rust runner ([`rust/`](rust/)) can expose Slint’s **embedded MCP** server (Streamable HTTP on `127.0.0.1`) for UI introspection while the window is open. This is **development-only**; do not ship production builds with `--features slint/mcp` or with `SLINT_MCP_PORT` set.

Upstream instructions and tool list: [Slint `internal/backends/testing/README.md` — Embedded MCP Server](https://raw.githubusercontent.com/slint-ui/slint/master/internal/backends/testing/README.md) (see also [Slint PR #11339](https://github.com/slint-ui/slint/pull/11339)). Slint recommends enabling MCP via **`cargo --features slint/mcp`**, not by adding an app-level `mcp` feature in `Cargo.toml`.

**Run (default MCP port 8080):**

```bash
pnpm dev:gallery:rust:mcp
```

Equivalent manual invocation from `packages/slint-gallery/rust`:

```bash
SLINT_EMIT_DEBUG_INFO=1 SLINT_ENABLE_EXPERIMENTAL_FEATURES=1 SLINT_MCP_PORT=8080 \
  cargo run --bin primer_slint_gallery_runner --features slint/mcp
```

`SLINT_EMIT_DEBUG_INFO=1` must be set for the **compile** step so element metadata is embedded (required for MCP introspection). `SLINT_MCP_PORT` selects the listen port; if unset, no MCP server is started.

**WASM:** the `slint/mcp` workflow applies to the **native** binary only; the wasm build is unchanged.

### Verifying the MCP transport (curl)

With the gallery running and `SLINT_MCP_PORT=8080`, confirm the server responds:

```bash
curl -s -X POST http://127.0.0.1:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"1.0"}}}'
```

Then call a tool (example: list windows):

```bash
curl -s -X POST http://127.0.0.1:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_windows","arguments":{}}}'
```

### Cursor

Add an MCP server entry of type **streamable-http** pointing at `http://127.0.0.1:8080/mcp` (see [`.cursor/mcp.json`](../../.cursor/mcp.json) in this repo). Start `pnpm dev:gallery:rust:mcp` first so the URL is reachable; then use Cursor’s MCP UI or Agent tools (if the client exposes them) against the running app.

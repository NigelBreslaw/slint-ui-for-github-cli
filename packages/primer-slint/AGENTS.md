# Primer Slint — guide for contributors and AI assistants

This document stands alone in the repo. Past chats or Cursor plan files are not a reliable archive; use **local upstream clones** and the files linked below when porting or extending components.

**Location:** Library source lives in **`packages/primer-slint/`**. The **github-app** package imports it through a symlink **`app/src/ui/Primer`** → **`packages/primer-slint`** so existing Slint paths (`Primer/...`, `../Primer/...`) keep working.

**Standalone gallery:** From the monorepo root, `pnpm dev:gallery` runs **`gallery-main.ts`**, which loads **`gallery/gallery-window.slint`** (header + sidebar; main area switches by group). **Buttons**, **Navs**, **Feedback**, and **Forms** are implemented in **`gallery/gallery-buttons-page.slint`**, **`gallery/gallery-navs-page.slint`**, **`gallery/gallery-feedback-page.slint`**, and **`gallery/gallery-forms-page.slint`** (ported from `app/src/ui/views/primer-gallery.slint`). Uses **`slint-bridge-kit`** for `GalleryState` wiring.

## Purpose

- **Audience:** Humans and AI assistants adding **Primer-style** UI in Slint under **`packages/primer-slint/`** (same tree as `app/src/ui/Primer/` in github-app).
- **Goals:** Stay close to Primer naming and layering, avoid duplicating color literals across globals, keep `export global` declaration order valid for Slint, and ship changes in reviewable steps.

## Porting workflow

**Procedure** (research → coverage matrix → token plan → interaction states → PRs) is spelled out in Cursor skills under [`.cursor/skills/`](../../.cursor/skills/) — start with [`primer-port-orchestrator/SKILL.md`](../../.cursor/skills/primer-port-orchestrator/SKILL.md). Those files are plain Markdown; you do not need Cursor to read them.

**This document** is **reference only**: paths, token globals, imports index, verification, limitations. It does not duplicate the step-by-step porting playbook.

## Upstream references (consult before inventing values)

| Location | Role |
| -------- | ---- |
| `/Users/nigelb/slint/primer-tokens` | **primer-tokens** — JSON5 under `src/tokens/` (functional + component). Source of truth for **names**, **layering**, and values when porting. |
| `/Users/nigelb/slint/primer-ui-react` | **primer-ui-react** — `*.module.css` maps tokens to **CSS variables**; use for **states**, **sizes**, **validation**, and naming. |

Public docs: [Primer Design System](https://primer.style/design/system), [Product — Getting started](https://primer.style/product/getting-started/).

## In-repo architecture

- **Barrel:** [`primer.slint`](primer.slint) re-exports components, `LayoutTokens`, `PrimerColors`, `ButtonTokens`, `CheckboxTokens`, `BannerTokens`, `LabelTokens`, **`Icons`**, `Size`, and shared types (**DataTable**, **Select**, **Label**, etc.). When adding exports or model fields, update [`readme.md`](readme.md) where noted (e.g. DataTable **Imports for views**).
- **Tokens:** [`tokens.slint`](tokens.slint) — several `export global` singletons in **one file**. **Order matters:** `PrimerColors` → `ButtonTokens` → `CheckboxTokens` (uses `ButtonTokens`) → `BannerTokens` → `LabelTokens` (`BannerTokens` / `LabelTokens`: `PrimerColors` `out` only; no literals in those globals).

### Token layers (current convention)

| Global | Contents |
| ------ | -------- |
| **LayoutTokens** | Lengths, typography, control dimensions, padding, radii, icon sizes, banner spacing. **No** light/dark colors. |
| **PrimerColors** | Semantic surfaces, shared primitives — each shared **hex** appears **once**. |
| **ButtonTokens** | `color-btn-*`, `button-*`, action-list / icon-button tints; composes from **`PrimerColors`**. |
| **CheckboxTokens** | Unchecked/checked/indeterminate/disabled paths; composes from **`PrimerColors`** + **`ButtonTokens`**. |
| **BannerTokens** | Per-variant banner surfaces; **only** from **`PrimerColors`**. |
| **LabelTokens** | Product **Label** chips; **only** from **`PrimerColors`**. |

**Cross-global rule:** Dependents use other globals’ **`out`** bindings only — not their **private** fields.

### Icons (`assets/icons.slint`)

Single registry for bundled SVGs — see [`assets/icons.slint`](assets/icons.slint). **Full** naming rules, checklist for new icons, Banner usage, and TS bridge: [`primer-slint-icons-registry`](../../.cursor/skills/primer-slint-icons-registry/SKILL.md) skill.

## Adding design tokens

Conventions: Primer-style **names** (`fgColor-*`, `bgColor-*`, …), **reuse** existing `out` properties before new literals, **one** primitive per shared color in **`PrimerColors`**, lengths in **`LayoutTokens`**, **scheme** on `out` where needed. **Workflow and audit table:** [`primer-slint-token-layers`](../../.cursor/skills/primer-slint-token-layers/SKILL.md) skill.

## Adding a new Primer component

1. Find the closest **primer-ui-react** component and matching **primer-tokens** files.
2. Add `packages/primer-slint/<Name>/` with a clear root `*.slint` (subfolders if needed) — also `app/src/ui/Primer/<Name>/` via symlink in github-app.
3. **Imports:** see [**component-imports.md**](component-imports.md) for which globals each family uses.
4. **Export** from [`primer.slint`](primer.slint) when part of the public surface.
5. **Docs:** user-facing notes in [`readme.md`](readme.md); process stays here.

## Typical PR sequence for a new component

| Stage | Focus |
| ----- | ----- |
| **PR1 — Spike / API** | Shell, properties, callbacks, minimal layout; compiles; PR lists upstream paths mirrored. |
| **PR2 — Tokens** | `tokens.slint` updates; dedupe literals; cite primer-tokens / CSS in PR. |
| **PR3 — Visual parity** | Hover, disabled, focus, validation, sizing, shadows, type. |
| **PR4 — Integration** | Wire into `main.slint` or views; bridges if needed. |
| **Final — Docs / cleanup** | `readme.md`, this file if exports change; dead code. |

Small widgets may merge PR1+PR2; large work may split PR3.

## Implementation plans and PR breakdown tables

Multi-PR **Primer** (or other UI) plans must include an **ordered** table: **PR**, **Title**, **Scope**, **Acceptance**; note dependencies and optional merges. See [`primer-port-orchestrator`](../../.cursor/skills/primer-port-orchestrator/SKILL.md) for planning context.

**Executing** a multi-PR plan (one PR at a time, small chunks, user handles git, acceptance including `pnpm autofix`, `pnpm test`, and `pnpm dev` with a clean start): [`primer-port-pr-sequential`](../../.cursor/skills/primer-port-pr-sequential/SKILL.md).

**Long lists in views:** Use **`Pagination`** (`Pagination/pagination.slint`), page fields on the right Slint global (`ProjectBoardListState` / `AppState` in `bridges/slint/`), and TS **`apply…SliceToWindow`** helpers for **`ArrayModel`** slices.

## Verification

From the **monorepo root**:

```bash
pnpm typecheck && pnpm autofix && pnpm test
```

Slint: load `app/src/ui/main.slint` as the app does (e.g. `slint-ui` `loadFile` in `app/src/main.ts`).

## Limitations

This folder is **incomplete** and not pixel-identical to GitHub production CSS. Prefer **internal consistency** and traceability to **primer-tokens** / **primer-ui-react** over perfect parity in one pass.

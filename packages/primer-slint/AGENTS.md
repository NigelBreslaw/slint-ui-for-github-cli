# Primer Slint — guide for contributors and AI assistants

**Location:** Library code lives in **`slint/`** (import from the github-app tree with **relative** paths, e.g. to [`primer.slint`](slint/primer.slint)). **Which globals to use:** [`slint/component-imports.md`](slint/component-imports.md).

**Gallery:** `pnpm dev:gallery` from the monorepo root — details: [`packages/slint-gallery/README.md`](../slint-gallery/README.md). **`AnchoredOverlay` / `PopupWindow`:** [`anchored-popupwindow.md`](../slint-gallery/ui/views/anchored-popupwindow.md).

## Purpose

- **Audience:** People and AI assistants working on **Primer-style** Slint under `packages/primer-slint/slint/`.
- **Goals:** Primer naming and token layering, no duplicate color literals across globals, valid `export global` order, reviewable changes.

## Porting and PRs

Full **procedure** (research → matrix → tokens → states → PRs) lives in [`.cursor/skills/`](../../.cursor/skills/): start with [`primer-port-orchestrator/SKILL.md`](../../.cursor/skills/primer-port-orchestrator/SKILL.md). **Multi-PR work:** plan shape and one-PR-at-a-time execution in [`primer-port-pr-sequential/SKILL.md`](../../.cursor/skills/primer-port-pr-sequential/SKILL.md). Plain Markdown; no special tool required to read them.

## In this package

- **Barrel** — public exports: [`slint/primer.slint`](slint/primer.slint). When the surface or model types change, update [`readme.md`](readme.md) where it lists imports (e.g. DataTable **Imports for views**).
- **Tokens** — one file, [`slint/tokens.slint`](slint/tokens.slint). **Order** of `export global` blocks and composition rules: [Design tokens](readme.md#design-tokens) in the readme, the [`primer-slint-token-layers`](../../.cursor/skills/primer-slint-token-layers/SKILL.md) skill, and audit/comment blocks in `tokens.slint` itself. **Rule:** use other globals’ **`out`** bindings only — not their private fields.
- **Icons** — single registry, [`slint/assets/icons.slint`](slint/assets/icons.slint); how to add icons and the TS bridge: [`primer-slint-icons-registry/SKILL.md`](../../.cursor/skills/primer-slint-icons-registry/SKILL.md).

## New component (short path)

1. Upstream: closest **primer-ui-react** + **primer-tokens** (orchestrator and [`primer-port-upstream-research/SKILL.md`](../../.cursor/skills/primer-port-upstream-research/SKILL.md)).
2. Add `slint/<Name>/` with a clear entry `*.slint`.
3. **Imports** per [component-imports](slint/component-imports.md); **export** from `primer.slint` when public; **user-facing docs** in [`readme.md`](readme.md).

## Verification

From the **monorepo root:**

```bash
pnpm typecheck && pnpm autofix && pnpm test
```

Load Slint the way the app does, e.g. `app/src/ui/main.slint` via `loadFile` in `app/src/main.ts`.

## Limitations

This library is **incomplete** and not pixel-identical to production GitHub CSS. Prefer **internal consistency** and traceability to **primer-tokens** / **primer-ui-react** over one-shot perfect parity.

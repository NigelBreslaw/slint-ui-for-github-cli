---
name: primer-port-upstream-research
description: >-
  Builds a Primer upstream inventory before Slint implementation: always reads
  React and Storybook from /Users/nigelb/slint/primer-ui-react, tokens from
  /Users/nigelb/slint/primer-tokens, enumerates every Storybook variant for the
  target component, and plans one PR per variant each with a gallery example. Use
  when porting or extending a Primer component, planning token coverage, or when
  the user asks what variants or tokens a Primer control has upstream.
---

# Primer port — upstream research

## Goal

Produce a **variant and token inventory** for the target component so implementation can trace every visual to **primer-tokens** keys and **primer-ui-react** usage—without guessing hex or variant names in Slint.

The inventory **must** enumerate **all Storybook-driven variants** for that component and **must** include an **ordered PR plan**: **one pull request per variant**, each PR scoped to that variant’s Slint work **plus** a **corresponding example** in `packages/slint-gallery` (see [`primer-port-pr-sequential`](../primer-port-pr-sequential/SKILL.md) for how to execute one PR at a time).

## Canonical repo rules (do not duplicate here)

- [`packages/primer-slint/AGENTS.md`](../../../packages/primer-slint/AGENTS.md) — token globals, barrel, verification.

## Mandatory local sources (always use these paths)

Do **not** skip reading the upstream repos. Treat these as the **primary** source of truth for naming, props, CSS hooks, and stories:

| Path | Role |
|------|------|
| `/Users/nigelb/slint/primer-ui-react` | React implementation: `*.tsx`, `*.module.css`, types — **data attributes**, **CSS custom properties**, interaction and size |
| `/Users/nigelb/slint/primer-tokens` | JSON5 under `src/tokens/` — functional color/size, `component/<name>.json5`, shadows |

Locate the closest **React component** (package + file paths under that root), matching **component token file(s)**, and **all Storybook entries** for the same component name / export.

## Storybook variant discovery (primer-ui-react)

1. **Find story files** under `/Users/nigelb/slint/primer-ui-react`: e.g. `**/<ComponentName>*.stories.tsx`, `*.stories.ts`, `*.stories.mdx`, or colocated `*.stories.*` next to the component. Use search if the filename differs (Bar, Item, etc.).
2. **Enumerate every distinct variant** the stories expose:
   - **Named exports** (`export const …`) — each story is usually one variant or one matrix row.
   - **`args` / `argTypes`** — list combinations that matter visually (variant, size, disabled, validation, etc.); if one story cycles controls, still list the **meaningful permutations** you will mirror in Slint + gallery.
3. **Cross-check** the React component’s **props** and **`.module.css`** so every story-relevant prop maps to tokens or CSS variables you will cite in the inventory.

Output a **Storybook variant checklist** (table or numbered list): story id / export name, args summary, and notes for the matching Slint + gallery slice.

## Inputs (web)

Use official docs as a **behavior and naming** check, not a substitute for the two local repos above:

- [Primer — Getting started (product)](https://primer.style/product/getting-started/)
- [Primer Design System](https://primer.style/design/system)

Search component-specific pages from the docs nav when they exist.

## Deliverable: variant and token inventory

Fill this **before** writing Slint:

| Column | Contents |
|--------|----------|
| **Upstream component** | Paths under `/Users/nigelb/slint/primer-ui-react` — TS/TSX and `*.module.css` |
| **Storybook variants** | Complete list from story files (see section above); no omitted named stories |
| **PR plan** | Ordered table: **PR *n*** = one variant (or one tightly scoped story cluster) + **gallery example** for that variant |
| **Props / variants** | e.g. `variant`, `size`, `disabled`, validation — match React |
| **DOM / data hooks** | `[data-*]`, class names that drive styles |
| **primer-tokens files** | Paths under `/Users/nigelb/slint/primer-tokens/src/tokens/` (functional + component) |
| **Token keys** | Names as in JSON5 (note base → functional → component layering) |
| **CSS variables in React** | Names used in `*.module.css` (porting reference for Slint property naming) |
| **Interaction states** | hover, active, focus, disabled, invalid — list what CSS covers |

## PR plan table (required shape)

Research must end with an ordered table suitable for [`primer-port-pr-sequential`](../primer-port-pr-sequential/SKILL.md), for example:

| PR | Title | Upstream story / variant | Slint scope | Gallery |
|----|-------|--------------------------|-------------|---------|
| 1 | … | `Default` / default args | … | `gallery-…-page.slint` (or agreed page) — section showing this variant |

Each row is **one PR**: implement that variant in `packages/primer-slint/slint` and add or extend the **gallery** demo so reviewers can see parity with the matching Storybook story.

## Workflow

1. Under `/Users/nigelb/slint/primer-ui-react`, find the **canonical React** implementation, its **`*.module.css`**, and **all** `*.stories.*` (or MDX) for that component.
2. **List every Storybook variant** (exports + args permutations that change visuals); build the **PR plan** (one PR per variant + gallery).
3. Under `/Users/nigelb/slint/primer-tokens`, read **component** and **functional** token JSON5 that the CSS references (or that define the same semantics).
4. Cross-check **docs** for user-visible names and accessibility notes.
5. Output the **full inventory** and **PR table**; flag gaps where tokens or stories are ambiguous before Slint work.

## Next steps

- Slint patterns and in-repo references: [`primer-port-slint-research`](../primer-port-slint-research/SKILL.md)
- Token placement in `tokens.slint`: [`primer-slint-token-layers`](../primer-slint-token-layers/SKILL.md)
- Full port order: [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md)
- Execute the PR table one at a time: [`primer-port-pr-sequential`](../primer-port-pr-sequential/SKILL.md)

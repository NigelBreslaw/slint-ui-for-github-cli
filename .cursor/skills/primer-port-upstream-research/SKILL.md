---
name: primer-port-upstream-research
description: >-
  Builds a Primer upstream inventory before Slint implementation: maps
  component variants, design tokens, and CSS variables from local primer-tokens
  and primer-ui-react clones plus primer.style documentation. Use when porting
  or extending a Primer component, planning token coverage, or when the user
  asks what variants or tokens a Primer control has in React/tokens repos.
---

# Primer port — upstream research

## Goal

Produce a **variant and token inventory** for the target component so implementation can trace every visual to **primer-tokens** keys and **primer-ui-react** usage—without guessing hex or variant names in Slint.

## Canonical repo rules (do not duplicate here)

- [`packages/primer-slint/AGENTS.md`](../../../packages/primer-slint/AGENTS.md) — token globals, barrel, verification.

## Inputs (local clones)

Paths from AGENTS (adjust if your machine differs):

| Clone | Role |
|-------|------|
| `primer-tokens` | JSON5 under `src/tokens/` — functional color/size, `component/<name>.json5`, shadows |
| `primer-ui-react` | `*.module.css`, component TS — **data attributes**, **CSS custom properties**, interaction and size |

Locate the closest **React component** and matching **component token file(s)** for the Slint port.

## Inputs (web)

Use official docs as a **behavior and naming** check, not a substitute for token files:

- [Primer — Getting started (product)](https://primer.style/product/getting-started/)
- [Primer Design System](https://primer.style/design/system)

Search component-specific pages from the docs nav when they exist.

## Deliverable: variant and token inventory

Fill this (markdown table or structured bullets) **before** writing Slint:

| Column | Contents |
|--------|----------|
| **Upstream component** | React package path(s), main module CSS file(s) |
| **Props / variants** | e.g. `variant`, `size`, `disabled`, validation — match React |
| **DOM / data hooks** | `[data-*]`, class names that drive styles |
| **primer-tokens files** | Paths under `src/tokens/` (functional + component) |
| **Token keys** | Names as in JSON5 (note base → functional → component layering) |
| **CSS variables in React** | Names used in `*.module.css` (porting reference for Slint property naming) |
| **Interaction states** | hover, active, focus, disabled, invalid — list what CSS covers |

## Workflow

1. Identify the **canonical React** implementation and its **Banner.module.css**-style file(s).
2. Read **component** and **functional** token JSON5 that the CSS references (or that define the same semantics).
3. Cross-check **docs** for user-visible variant names and accessibility notes.
4. Output the **inventory** above; flag gaps where tokens are unclear before Slint work.

## Next steps

- Slint patterns and in-repo references: [`primer-port-slint-research`](../primer-port-slint-research/SKILL.md)
- Token placement in `tokens.slint`: [`primer-slint-token-layers`](../primer-slint-token-layers/SKILL.md)
- Full port order: [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md)

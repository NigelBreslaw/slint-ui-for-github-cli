---
name: primer-port-orchestrator
description: >-
  End-to-end playbook for porting a Primer design system component into
  app/src/ui/Primer: ordered phases (upstream research, Slint research, variant
  matrix, token layers, interaction states), PR breakdown per AGENTS, and
  verification. Use when starting a new Primer port, planning multi-PR component
  work, or when the user asks what order to follow for Primer-to-Slint work.
---

# Primer port — orchestrator

## Canonical documentation

- [`app/src/ui/Primer/AGENTS.md`](../../../app/src/ui/Primer/AGENTS.md) — compact reference (architecture, verification, limitations).
- [`app/src/ui/Primer/component-imports.md`](../../../app/src/ui/Primer/component-imports.md) — which globals to import per component family.

## Phases (run in order)

| # | Phase | Skill / doc | Deliverable |
|---|--------|-------------|-------------|
| 1 | **Upstream inventory** | [`primer-port-upstream-research`](../primer-port-upstream-research/SKILL.md) | Variant and token inventory (React + primer-tokens + docs) |
| 2 | **Slint patterns** | [`primer-port-slint-research`](../primer-port-slint-research/SKILL.md) | Pattern list + paths (this repo + optional gb-slint) |
| 3 | **Coverage matrix** | [`primer-port-variant-matrix`](../primer-port-variant-matrix/SKILL.md) | Filled checklist matrix |
| 4 | **Token plan** | [`primer-slint-token-layers`](../primer-slint-token-layers/SKILL.md) | Token audit table; edits in `tokens.slint` per AGENTS |
| 5 | **Interaction styling** | [`primer-slint-interaction-states`](../primer-slint-interaction-states/SKILL.md) | `states [ ]` design; Checkbox as reference |
| 6 | **Implementation + PRs** | AGENTS + [`primer-port-pr-sequential`](../primer-port-pr-sequential/SKILL.md) | Spike → Tokens → Visual → Integration → Docs; **one PR at a time** when executing |

## PR breakdown (from AGENTS)

Multi-PR work **must** include an ordered table:

| PR | Title | Scope | Acceptance |
|----|-------|-------|------------|
| 1 | … | … | `pnpm typecheck`, Slint loads `app/src/ui/main.slint`, … |

See AGENTS **Implementation plans and PR breakdown tables** for required columns and dependencies.

**Executing the plan:** follow [`primer-port-pr-sequential`](../primer-port-pr-sequential/SKILL.md) — implement only the current PR, user owns git, mandatory `pnpm autofix`, `pnpm test`, and `pnpm dev` with a clean app start between steps.

## Verification (monorepo root)

```bash
pnpm typecheck && pnpm autofix && pnpm test
```

Confirm Slint loads `app/src/ui/main.slint` the way the app does (see AGENTS).

## Skill index

| Skill | Role |
|-------|------|
| [`primer-port-upstream-research`](../primer-port-upstream-research/SKILL.md) | primer-tokens, primer-ui-react, primer.style |
| [`primer-port-slint-research`](../primer-port-slint-research/SKILL.md) | This repo Primer + gb-slint |
| [`primer-port-variant-matrix`](../primer-port-variant-matrix/SKILL.md) | State/variant checklist |
| [`primer-slint-token-layers`](../primer-slint-token-layers/SKILL.md) | Deduped `tokens.slint` |
| [`primer-slint-interaction-states`](../primer-slint-interaction-states/SKILL.md) | `states [ ]`, mutex groups |
| [`primer-slint-icons-registry`](../primer-slint-icons-registry/SKILL.md) | `Icons` registry, new SVG checklist |
| [`primer-port-pr-sequential`](../primer-port-pr-sequential/SKILL.md) | One PR at a time; plan table; acceptance (autofix, test, dev) |

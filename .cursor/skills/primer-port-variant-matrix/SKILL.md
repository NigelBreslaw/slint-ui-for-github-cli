---
name: primer-port-variant-matrix
description: >-
  Produces a compact checklist matrix for a Primer Slint component: variant,
  disabled, color scheme, pointer interaction, size, and validation/focus where
  relevant—so no state is forgotten before implementation. Use when planning
  visual parity, reviewing a port for coverage, or after upstream research when
  the user asks for a complete state list.
---

# Primer port — variant and state matrix (template)

## When to use

Run after [`primer-port-upstream-research`](../primer-port-upstream-research/SKILL.md) and alongside [`primer-slint-interaction-states`](../primer-slint-interaction-states/SKILL.md). This skill only defines **what to enumerate**; implementation uses tokens + `states [ ]`.

## Template

Copy and fill (remove rows/columns that do not apply):

| Variant (or type) | ColorScheme | disabled | Size | Interaction (rest / hover / pressed) | Focus | Notes (e.g. validation) |
|-------------------|-------------|----------|------|----------------------------------------|-------|-------------------------|
| default | light | no | … | R, H, P | … | |
| default | light | yes | … | — | … | |
| default | dark | no | … | R, H, P | … | |
| … | … | … | … | … | … | |

**Coverage rule:** every **cell** that should differ visually must map to a **token** or **`states [ ]`** branch—no orphan combinations.

## Related

- Orchestrated workflow: [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md)

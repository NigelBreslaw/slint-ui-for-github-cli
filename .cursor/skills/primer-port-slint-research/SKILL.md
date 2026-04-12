---
name: primer-port-slint-research
description: >-
  Surfaces Slint patterns and file references for Primer ports: this repo’s
  Primer folder (Checkbox, tokens, barrel), optional gb-slint Material library
  (state layers, schemes, gallery), and compiler Material widgets. Use after
  upstream Primer research or when the user asks how similar controls are built
  in Slint, where to find TouchArea/state patterns, or Material examples on disk.
---

# Primer port — Slint research

## Goal

Collect **in-repo and Slint-ecosystem patterns** (file paths, idioms) to apply when implementing a Primer component—complementing [`primer-port-upstream-research`](../primer-port-upstream-research/SKILL.md), which covers React/tokens only.

## Canonical repo rules

- [`app/src/ui/Primer/AGENTS.md`](../../../app/src/ui/Primer/AGENTS.md) — globals order, imports, icons, verification.

## This repository (required)

| Area | Path | Why open it |
|------|------|-------------|
| **Reference control** | [`app/src/ui/Primer/Checkbox/checkbox.slint`](../../../app/src/ui/Primer/Checkbox/checkbox.slint) | `states [ ]`, TouchArea, token usage |
| **Tokens** | [`app/src/ui/Primer/tokens.slint`](../../../app/src/ui/Primer/tokens.slint) | `PrimerColors`, `ButtonTokens`, `CheckboxTokens`, … |
| **Barrel** | [`app/src/ui/Primer/primer.slint`](../../../app/src/ui/Primer/primer.slint) | Exports and public API |
| **Icons** | [`app/src/ui/Primer/assets/icons.slint`](../../../app/src/ui/Primer/assets/icons.slint) | Registry pattern for SVGs |

Pick **one** existing Primer component closest to the new port (e.g. **Button**, **Select**) and skim its folder for layout and callback patterns.

## gb-slint clone (optional but valuable)

If `~/gb-slint` (or your local Slint checkout) exists, use it for **idioms**, not for Primer colors:

| Area | Path (under repo root) | Notes |
|------|------------------------|--------|
| **Material styling** | `ui-libraries/material/src/ui/styling/` | `material_schemes.slint`, `material_palette.slint`, typography |
| **State / ripple** | `ui-libraries/material/src/ui/components/state_layer.slint` | Layered interaction feedback |
| **Buttons / checkbox** | `ui-libraries/material/src/ui/components/base_button.slint`, `check_box.slint` | Structure comparison |
| **Gallery** | `ui-libraries/material/examples/gallery/` | Runnable examples |
| **Compiler Material** | `internal/compiler/widgets/material/` | Built-in widget implementations |

See [`reference.md`](reference.md) for a slightly longer path list.

## Deliverable

Short **pattern list** with **absolute or repo-relative paths** actually opened:

- Which **this-repo** file(s) will be the main template.
- Any **gb-slint** files copied from for structure (state layer, scheme switching, `TouchArea`).
- Notes on **differences** from Primer (e.g. Material uses different tokens—still use **this app’s** `tokens.slint`).

## Next steps

- Interaction styling: [`primer-slint-interaction-states`](../primer-slint-interaction-states/SKILL.md)
- Token deduplication: [`primer-slint-token-layers`](../primer-slint-token-layers/SKILL.md)
- Orchestrated port: [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md)

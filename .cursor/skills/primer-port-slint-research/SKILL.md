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

- [`packages/primer-slint/AGENTS.md`](../../../packages/primer-slint/AGENTS.md) — `component-imports`, `tokens.slint` rule, icons pointer, **Verification**.

## This repository (required)

| Area | Path | Why open it |
|------|------|-------------|
| **Reference control** | [`packages/primer-slint/Checkbox/checkbox.slint`](../../../packages/primer-slint/Checkbox/checkbox.slint) | `states [ ]`, TouchArea, token usage |
| **Focus + pointer** | [`primer-slint-interaction-states`](../primer-slint-interaction-states/SKILL.md) § *FocusScope + TouchArea* | **`FocusScope` → `TouchArea`**, **`focus-on-click: false`** for keyboard-only focus ring; see [`Radio/radio.slint`](../../../packages/primer-slint/Radio/radio.slint), [`ToggleSwitch/toggle-switch.slint`](../../../packages/primer-slint/ToggleSwitch/toggle-switch.slint) |
| **Tokens** | [`packages/primer-slint/tokens.slint`](../../../packages/primer-slint/tokens.slint) | `PrimerColors`, `ButtonTokens`, `CheckboxTokens`, … |
| **Barrel** | [`packages/primer-slint/primer.slint`](../../../packages/primer-slint/primer.slint) | Exports and public API |
| **Icons** | [`packages/primer-slint/assets/icons.slint`](../../../packages/primer-slint/assets/icons.slint) | Registry pattern for SVGs |
| **Gallery demos** | [`packages/slint-gallery/ui/views/gallery-checkbox-page.slint`](../../../packages/slint-gallery/ui/views/gallery-checkbox-page.slint), [`gallery-demo-options-sidebar.slint`](../../../packages/slint-gallery/ui/components/gallery-demo-options-sidebar.slint) | Single preview + options sidebar; see [`primer-port-gallery-demo`](../primer-port-gallery-demo/SKILL.md) |

Pick **one** existing Primer component closest to the new port (e.g. **Button**, **Select**) and skim its folder for layout and callback patterns.

## Layout / width (no Primer `block` mirror)

- **Do not** add an upstream-style **`block`** boolean to the Slint API.
- **`Rectangle` is not a layout parent.** It paints (background, border). A child of `Rectangle` does **not** automatically get the rectangle’s width. Put a **`VerticalLayout`** (or other layout) inside the rectangle and give **that** layout `width: parent.width` when you need a fixed panel width.
- **Do not sprinkle `horizontal-stretch: 1`** on every inner `Rectangle`, `TouchArea`, `FocusScope`, and layout wrapper. That is a React “`width: 100%` on every div” habit and is usually redundant.
- **When `horizontal-stretch` is appropriate:**
  - **Caller** sets **`horizontal-stretch: 1`** on the component **instance** when it should participate in a parent `HorizontalLayout` / stretched column (optional; many lists only need a layout parent with a defined width).
  - **Inside `HorizontalLayout`:** **`horizontal-stretch: 1`** on the **label** (or spacer) so trailing text/icons stay at the end — same as flex-grow on one child.
- **When width comes for free:** a **`VerticalLayout`** parent with a defined width assigns that width to its children. Rows, dividers, and `TouchArea` backgrounds then fill the row without cascading stretch on each layer.
- **Hug content:** default **`horizontal-stretch: 0`** on the instance; optional inner branch like **[`PrimerTextInput`](../../../packages/primer-slint/PrimerTextInput/primer-text-input.slint)** — **`root.horizontal-stretch > 0 ? root.width : self.preferred-width`** — only when the component must support both hug and fill modes.
- **Never** fix layout with **`width: preferred-width`** on list rows or **`width: 100%`** on every nested element unless you have measured proof it is required.

## ActionList (compose-first)

- **`ActionList`** = list chrome + **`@children`** only ([`ActionList/README.md`](../../../packages/primer-slint/ActionList/README.md)).
- Prefer **`ActionListRow`** / **`ActionListItemDivider`** as children (static or `for ix in model`); set **`margin-inline`** per item for inset variants.
- **`ActionListLines`** = `[ActionListLine]` adapter for TS/model menus — do not add row features to the struct.

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

- Gallery demo pages: [`primer-port-gallery-demo`](../primer-port-gallery-demo/SKILL.md)
- Interaction styling: [`primer-slint-interaction-states`](../primer-slint-interaction-states/SKILL.md)
- Token deduplication: [`primer-slint-token-layers`](../primer-slint-token-layers/SKILL.md)
- Orchestrated port: [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md)

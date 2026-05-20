---
name: primer-port-variant-matrix
description: >-
  Produces a compact checklist matrix for a Primer Slint component: variant,
  disabled, color scheme, pointer interaction, size, and validation/focus where
  relevant—so no state is forgotten before implementation. Maps matrix axes to
  gallery sidebar controls. Use when planning visual parity, reviewing a port
  for coverage, or after upstream research when the user asks for a complete
  state list.
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

**Coverage rule:** every **cell** that should differ visually must map to a **token** or **`states [ ]`** branch—no orphan combinations. **Width:** “full width in a form vs narrow in a toolbar” is usually **parent composition and instance `horizontal-stretch` / `width`**, not a separate component variant row and **not** a ported **`block`** prop—demo those cases via **gallery layout** in the preview column, not a fake variant on the control.

## Gallery mapping

After filling the matrix, add a **sidebar mapping** table (or column on the matrix):

| Matrix axis / row | Gallery control | Notes |
|-------------------|-----------------|-------|
| `disabled` | Sidebar `Checkbox` → `preview-disabled` | |
| `variant` / `scheme` | `RadioGroup` or `Select` | Match upstream prop names |
| Mutually exclusive Storybook roots | `scenario-ix` + sidebar `Select` | One preview at a time; see [`gallery-pagination-page.slint`](../../../packages/slint-gallery/ui/views/gallery-pagination-page.slint) |

Each column or combination that changes visuals must be reachable from **`GalleryDemoOptionsSidebar`** on the component’s playground page—**not** by adding another static preview row. Layout and registration: [`primer-port-gallery-demo`](../primer-port-gallery-demo/SKILL.md).

## Related

- Gallery demo pages: [`primer-port-gallery-demo`](../primer-port-gallery-demo/SKILL.md)
- Orchestrated workflow: [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md)

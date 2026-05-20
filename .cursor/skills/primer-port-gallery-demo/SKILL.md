---
name: primer-port-gallery-demo
description: >-
  Defines the standard slint-gallery demo page layout: one live preview on the
  left, variant and state controls in GalleryDemoOptionsSidebar on the right.
  Covers page skeleton, preview-* properties, nav registration, verification,
  and exceptions for compose-first playgrounds. Use when adding or extending a
  gallery page during a Primer port.
---

# Primer port — gallery demo page

## Goal

Every **atomic** Primer port gets **one** gallery playground: a **single preview** in the main column and **all Storybook-driven permutations** reachable via **`GalleryDemoOptionsSidebar`** controls—not stacked static previews or one section per variant.

Full port order: [`primer-port-orchestrator`](../primer-port-orchestrator/SKILL.md). PR execution: [`primer-port-pr-sequential`](../primer-port-pr-sequential/SKILL.md).

## Reference pages (open before authoring)

| Complexity | File | Notes |
|------------|------|--------|
| Minimal | [`packages/slint-gallery/ui/views/gallery-checkbox-page.slint`](../../../packages/slint-gallery/ui/views/gallery-checkbox-page.slint) | One control, `preview-*`, sidebar checkboxes + label input |
| Enums | [`packages/slint-gallery/ui/views/gallery-counter-label-page.slint`](../../../packages/slint-gallery/ui/views/gallery-counter-label-page.slint) | `RadioGroup`, helper copy under controls |
| Many axes | [`packages/slint-gallery/ui/views/gallery-buttons-page.slint`](../../../packages/slint-gallery/ui/views/gallery-buttons-page.slint) | Rich sidebar; **IconButton** and **CounterLabel** are **separate** nav pages |

Sidebar chrome: [`packages/slint-gallery/ui/components/gallery-demo-options-sidebar.slint`](../../../packages/slint-gallery/ui/components/gallery-demo-options-sidebar.slint).

## Required page skeleton (default)

- **File:** `packages/slint-gallery/ui/views/gallery-<kebab-name>-page.slint`
- **Export:** `Gallery<Name>Page` with `vertical-stretch: 1`
- **Root:** `HorizontalLayout` with three regions:

1. **Preview column** — `VerticalLayout` (`padding: 24px`, `spacing: 16px`, `alignment: start`):
   - Title `Text` — component name, `font-size: 15px`, `font-weight: 600`, `PrimerColors.fgColor-default`
   - **One** preview subject (the ported control or minimal composition required to render it, e.g. `RadioGroup` with fixed child radios)
2. **Spacer** — `Rectangle { }` between preview and sidebar
3. **`GalleryDemoOptionsSidebar`** — one or more `VerticalLayout` sections as `@children`

### Sidebar section pattern

Each option group:

- Section label: `LayoutTokens.text-body-size-medium`, `LayoutTokens.base-text-weight-semibold`, `PrimerColors.fgColor-default`
- Optional helper: `LayoutTokens.text-body-size-small`, `PrimerColors.fgColor-muted`, `wrap: word-wrap`
- Controls: `Checkbox`, `RadioGroup` / `Radio`, `PrimerTextInput`, `Select`, etc.

### Naming conventions

- Page state: `property <T> preview-<dimension>:` (e.g. `preview-disabled`, `preview-scheme`)
- Preview instance binds from `preview-*`; use `<=>` for two-way state (checked, text)
- Sidebar section titles match **upstream prop names** where possible (`scheme`, `size`, `disabled`)

## Registration checklist (new nav entry)

All four are required when adding a **new** sidebar leaf:

| File | Action |
|------|--------|
| [`packages/slint-gallery/ui/gallery-window.slint`](../../../packages/slint-gallery/ui/gallery-window.slint) | `import` + `if GalleryState.selected-page-id == "<id>-playground": Gallery…Page { height: main-scroll.height; }` |
| [`packages/slint-gallery/node/state/gallery-sidebar-nav-bridge-shared.ts`](../../../packages/slint-gallery/node/state/gallery-sidebar-nav-bridge-shared.ts) | Add folder/leaf to `GALLERY_SIDEBAR_NAV` |
| [`packages/slint-gallery/rust/src/lib.rs`](../../../packages/slint-gallery/rust/src/lib.rs) | Mirror nav entry (keep in sync with TS) |
| [`packages/slint-gallery/ui/components/gallery-sidebar.slint`](../../../packages/slint-gallery/ui/components/gallery-sidebar.slint) | Fallback nav leaf where that file defines entries |

## Verification

From monorepo root:

```bash
pnpm dev:gallery
```

Open the new sidebar entry; exercise **every** sidebar control and confirm the preview updates for each Storybook-relevant permutation.

## PR scope (with upstream research)

| PR kind | Gallery work |
|---------|----------------|
| **First PR** (new component) | Create `Gallery*Page` + nav wiring + default preview + minimal sidebar (stub controls OK) |
| **Later PRs** (variant / token / interaction) | **Extend sidebar** and preview bindings; do **not** add a second static preview row for the same component |
| **Orthogonal export** (e.g. IconButton) | **Separate** `gallery-*-page.slint` + nav leaf |

Map each Storybook permutation to **which sidebar control** implements it (see [`primer-port-variant-matrix`](../primer-port-variant-matrix/SKILL.md) § Gallery mapping).

## Exceptions (do not force single-widget layout)

- **Compose-first families** — ActionList, FilteredActionList, SelectPanel, ActionMenu, TreeView: dedicated playground pages; preview may be a full composition; sidebar used where present
- **Multi-root Storybook stories** — [`gallery-pagination-page.slint`](../../../packages/slint-gallery/ui/views/gallery-pagination-page.slint): one visible scenario at a time via `scenario-ix` + sidebar `Select`; no duplicate static previews in the main column
- **Related but separate exports** — separate pages (Button vs IconButton vs CounterLabel), not one page with unrelated components

## Related skills

- Upstream inventory + PR table Gallery column: [`primer-port-upstream-research`](../primer-port-upstream-research/SKILL.md)
- Matrix → sidebar mapping: [`primer-port-variant-matrix`](../primer-port-variant-matrix/SKILL.md)
- Slint patterns in this repo: [`primer-port-slint-research`](../primer-port-slint-research/SKILL.md)

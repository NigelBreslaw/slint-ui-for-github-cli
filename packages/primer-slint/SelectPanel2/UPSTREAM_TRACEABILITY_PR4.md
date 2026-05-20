# PR4 — SelectPanel2 spike (upstream traceability)

## Gallery

| ix | Label | Upstream |
|----|-------|----------|
| 0 | Default | `SelectPanel.stories.tsx` → **Default** |

## Story args → Slint

| Upstream | Slint / gallery |
|----------|-----------------|
| `title="Select labels"` | `SelectPanel2.title` |
| `subtitle="Use labels to organize…"` | `SelectPanel2.subtitle` |
| `placeholder` on anchor | `anchor-label` |
| `width="medium"` | `width-preset: AnchoredOverlayWidth.medium` (320px) |
| `selected: items.slice(1, 3)` | `GallerySelectPanel2Default` bridge — **bug**, **good first issue** |
| `onFilterChange` | `filter-text` + `filter-changed` |
| Multi-select listbox | `list-role: listbox`, `selection-mode: multiple` |

## Tokens

| CSS | Slint |
|-----|-------|
| `.Header` padding `--base-size-8` | `panel-padding: LayoutTokens.base-size-8` |
| `.Title` / `.Subtitle` typography | `SelectPanel2Heading` + `LayoutTokens` / `PrimerColors` |
| Wrapper stack gap | `SelectPanelTokens.wrapper-stack-gap` |

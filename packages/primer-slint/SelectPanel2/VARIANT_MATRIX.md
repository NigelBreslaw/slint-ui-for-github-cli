# SelectPanel2 — gallery ↔ Storybook traceability

Curated **SelectPanel** stories exercised in [`gallery-select-panel2-page.slint`](../../slint-gallery/ui/views/gallery-select-panel2-page.slint). Deferred stories are listed in the gallery sidebar footer.

| `scenario-ix` | Sidebar label | Upstream story | Slint focus | Gallery global / bridge |
|---------------|---------------|----------------|-------------|-------------------------|
| 0 | Default | `Default` | Anchored multi listbox | `GallerySelectPanel2Default` |
| 1 | SingleSelect | `SingleSelect` | Single + close on pick | `GallerySelectPanel2Single` |
| 2 | MultiSelect | `MultiSelect` | Multi checkboxes, initial bug + good first issue | `GallerySelectPanel2Default` |
| 3 | FilterPlaceholder | `WithPlaceholderForSearchInput` | `filter-placeholder: "Filter labels"` | `GallerySelectPanel2Default` |
| 4 | ItemDividers | `WithItemDividers` | `show-dividers: true` | `GallerySelectPanel2Default` |
| 5 | DisabledItem | `WithDisabledItem` | **design** row disabled | `GallerySelectPanel2Disabled` |
| 6 | InactiveItems | `WithInactiveItems` | `inactive-text` on **request** | Inline `sp2-inactive-lines` |
| 7 | Notice | `WithNotice` | `SelectPanel2Notice` / **Banner** | `GallerySelectPanel2Default` + notice variant **Select** |
| 8 | FooterSecondary | `WithSecondaryActionButton` | Footer link + primary **Button** | `GallerySelectPanel2Default` |
| 9 | Groups | `WithGroups` | Section headings + `horizontal-inset` | Inline `sp2-groups-lines` |
| 10 | Message | `WithMessage` | `show-message` body | `GallerySelectPanel2Default` + message **Select** |
| 11 | NoResults | `CustomisedNoResults` | Filter `none` → empty copy | `GallerySelectPanel2Default` |
| 12 | NoInitialItems | `CustomisedNoInitialItems` | `lines: []` + rich empty | Empty lines |
| 13 | LoadingFetch | `AsyncFetch` | `loading` + body spinner | `GallerySelectPanel2Fetch` |
| 14 | SelectAll | `WithSelectAll` | Select-all strip | `GalleryFilteredActionList2SelectAll` |
| 15 | CancelFooter | `WithOnCancel` | Footer **Cancel** + `reset()` | `GallerySelectPanel2Cancel` |
| 16 | SingleModal | `SingleSelectModal` | `show-backdrop`, Save/Cancel, no close on pick | `GallerySelectPanel2Single` |
| 17 | MultiModal | `MultiSelectModal` | Backdrop + multi + Save/Cancel | `GallerySelectPanel2ModalMulti` |
| 18 | ExternalAnchor | `WithExternalAnchor` | `has-built-in-anchor: false` | `GallerySelectPanel2Default` |
| 19 | OverflowScroll | `HeightInitialWithOverflowingItems` | Default `body-region-height`, width **small** | `GallerySelectPanel2Default` |
| 20 | LongItems | `HeightInitialWithUnderflowingItems` | `body-region-height: 320px`, long labels | `GalleryFilteredActionList2Long` |

## Intentional gaps

- **Modal fullscreen-on-narrow** — modal uses centered **`AnchoredOverlay`** + backdrop, not full viewport.
- **Focus / `aria-activedescendant`** — filter keeps focus; roving list focus deferred (see **FilteredActionList2** `VARIANT_MATRIX.md`).
- **Virtualization**, **custom item renderers**, **reposition-after-load** — deferred (sidebar footer).

## Tokens (shell)

| Region | Upstream CSS / tokens | Slint |
|--------|----------------------|-------|
| Panel padding | `--base-size-8` | `SelectPanelTokens` / `panel-padding` |
| Title / subtitle | `.Title`, `.Subtitle` | `SelectPanel2Heading` |
| List scroll height | `list-max-height` / examples `320px` | `SelectPanelTokens.list-max-height-default`, scenario **20** `320px` |
| Notice | **Banner** variants | `SelectPanel2Notice` → **Banner** |

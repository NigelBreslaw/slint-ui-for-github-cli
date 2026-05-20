# SelectPanel — gallery ↔ Storybook traceability

Curated **SelectPanel** stories exercised in [`gallery-select-panel-page.slint`](../../slint-gallery/ui/views/gallery-select-panel-page.slint). Deferred stories are listed in the gallery sidebar footer.

| `scenario-ix` | Sidebar label | Upstream story | Slint focus | Gallery global / bridge |
|---------------|---------------|----------------|-------------|-------------------------|
| 0 | Default | `Default` | Anchored multi listbox | `GallerySelectPanelDefault` |
| 1 | SingleSelect | `SingleSelect` | Single + close on pick | `GallerySelectPanelSingle` |
| 2 | MultiSelect | `MultiSelect` | Multi checkboxes, initial bug + good first issue | `GallerySelectPanelDefault` |
| 3 | FilterPlaceholder | `WithPlaceholderForSearchInput` | `filter-placeholder: "Filter labels"` | `GallerySelectPanelDefault` |
| 4 | ItemDividers | `WithItemDividers` | `show-dividers: true` | `GallerySelectPanelDefault` |
| 5 | DisabledItem | `WithDisabledItem` | **design** row disabled | `GallerySelectPanelDisabled` |
| 6 | InactiveItems | `WithInactiveItems` | `inactive-text` on **request** | Inline `sp-inactive-lines` |
| 7 | Notice | `WithNotice` | `SelectPanelNotice` / **Banner** | `GallerySelectPanelDefault` + notice variant **Select** |
| 8 | FooterSecondary | `WithSecondaryActionButton` | Footer link + primary **Button** | `GallerySelectPanelDefault` |
| 9 | Groups | `WithGroups` | Section headings + `horizontal-inset` | Inline `sp-groups-lines` |
| 10 | Message | `WithMessage` | `show-message` body | `GallerySelectPanelDefault` + message **Select** |
| 11 | NoResults | `CustomisedNoResults` | Filter `none` → empty copy | `GallerySelectPanelDefault` |
| 12 | NoInitialItems | `CustomisedNoInitialItems` | `lines: []` + rich empty | Empty lines |
| 13 | LoadingFetch | `AsyncFetch` | `loading` + body spinner | `GallerySelectPanelFetch` |
| 14 | SelectAll | `WithSelectAll` | Select-all strip | `GalleryFilteredActionListSelectAll` |
| 15 | CancelFooter | `WithOnCancel` | Footer **Cancel** + `reset()` | `GallerySelectPanelCancel` |
| 16 | SingleModal | `SingleSelectModal` | `show-backdrop`, Save/Cancel, no close on pick | `GallerySelectPanelSingle` |
| 17 | MultiModal | `MultiSelectModal` | Backdrop + multi + Save/Cancel | `GallerySelectPanelModalMulti` |
| 18 | ExternalAnchor | `WithExternalAnchor` | `has-built-in-anchor: false` | `GallerySelectPanelDefault` |
| 19 | OverflowScroll | `HeightInitialWithOverflowingItems` | Default `body-region-height`, width **small** | `GallerySelectPanelDefault` |
| 20 | LongItems | `HeightInitialWithUnderflowingItems` | `body-region-height: 320px`, long labels | `GalleryFilteredActionListLong` |

## Intentional gaps

- **Modal fullscreen-on-narrow** — modal uses centered **`AnchoredOverlay`** + backdrop, not full viewport.
- **Focus / `aria-activedescendant`** — filter keeps focus; roving list focus deferred (see **FilteredActionList** `VARIANT_MATRIX.md`).
- **Virtualization**, **custom item renderers**, **reposition-after-load** — deferred (sidebar footer).

## Tokens (shell)

| Region | Upstream CSS / tokens | Slint |
|--------|----------------------|-------|
| Panel padding | `--base-size-8` | `SelectPanelTokens` / `panel-padding` |
| Title / subtitle | `.Title`, `.Subtitle` | `SelectPanelHeading` |
| List scroll height | `list-max-height` / examples `320px` | `SelectPanelTokens.list-max-height-default`, scenario **20** `320px` |
| Notice | **Banner** variants | `SelectPanelNotice` → **Banner** |

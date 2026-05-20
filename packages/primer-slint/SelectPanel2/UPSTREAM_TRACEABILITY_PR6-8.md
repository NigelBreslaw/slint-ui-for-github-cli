# PR6–8 — SelectPanel2 chrome, states, modal + anchor

## Gallery scenario index

| ix | Label | PR | Upstream story |
|----|-------|-----|----------------|
| 0 | Default | 4 | `Default` |
| 1 | SingleSelect | 5 | `SingleSelect` |
| 3 | FilterPlaceholder | 6 | `WithPlaceholderForSearchInput` |
| 4 | ItemDividers | 6 | `WithItemDividers` |
| 5 | DisabledItem | 7 | `WithDisabledItem` |
| 6 | InactiveItems | 7 | `WithInactiveItems` |
| 7 | Notice | 6 | `WithNotice` |
| 8 | FooterSecondary | 6 | `WithSecondaryActionButton` |
| 9 | Groups | 6 | `WithGroups` |
| 10 | Message | 7 | `WithMessage` |
| 11 | NoResults | 7 | `CustomisedNoResults` |
| 12 | NoInitialItems | 7 | `CustomisedNoInitialItems` |
| 13 | LoadingFetch | 7 | `AsyncFetch` |
| 14 | SelectAll | 7 | `WithSelectAll` |
| 15 | CancelFooter | 7 | `WithOnCancel` |
| 16 | SingleModal | 8 | `SingleSelectModal` |
| 17 | MultiModal | 8 | `MultiSelectModal` |
| 18 | ExternalAnchor | 8 | `WithExternalAnchor` |

**MultiSelect** (plan ix 2) omitted — **Default** covers multi-select listbox.

## PR6 — Component additions

| Story | Slint |
|-------|------|
| Filter placeholder | `filter-placeholder` → **FilteredActionList2** `placeholder` |
| Item dividers | `show-dividers` |
| Notice | `SelectPanel2Notice` + `show-notice` / `notice-variant` / `notice-text` |
| Secondary footer | `show-footer` + `SelectPanel2Footer` `@children` |
| Groups | `list-variant: horizontal_inset` + `section_heading` lines |

## PR7 — States (delegates to **FilteredActionList2**)

| Story | Slint |
|-------|------|
| Disabled row | Bridge sets `disabled: true` on **design** |
| Inactive | `inactive-text` on static demo lines |
| Message / empty | `show-message`, `empty-title`, `empty-message` |
| Async fetch | `loading` + `body_spinner` + gallery timer |
| Select all | `select-all-visible` + **GalleryFilteredActionList2SelectAll** |
| Cancel | `show-footer` + `GallerySelectPanel2Cancel.reset()` |

## PR8 — Modal + external anchor

| Story | Slint |
|-------|------|
| Modal | `show-backdrop: true`, `close-on-single-select: false`, footer Cancel/Save |
| External anchor | `has-built-in-anchor: false` + `anchor-position-props` from host **Button** |

**Gap:** fullscreen-on-narrow modal not ported (centered **AnchoredOverlay** + backdrop only).

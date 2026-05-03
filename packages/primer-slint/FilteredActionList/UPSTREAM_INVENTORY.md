# FilteredActionList — upstream variant & token inventory

**Repos (mandatory):** [`primer-ui-react`](file:///Users/nigelb/slint/primer-ui-react) · [`primer-tokens`](file:///Users/nigelb/slint/primer-tokens)

This file is the **phase-1 research deliverable** for the Slint port: Storybook coverage, prop-driven visuals, CSS hooks, and **primer-tokens** traceability. Slint-facing matrices and token audits live in [`VARIANT_MATRIX.md`](./VARIANT_MATRIX.md).

---

## Upstream component paths

| Kind | Path |
|------|------|
| Implementation | `packages/react/src/FilteredActionList/FilteredActionList.tsx` |
| Layout / chrome CSS | `packages/react/src/FilteredActionList/FilteredActionList.module.css` |
| Body loaders | `packages/react/src/FilteredActionList/FilteredActionListLoaders.tsx` |
| Loader CSS | `packages/react/src/FilteredActionList/FilteredActionListLoaders.module.css` |
| Item / list types | `packages/react/src/FilteredActionList/types.ts` |
| Announcements (a11y) | `packages/react/src/FilteredActionList/useAnnouncements.tsx` |
| Story chrome | `packages/react/src/FilteredActionList/FilteredActionList.stories.module.css` |
| Barrel | `packages/react/src/FilteredActionList/index.ts` |

---

## Storybook variant checklist

| # | Story file | Export / route | Args / setup | Visual / behavior notes |
|---|------------|----------------|--------------|-------------------------|
| 1 | `FilteredActionList.stories.tsx` | **`Default`** (`Components/FilteredActionList`) | `controls.disable: true`; local `items` with leading color circles; client filter `startsWith` | Filter header + scrollable `ActionList`; placeholder **“Filter Labels”**; outer demo border from story CSS (`FilteredActionListContainer`) |
| 2 | `FilteredActionList.examples.stories.tsx` | **`WithLongItems`** (`Components/FilteredActionList/Examples`) | Same control disable; items with very long primary text / descriptions | Exercises wrapping / height of rows inside same shell as Default |

**Not covered by Storybook (must still be inventoried from props + CSS):** loading (`loading` + `FilteredActionListLoadingTypes`), `message` / `messageText`, `onSelectAllChange` row, `textInputProps` (e.g. disabled), `selectionVariant`, `showItemDividers`, `groupMetadata`, `fullScreenOnNarrow`, virtualization, focus-zone props, `actionListProps`, custom `renderItem`. See **Prop-driven scenarios** below.

---

## Prop-driven scenarios (non-story visuals)

Ordered roughly by **layout shell → body → list chrome**.

| Scenario | Upstream props / code | Notes |
|----------|----------------------|--------|
| Idle filtered list | `items`, `filterValue` / internal state, `onFilterChange`, `placeholderText` | Default path: `getBodyContent()` renders `ActionList` |
| Header filter only | `textInputProps`, `placeholderText` | Upstream React **`TextInput`** uses **`block`** / width props; this repo’s **`PrimerTextInput`** uses **`horizontal-stretch: 1`** in the filter row (no `block` prop). |
| Loading in **input** (no body takeover) | `loading: true`, `loadingType: FilteredActionListLoadingTypes.input` | `loading={loading && !loadingType.appearsInBody}` → spinner in field (`appearsInBody === false`) |
| Loading **body spinner** | `loading: true`, `loadingType: bodySpinner` (default) | `FilteredActionListBodyLoader` when `loadingType.appearsInBody` and `scrollContainerRef.current` set |
| Loading **body skeleton** | `loading: true`, `loadingType: bodySkeleton` | Rows of `SkeletonBox` (16×16 + variable width bar), count from container height ÷ 24px, min 3 rows |
| **Message** replaces list | `message` set (React node) | Evaluated **after** loading branch that needs `scrollContainerRef.current`; **message wins over list** when not in that loading branch |
| Empty filter result | Parent passes `items=[]` after filter | Still “list” path; empty `ActionList` (no dedicated empty-state component in `FilteredActionList.tsx`) |
| **Select all** row | `onSelectAllChange` **defined** (not `undefined`) | Renders `Checkbox` + label (“Select all” / “Deselect all”); state derived from `items.every/some(selected)` |
| List selection chrome | `selectionVariant`, `showItemDividers`, `actionListProps`, `variant` on list | Passed through to `ActionList`; dividers disable `content-visibility` optimization in CSS |
| Grouped list | `groupMetadata` + `items` with `groupId` | `ActionList.Group` / `GroupHeading`; virtualization forced off when groups present |
| Narrow fullscreen input typography | `fullScreenOnNarrow` + `classes.FullScreenTextInput` | `@media` + `@supports (-webkit-touch-callout: none)` uses `--text-title-size-small` on input |
| Virtualized list | `virtualized: true` (no `groupMetadata`) | Absolute positioning + `virtualizer`; `ActionList` `height` + `position: relative` |

**Explicit out-of-scope for Slint v1 (per port plan):** `virtualized`, `_PrivateFocusManagement`, `onActiveDescendantChanged`, `scrollBehavior`, `focusOutBehavior`, `useAnnouncements` / `announcementsEnabled`, full aria-activedescendant parity, `renderItem` custom nodes.

---

## DOM / CSS class hooks (`FilteredActionList.module.css`)

| Class / selector | Role |
|------------------|------|
| `.Root` | Column flex; `overflow: hidden` |
| `.Header` | `box-shadow: 0 1px 0 var(--borderColor-default)`; stacks filter input |
| `.Container` | Flex grow, `overflow: auto`, scroll region; `content-visibility` rules on `.ActionListItem` (unless dividers) |
| `.ActionList` | `flex-grow: 1` |
| `.ActionListItem:focus`, `[data-input-focused][data-first-child]` | `background: var(--control-transparent-bgColor-selected)` + `@mixin activeIndicatorLine` |
| `.FullScreenTextInput` | Narrow viewport input font sizing |
| `.SelectAllContainer` | Muted bar: `bgColor-muted`, padding, bottom border |
| `.SelectAllCheckbox` | Margin tweak vs border |
| `.SelectAllLabel` | `text-body-size-medium`, `fgColor-muted` |

**Loaders (`FilteredActionListLoaders.module.css`):** `.LoadingSpinner` (padding 16, centered, full height), `.LoadingSkeletonContainer` (padding 8, column), `.LoadingSkeleton` (border-radius 4px on bar).

**Story-only (not component):** `.FilteredActionListContainer`, `.ColorCircle` in `FilteredActionList.stories.module.css`.

---

## CSS variables used in component CSS → primer-tokens

| CSS variable (React) | Typical primer-tokens source | Notes |
|----------------------|------------------------------|--------|
| `--borderColor-default` | `functional/color/borderColor.json5` → `borderColor.default` | Header hairline; select-all border; story border |
| `--bgColor-muted` | `functional/color/bgColor.json5` → `bgColor.muted` | Select-all strip |
| `--borderWidth-thin` | size tokens (used across Primer) | Select-all border; story border |
| `--control-transparent-bgColor-selected` | `functional/color/control.json5` → `control.transparent.bgColor.selected` (web maps via fallbacks) | Focused / active-descendant row highlight |
| `--fgColor-muted` | `functional/color/fgColor.json5` (muted) | Select-all label |
| `--text-body-size-medium` | typography functional tokens | Select-all label size |
| `--text-title-size-small` | typography | Narrow `FullScreenTextInput` |
| `--base-size-4`, `--base-size-8`, `--base-size-16` | spacing / size scale | Loader padding; select-all padding; skeleton row math |

**Loader internals:** Primer `Spinner`, `Stack`, `SkeletonBox` — no extra CSS variables in `FilteredActionListLoaders.module.css` beyond spacing.

**primer-tokens paths to cite in audits:**  
`src/tokens/functional/color/borderColor.json5`, `bgColor.json5`, `control.json5` (transparent selected), `fgColor.json5`, typography + `size` / `base-size` JSON5 under `src/tokens/functional/` as needed; legacy chain also appears in `src/tokens/fallback/color-fallbacks.json` (`--control-transparent-bgColor-selected`).

---

## Interaction states (upstream CSS + behavior)

| State | Where |
|-------|--------|
| Row focus / active-descendant | `.ActionListItem:focus`, `data-input-focused` + `data-first-child` — selected bg + active indicator (ActionList mixin) |
| Scroll / flash | `useScrollFlash(scrollContainerRef)` |
| Keyboard / focus zone | `useFocusZone` / roving mode — **Slint v1 simplified** |
| Hover on list | `disableSelectOnHover` can ignore hover for selection |
| Checkbox | Standard Primer `Checkbox` for select-all |

---

## Ordered PR plan (Storybook + prop slices → Slint + gallery)

Aligned with the port plan; each row is one reviewable PR with a gallery slice.

| PR | Title | Upstream story / variant | Slint scope | Gallery |
|----|-------|--------------------------|-------------|---------|
| 1 | Shell + filter | `Default` (header + scroll region only) | `Root` / `Header` / `Container`; `PrimerTextInput`; header hairline; `filter-text` / callback | Action list gallery page — static filter strip |
| 2 | ActionList body | `Default` + filtered `items` | Embed `Flickable` + `ActionList`; parent-driven `lines` | Filtered rows like Default |
| 3 | Long labels | `WithLongItems` | Wrapping / height with long labels | Long-item subsection |
| 4 | Loading modes | Prop matrix: `input` / `bodySpinner` / `bodySkeleton` | Enum + input leading loader + body spinner / placeholder skeleton | One block per loading kind |
| 5 | Select all | `onSelectAllChange` present | Checkbox row + tokens for strip | Toggle select-all visibility |
| 6 | Message vs list | `message` | Message region replaces list when set (parity: after loading branch rules) | Message demo |
| 7 | Exports + docs + matrix | — | `primer.slint`, readme, component-imports, [`VARIANT_MATRIX.md`](./VARIANT_MATRIX.md) | Full verification |

---

## Traceability

- **Storybook:** only **`Default`** and **`WithLongItems`** — both listed above, no other named exports under `FilteredActionList*.stories.tsx`.
- **Body content order in code:** (1) loading with `appearsInBody` and `scrollContainerRef.current` → loader; (2) else `message` → custom node; (3) else `ActionList` (grouped, virtualized, or flat).

See [`VARIANT_MATRIX.md`](./VARIANT_MATRIX.md) for the Slint **variant matrix**, **token audit table**, and **skeleton strategy**.

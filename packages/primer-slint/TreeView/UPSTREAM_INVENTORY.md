# TreeView — upstream variant & token inventory

**Repos (mandatory):** [`primer-ui-react`](file:///Users/nigelb/slint/primer-ui-react) · [`primer-tokens`](file:///Users/nigelb/slint/primer-tokens)

Phase-1 research for the Slint port: **Storybook coverage**, **compound API / props**, **CSS hooks**, **primer-tokens** traceability, and an **ordered PR plan**. Slint-facing state coverage lives in [`VARIANT_MATRIX.md`](./VARIANT_MATRIX.md).

**Port plan alignment:** gallery ships as **one scroll** in [`packages/slint-gallery/ui/views/gallery-tree-view-page.slint`](../../slint-gallery/ui/views/gallery-tree-view-page.slint); each PR still adds **one named section** there for review parity.

---

## Upstream component paths

| Kind | Path (under `primer-ui-react/packages/react/src/TreeView/`) |
|------|---------------------------------------------------------------|
| Implementation | `TreeView.tsx` (Root, Item, SubTree, visuals, DirectoryIcon, ErrorDialog, ActionDialog) |
| Item / subtree CSS | `TreeView.module.css` (root-scoped `.TreeViewRootUlStyles` pattern) |
| Story decorators | `TreeView.stories.module.css`, `TreeView.features.stories.module.css` |
| Stress / dev harness | `TreeView.stress.dev.stories.tsx`, `Treeview.stress.dev.stories.module.css` |
| Barrel | `index.ts` → re-exports `TreeView` |

Supporting hooks: `useRovingTabIndex.ts`, `useTypeahead.ts`, `useTreeItemCache.ts`, `shared.ts`.

---

## Storybook variant checklist

**Excluded (per port plan):** `TreeView.examples.stories.tsx` → **`DraggableListItem`** only (HTML5 `draggable` reorder affordance). **`TrailingActions`** in the same file **is in scope**.

| # | Story file | Storybook title / export | Args / setup | Visual / behavior notes |
|---|------------|---------------------------|--------------|-------------------------|
| 1 | `TreeView.stories.tsx` | `Components/TreeView` — **`Default`** | — | Directory + nested files; **trailing** diff icons (added / modified); one **`current`** row; `truncate` default **true** (root) |
| 2 | `TreeView.examples.stories.tsx` | `Components/TreeView/Examples` — **`TrailingActions`** | — | **`secondaryActions`** (gear / issue icons); **Ctrl/Cmd+Shift+U** opens multi-action **`ActionDialog`** (“Supplemental actions”); optional **per-item `Dialog`** on open; row with **count** uses **`Button`** + **`Tooltip`** instead of `IconButton` |
| 3 | `TreeView.features.stories.tsx` | **`Files`** | Root `truncate={false}` | Deep tree; long filename **wraps**; `onExpandedChange` on `public`; directory open/closed icons |
| 4 | same | **`FilesChanged`** | `truncate={false}` | Diff trailing visuals: added / modified / renamed / removed (**danger** class on removed) |
| 5 | same | **`Controlled`** | — | External tree state; **Expand all / Collapse all**; **`current`** from path context; controlled **`expanded`** + **`onExpandedChange`** |
| 6 | same | **`AsyncSuccess`** | `args.responseTime` (default **4000** ms) | **`SubTree`** `state`: `initial` → `loading` → `done`; async fetch on expand |
| 7 | same | **`Async with count (skeleton nodes)`** (`AsyncWithCount`) | `responseTime` (2000), **`count`** (3) | Loading shows **`count`** skeleton rows (`SkeletonAvatar` + `SkeletonText` widths) + sr-only “Loading N items” |
| 8 | same | **`AsyncError`** | `responseTime` (2000) | SubTree **`error`** + **`TreeView.ErrorDialog`** (`ConfirmationDialog`: Retry / Dismiss); dismiss collapses parent |
| 9 | same | **`EmptyDirectories`** | — | **`SubTree state`** loading → done with **no children** → empty leaf “No items found”; second item has **empty `<SubTree />`** |
| 10 | same | **`NestedTrees`** | — | Async folder + **nested** inner `TreeView` subtree with static children |
| 11 | same | **`NestedScrollContainer`** | — | **100×10** items; story wraps tree in **fixed-height scroll** (`.ScrollContainer`) |
| 12 | same | **`StressTest`** | — | **1000×100** nested items (perf / layout stress) |
| 13 | same | **`ContainIntrinsicSize`** | — | **10** roots × **1000** leaves; items pass **`containIntrinsicSize="2rem"`** → `content-visibility: auto` + intrinsic size CSS |
| 14 | same | **`InitialFocus`** | `truncate={false}` | Buttons before/after tree; deep **`current`** target (`Button7.test.tsx`) |
| 15 | same | **`FocusManagement`** | default truncate | **Kebab `IconButton`** inside row content (`tabIndex={-1}`, `aria-hidden`) — focus stays on treeitem |
| 16 | same | **`WithoutIndentation`** | Root **`flat`** | `data-omit-spacer` layout: **no** indent / toggle column grid space (same diff trailing pattern as Default) |
| 17 | same | **`MultilineItems`** | `truncate={false}` | Rows mix **wrapped** vs **non-wrapped** long labels + trailing alignment cases |
| 18 | `TreeViewWithLeadingAction.stories.tsx` | `Private/Components/TreeViewWithLeadingAction` — **`LeadingAction`** | — | **`Banner`** warning + **`LeadingAction`** column (grabber `IconButton`); issue closed/open **leading visuals**; subtree with tasks — **no** HTML5 drag |
| **—** | `TreeView.stress.dev.stories.tsx` | `StressTests/Components/TreeView` — **`CurrentUpdate`** | `totalIterations` 100 | **Optional** (separate Storybook tree / dev harness): `StressTest` wrapper animates **`current`** index over large list |

---

## Compound surface (props the port must respect)

### `TreeView` (root `<ul role="tree">`)

| Prop | Notes |
|------|--------|
| `aria-label` / `aria-labelledby` | Passed to root |
| `flat` | Maps to **`data-omit-spacer="true"`** — grid drops spacer/toggle/leading-action columns |
| `truncate` (default **true**) | Maps to **`data-truncate-text`** — ellipsis vs `word-break: break-word` on label |
| `className`, `style` | Standard |

### `TreeView.Item`

| Prop | Notes |
|------|--------|
| `id` | DOM id; focus / aria |
| `current` | `aria-current`; default expanded cache favors current |
| `defaultExpanded`, `expanded`, `onExpandedChange` | Controlled vs uncontrolled; `expanded={null}` hides `aria-expanded` (empty placeholder item) |
| `onSelect` | If set: **Enter/Space** call `onSelect` instead of toggle; **click** selects; **toggle** moves to chevron-only area; chevron gets hover class |
| `secondaryActions` | `label`, `onClick`, `icon`, optional **`count`**, optional `className` |
| `containIntrinsicSize` | Sets `content-visibility: auto` + `contain-intrinsic-size` on item container |

### `TreeView.SubTree`

| Prop | Notes |
|------|--------|
| `state` | `'initial' \| 'loading' \| 'done' \| 'error'` — drives loading UI, empty detection, announcements |
| `count` | Skeleton row count when loading |
| `aria-label` | Optional on subtree `<ul role="group">` |

### Subcomponents

| Export | Role |
|--------|------|
| `LeadingVisual` / `TrailingVisual` | Optional **`label`** → visually hidden description id |
| `LeadingAction` | Sets **`data-has-leading-action`**; grid **`--has-leading-action`** |
| `DirectoryIcon` | Open/fill vs closed/fill; color **`--treeViewItem-leadingVisual-iconColor-rest`** |
| `ErrorDialog` | `ConfirmationDialog` + retry/dismiss wiring |
| (internal) `ActionDialog` | Multi-action picker from **`secondaryActions`** |

---

## DOM / data hooks (`TreeView.module.css` + TSX)

| Hook | Role |
|------|------|
| Root `data-omit-spacer` | `flat` — flat grid (no indent columns) |
| Root `data-truncate-text` | `truncate` |
| Item `data-has-leading-action` | Leading action column width |
| Classes under `.TreeViewRootUlStyles` | `.TreeViewItem`, `.TreeViewItemContainer`, toggle, content, visuals, level lines, directory icon, skeleton, trailing action |

---

## CSS variables → primer-tokens (primary references)

| CSS variable (React `TreeView.module.css`) | primer-tokens / semantics |
|-------------------------------------------|---------------------------|
| `--fgColor-default`, `--fgColor-muted` | `functional/color/fgColor.json5` |
| `--fgColor-accent` | Current-item left bar + focus ring |
| `--control-transparent-bgColor-hover` | Row hover; toggle hover |
| `--control-transparent-bgColor-selected` | **`aria-current`** row background |
| `--borderColor-muted` | Level indicator lines (hover/focus-within reveal on fine pointers) |
| `--boxShadow-thick` | Focus-visible ring on item container |
| `--borderRadius-medium` | Row + accent bar radius |
| `--text-body-size-medium`, `--text-body-lineHeight-medium` | Typography |
| `--base-size-*` | Spacing, toggle hit area, accent bar geometry |
| `--treeViewItem-leadingVisual-iconColor-rest` | **`src/tokens/component/treeView.json5`** → `treeViewItem.leadingVisual.iconColor.rest` (+ dark override in JSON5); also wired via **`src/tokens/fallback/color-fallbacks.json`** |

**Loading skeletons:** `TreeViewSkeletonItemContainerStyle` uses fixed **2rem** / **2.75rem** (coarse) height; `--tree-item-loading-width` pattern per nth-child.

**Story-only CSS:** success / attention / danger icon tints live in `TreeView.stories.module.css` / `TreeView.features.stories.module.css` (not core component tokens).

---

## Interaction states (upstream)

| State | Where |
|-------|--------|
| Row hover | `.TreeViewItemContainer:hover` — transparent control hover bg (**disabled** when skeleton present via `:has(.TreeViewItemSkeleton)`) |
| `aria-current` | Selected bg + left **accent** bar |
| Focus-visible | `box-shadow` thick + `fgColor-accent` on inner container |
| Forced colors | High-contrast outline / HighlightText overrides |
| Coarse pointer (`@media (pointer: coarse)`) | Larger **`--toggle-width`** (**1.5rem**) and **`--min-item-height`** (**2.75rem**) |
| Level lines | Hidden border until root hover **or** `focus-within` (fine pointer hover media) |
| Trailing actions | `tabIndex={-1}`; stopPropagation; keyboard chord **Shift+Meta/Ctrl+U** |

**Slint v1 expectation:** roving tabindex, typeahead, live region announcements, and full **`aria-*`** parity are **partial** at best — track in `readme.md` when exporting (per port plan risk register).

---

## Ordered PR plan (implementation chunks → Slint + gallery sections)

Each PR implements a **slice** of `PrimerTreeView` and adds **one section** to `gallery-tree-view-page.slint`. Order favors **dependencies first** (row chrome before async overlays).

| PR | Title | Upstream story / cluster | Slint scope | Gallery section |
|----|-------|--------------------------|-------------|-----------------|
| 1 | Core row + indent + toggle | **`Default`**, **`Files`** (subset), **`WithoutIndentation`** | Root `flat` / `truncate`; item grid; level lines; chevron; `DirectoryIcon`; leading/trailing visuals; **`current`** bar | Default + Files (minimal) + flat |
| 2 | Subtree + sync expand | **`Files`**, **`FilesChanged`**, **`NestedTrees`** (sync parts) | `SubTree` mount/unmount; empty subtree; diff trailing icons | Files + FilesChanged |
| 3 | Controlled selection | **`Controlled`** | External expanded model + expand-all / collapse-all + `current` path | Controlled |
| 4 | Async + skeleton count | **`AsyncSuccess`**, **`AsyncWithCount`**, **`EmptyDirectories`** | `SubTree` `state` machine; spinner vs skeleton **`count`**; empty row | Async trio |
| 5 | Error + dialogs | **`AsyncError`**, **`TrailingActions`** (dialog paths) | `ErrorDialog` / confirmation pattern; **`secondaryActions`** + overlay **`ActionList`**; optional count button | AsyncError + TrailingActions |
| 6 | Leading action column | **`LeadingAction`** | `LeadingAction` slot width + grabber + issue icons; optional **`Banner`** | LeadingAction |
| 7 | Focus + multiline + stress (scaled) | **`InitialFocus`**, **`FocusManagement`**, **`MultilineItems`**, **`NestedScrollContainer`**, **`StressTest`**, **`ContainIntrinsicSize`** | `truncate={false}` wrapping; embedded kebab; scroll-in-glass; **reduced** row counts vs upstream; `containIntrinsicSize` approx / comment | One section each; label scaled counts |

**Optional follow-up (not in core checklist):** `StressTests/Components/TreeView` — **`CurrentUpdate`**.

---

## Findings summary (for implementers)

1. **Performance:** React inlines most item styles under **one** root class for thousands of rows; Slint should prefer a **virtualized** or **model-driven flat list** for `StressTest`-class demos (port plan).
2. **`containIntrinsicSize`:** Web-only **`content-visibility`** / intrinsic sizing — gallery should **document approximation** (fixed row height + viewport) rather than literal parity.
3. **Component tokens file is small:** `treeView.json5` mainly defines **directory / leading visual** color; most row chrome uses **shared functional** control + fg + border tokens.
4. **`ErrorDialog` vs `Dialog`:** Error path uses **`ConfirmationDialog`** (retry/dismiss), not the generic `Dialog` used in the TrailingActions example story.
5. **Trailing actions:** Single action → direct `onClick`; multiple → chord opens **`ActionDialog`**; **`count`** changes control from `IconButton` to `Button` + tooltip.

---

## Next steps

- [`VARIANT_MATRIX.md`](./VARIANT_MATRIX.md) — state matrix for tokens + `states [ ]`
- Slint patterns: [`primer-port-slint-research`](../../../.cursor/skills/primer-port-slint-research/SKILL.md)
- Token layer: [`primer-slint-token-layers`](../../../.cursor/skills/primer-slint-token-layers/SKILL.md)

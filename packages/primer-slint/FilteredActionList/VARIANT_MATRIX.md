# FilteredActionList — variant matrix (`primer-port-variant-matrix`)

**Upstream:** [`FilteredActionList.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/FilteredActionList/FilteredActionList.tsx), [`FilteredActionList.module.css`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/FilteredActionList/FilteredActionList.module.css), [`FilteredActionListLoaders.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/FilteredActionList/FilteredActionListLoaders.tsx). **Research:** [`UPSTREAM_INVENTORY.md`](./UPSTREAM_INVENTORY.md). **Slint reuse:** [`ActionList/action-list.slint`](../ActionList/action-list.slint), [`PrimerTextInput/primer-text-input.slint`](../PrimerTextInput/primer-text-input.slint), [`Checkbox/checkbox.slint`](../Checkbox/checkbox.slint), [`SelectPanel/select-panel.slint`](../SelectPanel/select-panel.slint) (reference only — do not duplicate overlay option model).

**Coverage rule:** every visually distinct **shell × body × list × select-all** combination maps to **`PrimerColors` / `LayoutTokens` / existing list tokens**, optional **`FilteredActionListTokens`** (or minimal extensions to **`SelectPanelTokens`**) for **deduped** chrome only, plus **`states [ ]`** on rows only where the embedded **ActionList** does not already cover them.

**ColorScheme:** reuse globals with internal `color-scheme` like other ports — matrix rows are **light** and **dark** where `PrimerColors` already branches.

---

## 1. Shell — header, scroll container, hairline

| Dimension | Cases | Maps to (Slint) |
|-----------|--------|-----------------|
| Header | Filter enabled; filter **disabled** (`textInputProps.disabled` upstream) | `PrimerTextInput`; optional `disabled` prop passthrough |
| Header hairline | Always (upstream `.Header`) | **1px** bottom separator: `PrimerColors.borderColor-default` (same semantic as `box-shadow: 0 1px 0 var(--borderColor-default)`) |
| Loading on **input** | `loading && !loadingType.appearsInBody` | `PrimerTextInput` **loading** API + leading loader position (parity with `loaderPosition: leading`) |
| Root | Column, clip overflow | `LayoutTokens` spacing; height from parent |
| Scroll body | Idle / loading / message | `Flickable` or scroll `Rectangle` region filling `flex` remainder |

---

## 2. Body region (mutex content)

Exactly **one** of these is shown at a time (upstream `getBodyContent` order — see inventory).

| Body mode | Upstream condition | Slint matrix rows |
|-----------|-------------------|-------------------|
| Body **spinner** | `loading && loadingType.appearsInBody && scrollContainerRef.current` + `bodySpinner` | Centered **`Spinner`** + label; padding **`LayoutTokens.stack-padding-normal`** via embedded **`SelectPanelLoading`** |
| Body **skeleton** | Same + `bodySkeleton` | **`SkeletonBox`** bars (**`FilteredActionListTokens.skeleton-line-height`**) + container padding/spacing from **`FilteredActionListTokens`**; bar corner radius follows **`SkeletonBox`** (**3px**, not the former **`base-size-4`** placeholder) |
| **Message** | After loading branch; `message` truthy | **`show-message`** + **`message-title`** / **`message-description`** — **`SelectPanelTokens`** message padding/stack (**`SelectPanel`**-aligned typography) |
| **Empty filtered** | Not loading, not message; `lines.length == 0` and empty copy set | **`empty-title`** / **`empty-message`** when at least one non-empty (same layout as message) |
| **ActionList** | Default | Embedded **`ActionList`** with parent-built **`[ActionListLine]`** |
| Empty list, no empty copy | Parent passes empty `lines`, no **`empty-*`** | **`ActionList`** path (zero rows) |

---

## 3. ActionList-driven matrix

Parent supplies lines; component passes through selection / dividers.

| Dimension | Cases | Notes |
|-----------|--------|--------|
| `selection-mode` | none / single / multiple | Upstream `selectionVariant`; **`radio`** deferred unless ActionList gains distinct radio semantics |
| `show-dividers` | on / off | Upstream `showItemDividers` |
| Row content | Short labels; **long wrapping** (`WithLongItems` story) | Gallery subsection |
| Danger / disabled rows | Per item | Inherited **ActionList** / line model |

Row focus / keyboard-active styling is **ActionList** + upstream `.ActionListItem` rules (`--control-transparent-bgColor-selected` + active indicator). Slint port should **not** fork row visuals; only ensure filter shell does not break **`ActionList`** focus host patterns.

---

## 4. Select-all strip (optional)

| State | Maps to |
|-------|---------|
| Hidden | `select-all-visible: false` (no `onSelectAllChange` upstream) |
| Visible + unchecked / checked / indeterminate | **`Checkbox`** + label; **`CheckboxTokens` / `PrimerColors`** for control; label **`PrimerColors.fgColor-muted`**, font **`LayoutTokens.text-body-size-medium`** |
| Bar chrome | `PrimerColors.bgColor-muted`; bottom border `PrimerColors.borderColor-default` + **`LayoutTokens.table-border-width`** (1px); padding **`base-size-4` block**, **`base-size-16` inline** |

Use **`states [ ]`** on the strip only if you add hover/pressed on the row container (upstream has none); **Checkbox** already owns interaction states.

---

## 5. ColorScheme spot-check

| Region | light / dark token source |
|--------|---------------------------|
| Hairline, dividers, select-all border | `PrimerColors.borderColor-default` |
| Select-all background | `PrimerColors.bgColor-muted` |
| Select-all label | `PrimerColors.fgColor-muted` |
| List row selected / focus surface | `ButtonTokens.color-action-list-item-default-selected-bg` (already maps same semantics as `--control-transparent-bgColor-selected` in this repo) |

---

## 6. Token audit table (`primer-slint-token-layers`)

Goal: **no new hex**; prefer **`PrimerColors`**, **`LayoutTokens`**, **`ButtonTokens`**, **`ActionListTokens`**, existing **`SelectPanelTokens`**; add **`FilteredActionListTokens`** (or extend **`SelectPanelTokens`**) only for **new composed lengths** that are truly FilteredActionList–specific and unused elsewhere.

| Visual / spacing (upstream CSS) | primer-tokens key / CSS var | Existing Slint global / `out` | Action |
|---------------------------------|-----------------------------|----------------------------------|--------|
| Header shadow hairline | `--borderColor-default` | `PrimerColors.borderColor-default` | **Reuse** — use 1px line or box-shadow token color only |
| Select-all background | `--bgColor-muted` | `PrimerColors.bgColor-muted` | **Reuse** |
| Select-all bottom border | `--borderColor-default` + thin | `PrimerColors.borderColor-default` + `LayoutTokens.table-border-width` | **Reuse** |
| Select-all padding block | `--base-size-4` | `LayoutTokens.base-size-4` | **Reuse** |
| Select-all padding inline | `--base-size-16` | `LayoutTokens.base-size-16` | **Reuse** |
| Select-all label color | `--fgColor-muted` | `PrimerColors.fgColor-muted` | **Reuse** |
| Select-all label size | `--text-body-size-medium` | `LayoutTokens.text-body-size-medium` | **Reuse** |
| Checkbox margin hack | mixed `base-size-*` | `LayoutTokens` spacing | **Reuse** or **FilteredActionListTokens.select-all-checkbox-margin** if a single composed margin is clearer |
| Body spinner padding | `--base-size-16` | `LayoutTokens.base-size-16` | **Reuse** |
| Skeleton container padding | `--base-size-8` | `LayoutTokens.base-size-8` | **Reuse** |
| Skeleton bar radius | `4px` literal in CSS | Implemented inside **`SkeletonBox`** (**3px** — **`LayoutTokens.borderRadius-small`**) | **SkeletonBox** owns radius; **`FilteredActionListTokens.skeleton-bar-border-radius`** remains for documentation parity only until removed |
| Skeleton bar height | `SkeletonBox` **10px** tall | No exact **`LayoutTokens`** match today | **`FilteredActionListTokens.skeleton-line-height`** → single `out` (compose from spacing audit) **or** reuse **`LayoutTokens.control-large-paddingInline-spacious`** (10px) only if reviewers accept semantic stretch |
| List item focus bg | `--control-transparent-bgColor-selected` | `ButtonTokens.color-action-list-item-default-selected-bg` | **Reuse** (ActionList) |
| SelectPanel message padding / gaps | N/A for FAL directly | `SelectPanelTokens.message-region-padding`, `message-stack-gap` | **Consider reuse** for message region only if layout matches; else **FilteredActionListTokens** message padding alias pointing at same `LayoutTokens` chain |

**Duplicate guard:** If a value equals **`SelectPanel`** filter chrome (e.g. list max height), prefer **`SelectPanelTokens.list-max-height-default`** or document why FilteredActionList uses a different height.

---

## 7. Skeleton strategy (confirmed)

**Implementation:** Shared **`SkeletonBox`** from [`Skeleton/skeleton-box.slint`](../Skeleton/skeleton-box.slint) — shimmer and light/dark fills live in that component.

**Layout (matches previous deterministic v1):**

- Outer padding **`FilteredActionListTokens.skeleton-container-padding`** (**`base-size-8`**).
- Vertical gap **`FilteredActionListTokens.skeleton-stack-gap`** (**`base-size-8`**).
- Five horizontal bars: full width, **88%**, full, **64%**, **72%**; bar height **`FilteredActionListTokens.skeleton-line-height`** (**10px** via **`LayoutTokens.control-large-paddingInline-spacious`**).

**Upstream `LoadingSkeleton` gaps (optional later):** per-row **16×16** avatar square + variable-width bar; row count from height ÷ 24px (min 3). Not required for current gallery matrix.

**Deferred:** Random bar widths (upstream `Math.random()`); Slint keeps **deterministic** widths for stable rendering.

---

## 8. Traceability checklist

- [ ] **Storybook:** `Default` + `WithLongItems` both have a matrix row or cross-reference in §3.
- [x] **Loading:** `input` / `body_spinner` / `body_skeleton` — §2 + gallery **FilteredActionList · loading kinds**.
- [x] **Message vs list** ordering matches upstream `getBodyContent` (loading body first, then message, then list / empty copy).
- [x] **Select-all** maps to **Checkbox** + §4 tokens; no duplicate label colors.
- [ ] **Token audit** §6: every new `out` in `tokens.slint` justified or marked **Reuse** only.

---

## 9. `states [ ]` guidance

- **FilteredActionList root:** usually layout-only; **no** `states` unless adding focus ring on a custom wrapper.
- **Select-all row:** prefer **Checkbox** child for states; container is static chrome.
- **Rows:** owned by **`ActionList`**; apply **`primer-slint-interaction-states`** at **ActionList** level, not reimplemented in the filter shell.

Keep this file in sync when adding **group headings**, **radio selection**, or **skeleton** upgrades.

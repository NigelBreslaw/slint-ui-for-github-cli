# TreeView — variant matrix (`primer-port-variant-matrix`)

**Upstream:** [`TreeView.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/TreeView/TreeView.tsx), [`TreeView.module.css`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/TreeView/TreeView.module.css). **Research:** [`UPSTREAM_INVENTORY.md`](./UPSTREAM_INVENTORY.md).

**Coverage rule:** every visually distinct combination of **root layout**, **row chrome**, **subtree state**, and **pointer density** maps to **`TreeViewTokens`** (or existing **`PrimerColors` / `LayoutTokens`**) plus **`states [ ]`** on the row container — no orphan combinations.

**ColorScheme:** matrix applies to **light** and **dark** via the same functional tokens (`PrimerColors` branches); high-contrast / forced-colors behavior is **CSS-only** upstream — call out gaps in the readme when exporting.

There is **no** global `disabled` prop on `TreeView.Item` upstream; do not add a fake disabled variant unless product asks for it.

---

## 1. Root-level dimensions

| Dimension | Cases | Maps to (Slint) / notes |
|-----------|--------|-------------------------|
| Indent / grid | Default indented tree vs **`flat`** | `flat` → omit spacer + toggle + leading-action columns (upstream `data-omit-spacer`) |
| Label overflow | **`truncate: true`** (default) vs **`false`** | `true` → elide single line; `false` → wrap (`word-break` upstream) |
| Width | Story **`WidthContraintContainer`** | Gallery: parent **`max-width`** ~560px (port plan) — **not** a component variant |

---

## 2. Row-level matrix (single item appearance)

Rows are identified by **composition** (leading / trailing / actions). Use one **`states [ ]`** host for hover/pressed/current/focus where visuals overlap.

| Story / scenario | ColorScheme | “Size” (touch) | Interaction (rest / hover / pressed) | Focus | Notes |
|------------------|-------------|----------------|----------------------------------------|-------|-------|
| Default row | light / dark | fine (1rem toggle) | R, H on container; toggle has optional **H** when `onSelect` | Focus-visible ring on container | Muted chevron; level lines fade in on root hover/focus-within |
| Default row | light / dark | **coarse** | Same semantics, taller min height | Same | `--toggle-width` 1.5rem; `--min-item-height` 2.75rem |
| **`aria-current`** | light / dark | either | H on non-current; current uses **selected** bg, **no** duplicate hover if undefined upstream | Same + left accent bar | Accent bar uses **`fgColor-accent`** |
| Row with **skeleton** children (loading) | light / dark | either | **Hover disabled** (transparent cursor) | — | `:has(.TreeViewItemSkeleton)` cancels hover bg |
| **`flat`** (`WithoutIndentation`) | light / dark | either | Same hover | Same | No indent columns; content starts at grid col 1fr |
| **LeadingAction** present | light / dark | either | R, H | Focus moves to treeitem; leading column **`aria-hidden`** in React | Grid reserves **`--leading-action-width`** |
| **Trailing actions** (icons / count) | light / dark | either | Buttons: use **invisible** control tokens; click does not select row | Trailing controls **`tabIndex` -1**; treeitem keeps roving focus | Multi-action → chord / dialog; document Slint affordance |
| **TrailingVisual** only (diff icons) | light / dark | either | Row hover only | — | Icon colors from story CSS classes (map to semantic success/danger/attention in Slint gallery or tokens) |

---

## 3. SubTree state mutex (async / empty)

Exactly **one** subtree mode applies per parent expansion (plus children when `done`).

| `state` | Visible UI | Interaction | Focus / a11y notes |
|---------|------------|--------------|-------------------|
| `undefined` / sync | Real children or empty detector | Normal tree | Standard |
| `initial` | Children if any; else empty handling | Normal | — |
| `loading` **no `count`** | Spinner + “Loading…” row | Skeleton row hover disabled N/A | Loading row can take focus |
| `loading` **with `count`** | N skeleton rows | Same | SR “Loading N items” |
| `done` | Children or **EmptyItem** (“No items found”) | Normal | Announces loaded / empty upstream |
| `error` | **`ErrorDialog`** (confirmation) | Retry / dismiss | Dismiss collapses + callback |

---

## 4. Optional / deferred rows

| Variant | In scope? | Notes |
|---------|-----------|--------|
| **`DraggableListItem`** | **No** | Excluded from port checklist |
| **`StressTests/…/CurrentUpdate`** | Optional | Perf harness; not part of main feature story list |
| **`containIntrinsicSize`** | Approximate | No 1:1 `content-visibility` — document in gallery |

---

## 5. Token audit seed (`primer-slint-token-layers`)

Goal: **no duplicate hex**; prefer **`PrimerColors`** for fg / control transparent hover+selected / border muted / accent / shadows; add **`TreeViewTokens`** only for **tree-specific** composed lengths (toggle column, accent bar width/offset, min row height fine vs coarse) that are not already in **`LayoutTokens`**.

| Visual (upstream) | primer-tokens / CSS var | Slint action |
|-------------------|-------------------------|--------------|
| Directory icon color | `treeViewItem.leadingVisual.iconColor.rest` → `--treeViewItem-leadingVisual-iconColor-rest` | `PrimerColors` bridge or **`TreeViewTokens`** alias |
| Row hover / selected | `control.transparent.bgColor.*` | Reuse **`PrimerColors`** |
| Focus ring | `boxShadow.thick` + `fgColor.accent` | Reuse globals |
| Level line | `borderColor.muted` | Reuse **`PrimerColors`** |
| Muted chevron / icons | `fgColor.muted` | Reuse **`PrimerColors`** |

---

## 6. Icons to register (from story set)

Octicons used across the checklist (dedupe when adding to `icons.slint`): **file**, **file-directory-fill**, **file-directory-open-fill**, **diff-added**, **diff-modified**, **diff-removed**, **diff-renamed**, **kebab-horizontal**, **gear**, **grabber**, **issue-opened**, **issue-closed**, **git-pull-request**, **chevron-down** / **chevron-right** (toggle size 12px upstream).

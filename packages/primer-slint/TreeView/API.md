# PrimerTreeView (Slint) — API and port notes

Upstream: [`primer-ui-react` `TreeView.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/TreeView/TreeView.tsx), [`TreeView.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/TreeView/TreeView.module.css), [`treeView.json5`](https://github.com/primer/primer-tokens/blob/main/src/tokens/component/treeView.json5).

## Architecture choice: **flat visible-row model**

Slint has no React-style context for `level`, expanded cache, roving tabindex, or compound children. For large trees (**StressTest**, **NestedScrollContainer**, **Controlled** expand-all) and future **ListView** virtualization, this port uses a **single model of visible rows** (a pre-order flatten of the expanded tree), not nested `PrimerTreeViewItem` components mirroring `TreeView.Item` / `SubTree` in the `.slint` tree.

- **Gallery / app state** owns the tree structure, expand/collapse, async `SubTree` transitions, and rebuilds the flat `[TreeViewRow]` (or equivalent) when the visible set changes.
- **PrimerTreeView** (component PR) renders rows from that model: indent, chevron, label, optional leading/trailing slots, **secondary actions** affordance, and delegates expand/collapse and action callbacks back to the host.

Nested composition remains possible for tiny demos only; it is **not** the supported integration pattern for performance stories.

## Public surface (planned mapping from React)

### Root — `TreeView` → `PrimerTreeView`

| React `TreeViewProps` | Slint direction |
| --- | --- |
| `aria-label` / `aria-labelledby` | `accessible-name` / `accessible-labelled-by` (or host wraps `AccessibleRole` + labels; exact names follow existing primer-slint patterns when implemented). |
| `flat` | `flat: bool` — when true, omit indent + chevron column (matches `data-omit-spacer` / zero grid columns upstream). |
| `truncate` | `truncate: bool` — default true: label `overflow: elide`; false allows wrapping (**Files**, **MultilineItems**). |
| `max-gutter-columns` | `max-gutter-columns: int` (default **12**) — number of indent slots for vertical guides; use Slint **`for slot[index] in max-gutter-columns`**; must be ≥ deepest **`row.level − 1`** when not **`flat`**. |
| `className` / `style` | Not ported; hosts use layout wrappers. |
| (callbacks) | **`row-current-requested(string id)`** — fires on primary row activation (pointer click or Space/Return when the row’s **`FocusScope`** has focus) for every **`interactive`** non-skeleton row; host sets **`current`** on the matching row in its model. **`row-toggle-requested(string id)`** — fires in addition when the row has **`has-children`** (expand/collapse). **`row-secondary-actions-requested(string id, length ax, length ay, length aw, length ah)`** — kebab pressed; anchor args are window-absolute geometry for **`AnchoredOverlay`**. The main row **`TouchArea`** is enabled for **`interactive && !is-skeleton`** so hover/press applies to leaves and empty folders, not only expandable nodes. |

### Item — `TreeView.Item` → **one row struct + row callbacks**

| React `TreeViewItemProps` | Slint model / API |
| --- | --- |
| `id` | `id: string` (stable row id; used for expand cache and callbacks). |
| `current` | `current: bool` on the row — drives “selected” background + left accent bar (`aria-current`). |
| `defaultExpanded` / `expanded` / `onExpandedChange` | Host tracks expansion; row carries `has-children`, `expanded`, and optional `expanded-changed(bool)` or a single `activated` that toggles when the chevron/row policy matches React. |
| `onSelect` | Host sets **`current: true`** on one row at a time. Slint: implement **`row-current-requested(id)`** to update selection; **`row-toggle-requested(id)`** still runs for rows with **`has-children`** on the same interaction. |
| `containIntrinsicSize` | Optional `intrinsic-height-hint: length` for gallery notes only; no `content-visibility` in Slint — large subtrees use **ListView** + bounded viewport (see port plan). |
| `secondaryActions` | See below. |
| Slots: `LeadingVisual`, `TrailingVisual`, `LeadingAction` | Row fields: **`TreeViewTrailingVisual`**, **`has-leading-visual`**, **`leading-is-directory`**, **`leading-file-icon`**; **LeadingAction** column: **`has-leading-action`**, **`show-leading-action-icon`**, **`leading-action-icon`**. |

### SubTree — `state`, `count` → **row metadata + host logic**

| React `SubTreeState` | Slint |
| --- | --- |
| `undefined` / sync | No loading row; children appear when host inserts rows. |
| `'initial'` | Treated like empty/done until host sets another state (optional no-op). |
| `'loading'` | **`TreeViewRow.is-skeleton: true`** on synthetic child rows (**`interactive: false`**) — **SkeletonBox** bars, no row hover; expand **`TouchArea`** disabled. Parent may set **`loading-children-badge`** (**AsyncWithCount**). |
| `'done'` | Normal children rows. |
| `'error'` | Host shows **Dialog** / inline error (**AsyncError**); not painted inside the row token layer. |

Live region announcements and focus moves after async load are **v1 partial** (see `readme.md` TreeView section).

### `TreeViewSecondaryActions` → **row flags + `row-secondary-actions-requested`**

React: `label`, `onClick`, `icon`, optional `count`.

Slint (implemented):

- **`TreeViewRow.has-secondary-actions`** — shows trailing **IconButton** (**kebab**) outside the expand **`TouchArea`** so the menu does not toggle expand.
- **`TreeViewRow.secondary-actions-badge`** — non-empty shows **CounterLabel** before the kebab (Storybook count).
- **`PrimerTreeView.row-secondary-actions-requested(string id, length anchor-x, length anchor-y, length anchor-w, length anchor-h)`** — host positions **`AnchoredOverlay`** / **`ActionList`** (or **`Dialog`**) using window-absolute anchor geometry from **`IconButton.absolute-position`** (see **`gallery-tree-view-page.slint`** **TrailingActions** / **FocusManagement**).
- **Ctrl/Cmd+Shift+U** is not bound in v1; use the visible kebab or host shortcuts.

## Interaction states (`TreeView.module.css` → Slint)

Follow [`.cursor/skills/primer-slint-interaction-states/SKILL.md`](../../../.cursor/skills/primer-slint-interaction-states/SKILL.md).

**Dimensions**

- **Disabled / non-interactive**: skeleton/loading rows — no row hover; pointer `cursor: default` parity.
- **Pointer**: `rest` → `hover` → `pressed` on the row container (`TouchArea`).
- **Current** (`current: true`): orthogonal to hover — combine **current+hover**, **current+rest**, **not current+hover**, etc., in `states [ ]` from most specific to least; **`disabled` / skeleton** branches first.
- **Focus-visible**: `FocusScope` → `TouchArea` → painted `Rectangle` for the row container; **`focus-on-click: false`** on `FocusScope` so pointer click does not show the keyboard ring; keyboard focus uses **`FocusScope.has-focus`** for the **2px** accent ring (upstream `box-shadow` + `fgColor-accent` — use **`TreeViewTokens`** / **`PrimerColors.fgColor-accent`**).

**Mutex groups**

- Skeleton/loading rows: pointer styling off (matches `:has(.TreeViewItemSkeleton):hover`).
- Enabled rows: pointer rest/hover/pressed mutually exclusive; **current** combines with those states.

**Level lines**

- Upstream: muted border, hidden on `hover: hover` until tree hover or `:focus-within`. Slint: separate `Rectangle`(s) or border alpha driven by `tree-has-hover-or-focus: bool` on the root (host or internal aggregate).

## Tokens

All resolved colors and metrics for the row chrome live in **`TreeViewTokens`** ([`../tokens.slint`](../tokens.slint)); see the audit table there. Do not duplicate hex in `PrimerTreeView` — compose from **`TreeViewTokens`** `out` properties only.

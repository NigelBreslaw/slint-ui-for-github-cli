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
| `className` / `style` | Not ported; hosts use layout wrappers. |

Callbacks: root does not take `onClick`; row-level activation is per item.

### Item — `TreeView.Item` → **one row struct + row callbacks**

| React `TreeViewItemProps` | Slint model / API |
| --- | --- |
| `id` | `id: string` (stable row id; used for expand cache and callbacks). |
| `current` | `current: bool` on the row — drives “selected” background + left accent bar (`aria-current`). |
| `defaultExpanded` / `expanded` / `onExpandedChange` | Host tracks expansion; row carries `has-children`, `expanded`, and optional `expanded-changed(bool)` or a single `activated` that toggles when the chevron/row policy matches React. |
| `onSelect` | When set upstream, click on row selects and chevron toggles expand. Slint: `select-on-activate: bool` or infer from `callback` wiring: if `row-selected()` is connected, row click fires that; chevron still calls `expand-toggle()` (mirror React’s split). |
| `containIntrinsicSize` | Optional `intrinsic-height-hint: length` for gallery notes only; no `content-visibility` in Slint — large subtrees use **ListView** + bounded viewport (see port plan). |
| `secondaryActions` | See below. |
| Slots: `LeadingVisual`, `TrailingVisual`, `LeadingAction` | Row fields: e.g. `has-leading-action`, `leading-icon`, `trailing-kind` enums / optional images; **LeadingAction** column width follows upstream `data-has-leading-action`. |

### SubTree — `state`, `count` → **row metadata + host logic**

| React `SubTreeState` | Slint |
| --- | --- |
| `undefined` / sync | No loading row; children appear when host inserts rows. |
| `'initial'` | Treated like empty/done until host sets another state (optional no-op). |
| `'loading'` | Row model includes synthetic skeleton rows (`count`) or a single loading row; no hover on skeleton (upstream `:has(.TreeViewItemSkeleton)` clears hover). |
| `'done'` | Normal children rows. |
| `'error'` | Host shows **Dialog** / inline error (**AsyncError**); not painted inside the row token layer. |

Live region announcements and focus moves after async load are **v1 partial** (see `readme.md` TreeView section).

### `TreeViewSecondaryActions` → **callbacks + minimal metadata**

React type:

- `label`, `onClick`, `icon`, optional `count`, optional `className`

Slint direction:

- Host supplies `secondary-actions: [TreeViewSecondaryAction]` where each entry has `label`, `icon` (`image` or **Icons** registry key when bridged), optional `count` string.
- **No** `callback` fields inside the struct if using strict Slint 1.x structs; instead **`secondary-action-activated(int)`** on the tree with row index + action index, or **`action-activated(row-id, action-index)`**, and the host runs logic (matches TS `onClick` closures).
- Multiple actions: upstream opens **ActionDialog**; Slint reuses **ActionList** / overlay patterns from primer-slint (same as plan). Single action: invoke the same callback path immediately.
- **Ctrl/Cmd+Shift+U**: document as gallery-visible overflow menu or shortcut when key chords are not bound in v1.

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

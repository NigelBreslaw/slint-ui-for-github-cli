# PR1 — FilteredActionList2 selection (upstream traceability)

## Stories covered (gallery `scenario-ix`)

| ix | Gallery label | Upstream story | React source |
|----|---------------|----------------|--------------|
| 2 | SingleSelect | `Components/SelectPanel/Features` → **SingleSelect** | `SelectPanel.features.stories.tsx`; list via `FilteredActionList` in `SelectPanel.tsx` (`role="listbox"`, `selectionVariant="single"`) |
| 3 | MultiSelect | **MultiSelect** | Same; `selectionVariant="multiple"`; initial `selected: items.slice(1, 3)` → **bug**, **good first issue** |

## Selection chrome

| Upstream | Slint |
|----------|-------|
| `role="listbox"` on list | `list-role: ActionList2ListRole.listbox` on **FilteredActionList2** → **ActionList2Lines** |
| `selectionVariant="single"` | `selection-mode: ActionList2SelectionMode.single` → **checkmark** lead (`ActionList2Lines` derivation) |
| `selectionVariant="multiple"` | `selection-mode: ActionList2SelectionMode.multiple` + **listbox** → **checkbox** lead |
| `selected` / `onSelectedChange` | `selected-index` (single) or `multi-selected[]` + `item-activated` |

## Tokens / CSS (reference)

| Visual | Upstream CSS | primer-tokens / Slint |
|--------|--------------|------------------------|
| Selected row background | `FilteredActionList.module.css` — `--control-transparent-bgColor-selected` | **PrimerColors** / **ActionList2Tokens** selected row states |
| Filter hairline | `box-shadow: 0 1px 0 var(--borderColor-default)` | `PrimerColors.borderColor-default` 1px **Rectangle** |
| List body border | inset list border | `PrimerColors.borderColor-muted`, `LayoutTokens.borderRadius-medium` |
| Leading circles | `SelectPanel.features.stories` `getColorCircle` hex | Gallery bridge `FILTERED_ACTION_LIST2_DEFAULT_LEADING_HEX` / RGB table in Rust |

## Slint API added (PR1)

- `list-role`, `selection-mode`, `selected-index`, `multi-selected` on **FilteredActionList2** (forwarded to **ActionList2Lines**).

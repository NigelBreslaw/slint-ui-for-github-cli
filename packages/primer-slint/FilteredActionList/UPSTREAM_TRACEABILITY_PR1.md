# PR1 — FilteredActionList selection (upstream traceability)

## Stories covered (gallery `scenario-ix`)

| ix | Gallery label | Upstream story | React source |
|----|---------------|----------------|--------------|
| 2 | SingleSelect | `Components/SelectPanel/Features` → **SingleSelect** | `SelectPanel.features.stories.tsx`; list via `FilteredActionList` in `SelectPanel.tsx` (`role="listbox"`, `selectionVariant="single"`) |
| 3 | MultiSelect | **MultiSelect** | Same; `selectionVariant="multiple"`; initial `selected: items.slice(1, 3)` → **bug**, **good first issue** |

## Selection chrome

| Upstream | Slint |
|----------|-------|
| `role="listbox"` on list | `list-role: ActionListListRole.listbox` on **FilteredActionList** → **ActionListLines** |
| `selectionVariant="single"` | `selection-mode: ActionListSelectionMode.single` → **checkmark** lead (`ActionListLines` derivation) |
| `selectionVariant="multiple"` | `selection-mode: ActionListSelectionMode.multiple` + **listbox** → **checkbox** lead |
| `selected` / `onSelectedChange` | `selected-index` (single) or `multi-selected[]` + `item-activated` |

## Tokens / CSS (reference)

| Visual | Upstream CSS | primer-tokens / Slint |
|--------|--------------|------------------------|
| Selected row background | `FilteredActionList.module.css` — `--control-transparent-bgColor-selected` | **PrimerColors** / **ActionListTokens** selected row states |
| Filter hairline | `box-shadow: 0 1px 0 var(--borderColor-default)` | `PrimerColors.borderColor-default` 1px **Rectangle** |
| List body border | inset list border | `PrimerColors.borderColor-muted`, `LayoutTokens.borderRadius-medium` |
| Leading circles | `SelectPanel.features.stories` `getColorCircle` hex | Gallery bridge `FILTERED_ACTION_LIST_DEFAULT_LEADING_HEX` / RGB table in Rust |

## Slint API added (PR1)

- `list-role`, `selection-mode`, `selected-index`, `multi-selected` on **FilteredActionList** (forwarded to **ActionListLines**).

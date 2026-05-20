# FilteredActionList2 — variant matrix

Storybook-driven coverage for the initial port (two stories only). Deferred API from upstream is listed at the bottom.

## Shipped stories

| Story | Color scheme | disabled | Row size | Leading | Selection | Focus notes |
|-------|--------------|----------|----------|---------|-------------|-------------|
| **Default** | inherited | no | medium | colored circle per row (gallery bridge) | none | filter field + row pointer / Tab on rows |
| **WithLongItems** | inherited | no | medium | none (long wrapping labels) | none | same |
| **SingleSelect** (SelectPanel) | inherited | no | medium | colored circles | listbox + single checkmark | gallery ix 2 |
| **MultiSelect** (SelectPanel) | inherited | no | medium | colored circles | listbox + multiple checkbox | gallery ix 3; initial bug + good first issue |

## Deferred (upstream API, not in `FilteredActionList2` yet)

| Area | Upstream | Notes |
|------|----------|--------|
| Loading | `loading`, `loadingType` | v1 **`FilteredActionList`** + **`SelectPanelLoading`** / skeleton |
| Select all | `onSelectAllChange` | v1 strip + **`Checkbox`** |
| Message / empty | `message`, empty filtered | v1 **`show-message`** / **`empty-*`** |
| Keyboard | `_PrivateFocusManagement`, `aria-activedescendant` | dedicated focus PR |

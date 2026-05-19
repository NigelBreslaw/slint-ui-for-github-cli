# FilteredActionList2 — variant matrix

Storybook-driven coverage for the initial port (two stories only). Deferred API from upstream is listed at the bottom.

## Shipped stories

| Story | Color scheme | disabled | Row size | Leading | Focus notes |
|-------|--------------|----------|----------|---------|-------------|
| **Default** | inherited | no | medium | colored circle per row (gallery bridge) | filter field + row pointer / Tab on rows |
| **WithLongItems** | inherited | no | medium | none (long wrapping labels) | same |

## Deferred (upstream API, not in `FilteredActionList2` yet)

| Area | Upstream | Notes |
|------|----------|--------|
| Loading | `loading`, `loadingType` | v1 **`FilteredActionList`** + **`SelectPanelLoading`** / skeleton |
| Select all | `onSelectAllChange` | v1 strip + **`Checkbox`** |
| Message / empty | `message`, empty filtered | v1 **`show-message`** / **`empty-*`** |
| Keyboard | `_PrivateFocusManagement`, `aria-activedescendant` | dedicated focus PR |

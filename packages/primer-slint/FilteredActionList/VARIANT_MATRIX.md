# FilteredActionList — variant matrix

Storybook-driven coverage for the initial port (two stories only). Deferred API from upstream is listed at the bottom.

## Shipped stories

| Story | Color scheme | disabled | Row size | Leading | Selection | Focus notes |
|-------|--------------|----------|----------|---------|-------------|-------------|
| **Default** | inherited | no | medium | colored circle per row (gallery bridge) | none | filter field + row pointer / Tab on rows |
| **WithLongItems** | inherited | no | medium | none (long wrapping labels) | none | same |
| **SingleSelect** (SelectPanel) | inherited | no | medium | colored circles | listbox + single checkmark | gallery ix 2 |
| **MultiSelect** (SelectPanel) | inherited | no | medium | colored circles | listbox + multiple checkbox | gallery ix 3; initial bug + good first issue |
| **LoadingInput** | inherited | no | medium | demo rows | none | gallery ix 4; filter spinner |
| **LoadingBodySpinner** | inherited | no | — | — | none | gallery ix 5 |
| **LoadingBodySkeleton** | inherited | no | — | skeleton bars | none | gallery ix 6 |
| **MessageVsList** | inherited | no | — | — | none | gallery ix 7; `show-message` |
| **EmptyBody** | inherited | no | — | — | none | gallery ix 8; `empty-message` |
| **SelectAll** (SelectPanel) | inherited | no | medium | colored circles | listbox + multiple + strip | gallery ix 9 |

## Deferred (upstream API, not in `FilteredActionList` yet)

| Area | Upstream | Notes |
|------|----------|--------|
| Keyboard | `_PrivateFocusManagement`, `aria-activedescendant` | dedicated focus PR |

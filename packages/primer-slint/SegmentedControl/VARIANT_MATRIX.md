# SegmentedControl — variant matrix

| Dimension | Cases | Slint status (phase 1) |
|-----------|--------|-------------------------|
| **Size** | `small` (28px), `medium` (32px) | Implement |
| **Width** | Hug content vs fill row | **`horizontal-stretch`** on host; inner row **`width`** when stretched |
| **Variant** | `default`, `hideLabels` | Implement **`hide_labels`** (hide label text when leading icon); **`dropdown`** deferred |
| **Selection** | Each segment selected / unselected | **`in-out selected-index`** |
| **Segment** | Text only; text + leading icon; icon-only (`aria-label`) | Model: **`label`**, **`has-leading-icon`**, **`leading-icon`**, **`icon-only`** |
| **Disabled** | Root N/A; per-segment `disabled` | Implement |
| **Count** | Optional **`CounterLabel`** | **`has-count`** + **`count-text`** |
| **Hover / active** | Unselected track hover/active on `.Content` | **`states`** on content |
| **Focus** | `:focus-visible` 2px accent outline | **`FocusScope`**, **`focus-on-click: false`**, ring |
| **Separator** | 1px vertical; transparent next to selected | Implement |
| **Scheme** | light / dark | **`Palette.color-scheme`** via **`ToggleSwitchTokens`** / **`PrimerColors`** |

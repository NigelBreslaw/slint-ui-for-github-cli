# SegmentedControl — upstream inventory

**Repos:** [`primer-ui-react`](file:///Users/nigelb/slint/primer-ui-react) · [`primer-tokens`](file:///Users/nigelb/slint/primer-tokens) (`functional/color/control.json5` — **controlTrack**, **controlKnob**).

Slint coverage checklist: [`VARIANT_MATRIX.md`](./VARIANT_MATRIX.md).

## Upstream paths

| Kind | Path (`primer-ui-react/packages/react/src/SegmentedControl/`) |
|------|----------------------------------------------------------------|
| Root | `SegmentedControl.tsx` — selection, `fullWidth`, `size`, responsive `variant`, `dropdown` + `ActionMenu` |
| Text segment | `SegmentedControlButton.tsx` |
| Icon segment | `SegmentedControlIconButton.tsx` (+ `TooltipV2`) |
| Styles | `SegmentedControl.module.css` |
| Stories | `SegmentedControl.stories.tsx`, `*.features.stories.tsx`, `*.examples.stories.tsx`, `*.responsive.stories.tsx` |

## Root props (React)

| Prop | Notes |
|------|--------|
| `aria-label` / `aria-labelledby` | Required for a11y (console warn if both missing) |
| `fullWidth` | `boolean` or per-viewport object — Slint: **`horizontal-stretch: 1`** on host |
| `size` | `small` \| `medium` — heights **28px** / **32px** |
| `variant` | `default` \| `hideLabels` \| `dropdown` (global or per **narrow/regular/wide**) |
| `onChange` | `(selectedIndex: number) => void` |

## Segment props (Button)

| Prop | Notes |
|------|--------|
| `children` | Label string |
| `selected` / `defaultSelected` | Controlled vs uncontrolled |
| `leadingVisual` / `leadingIcon` | Optional icon |
| `disabled` | Muted fg, no activation |
| `count` | **`CounterLabel`** after label |

## Icon segment

| Prop | Notes |
|------|--------|
| `icon`, `aria-label` | Icon-only; optional **`description`** + **`tooltipDirection`** for **`Tooltip`** |

## Phased Slint scope

| Phase | Scope |
|-------|--------|
| **1** | Pill strip: **`default`** + **`hide_labels`** variant, **`small`/`medium`**, segments model, **`selected-index`**, separators, focus ring, **`CounterLabel`**, per-segment **`disabled`**, fill width via layout |
| **2** | **`dropdown`** / responsive breakpoint parity — **`ActionMenu`** + **`ActionList`**, optional **`Tooltip`** parity for icon-only |

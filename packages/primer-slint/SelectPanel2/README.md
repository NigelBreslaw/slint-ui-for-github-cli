# SelectPanel2

Slint port of Primer **SelectPanel** using the **new stack** only: **`AnchoredOverlay`** + **`FilteredActionList2`** + **`ActionList2`**. Legacy **`SelectPanel`** / **SelectPanelCompose** are untouched.

## Upstream

- [`SelectPanel.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/SelectPanel/SelectPanel.tsx)
- [`SelectPanel.stories.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/SelectPanel/SelectPanel.stories.tsx) — gallery PR4: **Default** only

## Composition

```
SelectPanel2
  Button (anchor + triangle_down)
  AnchoredOverlay (width medium by default)
    SelectPanel2Heading
    FilteredActionList2 (filter + listbox body)
```

## Imports

From [`primer.slint`](../primer.slint): **`SelectPanel2`**, **`ActionList2Line`**, **`ActionList2ListRole`**, **`ActionList2SelectionMode`**, **`AnchoredOverlayWidth`**, etc.

See [`UPSTREAM_TRACEABILITY_PR4.md`](UPSTREAM_TRACEABILITY_PR4.md).

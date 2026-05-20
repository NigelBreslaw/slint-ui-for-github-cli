# SelectPanel2

Slint port of Primer **SelectPanel** using the **new stack** only: **`AnchoredOverlay`** + **`FilteredActionList2`** + **`ActionList2`**. Legacy **`SelectPanel`** / **SelectPanelCompose** are untouched.

## Upstream

- [`SelectPanel.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/SelectPanel/SelectPanel.tsx)
- [`SelectPanel.stories.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/SelectPanel/SelectPanel.stories.tsx) — gallery **Default**
- [`SelectPanel.features.stories.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/SelectPanel/SelectPanel.features.stories.tsx) — gallery scenarios **SingleSelect** (PR5), chrome/states/modal (PR6–8)

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

See [`UPSTREAM_TRACEABILITY_PR4.md`](UPSTREAM_TRACEABILITY_PR4.md), [`UPSTREAM_TRACEABILITY_PR5.md`](UPSTREAM_TRACEABILITY_PR5.md), [`UPSTREAM_TRACEABILITY_PR6-8.md`](UPSTREAM_TRACEABILITY_PR6-8.md).

## Selection (PR5)

- **`list-role`**, **`selection-mode`**, **`selected-index`**, **`multi-selected`** — forwarded to **`FilteredActionList2`**.
- Anchored **single**: **`close-on-single-select`** (default **true**) closes the overlay on the next timer tick after **`item-activated`** when **`show-backdrop`** is false (avoids closing **`PopupWindow`** inside the row click handler). Modal single-select (Save/Cancel) is PR8.
- **`single-selected-changed(int)`** — fired with the row index when **`selection-mode`** is **`single`**; wire this (or **`item-activated`**) in the host — unconnected callbacks crash the Node interpreter.

## Chrome and states (PR6–7)

- **`SelectPanel2Notice`** / **`show-notice`** — **Banner** above the filter.
- **`show-footer`** + **`SelectPanel2Footer`** — footer actions as **`@children`** (link + primary, Cancel, modal Save/Cancel).
- **`has-built-in-anchor`** / **`anchor-position-props`** — external trigger (PR8).
- Loading, empty, message, select-all — forwarded to **`FilteredActionList2`** (see **FilteredActionList2** README).

# Anchored dialogs and `PopupWindow` (Slint)

Use this note when implementing Primer-style **anchored** surfaces (SelectPanel, upstream Primer **AnchoredOverlay**). In this repo the shared shell is **`DialogBase`**: a **trigger** plus a **`PopupWindow`** that aligns to the anchor and stays on screen.

**Implementation in this repo:** [`DialogBase/dialog-base.slint`](../DialogBase/dialog-base.slint) (**`DialogBase`**) sizes the **`PopupWindow`** to the panel (**`panel-width`** or anchor width × **`panel-height`**) and positions it with parent-relative **`x`** / **`y`** — **no** full-viewport dimmer, matching Primer **anchored** surfaces (dropdown-style). Pass **`window-inner-width`** and **`window-inner-height`** from the root **`Window`** for **horizontal clamp** and **below/above** flip. **`vertical-side`** (`auto` | `outside_bottom` | `outside_top`) and **`align`** (`start` | `center` | `end`) match a Primer subset (default: **auto** + **start**). Enums: [`types.slint`](../DialogBase/types.slint). Panel chrome: **`OverlayTokens`** (**`backdrop-scrim`** is for modals such as [`primer-dialog.slint`](../../../app/src/ui/components/primer-dialog.slint)). **`SelectPanel`** ([`SelectPanel/select-panel.slint`](../SelectPanel/select-panel.slint)) is the panel **body** (filter + list + optional footer); compose it inside **`DialogBase`** (gallery **Forms** page; github-app project board import dialog uses **`SelectPanel`** in **`SelectPanelMode.single`**). Exported from [`primer.slint`](../primer.slint).

## Coordinate system

`PopupWindow` **`x`** and **`y`** are **relative to the parent element** in the `.slint` tree that **declares** the `PopupWindow`, not necessarily the window origin.

**Do not** assign the anchor’s **`absolute-position`** directly to **`x`** / **`y`**. That double-counts the parent’s offset on screen (the popup shifts, often **to the right** by about the parent’s **`x`**).

**Convert** a desired **window-space** top-left \((W_x, W_y)\) using the parent layout **`parent`** that wraps the `PopupWindow`:

```text
popup.x = W_x - parent.absolute-position.x
popup.y = W_y - parent.absolute-position.y
```

The anchor’s window position comes from **`anchor.absolute-position`** (and **`anchor.width`** / **`height`**). Example: panel **below** the anchor with gap **`g`** and body height **`h`**:

```text
W_x = anchor.absolute-position.x
W_y = anchor.absolute-position.y + anchor.height + g
```

Example: panel **above** the anchor:

```text
W_y = anchor.absolute-position.y - g - h
```

Bind **`popup.width`** / **`height`** to **`panel-width`** (or anchor width) × **`panel-height`**.

## Horizontal align and clamp

In **window space**, compute the raw panel left **`W_x`** from **`align`** (LTR):

- **start:** `W_x = anchor.x`
- **center:** `W_x = anchor.x + (anchor.width - panel.width) / 2`
- **end:** `W_x = anchor.x + anchor.width - panel.width`

Then clamp to the viewport: **`W_x = max(0, min(W_x, window.innerWidth - panel.width))`** so the panel stays on-screen (Primer **`preventOverflow`**-style). Pass **`window-inner-width`** from the **`Window`**.

## Vertical flip (below vs above)

Pass the **window** inner height from the root **`Window`** (e.g. `in property <length> window-inner-height` set from `GalleryWindow` as `root.height`) and compare in **window space**:

- Let **`below_bottom = anchor.y + anchor.height + gap + body_height`** (using **`absolute-position`**-style coordinates).
- Prefer **below** by default.
- Use **above** when **`below_bottom > window-inner-height`** and there is room: **`anchor.y >= gap + body_height`** so the panel does not cross **`y = 0`**. If **below** overflows but **above** does not fit, keep **below** (clip) or clamp in a later iteration.

Implement flip by setting the boolean **before** `show()`, then bind **`popup.y`** from window-space **`W_y`** and convert with **`parent.absolute-position.y`** as above.

## API habits

- Call **`show()`** / **`close()`** from gestures; avoid **`init { show(); }`** before layout is stable (see [`app/src/ui/components/primer-dialog.slint`](../../../app/src/ui/components/primer-dialog.slint)).
- **`width`** / **`height`** on `PopupWindow` size the popup’s client area; inner content typically uses **`100%`** fill.
- **`close-policy`**: fullscreen modals in the app often use **`no-auto-close`**; anchored popups may use the default—see existing usage in [`app/src/ui/main.slint`](../../../app/src/ui/main.slint) and [`app/src/ui/views/settings.slint`](../../../app/src/ui/views/settings.slint).

## Handlers inside the popup

`TouchArea` / focus handlers **inside** `PopupWindow` may not resolve **`root`** the same way as in the page component. If you need to update outer state from inside the popup, use a small **`export global`** or a callback passed from the parent—avoid relying on **`root`** from deep inside the popup without checking.

## Scroll and `Flickable`

Content inside a **`Flickable`** (e.g. gallery main area) moves when the user scrolls; **`absolute-position`** updates. Re-open or recompute position when opening the popup if the anchor may have moved.

## Primer mapping

Upstream Primer **AnchoredOverlay** + internal **Overlay** use the same ideas: anchor geometry, **`align`**, **`side`**, and viewport overflow. This Slint layer (**`DialogBase`**) converts window-space panel **`(W_x, W_y)`** to **parent-relative** **`PopupWindow`** **`x`** / **`y`** (see above). Panel border and **`shadow.floating.small`** elevation use **`OverlayTokens`**; viewport scrims are a **modal** concern, not the default anchored panel.

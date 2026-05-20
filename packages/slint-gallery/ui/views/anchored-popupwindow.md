# Anchored surfaces and `PopupWindow` (Slint)

Use this note when implementing Primer-style **anchored** menus or panels (e.g. **SelectPanel2** as a dropdown, upstream Primer **AnchoredOverlay**). **`packages/primer-slint`** exports **`AnchoredOverlay`** ([`anchored-overlay.slint`](../../../primer-slint/Overlays/anchored-overlay.slint)) — a **`PopupWindow`** shell with **`OverlayPanelChrome`**, outside-* placement, align/offsets, and optional backdrop — plus this coordinate recipe for custom hosts. The **standalone gallery** also has [`gallery-anchored-overlay-page.slint`](gallery-anchored-overlay-page.slint) and the **SelectPanel2** playground ([`gallery-select-panel2-page.slint`](gallery-select-panel2-page.slint)) — **`SelectPanel2`** composes **`AnchoredOverlay`** + **`FilteredActionList2`** (built-in trigger by default; see **External anchor** below).

**Modal shell in this repo:** [`ModalOverlay`](../../../primer-slint/Dialog/modal-overlay.slint) is a fullscreen **`PopupWindow`** with **`OverlayTokens.backdrop-scrim`**, backdrop dismiss, and centered panel chrome (see that file’s imports). Bind viewport size for layout caps the same way as in the gallery **Dialogs** page. **Standalone gallery:** [`GalleryWindow`](../gallery-window.slint) keeps the global **`AppWindow`** ([`tokens.slint`](../../../primer-slint/tokens.slint)) in sync with the root window **`width`** / **`height`** — use **`AppWindow.window-width`** / **`AppWindow.window-height`** for clamp and flip math instead of threading viewport **`in property`** values through every child.

**Panel body:** [`FilteredActionList2`](../../../primer-slint/FilteredActionList2/filtered-action-list2.slint) is the filter + list host; [`SelectPanel2`](../../../primer-slint/SelectPanel2/select-panel2.slint) adds title, subtitle, optional footer, and (by default) a trigger **`Button`** + **`AnchoredOverlay`**. For **inline** surfaces (modal dialog, custom trigger), set **`has-built-in-anchor: false`**, bind **`open`**, and pass **`anchor-position-props`** from your trigger’s **`absolute-position`** / size — see gallery **SelectPanel2 → External anchor** (~line 448 in [`gallery-select-panel2-page.slint`](gallery-select-panel2-page.slint)). App examples: project board import and time-reporting picker use **`FilteredActionList2`** inside **`ModalOverlay`**. Tokens: **`OverlayTokens`** (**`backdrop-scrim`** is for modals such as [`primer-dialog.slint`](../../../../app/src/ui/components/primer-dialog.slint)).

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

Bind **`popup.width`** / **`height`** to your panel size (or anchor width for dropdown-style width).

## Horizontal align and clamp

In **window space**, compute the raw panel left **`W_x`** from **`align`** (LTR):

- **start:** `W_x = anchor.x`
- **center:** `W_x = anchor.x + (anchor.width - panel.width) / 2`
- **end:** `W_x = anchor.x + anchor.width - panel.width`

Then clamp to the viewport: **`W_x = max(0, min(W_x, window.innerWidth - panel.width))`** so the panel stays on-screen (Primer **`preventOverflow`**-style). Use **`AppWindow.window-width`** (gallery) or your host’s viewport width for **`window.innerWidth`**.

## Vertical flip (below vs above)

Use the viewport height (gallery: **`AppWindow.window-height`**) and compare in **window space**:

- Let **`below_bottom = anchor.y + anchor.height + gap + body_height`** (using **`absolute-position`**-style coordinates).
- Prefer **below** by default.
- Use **above** when **`below_bottom > viewport_height`** and there is room: **`anchor.y >= gap + body_height`** so the panel does not cross **`y = 0`**. If **below** overflows but **above** does not fit, keep **below** (clip) or clamp in a later iteration.

Implement flip by setting placement **before** `show()`, then bind **`popup.y`** from window-space **`W_y`** and convert with **`parent.absolute-position.y`** as above.

## API habits

- Call **`show()`** / **`close()`** from gestures; avoid **`init { show(); }`** before layout is stable (packaged **`Dialog`** uses **`ModalOverlay`**’s deferred enter animation — see [`packages/primer-slint/Dialog/modal-overlay.slint`](../../../primer-slint/Dialog/modal-overlay.slint)).
- **`width`** / **`height`** on `PopupWindow` size the popup’s client area; inner content typically uses **`100%`** fill.
- **`close-policy`**: fullscreen modals in the app often use **`no-auto-close`**; anchored popups may use the default—see existing usage in [`app/src/ui/main.slint`](../../../../app/src/ui/main.slint) and [`app/src/ui/views/settings.slint`](../../../../app/src/ui/views/settings.slint).

## Handlers inside the popup

`TouchArea` / focus handlers **inside** `PopupWindow` may not resolve **`root`** the same way as in the page component. If you need to update outer state from inside the popup, use a small **`export global`** or a callback passed from the parent—avoid relying on **`root`** from deep inside the popup without checking.

## Scroll and `Flickable`

Content inside a **`Flickable`** (e.g. gallery main area) moves when the user scrolls; **`absolute-position`** updates. Re-open or recompute position when opening the popup if the anchor may have moved.

## Primer mapping

Upstream Primer **AnchoredOverlay** + internal **Overlay** use anchor geometry, **`align`**, **`side`**, and viewport overflow. In Slint, convert window-space panel **`(W_x, W_y)`** to **parent-relative** **`PopupWindow`** **`x`** / **`y`** (see above). Panel border and **`shadow.floating.small`** elevation use **`OverlayTokens`**; viewport scrims are a **modal** concern, not the default anchored panel.

### A simplified version of Microsoft's Primer Design System written in Slint.

Contributors and AI assistants: see [`AGENTS.md`](AGENTS.md) (reference and verification), [`component-imports.md`](slint/component-imports.md) (which globals to use), and [`.cursor/skills/primer-port-orchestrator/SKILL.md`](../../.cursor/skills/primer-port-orchestrator/SKILL.md) (full porting procedure).

**Gallery app:** `pnpm dev:gallery` from the repository root (see [`slint-gallery/README.md`](../slint-gallery/README.md)). **`AnchoredOverlay` / `PopupWindow`:** [`anchored-popupwindow.md`](../slint-gallery/ui/views/anchored-popupwindow.md) (parent-relative coords, vertical flip, app references).

**Long lists in app views:** use **`Pagination`** (nav strip from [`primer.slint`](slint/primer.slint)) plus **`PaginationLogic`** ([`slint/Pagination/pagination-logic.slint`](slint/Pagination/pagination-logic.slint)) to derive **`page-count`**, range text, and clamps from **`total-count`** / **`page-size`** / 0-based **`page-index`**, then compose the bordered footer row in your view (see **`GalleryPaginationRangeFooter`** in [`slint-gallery/ui/views/gallery-data-page.slint`](../slint-gallery/ui/views/gallery-data-page.slint)). Wire page fields on the right Slint global (`ProjectBoardListState` / `AppState` in `app/src/bridges/slint/`) and TypeScript **`apply…SliceToWindow`** helpers for **`ArrayModel`** slices.

The Primer Design System is used to build the GitHub UI. It's open source (MIT) and
specified in detail.

## Resources

- [Primer Design System](https://primer.style/design/system)

## Design tokens

[`tokens.slint`](slint/tokens.slint) defines the globals below (and `Size`). They are re-exported from [`primer.slint`](slint/primer.slint) for discovery.

- **LayoutTokens** — control sizes, padding, typography lengths, border radius (no light/dark literals). **`avatar-size-header`** (34px profile **`Avatar`** in app chrome). **`base-text-weight-normal`** (400) for muted body / dialog subtitle weight. **ActionList** row metrics: `action-list-item-min-height`, `action-list-item-padding-block`, `action-list-item-min-height-large`, `action-list-item-padding-block-large`. **ActionList** item divider vertical spacing matches [`ActionList.module.css`](https://github.com/primer/react/blob/main/packages/react/src/ActionList/ActionList.module.css) `.Divider`: `action-list-item-divider-margin-block-start` (= `--base-size-8` − `--borderWidth-thin` via `button-content-gap` − `table-border-width`), `action-list-item-divider-margin-block-end` (= `--base-size-8` / `button-content-gap`). Banner spacing and icon metrics: `banner-padding-default`, `banner-padding-compact`, `banner-icon-size-default` (20px leading icon, matches `Banner.module.css` `.BannerIcon svg`), `banner-icon-size-title-hidden` (16px when `hide-title` and no actions), `banner-icon-container-padding`, `base-text-weight-semibold`, `banner-actions-gap` (12px, matches `Banner.module.css` action `column-gap`), `banner-dismiss-margin-when-actions` (2px when actions + dismiss). **Label** metrics: `label-height-small` / `label-height-large`, `label-padding-inline-*`, `label-border-width`, `label-border-radius-pill`. **LabelGroup** row gap: `label-group-gap` (`LabelGroup.module.css`); item row min-height reuses `control-small-size` (28px). **DataTable** / `Table.module.css`: `table-cell-padding-block-*` / `table-cell-padding-inline-*` (condensed | normal | spacious), `table-cell-edge-inset-inline`, `table-border-radius`, `table-border-width`.
- **AvatarTokens** — [**Avatar**](slint/Avatar/avatar.slint) ring (**`borderColor.translucent`**) and placeholder fill (**primer-tokens** **`component/avatar.json5`** **`bgColor`**); scheme via **`Palette`** — literals live only in this global’s audit block.
- **PrimerColors** — semantic surface colors (fg, bg, border, link, overlay, drop-shadow, etc.) resolved from `Palette.color-scheme`. Banner-related functional colors include muted surfaces and borders for accent, success, attention, danger, and done/upsell (e.g. `bgColor-accent-muted`, `borderColor-danger-muted`, `fgColor-danger`, `fgColor-attention`, `fgColor-upsell` / `bgColor-upsell-muted`, plus existing `fgColor-success` for success banners). **DataTable** row hover: `table-row-bgColor-hover` (aligns with `Table.module.css` `--control-transparent-bgColor-hover`; shared semantics with action-list hover in **ButtonTokens**).
- **ButtonTokens** — `color-btn-*`, `button-*`, action-list hover backgrounds, disabled fg, icon-button tints, and filled-button shadow colors (`button-shadow-*-light` / `button-shadow-*-dark`); composes from **PrimerColors** where possible.
- **BannerTokens** — per-variant aliases matching [`Banner.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Banner/Banner.module.css) `--banner-bgColor`, `--banner-borderColor`, and `--banner-icon-fgColor` (`banner-bgColor-critical` … `banner-icon-fgColor-warning`). **No literals** — only **PrimerColors** `out` bindings.
- **LabelTokens** — per-variant `label-fg-*` and `label-border-*` for the product [**Label**](https://primer.style/product/components/label/) chip, aligned with [`Label.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Label/Label.module.css). **No literals** — only **PrimerColors** `out` bindings.
- **StateLabelTokens** — [StateLabel](slint/StateLabel/state-label.slint) padding, pill radius, semibold text size, and **onEmphasis** fg; composes **LayoutTokens** + **PrimerColors** only. Emphasis **bg** / **border** pairs: **PrimerColors** (`bgColor-open-emphasis`, `borderColor-done-emphasis`, …) in the **`StateLabel.module.css`** audit block.
- **ActionListTokens** — [**ActionList**](https://primer.style/product/components/action-list/) row and section-heading colors (danger, inactive, link, filled heading, divider, loading label fg): **only** **PrimerColors** + **ButtonTokens** `out` bindings. PR2 audit comment block in [`tokens.slint`](slint/tokens.slint) above **`ActionListTokens`**.
- **FilteredActionListTokens** — [**FilteredActionList**](slint/FilteredActionList/filtered-action-list.slint) select-all strip padding/gaps and body skeleton bar spacing; composes **LayoutTokens** only. See [`FilteredActionList/VARIANT_MATRIX.md`](slint/FilteredActionList/VARIANT_MATRIX.md) for coverage and v1 non-goals.
- **CheckboxTokens** — unchecked rest/hover/pressed, checked/indeterminate accent fill + hover/active, and disabled colors; composes from **PrimerColors** and **ButtonTokens**. **`LayoutTokens.checkbox-border-radius`** matches Primer **`borderRadius-small`** (2px).
- **RadioTokens** — unchecked base + checked inner dot (**`control.checked.fgColor`**) and outer ring (**`control.checked.bgColor`**) + disabled branches; composes **PrimerColors** / **ButtonTokens** (see audit block in [`tokens.slint`](slint/tokens.slint)).
- **OverlayTokens** — **`backdrop-scrim`** for modal-style dimmers; **`panel-background`** / **`panel-border`** / **`panel-border-width`** / **`panel-border-radius`**, **`panel-elevation-shadow`** (`shadow.floating.small` via **ShadowTokens**) for floating panels (**AnchoredOverlay** and **ModalOverlay** use the panel tokens; **AnchoredOverlay** optional **`panel-fill`** / **`panel-border-*`** / **`panel-elevation-shadow`** mirror these when overriding shell chrome — defaults unchanged). **ModalOverlay** also uses **`backdrop-scrim`**. **No literals** — composes **PrimerColors**, **LayoutTokens**, **ShadowTokens**.
- **DialogTokens** — Primer **`Dialog`**: spacing + header/body typography (**`title-font-size`** …), **`width-small`** … **`width-xlarge`** (**React **`Dialog.tsx`** **`widthMap`**, audited vs primer-tokens **`overlay.size`**), **`overlay-enter-duration`** (**`LayoutTokens.duration-200`**), **`overlay-sheet-enter-duration`** (**`LayoutTokens.duration-250`** — side/bottom sheets in later PRs). Full audit table in [`tokens.slint`](slint/tokens.slint).
- **UnderlineNavTokens** — **`UnderlineNav`** **`LoadingCounter`** skeleton (**`UnderlineTabbedInterface.module.css`**) size and opacity pulse period; composes **LayoutTokens** only.
- **TreeViewTokens** — [**`TreeView.module.css`**](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/TreeView/TreeView.module.css) row chrome (hover, `aria-current`, focus ring, level lines, toggle sizes) + [**`treeView.json5`**](https://github.com/primer/primer-tokens/blob/main/src/tokens/component/treeView.json5) leading-visual rest color; composes **PrimerColors**, **ButtonTokens**, **LayoutTokens** only (audit table in [`tokens.slint`](slint/tokens.slint)). API and interaction-state plan: [`TreeView/API.md`](TreeView/API.md).

Views and chrome typically import **PrimerColors** (and **LayoutTokens** when needed). **Button** / **IconButton** use **ButtonTokens** and **PrimerColors**. **Banner** uses **BannerTokens**, **LayoutTokens**, and **PrimerColors** (for default body text). **Label** uses **LabelTokens** and **LayoutTokens**; variant mapping is implemented in [`Label/logic.slint`](slint/Label/logic.slint). **LabelGroup** composes **Label** + **LayoutTokens** only (see [`LabelGroup/label-group.slint`](slint/LabelGroup/label-group.slint)). **DataTable** composes **LayoutTokens** + **PrimerColors** (see [`DataTable/data-table.slint`](slint/DataTable/data-table.slint)); body cells use **Label**, **Image**, and **IconButton** for **`label`** / **`iconText`** / **`action`** kinds. **`TableContainer`** composes **Button** for the title/toolbar (see [`DataTable/table-container.slint`](slint/DataTable/table-container.slint)). Sort icons use `@image-url` assets under `app/src/assets/16px/`. **Banner** action rows use embedded **Button** (**ButtonTokens** / **PrimerColors**), not new literals in `Banner`.

## UnderlineNav

Horizontal tabs with a model (`[UnderlineNavItem]`), controlled `selected-index`, and `item-activated(index)`. Primer-aligned **`UnderlineItem`**-style layout (not **`Button`**); upstream reference: **`UnderlineTabbedInterface`**, **`UnderlineItem`**, **`underlineNav`** tokens (parity notes: [`UnderlineNav/UPSTREAM_MATRIX.md`](slint/UnderlineNav/UPSTREAM_MATRIX.md)). Each tab is a **`TouchArea`** + padded label row, optional **16px** leading icon (**`LayoutTokens.base-size-8`** gap to the label, matching upstream), **`PrimerColors.bgColor-neutral-muted`** hover, **`PrimerColors.fgColor-accent`** **2px** focus ring (**`FocusScope`** + keyboard), **2px** **`PrimerColors.accent-underline`** on the selected item, and a full-width **muted** rule on the wrapper. The responsive **“More”** overflow menu is **not** implemented; narrow hosts should **`clip`** or widen the container — tabs are not horizontally scrollable. Non-empty **`UnderlineNavItem.counter`** shows **`CounterLabel`** (**`use-primer-scheme`** + **`CounterLabelVariant.secondary`**); with **`loading-counters`**, those slots use the **`LoadingCounter`** skeleton (**`UnderlineNavTokens`**) and an opacity pulse.

| Property | Notes |
| -------- | ----- |
| `variant` | **`UnderlineNavVariant.inset`** (default): **`LayoutTokens.stack-padding-normal`** horizontal padding on the tab row. **`flush`**: no horizontal padding. |
| `loading-counters` | When true, tabs whose **`counter`** is non-empty show the animated skeleton instead of **`CounterLabel`**, avoiding layout jump while counts load. |
| `accessible-name` | When non-empty, sets the landmark label for **`AccessibleRole.tab-list`**. |
| `item-activated(index)` | Fired when a tab is activated (click, **Space** / **Enter** when focused). |
| `UnderlineNavItem.has-leading-icon` / `leading-icon` | When **`has-leading-icon`**, the tab shows **`leading-icon`** before the label; icon color tracks label **fg** (selected / muted / disabled). |
| `UnderlineNavItem.counter` | Empty hides the trailing pill; non-empty shows **`CounterLabel`** or the loading skeleton (see **`loading-counters`**). |

The item row uses **`LayoutTokens.control-xlarge-size`** (48px) **min-height** to align with **`.UnderlineWrapper`**. When tabs are wider than the nav, the row does not scroll horizontally; use a wider host or **`clip: true`** on a parent if overflow should be hidden.

## TreeView

**Status:** Design-only in this repo slice — **`PrimerTreeView`** UI is not exported from [`primer.slint`](slint/primer.slint) yet. Use this section for the agreed **Slint architecture**, **token ownership**, and **v1 limitations** before wiring the gallery page.

| Topic | Where it lives |
| -------- | ----- |
| **Flat model vs nested components** | [`TreeView/API.md`](TreeView/API.md) — **visible-row / flat model** is the supported approach; nested Slint children mirror React only for small demos. |
| **React prop → Slint mapping** (`TreeViewProps`, row fields, `SubTreeState`, `secondaryActions`) | Same file — tables for root, item row, subtree, and trailing actions. |
| **Interaction states** (`hover`, `current`, `:focus-visible`, skeleton) | [`TreeView/API.md`](TreeView/API.md) **Interaction states** + [`.cursor/skills/primer-slint-interaction-states/SKILL.md`](../../.cursor/skills/primer-slint-interaction-states/SKILL.md) — **`FocusScope`** → **`TouchArea`** → row **`Rectangle`**, **`focus-on-click: false`**, named **`states [ ]`** branches (**disabled/skeleton** first, then **current × pointer**, then focus ring from **`FocusScope.has-focus`**). |
| **Tokens** | **`TreeViewTokens`** in [`tokens.slint`](slint/tokens.slint) — no duplicate hex; row hover reuses **`PrimerColors.table-row-bgColor-hover`** (`--control-transparent-bgColor-hover`), current row reuses **`ButtonTokens.color-action-list-item-default-selected-bg`**. |

**v1 non-goals (call out in reviews):** roving tabindex, typeahead, and live-region announcements are not expected to match React **TreeView** on first ship; keyboard parity is partial via **`FocusScope`** and host shortcuts. **`containIntrinsicSize`** has no Slint equivalent — large lists use bounded **`ListView`** / scaled demos (see port plan).

## Avatar

Slint port of [@primer/react `Avatar`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Avatar/Avatar.tsx) and [`Avatar.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Avatar/Avatar.module.css). Tokens: primer-tokens [`component/avatar.json5`](https://github.com/primer/primer-tokens/blob/main/src/tokens/component/avatar.json5) (**`bgColor`**) + **`borderColor.translucent`** for the ring. **Responsive `size`** (`narrow` / `regular` / `wide`) from upstream is not ported — use a fixed **`size`** per layout.

| Property | Type | Notes |
| -------- | ---- | ----- |
| `source` | `image` | **`in-out`**; bound to inner **`Image`** (maps to React **`src`**). |
| `size` | `length` | Width and height; default **20px** (**`DEFAULT_AVATAR_SIZE`**). Use **`LayoutTokens.avatar-size-header`** (34px) for **`AppHeader`** / **`UserMenu`** profile. |
| `square` | `bool` | Default **`false`** (circle). When **`true`**, corner radius matches **`clamp(4px, size − 24px, borderRadius-medium)`**. |
| `alt-text` | `string` | Maps to React **`alt`** (Slint **`Image`** **`accessible-label`**); empty when decorative only. |

**Imports:** **`AvatarTokens`** + **`LayoutTokens`** from [`tokens.slint`](slint/tokens.slint) or the [`primer.slint`](slint/primer.slint) barrel. Gallery: **`pnpm dev:gallery`** → **Feedback**.

## Banner

Slint port of [@primer/react `Banner`](https://primer.style/product/components/banner/) — source of truth for behavior and variants: [`Banner.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Banner/Banner.tsx) and [`Banner.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Banner/Banner.module.css). Color literals in **PrimerColors** are aligned with **primer-tokens** functional color (`bgColor.json5`, `borderColor.json5`, `fgColor.json5`) and **primer-ui-react** legacy theme fallbacks (`light.ts` / `dark.ts`).

| Property                  | Type            | Notes                                                                                                                                                                                                                                                             |
| ------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                   | `string`        | Shown unless `hide-title` is true; still used for accessibility when hidden.                                                                                                                                                                                      |
| `description`             | `string`        | Main body: full plain text if **`description-emphasis`** is empty; otherwise the segment after the bold emphasis (often starts with a space). App views own all product copy.                                                                                     |
| `description-emphasis`    | `string`        | Default empty. When set, first segment is bold via **`StyledText`** / `@markdown` (`**…**` is fixed in `.slint`; only this string is interpolated).                                                                                                               |
| `subtitle`                | `string`        | Optional secondary line (`text-body-size-small`, muted). **Slint extension** — React Banner has `title` + `description` only; use for extra context in this app.                                                                                                  |
| `variant`                 | `BannerVariant` | `critical`, `info`, `success`, `upsell`, `warning`.                                                                                                                                                                                                               |
| `layout`                  | `BannerLayout`  | `default` (8px padding) or `compact` (4px).                                                                                                                                                                                                                       |
| `flush`                   | `bool`          | Top/bottom border only; no side border or corner radius on the outer box.                                                                                                                                                                                         |
| `hide-title`              | `bool`          | Hides the title line. Leading icon is **16px** only when there are **no** actions; **20px** when actions are present (matches `Banner.module.css` `[data-title-hidden]` rules).                                                                                   |
| `has-custom-leading-icon` | `bool`          | With `leading-icon`, replaces the default icon for **`info`** and **`upsell`** only (matches React `leadingVisual`).                                                                                                                                              |
| `leading-icon`            | `image`         | Custom leading visual when allowed.                                                                                                                                                                                                                               |
| `dismissible`             | `bool`          | Shows a dismiss control tinted like the variant icon.                                                                                                                                                                                                             |
| `dismiss`                 | `callback`      | Invoked when the user activates dismiss.                                                                                                                                                                                                                          |
| `primary-action-label`    | `string`        | Non-empty shows a primary **Button**; empty hides it.                                                                                                                                                                                                             |
| `primary-action-variant`  | `ButtonVariant` | Defaults to **`default`** (matches React `Banner.PrimaryAction`). Use **`primary`** for a green CTA.                                                                                                                                                              |
| `action-size`             | `Size`          | `small` / `medium` / `large` for both action buttons.                                                                                                                                                                                                             |
| `primary-action`          | `callback`      | Primary button click.                                                                                                                                                                                                                                             |
| `secondary-action-label`  | `string`        | Non-empty shows a secondary **Button** (`invisible`, like React `Banner.SecondaryAction`).                                                                                                                                                                        |
| `secondary-action`        | `callback`      | Secondary button click.                                                                                                                                                                                                                                           |
| `actions-trailing`        | `bool`          | Default **`false`**. When **`true`** and at least one action label is set, primary/secondary render in the **top** row after the text column (text stretches; buttons stay right of the copy). When **`false`**, actions stay in a row **below** the description. |

Default leading icons live under `app/src/assets/16px/` (`stop`, `info`, `circle-check`, `alert`, and `x` for dismiss). Examples: **standalone gallery** (`pnpm dev:gallery` from the repo root — **Feedback** group).

**Actions layout:** Default: actions in a row **below** the description (`column-gap` = `LayoutTokens.banner-actions-gap`). Set **`actions-trailing: true`** for a full-width notice row (GitHub-style review banners). React **`actionsLayout`** (`default` / `inline` / `stacked`) is only partially reflected (stacked = default; trailing ≈ inline end).

## Label

Slint port of the Primer product [**Label**](https://primer.style/product/components/label/) (short metadata / status chips). Upstream: [`Label.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Label/Label.tsx) and [`Label.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Label/Label.module.css).

**Not** [**CounterLabel**](slint/CounterLabel/counter-label.slint): **CounterLabel** is the small **numeric** pill embedded in **Button** (filled row). **Label** is a **standalone** chip with the full Primer variant set and **`LabelSize`** (`small` / `large`).

| Property  | Type           | Notes                                                                                                                        |
| --------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `text`    | `string`       | Chip text; empty hides the control (same pattern as **CounterLabel**).                                                       |
| `variant` | `LabelVariant` | `default`, `primary`, `secondary`, `accent`, `success`, `attention`, `severe`, `danger`, `done`, `sponsors` (matches React). |
| `size`    | `LabelSize`    | `small` or `large` (React `small` / `large`; distinct from **Button** `Size`).                                               |

Colors resolve through **`LabelTokens`**; **`Label/logic.slint`** maps `variant` → token. Examples: **standalone gallery** (`pnpm dev:gallery` — **Feedback** group).

## LabelGroup

Slint port of Primer [**LabelGroup**](https://primer.style/product/components/label-group/) (horizontal group of **Label** chips). Upstream: [`LabelGroup.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/LabelGroup/LabelGroup.tsx) and [`LabelGroup.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/LabelGroup/LabelGroup.module.css).

**MVP:** Model-driven row with **`LayoutTokens.label-group-gap`** and per-item min-height via **`control-small-size`**. **Not** in this port yet: React **`visibleChildCount`** (`auto` / number), **`overflowStyle`** (`inline` / `overlay`), **+N more** control, overlay, or `IntersectionObserver` truncation.

| Property | Type               | Notes                                                                            |
| -------- | ------------------ | -------------------------------------------------------------------------------- |
| `items`  | `[LabelGroupItem]` | Each entry has `text`, `variant` (**`LabelVariant`**), `size` (**`LabelSize`**). |

Examples: **standalone gallery** (`pnpm dev:gallery` — **Feedback** group).

## ToggleSwitch

Slint port of Primer [**ToggleSwitch**](https://primer.style/product/components/toggle-switch/). Upstream: primer-ui-react **`ToggleSwitch.tsx`** + **`ToggleSwitch.module.css`** — track/knob/icons, **`Spinner`** when **`loading`**, row order matches React DOM (**loading → status → switch** for `start`, reversed visual for `end`). Motion: **`LayoutTokens.duration-80`** (**80ms**) + **`cubic-bezier(0.5, 1, 0.89, 1)`** on knob **`x`**, icon **`x`**, track **`background`** / **`border-color`**, knob **`border-color`**; **`0ms`** when **`disabled`** or **`reduce-motion`** (upstream **`@media (prefers-reduced-motion)`**). The standalone gallery wires **`reduce-motion`** from **`GalleryAccessibility.reduce-ui-motion`** (header **Full/Reduced** switch).

| Property | Type | Notes |
| -------- | ---- | ----- |
| `checked` | `bool` (in-out) | On/off state. |
| `disabled` | `bool` | Disables interaction and dims status text. |
| `loading` | `bool` | Shows **`Spinner`** (`Size.small`); toggling is blocked (**`accepts-interaction`**). |
| `size` | **`ToggleSwitchSize`** | **`small`** (48×24) or **`medium`** (64×32). |
| `status-label-position` | **`ToggleSwitchStatusLabelPosition`** | **`start`** \| **`end`** — On/Off text before or after the switch. |
| `button-label-on` / `button-label-off` | `string` | Default **On** / **Off**. |
| `reduce-motion` | `bool` | When **`true`**, motion duration is **0ms** (map from host **`prefers-reduced-motion`** when exposed). |
| `changed` | `callback (bool)` | New **`checked`** after a toggle. |
| `clicked` | `callback` | Fires after each successful toggle (same click as **`changed`**). |

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`ToggleSwitch`**, **`ToggleSwitchSize`**, **`ToggleSwitchStatusLabelPosition`**.

### Storybook vs gallery (features)

| Upstream story (`ToggleSwitch.features`) | Gallery (`Forms` → ToggleSwitch) |
| -------------------------------------- | -------------------------------- |
| `Default` / `Playground` | Default row + **Checked** / **Disabled** rows |
| `Small` | **Label end** column uses **`ToggleSwitchSize.small`** |
| `WithCaption` | Compose label/caption in the view (not built into **`ToggleSwitch`**). |
| `Loading` | **Loading** column |
| `LabelEnd` | **Label end** column |
| `WithCustomLabels` | **Custom labels** row (**Active** / **Inactive**) |
| `Loading` + `LabelEnd` | **Loading, label end** row |
| `Controlled` | Bind **`checked <=>`** in the host (gallery **Default**). |
| `prefers-reduced-motion` (CSS) | Gallery header **Full/Reduced** → **`reduce-motion`** on **`ToggleSwitch`** demos (**Forms** + **Dialog** playground). |

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group; **Dialog** → Playground uses **`ToggleSwitchSize.small`** for header/footer toggles).

## Checkbox

Slint port of Primer [**Checkbox**](https://primer.style/product/components/checkbox/). Upstream: primer-ui-react **`Checkbox.module.css`** — 16px control, **`borderRadius-small`**, **`control-checked-bgColor-rest`** when checked or indeterminate (accent fill + on-emphasis mark).

| Property        | Type            | Notes                                                                       |
| --------------- | --------------- | --------------------------------------------------------------------------- |
| `checked`       | `bool` (in-out) | Checked state.                                                              |
| `indeterminate` | `bool` (in-out) | When true, shows a dash; first click sets checked and clears indeterminate. |
| `disabled`      | `bool`          | Disables interaction; uses disabled palette (including checked-disabled).   |
| `label`         | `string`        | Optional label; hit target covers the row.                                  |
| `toggled`       | `callback`      | Fires after a click changes state.                                          |

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`Checkbox`**, **`Icons`** (as needed).

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group).

## Radio

Slint port of Primer [**Radio**](https://primer.style/product/components/radio/) — 16px circular control; checked mapping follows **`Radio.module.css`** (inner fill = **`control.checked.fgColor`**, ring = **`control.checked.bgColor`**). Upstream: **`Radio.tsx`**, shared **`Checkbox/shared.module.css`** input chrome.

| Property      | Type            | Notes                                                                                         |
| ------------- | --------------- | --------------------------------------------------------------------------------------------- |
| `checked`     | `bool` (in-out) | Selected state; in mutex groups bind **`checked: selected == value`**.                         |
| `disabled`    | `bool`          | Disables interaction; uses disabled palette (checked + unchecked).                           |
| `interactive` | `bool`          | When **`false`**, display-only (parent handles activation).                                   |
| `value`       | `string`        | Mutex key for grouped radios.                                                                 |
| `label`       | `string`        | Optional label; hit target covers the row.                                                    |
| `toggled`     | `callback`      | Fires after the user activates the control (click / keyboard).                                |

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`Radio`**, **`RadioTokens`** (optional direct token access).

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group).

## CheckboxGroup

Slint port of Primer [**CheckboxGroup**](https://primer.style/product/components/checkbox-group/) (fieldset-style stack). Upstream: React compound API (legend, caption, validation).

| Property                | Type                   | Notes                                                                                                             |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `label`                 | `string`               | Legend; hidden when **`label-visually-hidden`** is true (no separate a11y tree in Slint).                         |
| `label-visually-hidden` | `bool`                 | Skips visible legend; **`caption`** can still show.                                                               |
| `caption`               | `string`               | Muted helper below the legend.                                                                                    |
| `required`              | `bool`                 | Shows a red **`*`** next to the legend when visible.                                                              |
| `disabled`              | `bool`                 | Dims the checkbox stack; set each child **`Checkbox`**’s **`disabled`** to the same value so toggling is blocked. |
| `validation-status`     | **`ValidationStatus`** | **`none`**, **`error`**, **`success`** (same enum as **Select**).                                                 |
| `validation-message`    | `string`               | Shown when **`validation-status`** is not **`none`**.                                                             |
| `children`              | `@children`            | Place **`Checkbox`** instances here.                                                                              |

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`CheckboxGroup`**, **`Checkbox`**, **`ValidationStatus`**, **`Icons`**.

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group).

## RadioGroup

Slint port of Primer [**RadioGroup**](https://primer.style/product/components/radio-group/) (fieldset-style stack for mutually exclusive options). Same shell as **CheckboxGroup**: legend, caption, validation row. **Slint does not wire children automatically** — bind **`checked`** / **`toggled`** on each **`Radio`** from shared page state (same pattern as the gallery mutex demo).

| Property                | Type                   | Notes                                                                                                          |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `label`                 | `string`               | Legend; hidden when **`label-visually-hidden`** is true.                                                       |
| `label-visually-hidden` | `bool`                 | Skips visible legend; **`caption`** can still show.                                                          |
| `caption`               | `string`               | Muted helper below the legend.                                                                                 |
| `required`              | `bool`                 | Shows a red **`*`** next to the legend when visible.                                                           |
| `disabled`              | `bool`                 | Dims the radio stack; set each child **`Radio`**’s **`disabled`** to the same value so activation is blocked. |
| `validation-status`     | **`ValidationStatus`** | **`none`**, **`error`**, **`success`** (same enum as **Select**).                                              |
| `validation-message`    | `string`               | Shown when **`validation-status`** is not **`none`**.                                                        |
| `children`              | `@children`            | Place **`Radio`** instances here.                                                                              |

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`RadioGroup`**, **`Radio`**, **`ValidationStatus`**, **`Icons`**.

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group).

## DataTable

Slint port of Primer [**DataTable**](https://primer.style/product/components/data-table/) (tabular rows driven by a column model). Upstream: [`DataTable.tsx`](https://github.com/primer/react/blob/main/packages/react/src/DataTable/DataTable.tsx) and [`Table.module.css`](https://github.com/primer/react/blob/main/packages/react/src/DataTable/Table.module.css).

**In this port:** **`DataTableCell`** per column (`text` plain body copy, **`label`** renders **Label**, **`iconText`** renders a leading **16px** icon + body text, **`action`** renders a small **IconButton**); **`sort-toggled`** reports header activation; **`row-clicked(row-id)`** fires when a body row is activated outside an **`action`** **IconButton**; **`row-action(row-id, column-id, action-id)`** fires when an **`action`** cell’s button is clicked (**`action-id`** is that cell’s **`text`**). See **standalone gallery** (`pnpm dev:gallery` — **Data** group). **`TableContainer`** (title, subtitle, table-level actions) is in [`DataTable/table-container.slint`](slint/DataTable/table-container.slint). **Not** ported: **`TableSkeleton`**, responsive column widths, rich `renderCell` content, or horizontal scroll parity.

**Layout:** The header row and each body row are separate [`HorizontalLayout`](https://docs.slint.dev/) slices, so flex is solved **per row** unless you tie columns together. This component keeps header and body aligned by applying the **same per-column** `horizontal-stretch`, `min-width`, `preferred-width` (zero for flexible columns so width is not driven by text), and `max-width` on the cells in column _i_, following the same idea as Slint’s material [`StandardTableView`](https://github.com/slint-ui/slint/blob/master/internal/compiler/widgets/material/tableview.slint) (`TableViewColumn` / `TableViewCell`). A single [`GridLayout`](https://docs.slint.dev/) would share column tracks across all rows, but **nested repeaters inside `GridLayout`** (`for each row: Row { for each cell: … }`) have triggered an interpreter panic in `slint-ui`, so that approach is not used here until the toolchain supports it. See the Slint reference for **HorizontalLayout** and **GridLayout** behavior (stretch, min/preferred/max width).

| Property           | Type                         | Notes                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`          | `[DataTableColumn]`          | `header`, `id`, `sortable`, `align` (**`DataTableCellAlign`**), `row-header`, **`cell-kind`** (**`DataTableCellKind`** — `text`, **`label`**, **`icon_text`**, or **`action`**), `horizontal-stretch`, `min-width`, `width` (fixed column when ≥ 1px), `monospace` (per-column font; ignored for **`label`** / **`action`** body cells).      |
| `rows`             | `[DataTableRow]`             | `id`, **`cells`**: `[DataTableCell]` — `kind` + **`text`** + **`icon`** (Slint **`image`**); when `kind == label`, also **`label-variant`** / **`label-size`**. For **`action`**, **`text`** is the **`action-id`** passed to **`row-action`**. For kinds that do not render **`icon`**, use any placeholder. Same column order as `columns`. |
| `cell-padding`     | **`DataTableCellPadding`**   | `condensed` / `normal` / `spacious`.                                                                                                                                                                                                                                                                                                          |
| `sorted-column-id` | `string`                     | Active sort column id; empty if none.                                                                                                                                                                                                                                                                                                         |
| `sort-direction`   | **`DataTableSortDirection`** | `none`, `ascending`, `descending`.                                                                                                                                                                                                                                                                                                            |
| `external-sorting` | `bool`                       | Parity with React; table does not reorder rows internally — parent owns data.                                                                                                                                                                                                                                                                 |
| `sort-toggled`     | `callback`                   | `(column-id, direction)` when a sortable header is activated.                                                                                                                                                                                                                                                                                 |
| `row-action`       | `callback`                   | `(row-id, column-id, action-id)` when an **`action`** cell’s **IconButton** is clicked (`action-id` = that cell’s **`text`**).                                                                                                                                                                                                                |
| `row-clicked`      | `callback`                   | `(row-id)` when a body row is clicked; **`action`** **IconButton** clicks invoke **`row-action`** only (nested **`TouchArea`**).                                                                                                                                                                                                              |

**Imports for views (building `columns` / `rows`):** Prefer [`primer.slint`](slint/primer.slint) — **`DataTable`**, **`DataTableCell`**, **`DataTableCellKind`**, **`DataTableColumn`**, **`DataTableRow`**, **`DataTableCellAlign`**, **`DataTableCellPadding`**, **`DataTableSortDirection`**, **`TableContainer`**, **`LabelVariant`**, **`LabelSize`**, **`ButtonVariant`**, **`Size`**. For **`TableContainer`** toolbar buttons, set **`primary-action-label`** / **`secondary-action-label`** and **`action-size`** as needed. Each **`DataTableCell`** needs **`icon`**: use **`@image-url(...)`** for **`iconText`** and **`action`** cells; for **`text`** / **`label`** cells pass any placeholder **`image`** (it is not drawn). **`DataTable`** instantiates **Label** and **IconButton** internally — import those only if you use them outside the table.

Examples: **standalone gallery** (`pnpm dev:gallery` — **Data** group).

## TableContainer

Wraps a **`DataTable`** (or other content) with optional **title**, **subtitle**, and up to two **table-level** actions (`primary-action` / `secondary-action`, same pattern as **Banner** actions). Upstream: Primer **DataTable** header region.

| Property                 | Type                | Notes                                                 |
| ------------------------ | ------------------- | ----------------------------------------------------- |
| `title`                  | `string`            | Empty hides the title line.                           |
| `subtitle`               | `string`            | Empty hides; `text-body-size-small`, muted.           |
| `primary-action-label`   | `string`            | Non-empty shows a primary **Button** on the toolbar.  |
| `secondary-action-label` | `string`            | Non-empty shows a secondary **Button** (`invisible`). |
| `primary-action-variant` | **`ButtonVariant`** | Toolbar primary button variant.                       |
| `action-size`            | **`Size`**          | Default **`small`** for table toolbar density.        |
| `primary-action`         | `callback`          |                                                       |
| `secondary-action`       | `callback`          |                                                       |
| `children`               | `@children`         | Place **`DataTable`** here.                           |

Horizontal padding matches **`LayoutTokens.stack-padding-normal`**. When there is no title, subtitle, or action labels, the header block is omitted and the **child** is laid out directly.

## ActionList

**ActionList** ([`ActionList/action-list.slint`](slint/ActionList/action-list.slint)) is the vertical list shell aligned with Primer [**ActionList**](https://primer.style/product/components/action-list/), following Storybook **ActionList → Features**. **`[ActionListLine] lines`** mixes **`ActionListLineKind.row`** (rendered with **`ActionListRow`** — **`ActionListRowVariant`** default | danger, **`ActionListDescriptionLayout`** none | inline | block, inactive via **`inactive-text`**, loading via **`show-trailing-loading`**, optional leading avatar/icon and trailing icon), **`item_divider`** (explicit hairline + block margins; use **`ActionListItemDivider`** standalone if needed), **`list_visual_heading`**, **`custom_heading`**, and **`section_heading`**. **`show-dividers`** adds seam hairlines between consecutive rows only. **`selection-mode`** (**`ActionListSelectionMode`**: none | single | multiple) wires **`selected-index`** / **`multi-selected`** and per-row single-check vs multi-checkbox columns. **`item-activated(int)`** fires for activated row indices (skips inactive, loading, and disabled rows). **`ActionListRow`** is also used outside the shell (**NavList**, **SelectPanel** single list).

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`ActionList`**, **`ActionListRow`**, **`ActionListItemDivider`**, **`ActionListLine`**, **`ActionListLineKind`**, **`ActionListRowVariant`**, **`ActionListDescriptionLayout`**, **`ActionListSelectionMode`**, **`ActionListTokens`**, **`LayoutTokens`**.

Examples: **standalone gallery** (`pnpm dev:gallery` — **Action list** group).

## FilteredActionList

Slint host for Primer **FilteredActionList** (filter field, header hairline, optional **select-all** row, scrollable **`ActionList`**). Upstream: [`FilteredActionList.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/FilteredActionList/FilteredActionList.tsx), [`FilteredActionList.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/FilteredActionList/FilteredActionList.module.css), loaders in the same folder. This component is **not** **`SelectPanel`**: it embeds **`ActionList`** with parent-built **`[ActionListLine]`** and parent-owned filtering (bind **`filter-text`** and react to **`filter-changed`**). **`loading`** + **`FilteredActionListLoadingKind`** (**`input`**, **`body_spinner`**, **`body_skeleton`**) mirror upstream loading modes; **`show-message`** + **`message-*`** replace the list after loading (upstream message wins). Empty filtered state uses **`empty-title`** / **`empty-message`** when **`lines`** is empty. **v1 non-goals** (virtualization, roving tabindex / `aria-activedescendant`, custom render nodes) are listed in [`FilteredActionList/VARIANT_MATRIX.md`](slint/FilteredActionList/VARIANT_MATRIX.md).

| Property | Notes |
| -------- | ----- |
| `filter-text` | **in-out** `string`; wired to **`PrimerTextInput`**; **`filter-changed(string)`** on edit. |
| `placeholder`, `disabled` | Filter field chrome. |
| `lines` | **`[ActionListLine]`** — parent narrows by query. |
| `show-dividers`, `selection-mode`, `selected-index`, `multi-selected`, `item-activated` | Passed through to **`ActionList`**. |
| `body-region-height` | Scroll region height; default **`SelectPanelTokens.list-max-height-default`**. |
| `loading`, `loading-kind`, `loading-message` | **`FilteredActionListLoadingKind`**: spinner in input, centered body spinner (**`SelectPanelLoading`**), or geometric skeleton rows (**`FilteredActionListTokens`**). |
| `select-all-visible`, `select-all-checked`, `select-all-indeterminate`, `select-all-label-*`, `select-all-changed` | Optional strip above the list. |
| `show-message`, `message-title`, `message-description` | Body message region when not loading. |
| `empty-title`, `empty-message` | Centered empty copy when **`lines`** is empty and **`show-message`** is false. |

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`FilteredActionList`**, **`FilteredActionListLoadingKind`**, **`ActionListLine`**, **`ActionListSelectionMode`**, **`FilteredActionListTokens`**, **`SelectPanelTokens`** (default list height), **`LayoutTokens`**, **`PrimerColors`**.

Examples: **standalone gallery** (`pnpm dev:gallery` — **Action list** group, **FilteredActionList** subsections).

## Select

**Select** ([`Select/select.slint`](slint/Select/select.slint)) is the trigger + **ContextMenu** picker pattern using **`SelectOption`** (`value`, `label`, `enabled`).

**SelectPanel** ([`SelectPanel/select-panel.slint`](slint/SelectPanel/select-panel.slint)) matches Primer’s product [**SelectPanel**](https://primer.style/product/components/select-panel/) as panel **body** content: title, subtitle, filter (**`PrimerTextInput`** + **`Icons.search`**), divider, scrollable list, optional **footer** (`show-footer` + **`@children`** below the list, Primer **`.Footer`** top border + padding). **`loading-message`**, empty **`empty-title`** + **`empty-message`**, and **`focused-index`** (accent in **single** and **multi** rows) mirror upstream states. **`SelectPanelMode.single`** uses **`SelectOption`** + **`ActionListRow`**; **`SelectPanelMode.multi`** uses **`SelectPanelItem`** + **`SelectPanelRow`** with **`multi-selected`** (`[bool]`; row `ix` checked when `ix < multi-selected.length && multi-selected[ix]`, same rule as **`ActionList.multi-selected`**) and **`multi-item-activated(ix)`** so the parent (or Node bridge) updates selection — parity with **`ActionList`**’s **`multi-selected`** / **`item-activated`**. Parent-filtered **`item-count`** matches **Select**’s **`option-count`**. Compose with **`AnchoredOverlay`** (see [`anchored-popupwindow.md`](../slint-gallery/views/anchored-popupwindow.md)).

The **project board** import dialog uses **`SelectPanel`** in **`SelectPanelMode.single`** ([`project-board-list.slint`](../../app/src/ui/views/project-board-list.slint)) for repository search + pick.

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`AnchoredOverlay`**, **`AnchoredOverlaySide`**, **`AnchoredOverlayAlign`**, **`ModalOverlay`**, **`OverlayPanelChrome`**, **`Dialog`**, **`DialogHeader`**, **`DialogBody`**, **`DialogFooter`**, **`DialogWidthPreset`**, **`DialogHeightPreset`**, **`DialogAlignPreset`**, **`DialogPositionPreset`**, **`DialogNarrowPositionPreset`**, **`SelectPanel`**, **`SelectPanelMode`**, **`SelectPanelItem`**, **`Select`**, **`SelectOption`**, **`ValidationStatus`**, **`DialogTokens`** (optional **`OverlayTokens`** for overrides).

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group, AnchoredOverlay + SelectPanel multi demo with footer); **Project board** import dialog (**`SelectPanel`** `single`).

## Dialog (Dialog)

**Slint exports:** The public modal shell is **`Dialog`** ([`Dialog/dialog.slint`](slint/Dialog/dialog.slint)) with composable parts **`DialogHeader`**, **`StandardDialogHeader`**, **`DialogBody`**, and **`DialogFooter`**. There is no separate all-in-one **`Dialog`** component. For parity with Primer [Dialog](https://primer.style/react/storybook/?path=/story/components-dialog--default) **Default** and **Playground** stories, assemble **`StandardDialogHeader`** (title, optional subtitle, **`Icons.x`**), **`DialogBody`**, and **`DialogFooter`** as **`@children`** of **`Dialog`**.

**Behavior and motion** follow **`Dialog.module.css`**: **`ModalOverlay`** (backdrop scrim + **`OverlayPanelChrome`**) with centered modals using **`scaleFade`** (**`DialogTokens.overlay-enter-duration`**); side sheets (**`position-preset`** **left** / **right**) use slide-in motion (**`DialogTokens.overlay-sheet-enter-duration`**); narrow viewport uses **`DialogNarrowPositionPreset`** for **bottom** / **fullscreen** / **center** paths. Presets in [`Dialog/types.slint`](slint/Dialog/types.slint) mirror React **`widthMap`** / **`heightMap`**. **`ModalOverlay`** uses a **`FocusScope`**; **focus trap** and React ref semantics are **best-effort** in Slint. **`DialogFooterAutoFocus`** (**`PR11`**) aligns with React footer **`autoFocus`**. See **`DialogFooter`** for default vs custom actions (**`use-default-actions`**) and PR10/PR11 footer options.

Visual checks: **`pnpm dev:gallery`** → **Dialogs** group, **[`gallery-dialogs-page.slint`](../slint-gallery/ui/views/gallery-dialogs-page.slint)** (see also **[`gallery-dialog-instances.slint`](../slint-gallery/ui/views/gallery-dialog-instances.slint)** for modal trees).

### Storybook parity (React exports → gallery)

Upstream inventory: **[`Dialog.stories.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Dialog/Dialog.stories.tsx)**, **[`Dialog.features.stories.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Dialog/Dialog.features.stories.tsx)**, **[`Dialog.dev.stories.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Dialog/Dialog.dev.stories.tsx)**. Use this table when reviewing Slint coverage row-by-row.

| Storybook story | Group | Slint / gallery (`Dialogs` page) |
| ----------------| ------| ----------------------------------|
| `Default` | Components/Dialog | **Default** — nested inner dialog, long body, default footer |
| `Playground` | Components/Dialog | **Playground** — width, height, title, subtitle, header/footer toggles |
| `WithCustomRenderers` | Dialog/Features | **WithCustomRenderers** — **`Dialog`** + **`DialogHeader`** / **`DialogBody`** / **`DialogFooter`** |
| `WithDirectSubcomponents` | Dialog/Features | **WithDirectSubcomponents** — slot-style parts; custom footer row |
| `StressTest` | Dialog/Features | **StressTest** — long chrome, many footer actions, **`narrow-position-preset`**, nested dialog |
| `ReproMultistepDialogWithConditionalFooter` | Dialog/Features | **ReproMultistepDialogWithConditionalFooter** — conditional footer buttons |
| `BottomSheetNarrow` | Dialog/Features | **Narrow viewport** — **`DialogNarrowPositionPreset.bottom`** |
| `FullScreenNarrow` | Dialog/Features | **Narrow viewport** — **`fullscreen`** |
| `SideSheet` | Dialog/Features | **Side sheet** — **`position-preset`** **left** / **right** |
| `ReturnFocusRef` | Dialog/Features | Not a dedicated gallery block yet (`returnFocusRef`) |
| `NewIssues` | Dialog/Features | Not a dedicated gallery block yet (`initialFocusRef`, body **`ActionList`**) |
| `RetainsFocusTrapWithDynamicContent` | Dialog/Features | **RetainsFocusTrapWithDynamicContent** — dynamic footer visibility |
| `LoadingFooterButtons` | Dialog/Features | **LoadingFooterButtons** — **`footer-*-loading`**, **`footer-auto-focus`** |
| `LoadingCustomFooterButtonsCould` | Dialog/Features | **LoadingCustomFooterButtonsCould** — custom **`DialogFooter`** + loading |
| `AlignTop` | Dialog/Features | **Align top / bottom** — **`DialogAlignPreset.top`** |
| `AlignBottom` | Dialog/Features | **Align top / bottom** — **`DialogAlignPreset.bottom`** |
| `WithCss` | Dialog/Dev | Not ported (CSS hooks / class names) |
| `WithScrollBody` | Dialog/Dev | Not ported (host scroll / layout parameter) |

**PR10** (**`footer-button-layout`** **`wrap`** \| **`scroll`**, **`footer-has-*-button`**, **`footer-extra-*-label`**) and **PR11** (**`footer-*-loading`**) are exercised in **StressTest**, **ReproMultistep…**, **RetainsFocusTrap…**, and **Loading** blocks above.

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`Dialog`**, **`DialogHeader`**, **`StandardDialogHeader`**, **`DialogBody`**, **`DialogFooter`**, **`DialogFooterButtonLayout`**, **`DialogFooterAutoFocus`**, **`DialogWidthPreset`**, **`DialogHeightPreset`**, **`DialogAlignPreset`**, **`DialogPositionPreset`**, **`DialogNarrowPositionPreset`**, **`DialogFillMode`**, **`AppWindow`** (from [`tokens.slint`](slint/tokens.slint)) for viewport size, **`DialogTokens`** / **`PrimerColors`** only if building custom regions outside **`Dialog`**.

## PrimerTextInput

Slint port of Primer [**TextInput**](https://primer.style/product/components/text-input/) field chrome (label, validation, leading/trailing visuals, loading, character limit, optional trailing clear). Upstream **Features** stories are mapped in the **Forms** gallery (**PrimerTextInput** section, including a compact #1–18 checklist and an autocomplete disclaimer). **Full-width fields:** set **`horizontal-stretch: 1`** on the instance (or an explicit **`width`**); there is no `block` property — layout is Slint-native.

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`PrimerTextInput`**, **`ValidationStatus`**, **`Size`**, **`TextInputLoaderPosition`**, **`Icons`** (when using **`leading-visual`**, **`trailing-visual`**, **`has-trailing-action`**, or loading slot visuals).

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group).

## StateLabel

Slint port of Primer [**StateLabel**](https://primer.style/product/components/state-label/) (issue/PR/alert status pill). Upstream: [`StateLabel.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/StateLabel/StateLabel.tsx), [`StateLabel.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/StateLabel/StateLabel.module.css).

| Property | Type | Notes |
| -------- | ---- | ----- |
| `text` | `string` | Label text; empty hides the control (same pattern as **Label**). |
| `status` | **`StateLabelStatus`** | Drives emphasis **bg** / **border** and Octicon (**`Open`** / **`Closed`** omit the icon). |
| `size` | **`StateLabelSize`** | **`unset`** (default) omits React **`size`**; **`small`** / **`medium`** set padding + typography. |
| `variant` | **`StateLabelVariant`** | Deprecated upstream; used **only** when **`size`** is **`unset`** (**`small`** → small chip). |

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`StateLabel`**, **`StateLabelStatus`**, **`StateLabelSize`**, **`StateLabelVariant`**, **`Icons`**. Optional **`StateLabelTokens`** / **`PrimerColors`** from [`tokens.slint`](slint/tokens.slint).

Examples: **standalone gallery** (`pnpm dev:gallery` — **State label** group).

## Pagination

Primer **DataTable** toolbar parity is split: **`Pagination`** renders only the **Previous** / **Next** / page-number strip (upstream [`Pagination/Pagination.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Pagination/Pagination.tsx)). **`PaginationLogic`** ([`slint/Pagination/pagination-logic.slint`](slint/Pagination/pagination-logic.slint)) matches [`Pagination/model.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Pagination/model.tsx). For a full **range label + bordered footer + nav** (like the React DataTable footer), compose **`Pagination`** inside a padded row and compute **`page-count`**, range strings, and 1-based **`current-page`** from your **`total-count`**, **`page-size`**, and **0-based** `page-index` (see gallery **`GalleryPaginationRangeFooter`** and app **`ProjectBoardPaginationFooter`** / **`TimeReportingPickerPaginationFooter`**).

**`Pagination`**

| Property                 | Type       | Notes                                                                                                   |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| `page-count`             | `int`      | Total pages (derive from totals with **`PaginationLogic.page_count_from_total`** when you have item counts). |
| `current-page`           | `int`      | **1-based** current page (controlled **`in-out`**; clamps when **`page-count`** changes).              |
| `show-pages`             | `bool`     | When false, only **Previous** / **Next** (no numeric page strip).                                       |
| `margin-page-count`      | `int`      | Pages fixed at the start/end of the strip (default **1**; matches React `buildPaginationModel` margin). |
| `surrounding-page-count` | `int`      | Pages on each side of the current page (default **2**).                                                 |
| `page-changed`           | `callback` | Argument is **0-based** page index (same as **0-based** `page-index` on your bridge when you compose a table footer). |

**Imports for views:** [`primer.slint`](slint/primer.slint) — **`Pagination`**. Import **`PaginationLogic`** from [`slint/Pagination/pagination-logic.slint`](slint/Pagination/pagination-logic.slint) when you page by **`total-count`** / **`page-size`**. Compose **below** **`TableContainer`** / **`DataTable`** when the parent slices **`rows`** and owns **0-based** **`page-index`**.

Examples: **standalone gallery** (`pnpm dev:gallery` — **Data** group).

## Caution:

This is a simplified version of the Primer Design System. It's incomplete, it's certainly
not 100% accurate, but for now it's a good starting point for Github like apps and more.

### A simplified version of Microsoft's Primer Design System written in Slint.

Contributors and AI assistants: see [`AGENTS.md`](AGENTS.md) (reference and verification), [`component-imports.md`](component-imports.md) (which globals to use), and [`.cursor/skills/primer-port-orchestrator/SKILL.md`](../../.cursor/skills/primer-port-orchestrator/SKILL.md) (full porting procedure).

**Gallery app:** `pnpm dev:gallery` from the repository root (see [`slint-gallery/gallery/README.md`](../slint-gallery/gallery/README.md)). **`AnchoredOverlay` / `PopupWindow`:** [`anchored-popupwindow.md`](../slint-gallery/gallery/anchored-popupwindow.md) (parent-relative coords, vertical flip, app references).

The Primer Design System is used to build the GitHub UI. It's open source (MIT) and
specified in detail.

## Resources

- [Primer Design System](https://primer.style/design/system)

## Design tokens

[`tokens.slint`](tokens.slint) defines the globals below (and `Size`). They are re-exported from [`primer.slint`](primer.slint) for discovery.

- **LayoutTokens** — control sizes, padding, typography lengths, border radius (no light/dark literals). **`base-text-weight-normal`** (400) for muted body / dialog subtitle weight. **ActionList** row metrics: `action-list-item-min-height`, `action-list-item-padding-block`, `action-list-item-min-height-large`, `action-list-item-padding-block-large`. **ActionList** item divider vertical spacing matches [`ActionList.module.css`](https://github.com/primer/react/blob/main/packages/react/src/ActionList/ActionList.module.css) `.Divider`: `action-list-item-divider-margin-block-start` (= `--base-size-8` − `--borderWidth-thin` via `button-content-gap` − `table-border-width`), `action-list-item-divider-margin-block-end` (= `--base-size-8` / `button-content-gap`). Banner spacing and icon metrics: `banner-padding-default`, `banner-padding-compact`, `banner-icon-size-default` (20px leading icon, matches `Banner.module.css` `.BannerIcon svg`), `banner-icon-size-title-hidden` (16px when `hide-title` and no actions), `banner-icon-container-padding`, `base-text-weight-semibold`, `banner-actions-gap` (12px, matches `Banner.module.css` action `column-gap`), `banner-dismiss-margin-when-actions` (2px when actions + dismiss). **Label** metrics: `label-height-small` / `label-height-large`, `label-padding-inline-*`, `label-border-width`, `label-border-radius-pill`. **LabelGroup** row gap: `label-group-gap` (`LabelGroup.module.css`); item row min-height reuses `control-small-size` (28px). **DataTable** / `Table.module.css`: `table-cell-padding-block-*` / `table-cell-padding-inline-*` (condensed | normal | spacious), `table-cell-edge-inset-inline`, `table-border-radius`, `table-border-width`.
- **PrimerColors** — semantic surface colors (fg, bg, border, link, overlay, drop-shadow, etc.) resolved from `Palette.color-scheme`. Banner-related functional colors include muted surfaces and borders for accent, success, attention, danger, and done/upsell (e.g. `bgColor-accent-muted`, `borderColor-danger-muted`, `fgColor-danger`, `fgColor-attention`, `fgColor-upsell` / `bgColor-upsell-muted`, plus existing `fgColor-success` for success banners). **DataTable** row hover: `table-row-bgColor-hover` (aligns with `Table.module.css` `--control-transparent-bgColor-hover`; shared semantics with action-list hover in **ButtonTokens**).
- **ButtonTokens** — `color-btn-*`, `button-*`, action-list hover backgrounds, disabled fg, icon-button tints, and filled-button shadow colors (`button-shadow-*-light` / `button-shadow-*-dark`); composes from **PrimerColors** where possible.
- **BannerTokens** — per-variant aliases matching [`Banner.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Banner/Banner.module.css) `--banner-bgColor`, `--banner-borderColor`, and `--banner-icon-fgColor` (`banner-bgColor-critical` … `banner-icon-fgColor-warning`). **No literals** — only **PrimerColors** `out` bindings.
- **LabelTokens** — per-variant `label-fg-*` and `label-border-*` for the product [**Label**](https://primer.style/product/components/label/) chip, aligned with [`Label.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Label/Label.module.css). **No literals** — only **PrimerColors** `out` bindings.
- **ActionListTokens** — [**ActionList**](https://primer.style/product/components/action-list/) row and section-heading colors (danger, inactive, link, filled heading, divider, loading label fg): **only** **PrimerColors** + **ButtonTokens** `out` bindings. PR2 audit comment block in [`tokens.slint`](tokens.slint) above **`ActionListTokens`**.
- **CheckboxTokens** — unchecked rest/hover/pressed, checked/indeterminate accent fill + hover/active, and disabled colors; composes from **PrimerColors** and **ButtonTokens**. **`LayoutTokens.checkbox-border-radius`** matches Primer **`borderRadius-small`** (2px).
- **OverlayTokens** — **`backdrop-scrim`** for modal-style dimmers; **`panel-background`** / **`panel-border`** / **`panel-border-width`** / **`panel-border-radius`**, **`panel-elevation-shadow`** (`shadow.floating.small` via **ShadowTokens**) for floating panels (**AnchoredOverlay** and **ModalOverlay** use the panel tokens; **AnchoredOverlay** optional **`panel-fill`** / **`panel-border-*`** / **`panel-elevation-shadow`** mirror these when overriding shell chrome — defaults unchanged). **ModalOverlay** also uses **`backdrop-scrim`**. **No literals** — composes **PrimerColors**, **LayoutTokens**, **ShadowTokens**.
- **DialogTokens** — Primer **`Dialog`**: spacing + header/body typography (**`title-font-size`** …), **`width-small`** … **`width-xlarge`** (**React **`Dialog.tsx`** **`widthMap`**, audited vs primer-tokens **`overlay.size`**), **`overlay-enter-duration`** (**`LayoutTokens.duration-200`**), **`overlay-sheet-enter-duration`** (**`LayoutTokens.duration-250`** — side/bottom sheets in later PRs). Full audit table in [`tokens.slint`](tokens.slint).

Views and chrome typically import **PrimerColors** (and **LayoutTokens** when needed). **Button** / **IconButton** use **ButtonTokens** and **PrimerColors**. **Banner** uses **BannerTokens**, **LayoutTokens**, and **PrimerColors** (for default body text). **Label** uses **LabelTokens** and **LayoutTokens**; variant mapping is implemented in [`Label/logic.slint`](Label/logic.slint). **LabelGroup** composes **Label** + **LayoutTokens** only (see [`LabelGroup/label-group.slint`](LabelGroup/label-group.slint)). **DataTable** composes **LayoutTokens** + **PrimerColors** (see [`DataTable/data-table.slint`](DataTable/data-table.slint)); body cells use **Label**, **Image**, and **IconButton** for **`label`** / **`iconText`** / **`action`** kinds. **`TableContainer`** composes **Button** for the title/toolbar (see [`DataTable/table-container.slint`](DataTable/table-container.slint)). Sort icons use `@image-url` assets under `app/src/assets/16px/`. **Banner** action rows use embedded **Button** (**ButtonTokens** / **PrimerColors**), not new literals in `Banner`.

## UnderlineNav

Horizontal tabs with a model (`[UnderlineNavItem]`), controlled `selected-index`, and `item-activated(index)`. Each item is an **invisible** **`Button`** (`Size.medium`) plus optional **label typography overrides** on **`Button`** for selected vs muted labels; a 2px accent sits under the active item and a full-width muted rule sits under the row. See **primer-ui-react** `UnderlineTabbedInterface` for upstream spacing/typography targets.

| Property                   | Notes                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`                  | **`UnderlineNavVariant.inset`** (default): `LayoutTokens.stack-padding-normal` inline padding on the item row. **`flush`**: no inline padding (matches `[data-variant='flush']`). |
| `loading-counters`         | When true, items with a non-empty **`counter`** show a fixed skeleton (24×16, pill) instead of the numeric **`Button`** counter, avoiding layout jump while counts load.          |
| `accessible-name`          | Landmark label for **`AccessibleRole.tab-list`** (matches React `aria-label`). Role is always **`tab-list`**; leave empty when no name is needed.                                 |
| `UnderlineNavItem.counter` | Empty hides the counter; non-empty shows **`Button`** counter pill unless **`loading-counters`** is true.                                                                         |

The item row uses **`LayoutTokens.control-xlarge-size`** (48px) **min-height** to align with **`.UnderlineWrapper`**. When tabs are wider than the nav, the row is inside a horizontal **`Flickable`** (`viewport-width` = content width) so users can scroll sideways (Primer overflow behavior; scroll arrows **F16** not implemented).

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

**Not** [**CounterLabel**](CounterLabel/counter-label.slint): **CounterLabel** is the small **numeric** pill embedded in **Button** (filled row). **Label** is a **standalone** chip with the full Primer variant set and **`LabelSize`** (`small` / `large`).

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

## Checkbox

Slint port of Primer [**Checkbox**](https://primer.style/product/components/checkbox/). Upstream: primer-ui-react **`Checkbox.module.css`** — 16px control, **`borderRadius-small`**, **`control-checked-bgColor-rest`** when checked or indeterminate (accent fill + on-emphasis mark).

| Property        | Type            | Notes                                                                       |
| --------------- | --------------- | --------------------------------------------------------------------------- |
| `checked`       | `bool` (in-out) | Checked state.                                                              |
| `indeterminate` | `bool` (in-out) | When true, shows a dash; first click sets checked and clears indeterminate. |
| `disabled`      | `bool`          | Disables interaction; uses disabled palette (including checked-disabled).   |
| `label`         | `string`        | Optional label; hit target covers the row.                                  |
| `toggled`       | `callback`      | Fires after a click changes state.                                          |

**Imports for views:** [`primer.slint`](primer.slint) — **`Checkbox`**, **`Icons`** (as needed).

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

**Imports for views:** [`primer.slint`](primer.slint) — **`CheckboxGroup`**, **`Checkbox`**, **`ValidationStatus`**, **`Icons`**.

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group).

## DataTable

Slint port of Primer [**DataTable**](https://primer.style/product/components/data-table/) (tabular rows driven by a column model). Upstream: [`DataTable.tsx`](https://github.com/primer/react/blob/main/packages/react/src/DataTable/DataTable.tsx) and [`Table.module.css`](https://github.com/primer/react/blob/main/packages/react/src/DataTable/Table.module.css).

**In this port:** **`DataTableCell`** per column (`text` plain body copy, **`label`** renders **Label**, **`iconText`** renders a leading **16px** icon + body text, **`action`** renders a small **IconButton**); **`sort-toggled`** reports header activation; **`row-clicked(row-id)`** fires when a body row is activated outside an **`action`** **IconButton**; **`row-action(row-id, column-id, action-id)`** fires when an **`action`** cell’s button is clicked (**`action-id`** is that cell’s **`text`**). See **standalone gallery** (`pnpm dev:gallery` — **Data** group). **`TableContainer`** (title, subtitle, table-level actions) is in [`DataTable/table-container.slint`](DataTable/table-container.slint). **Not** ported: **`TableSkeleton`**, responsive column widths, rich `renderCell` content, or horizontal scroll parity.

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

**Imports for views (building `columns` / `rows`):** Prefer [`primer.slint`](primer.slint) — **`DataTable`**, **`DataTableCell`**, **`DataTableCellKind`**, **`DataTableColumn`**, **`DataTableRow`**, **`DataTableCellAlign`**, **`DataTableCellPadding`**, **`DataTableSortDirection`**, **`TableContainer`**, **`LabelVariant`**, **`LabelSize`**, **`ButtonVariant`**, **`Size`**. For **`TableContainer`** toolbar buttons, set **`primary-action-label`** / **`secondary-action-label`** and **`action-size`** as needed. Each **`DataTableCell`** needs **`icon`**: use **`@image-url(...)`** for **`iconText`** and **`action`** cells; for **`text`** / **`label`** cells pass any placeholder **`image`** (it is not drawn). **`DataTable`** instantiates **Label** and **IconButton** internally — import those only if you use them outside the table.

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

**ActionList** ([`ActionList/action-list.slint`](ActionList/action-list.slint)) is the vertical list shell aligned with Primer [**ActionList**](https://primer.style/product/components/action-list/), following Storybook **ActionList → Features**. **`[ActionListLine] lines`** mixes **`ActionListLineKind.row`** (rendered with **`ActionListRow`** — **`ActionListRowVariant`** default | danger, **`ActionListDescriptionLayout`** none | inline | block, inactive via **`inactive-text`**, loading via **`show-trailing-loading`**, optional leading avatar/icon and trailing icon), **`item_divider`** (explicit hairline + block margins; use **`ActionListItemDivider`** standalone if needed), **`list_visual_heading`**, **`custom_heading`**, and **`section_heading`**. **`show-dividers`** adds seam hairlines between consecutive rows only. **`selection-mode`** (**`ActionListSelectionMode`**: none | single | multiple) wires **`selected-index`** / **`multi-selected`** and per-row single-check vs multi-checkbox columns. **`item-activated(int)`** fires for activated row indices (skips inactive, loading, and disabled rows). **`ActionListRow`** is also used outside the shell (**NavList**, **SelectPanel** single list).

**Imports for views:** [`primer.slint`](primer.slint) — **`ActionList`**, **`ActionListRow`**, **`ActionListItemDivider`**, **`ActionListLine`**, **`ActionListLineKind`**, **`ActionListRowVariant`**, **`ActionListDescriptionLayout`**, **`ActionListSelectionMode`**, **`ActionListTokens`**, **`LayoutTokens`**.

Examples: **standalone gallery** (`pnpm dev:gallery` — **Action list** group).

## Select

**Select** ([`Select/select.slint`](Select/select.slint)) is the trigger + **ContextMenu** picker pattern using **`SelectOption`** (`value`, `label`, `enabled`).

**SelectPanel** ([`SelectPanel/select-panel.slint`](SelectPanel/select-panel.slint)) matches Primer’s product [**SelectPanel**](https://primer.style/product/components/select-panel/) as panel **body** content: title, subtitle, filter (**`PrimerTextInput`** + **`Icons.search`**), divider, scrollable list, optional **footer** (`show-footer` + **`@children`** below the list, Primer **`.Footer`** top border + padding). **`loading-message`**, empty **`empty-title`** + **`empty-message`**, and **`focused-index`** (accent in **single** and **multi** rows) mirror upstream states. **`SelectPanelMode.single`** uses **`SelectOption`** + **`ActionListRow`**; **`SelectPanelMode.multi`** uses **`SelectPanelItem`** + **`SelectPanelRow`** and **`multi-checked-mask`** (bit `ix` checked, rows `0..30`). Parent-filtered **`item-count`** matches **Select**’s **`option-count`**. Compose with **`AnchoredOverlay`** (see [`anchored-popupwindow.md`](../slint-gallery/gallery/anchored-popupwindow.md)).

The **project board** import dialog uses **`SelectPanel`** in **`SelectPanelMode.single`** ([`project-board-list.slint`](../../app/src/ui/views/project-board-list.slint)) for repository search + pick.

**Imports for views:** [`primer.slint`](primer.slint) — **`AnchoredOverlay`**, **`AnchoredOverlaySide`**, **`AnchoredOverlayAlign`**, **`ModalOverlay`**, **`OverlayPanelChrome`**, **`Dialog`**, **`DialogWidthPreset`**, **`DialogHeightPreset`**, **`DialogAlignPreset`**, **`DialogPositionPreset`**, **`DialogNarrowPositionPreset`**, **`SelectPanel`**, **`SelectPanelMode`**, **`SelectPanelItem`**, **`Select`**, **`SelectOption`**, **`ValidationStatus`**, **`DialogTokens`** (optional **`OverlayTokens`** for overrides).

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group, AnchoredOverlay + SelectPanel multi demo with footer); **Project board** import dialog (**`SelectPanel`** `single`).

## Dialog

Primer [**Dialog**](https://primer.style/react/storybook/?path=/story/components-dialog--default) default shell: **`ModalOverlay`** full-viewport **`PopupWindow`** with backdrop scrim + **`OverlayPanelChrome`**, **enter motion** aligned with **`Dialog.module.css`**: centered modals use backdrop fade + **`Overlay--motion-scaleFade`** (**`DialogTokens.overlay-enter-duration`**); side sheets (**`position-preset`** **left** / **right**) use **`Overlay--motion-slideInLeft`** / **`slideInRight`** (**`DialogTokens.overlay-sheet-enter-duration`**) with full viewport height, asymmetric panel radii, **no footer**, and a body region that fills the space below the header (scroll when content overflows). **Narrow viewport** (**`AppWindow.window-width ≤ DialogTokens.narrow-max-width`** **767px** or **`narrow-layout: true`**): **`narrow-position-preset`** chooses **`bottom`** (**`Overlay--motion-slideUp`**, **`overlay-sheet-enter-duration`**), **`fullscreen`** (edge-to-edge **`scaleFade`**), or **`narrow center`** (**`scaleFade`** like regular center). Header (title, optional subtitle, **`Icons.x`** close), scrollable body (**`@children`**); when **`position-preset`** is **`center`**, **`show-footer`** adds the Storybook **Default** three-**`Button`** footer row (compact height when **`height-preset`** is **auto**), except regular **side sheets** still omit the footer. Width presets match React **`widthMap`**; **`height-preset`** (**`DialogHeightPreset`**) matches **`heightMap`** (center mode); **`align-preset`** (**`DialogAlignPreset`**) applies when **`position-preset`** is **`center`** (**`DialogTokens.align-viewport-edge-inset`**). See **Dialogs** gallery — **Default**, **Playground**, **Align**, **Side sheet**, **Narrow viewport**.

**Imports for views:** [`primer.slint`](primer.slint) — **`Dialog`**, **`DialogWidthPreset`**, **`DialogHeightPreset`**, **`DialogAlignPreset`**, **`DialogPositionPreset`**, **`DialogNarrowPositionPreset`**, **`AppWindow`** (from [`tokens.slint`](tokens.slint)) for viewport size, **`DialogTokens`** / **`PrimerColors`** only if building custom regions outside **`Dialog`**.

## PrimerTextInput

Slint port of Primer [**TextInput**](https://primer.style/product/components/text-input/) field chrome (label, validation, leading/trailing visuals, loading, character limit, optional trailing clear). Upstream **Features** stories are mapped in the **Forms** gallery (**PrimerTextInput** section, including a compact #1–18 checklist and an autocomplete disclaimer).

**Imports for views:** [`primer.slint`](primer.slint) — **`PrimerTextInput`**, **`ValidationStatus`**, **`Size`**, **`TextInputLoaderPosition`**, **`Icons`** (when using **`leading-visual`**, **`trailing-visual`**, **`has-trailing-action`**, or loading slot visuals).

Examples: **standalone gallery** (`pnpm dev:gallery` — **Forms** group).

## Pagination

Table footer pagination aligned with Primer **DataTable** toolbar **`Pagination`**. Upstream: [`DataTable/Pagination.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/DataTable/Pagination.tsx) and [`Pagination/model.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Pagination/model.tsx).

| Property                 | Type       | Notes                                                                                                   |
| ------------------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| `total-count`            | `int`      | Total items (same semantics as React `totalCount`).                                                     |
| `page-size`              | `int`      | Items per page (default **25**).                                                                        |
| `page-index`             | `int`      | **0-based** current page index (controlled; parent updates after `page-changed`).                       |
| `show-pages`             | `bool`     | When false, only **Previous** / **Next** (no numeric page strip).                                       |
| `margin-page-count`      | `int`      | Pages fixed at the start/end of the strip (default **1**; matches React `buildPaginationModel` margin). |
| `surrounding-page-count` | `int`      | Pages on each side of the current page (default **2**).                                                 |
| `page-changed`           | `callback` | `(new-page-index)` **0-based** index to select.                                                         |

**Imports for views:** Prefer [`primer.slint`](primer.slint) — **`Pagination`**. Compose it **below** **`TableContainer`** / **`DataTable`** when paging row models in the parent (parent slices **`rows`** and updates **`page-index`**).

Examples: **standalone gallery** (`pnpm dev:gallery` — **Data** group).

## Caution:

This is a simplified version of the Primer Design System. It's incomplete, it's certainly
not 100% accurate, but for now it's a good starting point for Github like apps and more.

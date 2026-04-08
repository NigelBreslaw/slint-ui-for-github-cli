### A simplified version of Microsoft's Primer Design System written in Slint.

Contributors and AI assistants: see [`AGENTS.md`](AGENTS.md) for upstream references, token layers, and a suggested PR workflow when adding components.

The Primer Design System is used to build the GitHub UI. It's open source (MIT) and
specified in detail.

## Resources

- [Primer Design System](https://primer.style/design/system)

## Design tokens

[`tokens.slint`](tokens.slint) defines the globals below (and `Size`). They are re-exported from [`primer.slint`](primer.slint) for discovery.

- **LayoutTokens** — control sizes, padding, typography lengths, border radius (no light/dark literals). Banner spacing and icon metrics: `banner-padding-default`, `banner-padding-compact`, `banner-icon-size-default`, `banner-icon-size-title-hidden`, `banner-icon-container-padding`, `base-text-weight-semibold`, `banner-actions-gap` (12px, matches `Banner.module.css` action `column-gap`), `banner-dismiss-margin-when-actions` (2px when actions + dismiss).
- **PrimerColors** — semantic surface colors (fg, bg, border, link, overlay, drop-shadow, etc.) resolved from `Palette.color-scheme`. Banner-related functional colors include muted surfaces and borders for accent, success, attention, danger, and done/upsell (e.g. `bgColor-accent-muted`, `borderColor-danger-muted`, `fgColor-danger`, `fgColor-attention`, `fgColor-upsell` / `bgColor-upsell-muted`, plus existing `fgColor-success` for success banners).
- **ButtonTokens** — `color-btn-*`, `button-*`, action-list hover backgrounds, disabled fg, icon-button tints, and filled-button shadow colors; composes from **PrimerColors** where possible.
- **BannerTokens** — per-variant aliases matching [`Banner.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Banner/Banner.module.css) `--banner-bgColor`, `--banner-borderColor`, and `--banner-icon-fgColor` (`banner-bgColor-critical` … `banner-icon-fgColor-warning`). **No literals** — only **PrimerColors** `out` bindings.

Views and chrome typically import **PrimerColors** (and **LayoutTokens** when needed). **Button** / **IconButton** use **ButtonTokens** and **PrimerColors**. **Banner** uses **BannerTokens**, **LayoutTokens**, and **PrimerColors** (for default body text). Action rows use embedded **Button** (**ButtonTokens** / **PrimerColors**), not new literals in `Banner`.

## Banner

Slint port of [@primer/react `Banner`](https://primer.style/product/components/banner/) — source of truth for behavior and variants: [`Banner.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Banner/Banner.tsx) and [`Banner.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/Banner/Banner.module.css). Color literals in **PrimerColors** are aligned with **primer-tokens** functional color (`bgColor.json5`, `borderColor.json5`, `fgColor.json5`) and **primer-ui-react** legacy theme fallbacks (`light.ts` / `dark.ts`).

| Property                  | Type            | Notes                                                                                                                |
| ------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `title`                   | `string`        | Shown unless `hide-title` is true; still used for accessibility when hidden.                                         |
| `description`             | `string`        | Body copy.                                                                                                           |
| `variant`                 | `BannerVariant` | `critical`, `info`, `success`, `upsell`, `warning`.                                                                  |
| `layout`                  | `BannerLayout`  | `default` (8px padding) or `compact` (4px).                                                                          |
| `flush`                   | `bool`          | Top/bottom border only; no side border or corner radius on the outer box.                                            |
| `hide-title`              | `bool`          | Hides the title line; smaller leading icon (16px vs 20px).                                                           |
| `has-custom-leading-icon` | `bool`          | With `leading-icon`, replaces the default icon for **`info`** and **`upsell`** only (matches React `leadingVisual`). |
| `leading-icon`            | `image`         | Custom leading visual when allowed.                                                                                  |
| `dismissible`             | `bool`          | Shows a dismiss control tinted like the variant icon.                                                                |
| `dismiss`                 | `callback`      | Invoked when the user activates dismiss.                                                                             |
| `primary-action-label`    | `string`        | Non-empty shows a primary **Button**; empty hides it.                                                                |
| `primary-action-variant`  | `ButtonVariant` | Defaults to **`default`** (matches React `Banner.PrimaryAction`). Use **`primary`** for a green CTA.                 |
| `action-size`             | `Size`          | `small` / `medium` / `large` for both action buttons.                                                                |
| `primary-action`          | `callback`      | Primary button click.                                                                                                |
| `secondary-action-label`  | `string`        | Non-empty shows a secondary **Button** (`invisible`, like React `Banner.SecondaryAction`).                           |
| `secondary-action`        | `callback`      | Secondary button click.                                                                                              |

Default leading icons live under `app/src/assets/16px/` (`stop`, `info`, `circle-check`, `alert`, and `x` for dismiss). In-app examples: **Primer gallery** view (sidebar palette icon).

**Actions layout:** Actions render in a row **below** the description inside the content column (`column-gap` = `LayoutTokens.banner-actions-gap`). This matches narrow / stacked behavior from Primer CSS; **`actionsLayout`** (`default` / `inline` / `stacked`) and wide-viewport placement beside the text are **not** ported yet.

## Caution:

This is a simplified version of the Primer Design System. It's incomplete, it's certainly
not 100% accurate, but for now it's a good starting point for Github like apps and more.

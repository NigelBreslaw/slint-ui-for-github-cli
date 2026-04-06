### A simplified version of Microsoft's Primer Design System written in Slint.

Contributors and AI assistants: see [`AGENTS.md`](AGENTS.md) for upstream references, token layers, and a suggested PR workflow when adding components.

The Primer Design System is used to build the GitHub UI. It's open source (MIT) and
specified in detail.

## Resources

- [Primer Design System](https://primer.style/design/system)

## Design tokens

[`tokens.slint`](tokens.slint) defines three globals (and `Size`). They are re-exported from [`primer.slint`](primer.slint) for discovery.

- **LayoutTokens** — control sizes, padding, typography lengths, border radius (no light/dark literals).
- **PrimerColors** — semantic surface colors (fg, bg, border, link, overlay, drop-shadow, etc.) resolved from `Palette.color-scheme`.
- **ButtonTokens** — `color-btn-*`, `button-*`, action-list hover backgrounds, disabled fg, icon-button tints, and filled-button shadow colors; a few values compose from **PrimerColors**.

Views and chrome typically import **PrimerColors** (and **LayoutTokens** when needed). **Button** / **IconButton** pull **ButtonTokens** and **PrimerColors** from `tokens.slint`.

## Caution:

This is a simplified version of the Primer Design System. It's incomplete, it's certainly
not 100% accurate, but for now it's a good starting point for Github like apps and more.

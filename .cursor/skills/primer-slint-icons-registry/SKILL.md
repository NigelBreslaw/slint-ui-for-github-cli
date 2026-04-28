---
name: primer-slint-icons-registry
description: >-
  Registers SVG icons for the Primer Slint app via packages/primer-slint/assets/icons.slint
  (Icons global), naming rules, bridge types in slint-interface.ts, and Banner
  icon usage. Use when adding or renaming icons, replacing raw @image-url calls,
  or when the user asks how Primer icons are bundled in this repo.
---

# Primer Slint — icons registry

## Canonical reference

- [`packages/primer-slint/AGENTS.md`](../../../packages/primer-slint/AGENTS.md) — icon registry path; this skill is the full procedure.

## Rules

SVGs are **not** scattered as inline `@image-url("../../assets/…")` across views. Slint only bundles images that appear in the source tree; the **single registry** is [`packages/primer-slint/assets/icons.slint`](../../../packages/primer-slint/assets/icons.slint) (`export global Icons { … }`). Asset files live under [`packages/primer-slint/assets/`](../../../packages/primer-slint/assets/) (e.g. `16px/`, `24px/`).

**Consumption:** `import { Icons } from "../Primer/primer.slint";` (adjust path). Use **`Icons.<property>`** for every `image`. **Do not** add new `@image-url` paths in Primer components or in `app/src/ui/views` / `components` for icons that ship with the app—register first, then use **`Icons.*`**.

**Property naming:** SVG basename without `.svg`, replace each `-` with `_` → Slint identifier (e.g. `sort-desc.svg` → `sort_desc`). **Exceptions:** `git-pull-request.svg` → **`pull_request`**; **`copy.svg`** → **`copy_icon`**. For `24px/gear.svg` vs 16px gear, use **`gear_24`** when the 24px asset is intended.

**TypeScript / Node:** The window exposes **`window.Icons`**. If TS reads `window.Icons.<name>`, extend **`SlintIconsGlobal`** in [`app/src/bridges/node/slint-interface.ts`](../../../app/src/bridges/node/slint-interface.ts).

## Checklist: new icon

1. Add the `.svg` under **`packages/primer-slint/assets/16px/`** or **`24px/`** (match size folder used elsewhere for that glyph).
2. In **`assets/icons.slint`**, add **`out property <image> <name>: @image-url("16px/….svg");`** using the naming rule above.
3. Replace any raw **`@image-url`** for that file with **`Icons.<name>`** and import **`Icons`** from **`primer.slint`** where needed.
4. If Node/TS reads the image from **`window.Icons`**, add the field to **`SlintIconsGlobal`** in **`slint-interface.ts`**.
5. Verify: Slint loads **`app/src/ui/main.slint`**, **`pnpm typecheck`**.

## Banner

**Banner** reads background, border, and icon tint from **`BannerTokens`** (lengths from **`LayoutTokens`**). Leading/dismiss SVGs use **`Icons.*`**, not ad hoc paths. Use **`PrimerColors`** inside **Banner** only for non-banner semantics (e.g. default title/description fg). Product copy belongs in **views**; **Banner** exposes structure only.

## Related

- [`primer-port-slint-research`](../primer-port-slint-research/SKILL.md) — other in-repo patterns.

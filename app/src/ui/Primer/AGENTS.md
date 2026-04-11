# Primer Slint — guide for contributors and AI assistants

This document stands alone in the repo. Past chats or Cursor plan files are not a reliable archive; use **local upstream clones** and the files linked below when porting or extending components.

## Purpose

- **Audience:** Humans and AI assistants adding **Primer-style** UI in Slint under `app/src/ui/Primer/`.
- **Goals:** Stay close to Primer naming and layering, avoid duplicating color literals across globals, keep `export global` declaration order valid for Slint, and ship changes in reviewable steps.

## Upstream references (consult before inventing values)

| Location                              | Role                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/Users/nigelb/slint/primer-tokens`   | **primer-tokens** — functional and component token JSON5 (e.g. `src/tokens/functional/color/control.json5`, `functional/size/size.json5`, `component/button.json5`, shadow tokens). Use for **token names**, **layering** (base → functional → component), and **hex / hsla / hsv** as the source of truth when porting.                                 |
| `/Users/nigelb/slint/primer-ui-react` | **primer-ui-react** — how tokens become **CSS custom properties** in `*.module.css` (e.g. `internal/components/TextInputWrapper.module.css`, `Select/Select.module.css`, `Banner/Banner.module.css`, button-related styles). Use for **interaction states**, **sizes**, **validation**, and **variable names**, even when this Slint port is simplified. |

Also see the public docs: [Primer Design System](https://primer.style/design/system).

## In-repo architecture

- **Barrel:** [`primer.slint`](primer.slint) re-exports Primer components plus `LayoutTokens`, `PrimerColors`, `ButtonTokens`, `BannerTokens`, `LabelTokens`, and `Size`.
- **Tokens:** [`tokens.slint`](tokens.slint) holds **several `export global` singletons** in one file. **Order matters:** declare `PrimerColors` before `ButtonTokens`, **`BannerTokens`**, and **`LabelTokens`**, because **`ButtonTokens`**, **`BannerTokens`**, and **`LabelTokens`** reference `PrimerColors` `out` properties only (no literals in `BannerTokens` / `LabelTokens`).

### Token layers (current convention)

| Global           | Contents                                                                                                                                                                                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LayoutTokens** | Lengths, typography sizes, line heights, control dimensions, padding, icon sizes, border radius, **banner** padding/icon sizes, **banner** action row gap (`banner-actions-gap`) and dismiss offset when actions exist (`banner-dismiss-margin-when-actions`). **No** light/dark color scheme.                  |
| **PrimerColors** | Semantic surfaces (fg, bg, border, link, overlay, shadows, success validation, control-trigger shadows, **banner functional colors** — accent/success/attention/danger/done-upsell muted surfaces and fg, etc.) plus **shared primitives** so each **hex / rgb / hsv** appears **once** when values are shared. |
| **ButtonTokens** | GitHub-style `color-btn-*` and resolved `button-*` colors, action-list tints, icon-button tints, filled-button shadow colors. Composes from **`PrimerColors` `out` properties** where possible instead of repeating literals.                                                                                   |
| **BannerTokens** | Per-variant `banner-bgColor-*`, `banner-borderColor-*`, `banner-icon-fgColor-*` aligned with `Banner.module.css` `[data-variant]`. **Composes only from `PrimerColors`** — banner surfaces must not introduce new hex in the component file.                                                                    |
| **LabelTokens**  | Per-variant `label-fg-*`, `label-border-*` for product **Label** chips, aligned with `Label.module.css` `[data-variant]`. **Composes only from `PrimerColors`** — no literals in `LabelTokens`.                                                                                                                      |

**Cross-global rule:** Treat other globals as exposing only their **`out`** bindings to dependents. Do not rely on reading another global’s **private** fields from outside that global.

**Banner rule:** **`Banner`** (and any future banner-like chrome) should read **background, border, and icon tint** from **`BannerTokens`** (and lengths from **`LayoutTokens`**). Use **`PrimerColors`** inside **`Banner`** only for non-banner semantics (e.g. default foreground for title/description text), not for ad hoc variant colors. **Product-specific sentences** (e.g. review-request copy) belong in **views**; **`Banner`** exposes structure only (`title`, `description`, optional **`description-emphasis`** / **`subtitle`**, actions).

```mermaid
flowchart TB
  LT[LayoutTokens]
  PC[PrimerColors]
  BT[ButtonTokens]
  BanT[BannerTokens]
  LabT[LabelTokens]
  LT --> Components[Slint components]
  PC --> Components
  PC --> BT
  PC --> BanT
  PC --> LabT
  BT --> Components
  BanT --> Components
  LabT --> Components
```

## Adding design tokens (checklist)

1. **Naming** — Prefer Primer / CSS-variable families: `fgColor-*`, `bgColor-*`, `borderColor-*`, `control-*`, `button-*`, `shadow-*`, etc.
2. **Reuse first** — Check existing `out` properties on `LayoutTokens`, `PrimerColors`, **`ButtonTokens`**, **`BannerTokens`**, and **`LabelTokens`** before adding literals (e.g. chrome: `bgColor-default`, `borderColor-default`, `fgColor-muted`; buttons: `ButtonTokens` chains; banner surfaces: `BannerTokens` → `PrimerColors`; label chips: `LabelTokens` → `PrimerColors`).
3. **New shared color** — Add **one** private literal (or a small primitive group) under **`PrimerColors`**, expose semantics via **`out`**, then reference from **`ButtonTokens`**, **`BannerTokens`**, **`LabelTokens`**, or components. **Do not** repeat the same hex for the same meaning in multiple globals.
4. **New length / radius / typography** — Prefer **`LayoutTokens`** unless the value is truly one-off and never reused (then a **private** on the component is acceptable).
5. **Scheme** — Where colors depend on theme, follow the existing pattern: `property <ColorScheme> color-scheme: Palette.color-scheme` and `color-scheme == ColorScheme.dark ? *-dark : *-light` (or equivalent) on `out` properties.
6. **Compile** — After token edits, verify Slint loads the app entry (see [Verification](#verification)).

## Adding a new Primer component

1. Find the closest **primer-ui-react** component and the matching **primer-tokens** functional/component files.
2. Add `app/src/ui/Primer/<Name>/` with a clear root `*.slint` (and subfolders if needed).
3. **Imports:**
   - App views / chrome: **`PrimerColors`** and **`LayoutTokens`** (from `tokens.slint` or the `primer.slint` barrel).
   - Controls that use the GitHub button palette or danger/success alignment: **`ButtonTokens`** + **`PrimerColors`** as needed (see [`Buttons/buttons.slint`](Buttons/buttons.slint) and [`Select/select.slint`](Select/select.slint)).
   - **CounterLabel** (pill): [`CounterLabel/counter-label.slint`](CounterLabel/counter-label.slint) — pass explicit colors from **`Button`**, or set **`use-primer-scheme`** with **`CounterLabelVariant`** for standalone **`PrimerColors`** (`bgColor-neutral-emphasis` / `neutral-muted`, **`counter-borderColor`**).
   - **Label** (product metadata chip): **`LabelTokens`** + **`LayoutTokens`** (see [`Label/label.slint`](Label/label.slint), [`Label/logic.slint`](Label/logic.slint)); not the same as **CounterLabel**.
   - **LabelGroup** (row of **Label** chips): **`Label`** + **`LayoutTokens`** only — [`LabelGroup/label-group.slint`](LabelGroup/label-group.slint); no separate color global.
   - **Banner** (and similar product banners): **`BannerTokens`** + **`LayoutTokens`** + **`PrimerColors`** for default text fg (see [`Banner/banner.slint`](Banner/banner.slint)).
4. **Export** new components from [`primer.slint`](primer.slint) when they are part of the public Primer surface for this app.
5. **Docs** — User-facing notes go in [`readme.md`](readme.md). Process, tokens, and PR workflow stay in **this file** (`AGENTS.md`).

## Typical PR sequence for a new component

Split or merge PRs by size; small widgets can combine steps.

| Stage                    | Focus                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PR1 — Spike / API**    | Component shell, properties, callbacks, minimal layout; must compile; PR description lists upstream paths you mirrored.                                 |
| **PR2 — Tokens**         | New `LayoutTokens` / `PrimerColors` / `ButtonTokens` / `BannerTokens` entries; **deduplicate** literals; cite primer-tokens keys or CSS vars in the PR. |
| **PR3 — Visual parity**  | Hover, disabled, focus, validation, sizing, shadows, typography; optional screenshots or Storybook references from primer-ui-react.                     |
| **PR4 — Integration**    | Wire into `main.slint` or a view; TypeScript bridges if needed; avoid unrelated refactors.                                                              |
| **PR5 — Docs / cleanup** | Update `readme.md` or focused comments; remove dead code; update `AGENTS.md` if the process or layers change.                                           |

Trivial components may merge PR1+PR2; large or risky work may split PR3 further.

## Implementation plans and PR breakdown tables

Any **implementation plan** for **Primer** work (or other **multi-PR** UI changes in this repo) must include an **ordered PR breakdown table** so changes can land in reviewable steps. This applies to humans and to AI assistants drafting plans in issues, design docs, or chat.

The table should list **PRs in merge order** and include at least:

| Column         | Contents                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- |
| **PR**         | Sequence number (1, 2, …).                                                                |
| **Title**      | Short, descriptive name.                                                                  |
| **Scope**      | What ships (paths, components, behavior).                                                 |
| **Acceptance** | How to verify (e.g. `pnpm typecheck`, Slint `main.slint` load, gallery or manual checks). |

Call out **dependencies** (e.g. “PR3 must follow PR2”) and **optional merges** (e.g. “PR2+PR3 may be one PR if small”). The **last row** of a plan may be a process-only PR (e.g. updating this `AGENTS.md`) when the plan itself introduces a new rule.

## Verification

From the **monorepo root**:

```bash
pnpm typecheck
```

Slint: load `app/src/ui/main.slint` the same way the app does (e.g. `slint-ui` `loadFile` in `app/src/main.ts`). Fix compile errors before merging token or component changes.

## Limitations

This Slint Primer folder is **incomplete** and not pixel-identical to GitHub’s production CSS. Prefer consistency **within this repo** and traceability to **primer-tokens** / **primer-ui-react** over perfect parity in one pass.

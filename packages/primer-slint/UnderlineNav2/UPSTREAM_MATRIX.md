# UnderlineNav2 — upstream research + variant matrix

Sources: [`primer-ui-react`](file:///Users/nigelb/slint/primer-ui-react) (`UnderlineTabbedInterface.module.css`, `UnderlineNav*`), [`primer-tokens`](file:///Users/nigelb/slint/primer-tokens) `component/underlineNav.json5`, in-repo [`tokens.slint`](../tokens.slint).

**Out of scope for Slint port:** resize-driven **More** button, `ActionList`, `overflowEffect`, `MORE_BTN_WIDTH`, and any Storybook that exists only to exercise that path (listed below).

---

## 1. Upstream files

| Role | Path (under `primer-ui-react`) |
|------|--------------------------------|
| Wrapper + list + item + loading counter CSS | `packages/react/src/internal/components/UnderlineTabbedInterface.module.css` |
| Container + overflow logic (More menu — **not ported**) | `packages/react/src/UnderlineNav/UnderlineNav.tsx` |
| Tab item | `packages/react/src/UnderlineNav/UnderlineNavItem.tsx` |
| Stories — main | `packages/react/src/UnderlineNav/UnderlineNav.stories.tsx` |
| Stories — features | `packages/react/src/UnderlineNav/UnderlineNav.features.stories.tsx` |
| Stories — examples | `packages/react/src/UnderlineNav/UnderlineNav.examples.stories.tsx` |
| Stories — item playground | `packages/react/src/UnderlineNav/UnderlineNav.Item.stories.tsx` |
| Stories — interactions (**More** — **omit**) | `packages/react/src/UnderlineNav/UnderlineNav.interactions.stories.tsx` |

**primer-tokens:** `src/tokens/component/underlineNav.json5` — `underlineNav.borderColor.active` → coral (same intent as `PrimerColors.accent-underline` in `tokens.slint`).

---

## 2. `UnderlineTabbedInterface.module.css` → `LayoutTokens` / `PrimerColors`

| CSS custom property / literal | Upstream usage | Slint mapping |
|------------------------------|----------------|---------------|
| `--stack-padding-normal` | `.UnderlineWrapper` horizontal padding (inset) | `LayoutTokens.stack-padding-normal` |
| *(unset)* | `data-variant='flush'` removes inline padding | `0` when variant flush |
| `--control-xlarge-size` (48px) | Wrapper min-height; `::after` bottom math | `LayoutTokens.control-xlarge-size` |
| `--borderColor-muted` | Wrapper inset bottom “border” (`box-shadow`) | `PrimerColors.borderColor-muted` |
| `gap: 8px` | `.UnderlineItemList` | `LayoutTokens.base-size-8` (8px gap) |
| `--text-body-size-medium` | Item font-size | `LayoutTokens.text-body-size-medium` |
| `--text-body-lineHeight-medium` | Item line-height | `LayoutTokens.text-body-lineHeight-medium` |
| `--fgColor-default` | Item label color | `PrimerColors.fgColor-default` |
| `--borderRadius-medium` | Item border-radius | `LayoutTokens.borderRadius-medium` |
| `--base-size-8` | Item padding-inline; icon margin-inline-end; counter margin-inline-start | `LayoutTokens.base-size-8` |
| `--base-size-6` | Item padding-block | `LayoutTokens.base-size-6` |
| `--bgColor-neutral-muted` | Item `@media (hover: hover)` hover background | `PrimerColors.bgColor-neutral-muted` |
| `--fgColor-accent` | Item `:focus` / `:focus-visible` inset ring | `PrimerColors.fgColor-accent` |
| `--base-text-weight-semibold` | Selected label; `data-content::before` reserve width | `LayoutTokens.base-text-weight-semibold` |
| `--base-text-weight-normal` | Unselected label (inherit / default) | `LayoutTokens.base-text-weight-normal` |
| `--fgColor-muted` | `[data-component='icon']` | `PrimerColors.fgColor-muted` |
| `--underlineNav-borderColor-active` / fallback | Selected `::after` 2px bar | `PrimerColors.accent-underline` |
| `LinkText` | `forced-colors` for `::after` | Optional / document delta if unsupported |
| `--bgColor-neutral-muted` | `.LoadingCounter` fill | `PrimerColors.bgColor-neutral-muted` |
| `--borderColor-default` | `.LoadingCounter` border | `PrimerColors.borderColor-default` |
| `border-radius: 20px` | `.LoadingCounter` | Literal or shared token if `UnderlineNavTokens` added |
| `width: 1.5rem` / `height: 1rem` | `.LoadingCounter` | 24px × 16px |
| `opacity` keyframes 1 ↔ 0.2 | `.LoadingCounter` | Slint animation on loading pill |

**Gaps / follow-ups:** `data-overflow-measured` overflow toggles on the wrapper are for React measurement — **not** needed without More menu. **Layout shift:** `[data-content]::before` bold reserve — mirror with hidden semibold `Text` or document known delta (per port plan).

---

## 3. Storybook slices

### In scope (mirror in gallery / implementation)

| Story file | Export | Args / notes | Slint / gallery slice |
|------------|--------|--------------|------------------------|
| `UnderlineNav.stories.tsx` | `Default` | Basic tabs, first `aria-current` | Default inset row |
| `UnderlineNav.stories.tsx` | `Playground` | `variant` inset \| flush, `loadingCounters` | Controls row: variant + loading |
| `UnderlineNav.features.stories.tsx` | `Default` | Three items | Same as Default |
| `UnderlineNav.features.stories.tsx` | `WithIcons` | `leadingVisual` + optional `counter` | Icons + counters |
| `UnderlineNav.features.stories.tsx` | `WithCounterLabels` | String counters (`11K`) + icons | CounterLabel-style strings |
| `UnderlineNav.features.stories.tsx` | `CountersLoadingState` | `loadingCounters` | Loading skeleton pills |
| `UnderlineNav.features.stories.tsx` | `VariantFlush` | `variant="flush"` | Flush horizontal padding |
| `UnderlineNav.examples.stories.tsx` | `PullRequestPage`, `ReposPage`, `ProfilePage` | Composed pages | Optional parity demos (same tokens as above) |
| `UnderlineNav.Item.stories.tsx` | `Playground` | Item-level `counter`, `leadingVisual` via controls | Single-item edge cases |

### Omitted (More / overflow only)

| Story file | Export | Reason |
|------------|--------|--------|
| `UnderlineNav.features.stories.tsx` | `OverflowTemplate`, `OverflowOnNarrowScreen` | **More** menu + measurement; Slint: **Flickable** / clip / horizontal scroll |
| `UnderlineNav.interactions.stories.tsx` | `KeyboardNavigation`, `SelectAMenuItem`, `KeepSelectedItemVisible` | All depend on `OverflowTemplate` / **More** |

### Deprecated package (reference only)

`packages/react/src/deprecated/UnderlineNav/*` — not used for new port naming.

---

## 4. Ordered PR / gallery alignment (compact)

| PR | Upstream slice | Slint + gallery |
|----|----------------|-----------------|
| 1 | `Default`, `VariantFlush`, `Playground` (variant), narrow layout without menu | Wrapper, item row, inset/flush, bottom rule, scroll/clip |
| 2 | `CountersLoadingState`, `Playground` (`loadingCounters`), `WithCounterLabels` | `CounterLabel`, loading pill animation, optional `UnderlineNavTokens` |
| 3 | `WithIcons`, Item `Playground` | Leading icon slot + spacing (required in port plan) |

---

## 5. Variant + state matrix (`primer-port-variant-matrix`)

Coverage rule: each cell that differs visually maps to **`PrimerColors` / `LayoutTokens`** or **`states [ ]`**.

| Variant | ColorScheme | disabled | Size (wrapper) | Interaction (rest / hover / pressed) | Focus | Counter / loading | Notes |
|---------|-------------|----------|----------------|----------------------------------------|-------|-------------------|-------|
| inset | light | no | `control-xlarge` min-height | R, H (muted bg); P optional same as H | inset 2px `fgColor-accent` | none | bottom wrapper rule `borderColor-muted` |
| inset | light | yes | same | — | optional skip / dim | — | muted fg; no hover |
| inset | dark | no | same | R, H, P | same ring | none | |
| inset | dark | yes | same | — | | | |
| flush | light | no | same | R, H, P | same | none | wrapper horizontal padding `0` |
| flush | dark | no | same | R, H, P | same | none | |
| inset | light | no | same | R, H | same | numeric / string pill | `CounterLabel` secondary + scheme |
| inset | light | no | same | R, H | same | loading skeleton | muted fill + `borderColor-default` + opacity anim |
| selected | * | no | * | label **semibold**; `::after` **accent-underline** | same as row | optional | unselected: normal weight; transparent bar |
| unselected | * | no | * | normal weight | | | |
| + leading icon | * | no | * | icon `fgColor-muted`; margins `base-size-8` | | optional counter | matches `[data-component='icon']` |

**Pressed:** Upstream hover uses background only; no distinct pressed token in this CSS — Slint may mirror **Button**-like pressed as optional polish or alias hover.

**Accessibility:** Keep `tab` / `tab-list` (or chosen single semantics) consistent with legacy `UnderlineNav` unless deliberately changed.

---

## 6. DOM / data hooks (reference)

- `data-variant='flush'` on wrapper → flush padding.
- `aria-current` / `aria-selected` on item → selected label + underline (Slint: `selected-index` or per-item state).
- `[data-content]`, `[data-component='icon'|'counter']` → layout slots in Slint.

This document satisfies the **upstream-matrix** pass: CSS → tokens, Storybook enumeration with **More** omitted, and full variant matrix for implementation.

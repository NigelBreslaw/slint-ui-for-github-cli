# PrimerTextInput — Phase 1 upstream inventory

Tracing target: **GitHub Primer React `TextInput`** + **`TextInputWrapper`** chrome. Product docs: [TextInput](https://primer.style/product/components/text-input/).

## 1. Canonical upstream paths (primer-ui-react clone)

| Role | Path (under `primer-ui-react/`) |
|------|----------------------------------|
| Main component | `packages/react/src/TextInput/TextInput.tsx` |
| Local styles (counter only) | `packages/react/src/TextInput/TextInput.module.css` |
| Wrapper shell + field chrome | `packages/react/src/internal/components/TextInputWrapper.tsx` |
| Wrapper CSS (sizes, borders, focus, validation, slots) | `packages/react/src/internal/components/TextInputWrapper.module.css` |
| Leading/trailing slot + spinner swap | `packages/react/src/internal/components/TextInputInnerVisualSlot.tsx` |
| Spinner slot CSS | `packages/react/src/internal/components/TextInputInnerVisualSlot.module.css` |
| Trailing **`TextInput.Action`** button | `packages/react/src/internal/components/TextInputInnerAction.tsx` |
| Action CSS | `packages/react/src/internal/components/TextInputInnerAction.module.css` |
| Editable core | `packages/react/src/internal/components/UnstyledTextInput` (import in `TextInput.tsx`) |
| Stories | `packages/react/src/TextInput/TextInput.stories.tsx`, `TextInput.features.stories.tsx` |
| Token-heavy variant (parallel API) | `packages/react/src/TextInputWithTokens/` — optional reference if CSS vars differ |

## 2. Composition (what Slint `PrimerTextInput` should mirror)

- Outer **`TextInputWrapper`** = `TextInputBaseWrapper` + `TextInputWrapper` classes: flex row, **`UnstyledTextInput`** (`<input>`) in the middle, optional deprecated `icon`, **`TextInputInnerVisualSlot`** (leading / trailing), optional **`trailingAction`** children.
- **FormControl** (label, caption, validation) is **not** inside `TextInput.tsx`; stories compose **`FormControl`** + **`TextInput`**. Slint should match **`Select`** / **`CheckboxGroup`**: label row, field, caption, validation row on **`PrimerTextInput`**.

## 3. Public props (from `TextInput.tsx` + wrapper props)

| Prop | Notes for Slint |
|------|-------------------|
| `block` | Full width / stretch |
| `size` | `'small' \| 'medium' \| 'large'` — maps to **`Size`** |
| `disabled` | |
| `contrast` | Higher-contrast field background |
| `monospace` | `fontStack-monospace` |
| `validationStatus` | `'error' \| 'success'` — merge with character limit (below) |
| `loading` | Boolean |
| `loaderPosition` | `'auto' \| 'leading' \| 'trailing'` |
| `loaderText` | SR-only in React; optional for Slint |
| `leadingVisual` | Icon or node |
| `trailingVisual` | Icon or node |
| `trailingAction` | **`TextInput.Action`** — invisible icon button |
| `characterLimit` | Counter below field; **over limit forces validation error styling** |
| `required` | `aria-required`; Slint: show `*` with label |
| Standard input | `value` / `defaultValue`, `onChange`, `type`, `placeholder`, etc. |

## 4. Validation merge rule (must port)

From `TextInput.tsx`:

```ts
const isValid = isOverLimit ? 'error' : validationStatus
```

So **`characterLimit` exceeded** overrides **`validationStatus`** for wrapper **`data-validation`** and focus/error outline behavior.

## 5. Loading indicator placement (must match)

From `TextInput.tsx`:

```ts
const showLeadingLoadingIndicator =
  loading && (loaderPosition === 'leading' || Boolean(LeadingVisual && loaderPosition !== 'trailing'))
const showTrailingLoadingIndicator =
  loading && (loaderPosition === 'trailing' || Boolean(loaderPosition === 'auto' && !LeadingVisual))
```

- **`auto`**: trailing unless there is a **leading visual**, then leading (unless `loaderPosition === 'trailing'` short-circuits via first clause — read TS carefully: leading shows when `leading` OR `(leadingVisual && not trailing)`).
- **`InnerVisualSlot`**: when loading is possible, spinner **replaces** the visual in that slot (child hidden via `SpinnerHidden` / `SpinnerVisible`); spinner size `small` when alone in slot.

## 6. DOM / data hooks (wrapper)

`TextInputBaseWrapper` / `TextInputWrapper` set:

| Attribute | Meaning |
|-----------|---------|
| `data-block` | Block layout |
| `data-contrast` | Contrast background |
| `data-disabled` | Disabled |
| `data-focused` | Input focused (from React state) |
| `data-monospace` | Monospace |
| `data-size` | `small` / `medium` / `large` |
| `data-trailing-action` | Trailing action present — **changes focus ring selector** |
| `data-validation` | `error` / `success` (merged value) |
| `data-leading-visual` | Leading slot shown |
| `data-trailing-visual` | Trailing slot shown |
| `data-variant` | Deprecated size alias |

## 7. CSS variables used by field chrome (trace into `tokens.slint`)

Pulled from `TextInputWrapper.module.css` / `TextInput.module.css` — these are the names to resolve against **primer-tokens** (`src/tokens/functional/...`) when implementing **`PrimerTextInput`**:

| Variable | Usage |
|----------|--------|
| `--fgColor-default`, `--fgColor-muted`, `--fgColor-disabled` | Text, placeholder, disabled |
| `--bgColor-default` | Field background |
| `--control-borderColor-rest` | Default border |
| `--borderColor-accent-emphasis` | Focus border + outline |
| `--borderWidth-thin`, `--borderWidth-thick`, `--borderRadius-medium` | Geometry |
| `--shadow-inset` | Inset shadow |
| `--control-bgColor-disabled`, `--control-borderColor-disabled` | Disabled |
| `--control-bgColor-contrast` (fallback `--bgColor-inset`) | **contrast** mode |
| `--borderColor-danger-emphasis`, `--control-borderColor-danger` | **error** border + focus outline |
| `--bgColor-success-emphasis` | **success** border color |
| `--fontStack-monospace` | **monospace** |
| `--text-body-size-small`, `--text-body-size-medium`, `--text-title-size-medium` | Sizes |
| `--base-size-*` | Padding, heights (28 / 32 / 40), gaps |
| `--control-xsmall-gap` | Character counter gap |
| `--fgColor-danger` | Counter error text |

## 8. Interaction states checklist (CSS)

- **Rest:** border `--control-borderColor-rest`, inset shadow, default bg.
- **Hover:** (input uses wrapper click-to-focus; no separate hover border in excerpt — confirm full CSS).
- **Focus / focus-within:** accent border + thick outline; **if `data-trailing-action`**, selector uses `[data-focused]` instead of `:focus-within`.
- **Disabled:** muted fg/bg/border, no shadow, `not-allowed` cursor on inputs.
- **Validation error:** danger border; focused error uses `--control-borderColor-danger` outline.
- **Validation success:** success-emphasis border.
- **Contrast:** inset-style background.

## 9. primer-tokens lookup (next step before PR2)

Search the **`primer-tokens`** clone under `src/tokens/` for the functional keys backing the variables above (e.g. `borderColor`, `bgColor`, `shadow`, control scales). **No separate `text-input.json5`** is required if everything resolves through shared functional tokens — align new **`PrimerColors`** / **`LayoutTokens`** / optional **`TextInputTokens`** entries with those keys per [`AGENTS.md`](../AGENTS.md) and [`primer-slint-token-layers`](../../../.cursor/skills/primer-slint-token-layers/SKILL.md).

## 10. Stories ↔ acceptance (Features)

Mirror [`TextInput.features.stories.tsx`](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.features.stories.tsx) exports in gallery: Disabled, WithCaption, VisuallyHiddenLabel, Error, Success, Block, Small, Large, Required, WithLeadingVisual, WithTrailingIcon, WithTrailingAction, WithTooltipDirection, WithLoadingIndicator, WithAutocompleteAttribute, WithCharacterLimit, WithCharacterLimitAndCaption, WithCharacterLimitExceeded.

---

*Phase 1 deliverable: inventory only; implementation follows the port plan PR sequence.*

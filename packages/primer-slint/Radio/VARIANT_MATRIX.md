# Radio + RadioGroup — variant matrix (`primer-port-variant-matrix`)

**Upstream:** Primer `Radio` / `RadioGroup`, shared input chrome (`Checkbox/shared.module.css`), `Radio.module.css`, `CheckboxOrRadioGroup` + `InputValidation`. **Slint references:** [`Checkbox/checkbox.slint`](../Checkbox/checkbox.slint) (`states [ ]`), [`CheckboxGroup/checkbox-group.slint`](../CheckboxGroup/checkbox-group.slint) (group shell + validation).

**Coverage rule:** every cell that should differ visually maps to a **`RadioTokens` `out`**, another global’s **`out`** (`PrimerColors`, `ButtonTokens`, `LayoutTokens`, `TextInputTokens`), or a **`states [ ]`** branch on the radio chrome `Rectangle` (plus a **focus host** around `FocusScope`, not inside `states [ ]`).

**ColorScheme:** all `RadioTokens` entries follow the same pattern as [`CheckboxTokens`](../tokens.slint): internal `property <ColorScheme> color-scheme: Palette.color-scheme` so **light** and **dark** are one row each in the matrix below (tokens switch by scheme).

---

## 1. Radio — control chrome (16×16 circle)

**Geometry:** `LayoutTokens.iconButton-icon-size-medium` (16px), full border-radius (circle). **Checked:** thicker border on the outer ring (upstream `--borderWidth-thicker`); **inner dot** is a nested fill using **checked fg** semantics, ring uses **checked bg** semantics (swapped roles vs checkbox fill).

| ColorScheme | disabled | checked | Keyboard focus | Pointer interaction (upstream) | RadioTokens / label | `states [ ]` on ring `Rectangle` |
|-------------|----------|---------|----------------|----------------------------------|---------------------|----------------------------------|
| light / dark | no | no | no | rest only (no hover/pressed in upstream CSS) | Ring: `RadioTokens.radio-borderColor-rest` (thin), fill: `RadioTokens.radio-bgColor-rest`. Label: `PrimerColors.fgColor-default`. | *Default properties* — no branch. |
| light / dark | no | no | yes | rest | Above + **focus host** `border-width: 2px`, `border-color: TextInputTokens.borderColor-focus` (same family as [`ToggleSwitch`](../ToggleSwitch/toggle-switch.slint) / form controls). | N/A (sibling `Rectangle` + `FocusScope`, driven by `has-focus`). |
| light / dark | no | yes | no | rest | Ring: `RadioTokens.radio-checked-ring-*-rest` + thick border width; dot: `RadioTokens.radio-checked-dot-fgColor-rest`. Label: `PrimerColors.fgColor-default`. | `checked-rest` when `!disabled && checked && !touch.pressed && !touch.has-hover` (or fold into defaults if base properties are set for `checked` only). |
| light / dark | no | yes | yes | rest | Same tokens + focus ring on host. | `checked-rest` for chrome + focus host. |
| light / dark | yes | no | — | — | Ring/fill: `RadioTokens.radio-borderColor-disabled`, `RadioTokens.radio-bgColor-disabled` (shared **unchecked disabled** control surface). Label: `ButtonTokens.control-fgColor-disabled` (match [`Checkbox`](../Checkbox/checkbox.slint) label). | `disabled-unchecked` when `disabled && !checked`. |
| light / dark | yes | yes | — | — | Dot: `RadioTokens.radio-checked-dot-fgColor-disabled`; ring: `RadioTokens.radio-checked-ring-*-disabled`. Label: `ButtonTokens.control-fgColor-disabled`. | `disabled-checked` when `disabled && checked`. |

**Recommended `states [ ]` order (first matching branch wins):** `disabled-checked` → `disabled-unchecked` → optional `checked-hover` / `checked-pressed` (only if you add non-upstream polish) → `checked-rest` → optional `unchecked-hover` / `unchecked-pressed` (optional polish; **default** remains upstream **rest-only** empty).

**Optional polish (not required for upstream parity):** empty hover/pressed rows would reuse the same token slots as [`Checkbox`](../Checkbox/checkbox.slint) empty states (`PrimerColors.table-row-bgColor-hover`, etc.) or dedicated `RadioTokens` aliases — only add matrix rows if you implement them.

---

## 2. RadioTokens — proposed `out` names (audit targets in `tokens.slint`)

Map each matrix cell above to these outputs (exact literals composed per [`primer-slint-token-layers`](../../.cursor/skills/primer-slint-token-layers/SKILL.md) + `control.checked` in primer-tokens):

| Visual intent | primer-tokens / upstream | `RadioTokens` `out` (proposed) |
|---------------|---------------------------|--------------------------------|
| Unchecked fill | `--bgColor-default` / shared input | `radio-bgColor-rest` |
| Unchecked border | `--control-borderColor-emphasis` | `radio-borderColor-rest` |
| Unchecked disabled fill/border | `control.*` disabled | `radio-bgColor-disabled`, `radio-borderColor-disabled` |
| Checked inner disk | `control.checked.fgColor.rest` → `--control-checked-fgColor-rest` | `radio-checked-dot-fgColor-rest` |
| Checked outer ring | `control.checked.bgColor.rest` (+ thicker border) | `radio-checked-ring-bgColor-rest` |
| Checked disabled disk/ring | `control.checked.fgColor.disabled`, `control.checked.bgColor.disabled` | `radio-checked-dot-fgColor-disabled`, `radio-checked-ring-bgColor-disabled` |

**Not duplicated on RadioTokens:** label default/disabled foregrounds → **`PrimerColors`** / **`ButtonTokens`**; focus ring color → **`TextInputTokens.borderColor-focus`** (or **`PrimerColors.fgColor-link`** if you align with `ToggleSwitch`).

---

## 3. RadioGroup — shell, disabled, validation

**Component:** new `RadioGroup/radio-group.slint`, parallel to **`CheckboxGroup`**. **No `RadioTokens`** on the group chrome except where a child **Radio** consumes tokens.

| ColorScheme | Group `disabled` | Validation | Focus | Maps to |
|-------------|------------------|--------------|-------|---------|
| light / dark | no | none | legend/caption/body only | Legend: `PrimerColors.fgColor-default` + `LayoutTokens.base-text-weight-semibold`; caption: `PrimerColors.fgColor-muted`; body spacing: `LayoutTokens.button-content-gap` / margins per CheckboxGroup parity. |
| light / dark | no | error | — | Row visible when `validation-message != ""` && `ValidationStatus.error`: icon `Icons.alert`, text `ButtonTokens.color-btn-danger-text` (same as CheckboxGroup). |
| light / dark | no | success | — | `Icons.check_circle`, `PrimerColors.fgColor-success`. |
| light / dark | yes | any | — | Options stack `opacity: 0.5` (mirror [`CheckboxGroup`](../CheckboxGroup/checkbox-group.slint)); **each child `Radio` must set `disabled: true`** so interaction matches. Legend optional muted: **`PrimerColors.fgColor-muted`** if mirroring upstream `[data-label-disabled]`. |
| light / dark | * | * | optional | Slint has no fieldset focus ring requirement; per-control **`FocusScope`** on each **Radio** supplies keyboard focus. |

**Group validation** is **not** a `states [ ]` on **Radio**; it is conditional UI on **RadioGroup** (same structure as CheckboxGroup validation row).

---

## 4. Traceability checklist

- [ ] Every **Radio** chrome combination **(scheme × disabled × checked)** has a **token** or **`states [ ]`** row in §1.
- [ ] **Focus** is accounted for via **FocusScope** + focus host, not an orphan special case.
- [ ] **RadioGroup** error/success uses the same **validation row** mapping as **CheckboxGroup**.
- [ ] **Radio** checked **dot** uses **fg** semantic tokens; **ring** uses **bg** semantic tokens (not checkbox’s fill=bg pattern).

This document is the filled **variant-matrix** deliverable for the Radio port; keep it in sync if you add hover/pressed parity later.

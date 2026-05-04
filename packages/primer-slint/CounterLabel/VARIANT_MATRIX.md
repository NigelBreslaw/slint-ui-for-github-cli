# CounterLabel — variant matrix

Upstream reference: Primer **CounterLabel** (numeric / string pill on buttons, nav, segmented control). Tokens in [`tokens.slint`](../tokens.slint): `LayoutTokens.counter-label-*`, `PrimerColors.counter-borderColor`, `ButtonTokens.buttonCounter-*` for **Button**-embedded paints.

| Dimension | Cases | Slint status |
|-----------|--------|----------------|
| **Visibility** | Empty `text` hides control | **`visible: text != ""`** |
| **Scheme** | `primary` (emphasis), `secondary` (muted) | **`CounterLabelVariant`**; default **`background`** / **`foreground`** derived from **`scheme`** via **`PrimerColors`** |
| **Border** | Thin semantic border | **`counter-border`** set by caller (**`PrimerColors.counter-borderColor`** vs **`ButtonTokens.buttonCounter-borderColor`**) |
| **Button count** | Variant-specific counter fills | **`Button`** passes **`background`** / **`foreground`** from **`ButtonLogic.button-counter-paint`** and **`counter-border`** from **`ButtonTokens`** (overrides scheme defaults) |
| **Typography** | Small semibold label | **`LayoutTokens.text-body-size-small`**, **`base-text-weight-semibold`** |
| **Shape** | Pill radius, thin border | **`counter-label-border-radius`**, **`counter-label-border-width`**, `Math.min(radius, height/2)` |
| **Interaction** | Pill itself is non-interactive | No **`TouchArea`** on **`CounterLabel`**; hover/disabled live on **parent** (e.g. **Button**) |

**Deferred / N/A:** Loading skeleton pills (e.g. **UnderlineNav** counter loading) stay separate **Rectangle** animations, not this component.

**Token gaps (phase 1):** None identified; parity sufficient for current call sites (**Button**, **SegmentedControl**, **UnderlineNav**, **TreeView**).

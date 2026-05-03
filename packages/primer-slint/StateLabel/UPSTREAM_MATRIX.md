# StateLabel — upstream research + variant matrix

Handoff for Slint port work: **React + CSS contract**, **primer-tokens** semantics, and a **coverage matrix** (status × size × color scheme). Sources live outside this repo unless noted.

---

## 1. Upstream files

| Role | Path |
|------|------|
| Component + icon map + size inference | [`primer-ui-react`](file:///Users/nigelb/slint/primer-ui-react) `packages/react/src/StateLabel/StateLabel.tsx` |
| Layout, status colors, icon margin/size | `packages/react/src/StateLabel/StateLabel.module.css` |
| Stories | `packages/react/src/StateLabel/StateLabel.stories.tsx` |

**primer-tokens** (functional color roles used by the module CSS):

- `src/tokens/functional/color/bgColor.json5` — `open.emphasis`, `done.emphasis`, `closed.emphasis`, `attention.emphasis`, `neutral.emphasis`, `draft.emphasis` (draft resolves like neutral for emphasis in tokens; CSS adds explicit fallbacks).
- `src/tokens/functional/color/borderColor.json5` — matching `*.emphasis` keys for inset border.
- `src/tokens/functional/color/fgColor.json5` — `onEmphasis` (label + icon context).
- `src/tokens/fallback/color-fallbacks.json` — legacy CSS var aliases (e.g. `--bgColor-open-emphasis`).

**In-repo implementation targets:** [`tokens.slint`](../tokens.slint) (`PrimerColors` / composed globals), [`assets/icons.slint`](../assets/icons.slint), export from [`primer.slint`](../primer.slint), gallery per port plan.

---

## 2. Public API (React)

- **`status`** (required): `keyof typeof octiconMap` — **17** keys (see §4). Not 19; treat the plan text as outdated if it says otherwise.
- **`size`:** `'small' \| 'medium'` (preferred).
- **`variant`:** deprecated `'normal' \| 'small'`; when `size` is unset, `variant === 'small'` → inferred size `small`, else `medium`.

**Inferred size:** `size ?? (variant === 'small' ? 'small' : 'medium')` — mirror exactly in Slint for gallery parity.

---

## 3. `StateLabel.module.css` → tokens / Slint

### Shared chrome (all statuses, both sizes)

| CSS | Role | Slint direction |
|-----|------|-----------------|
| `display: inline-flex`; `align-items: center` | layout | `HorizontalLayout` + alignment |
| `font-weight: var(--base-text-weight-semibold)` | label | `LayoutTokens.base-text-weight-semibold` |
| `line-height: 16px` | fixed line box | match literal or token if present |
| `color: var(--fgColor-onEmphasis)` | label (icon inherits) | `PrimerColors.fgColor-onEmphasis` |
| `text-align: center` | | optional |
| `border-radius: var(--borderRadius-full)` | pill | `LayoutTokens.borderRadius-full` (or equivalent) |
| `box-shadow: var(--boxShadow-thin, inset 0 0 0 1px) var(--borderColor-*-emphasis, …)` | hairline inset border | same semantic border color as bg family; draft uses fallback chain in CSS |

### Size axis (`data-size`)

| `data-size` | Padding | `font-size` |
|-------------|---------|-------------|
| `small` | `base-size-4` × `base-size-8` | `text-body-size-small` |
| `medium` | `base-size-8` × `base-size-12` | `text-body-size-medium` |

### Icon layout (`.Icon`)

- `margin-right: var(--base-size-4)` when icon present.
- `[data-size-small]` on the Octicon wrapper → **width: 1em** (scales with small body text).
- **Medium:** no `data-size-small` — Octicon default **16px** visual (upstream default icon size).

---

## 4. Status → emphasis family (CSS `data-status`)

Each row is the **semantic token pair** for background + inset border. **Light vs dark** does not change which variables are used—only resolved values from the active color mode.

| `status` | `--bgColor-*-emphasis` | `--borderColor-*-emphasis` | Notes |
|----------|------------------------|------------------------------|--------|
| `issueOpened`, `pullOpened`, `open`, `alertOpened` | `open` | `open` | |
| `issueClosed`, `pullMerged`, `closed`, `alertFixed` | `done` | `done` | |
| `pullClosed`, `alertClosed` | `closed` | `closed` | In tokens, `closed.emphasis` aliases danger emphasis |
| `pullQueued` | `attention` | `attention` | |
| `issueClosedNotPlanned`, `unavailable`, `archived` | `neutral` | `neutral` | |
| `draft`, `issueDraft`, `alertDismissed` | `draft` with **fallback** `neutral` | `draft` with **fallback** `neutral` | CSS: `var(--bgColor-draft-emphasis, var(--bgColor-neutral-emphasis))` and same pattern for border |

Slint: implement draft row with the same fallback semantics so undefined draft tokens still match React.

---

## 5. Status → icon (React `octiconMap` + `labelMap`)

**No icon** only for `open` and `closed` (`noIconStatus` in TS).

| `status` | Icon (Octicon) | `aria-label` / `labelMap` |
|----------|----------------|---------------------------|
| `open` | *(none)* | `""` |
| `closed` | *(none)* | `""` |
| `issueOpened` | IssueOpened | `"Issue"` |
| `pullOpened` | GitPullRequest | `"Pull request"` |
| `issueClosed` | IssueClosed | `"Issue"` |
| `issueClosedNotPlanned` | Skip | `"Issue, not planned"` |
| `pullClosed` | GitPullRequestClosed | `"Pull request"` |
| `pullMerged` | GitMerge | `"Pull request"` |
| `draft` | GitPullRequestDraft | `"Pull request"` |
| `issueDraft` | IssueDraft | `"Issue"` |
| `pullQueued` | GitMergeQueue | `"Pull request"` |
| `unavailable` | Alert | `""` |
| `alertOpened` | Shield | `"Alert"` |
| `alertFixed` | ShieldCheck | `"Alert"` |
| `alertDismissed` | ShieldSlash | `"Alert"` |
| `alertClosed` | ShieldX | `"Alert"` |
| `archived` | Archive | `"Archived"` |

Register SVGs in [`assets/icons.slint`](../assets/icons.slint) per [`primer-slint-icons-registry`](../../.cursor/skills/primer-slint-icons-registry/SKILL.md); map status → `Icons.*` in the component.

---

## 6. Storybook (upstream)

| Export | Notes |
|--------|--------|
| `Default` | `status="issueOpened"`, text “Open” |
| `Playground` | `args.status`; `argTypes` hides `ref` only |

No per-status story matrix upstream—**parity is defined by TS + CSS**, not extra stories.

---

## 7. Color scheme dimension (light × dark)

**Coverage rule:** For each **emphasis family** in §4, `PrimerColors` (or a small `StateLabelTokens` global composing only other globals’ `out` properties) must expose **light and dark** values for:

- background emphasis,
- border emphasis (including draft → neutral fallback),
- `fgColor-onEmphasis` for label text.

**Per-status × scheme:** You do **not** need 17 separate light/dark branches—only family-level (+ draft fallback) token wiring. Each of the **17 × 2 sizes × 2 schemes** combinations is satisfied by:

1. Choosing the correct **family** row from §4 for that `status`,
2. Applying **§3** size metrics and **§5** icon rules,
3. Letting the global color scheme switch resolved hex for the same semantic names.

primer-tokens notes: e.g. `fgColor.onEmphasis` defaults to `neutral.0` with `dark` override to `neutral.13` (plus dimmed / high-contrast entries); emphasis backgrounds have their own `org.primer.overrides` per mode—audit when adding literals to `tokens.slint`.

---

## 8. Variant matrix (`primer-port-variant-matrix`)

Upstream is a **read-only** `<span>`: no hover/pressed/disabled/focus styling in module CSS.

| Variant (`status`) | ColorScheme | disabled | Size | Interaction | Focus | Notes |
|--------------------|-------------|----------|------|-------------|-------|--------|
| Any of 17 | light | n/a | `small` / `medium` | rest only | n/a | Colors §4 + `fgColor-onEmphasis`; icon §5; metrics §3 |
| Any of 17 | dark | n/a | `small` / `medium` | rest only | n/a | Same CSS **names** as light; values from theme |

Optional later: focus ring / `TouchArea`—**not** upstream for StateLabel.

---

## 9. Implementation checklist (short)

1. Enums / types for `status`, `size`, deprecated `variant`; **inferred size** helper matching React.
2. `states [ ]` or small lookup: status → (emphasis family, icon id); avoid deep nested ternaries.
3. Token audit in `tokens.slint` against §4 / primer-tokens; **no duplicate hex** where an `out` already exists ([`primer-slint-token-layers`](../../.cursor/skills/primer-slint-token-layers/SKILL.md)).
4. Gallery: Storybook-style playground (Select + RadioGroups + reset) per port plan; wire inferred size exactly as §2.

---

## 10. Status list (17) — quick copy

`issueOpened`, `pullOpened`, `issueClosed`, `issueClosedNotPlanned`, `pullClosed`, `pullMerged`, `draft`, `issueDraft`, `pullQueued`, `unavailable`, `alertOpened`, `alertFixed`, `alertDismissed`, `alertClosed`, `open`, `closed`, `archived`

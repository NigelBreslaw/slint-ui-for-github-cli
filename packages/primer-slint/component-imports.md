# Primer Slint — which globals to import

**Rules:** Prefer **`primer.slint`** (or `tokens.slint` + `assets/icons.slint` only). Use each global’s **`out`** bindings — no duplicate hex. Procedure, verification, barrel: [`AGENTS.md`](AGENTS.md). Token list and long-form notes: [`readme.md`](readme.md#design-tokens). New port flow: [`.cursor/skills/primer-port-orchestrator/SKILL.md`](../../.cursor/skills/primer-port-orchestrator/SKILL.md).

**Default stack for views:** `PrimerColors` + `LayoutTokens`. Add **one** component token global below when that family owns colors; add `Icons` when the UI shows registry icons.

| When you touch… | Add (besides defaults) |
| --- | --- |
| `Button` / `IconButton` | `ButtonTokens` |
| `Banner` | `BannerTokens` |
| **`Label`** (metadata chip) | `LabelTokens` — **not** `CounterLabel` |
| **`CounterLabel`** (count pill) | See [`CounterLabel/counter-label.slint`](CounterLabel/counter-label.slint); border/context: readme + [`CounterLabel/VARIANT_MATRIX.md`](CounterLabel/VARIANT_MATRIX.md) if present |
| `Checkbox` / `CheckboxGroup` | `CheckboxTokens`; group validation line: `ButtonTokens` |
| `Radio` / `RadioGroup` | `RadioTokens`; group: same pattern as checkbox group (`ButtonTokens` for validation) |
| `ToggleSwitch` | `ToggleSwitchTokens`, `Icons`, `Size`; loading → [`Progress/spinner.slint`](Progress/spinner.slint) |
| `Avatar` | `AvatarTokens` |
| `DataTable` / `TableContainer` | Same as readme **DataTable** section; `Label` / `IconButton` / `Image` as cell kinds |
| `TreeView` | `TreeViewTokens`, `Icons` — API: [`TreeView/API.md`](TreeView/API.md) |
| `SegmentedControl` | `ToggleSwitchTokens`, `ButtonTokens`, `CounterLabel` as needed |
| `PrimerTextInput` | `TextInputTokens`, `ButtonTokens` (disabled + counter danger) |
| `AnchoredOverlay` / `ModalOverlay` / `Dialog` | `OverlayTokens`, `DialogTokens`; see [`anchored-popupwindow.md`](../slint-gallery/ui/views/anchored-popupwindow.md) |
| `ActionList` / `SelectPanel` / `FilteredActionList` | `ActionListTokens` / `SelectPanelTokens` / `FilteredActionListTokens` as in the entry `.slint` |

**Reuse (grep before duplicating):** `ValidationStatus` and friends — import from [`Select/select.slint`](Select/select.slint) for inputs and groups. **`DialogFooter`:** custom actions use `visible:` branches, not `if`, around `@children` (Slint limitation).

**Unsure?** Open the closest sibling under `packages/primer-slint/<Component>/` and match its imports.

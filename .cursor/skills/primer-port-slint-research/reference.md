# gb-slint — extended path reference

Optional second page for [`SKILL.md`](SKILL.md). Paths are relative to the **gb-slint** repository root.

## Material UI library

- `ui-libraries/material/src/material.slint` — entry
- `ui-libraries/material/src/ui/styling/` — schemes, palette, typography, metrics, animations
- `ui-libraries/material/src/ui/components/` — buttons, `check_box.slint`, `switch.slint`, `text_field.slint`, `state_layer.slint`, navigation, dialogs, etc.
- `ui-libraries/material/src/ui/icons/icons.slint` — icon registry pattern (compare to Primer `assets/icons.slint`)

## Examples (sample)

- `ui-libraries/material/examples/gallery/` — Material gallery
- `examples/gallery/` — general Slint gallery
- `examples/todo/`, `examples/7guis/` — smaller apps

## Compiler widgets

- `internal/compiler/widgets/material/` — `styling.slint`, `checkbox.slint`, `std-widgets.slint`, etc.

Use these for **Slint language patterns** only; **colors and names** must follow **primer-tokens** and [`packages/primer-slint/tokens.slint`](../../../packages/primer-slint/tokens.slint).

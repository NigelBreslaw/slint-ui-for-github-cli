# FilteredActionList2

Slint host for Primer **FilteredActionList** built on **ActionList2**: filter field, header hairline, and a bounded scroll region containing **`ActionList2`** + **`ActionList2Lines`**.

## Upstream

- [`FilteredActionList.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/FilteredActionList/FilteredActionList.tsx)
- CSS: [`FilteredActionList.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/FilteredActionList/FilteredActionList.module.css)
- Storybook: only **`Default`** and **`WithLongItems`** (see `FilteredActionList.stories.tsx` and `FilteredActionList.examples.stories.tsx`).

## Contract

- **Parent-owned filtering**: bind **`filter-text`** and handle **`filter-changed`**; the parent narrows **`lines`**: `[ActionList2Line]` (Slint has no `starts-with` helper in the language — hosts often filter in TypeScript / Rust, as in the gallery bridges).
- **Layout width**: callers set **`horizontal-stretch: 1`** and/or explicit width on the instance when the control should fill a toolbar or form row (see [`AGENTS.md`](../AGENTS.md) — no upstream-style **`block`** prop).
- **Selection (PR1)**: optional **`list-role`**, **`selection-mode`**, **`selected-index`**, **`multi-selected`**, **`item-activated`** — use **`listbox`** + **`single`** / **`multiple`** for **SelectPanel**-style lists (see [`UPSTREAM_TRACEABILITY_PR1.md`](UPSTREAM_TRACEABILITY_PR1.md)).

## Embedding

[`filtered-action-list2.slint`](filtered-action-list2.slint) forwards **`list-role`** and **`selection-mode`** to **`ActionList2Lines`**. Default is **`none`** (FilteredActionList **Default** / **WithLongItems**). **SelectPanel** **SingleSelect** / **MultiSelect** use **`listbox`** with **`single`** or **`multiple`**.

## Loading / message / empty (PR2)

- **`loading`**, **`loading-kind`** (`FilteredActionListLoadingKind`), **`loading-message`**
- **`show-message`**, **`message-title`**, **`message-description`**
- **`empty-title`**, **`empty-message`**

See [`UPSTREAM_TRACEABILITY_PR2.md`](UPSTREAM_TRACEABILITY_PR2.md). Body spinner: [`filtered-action-list2-body-spinner.slint`](filtered-action-list2-body-spinner.slint) (**Spinner**, not **SelectPanelCompose**).

## Select-all (PR3)

- **`select-all-visible`**, **`select-all-checked`**, **`select-all-indeterminate`**, **`select-all-changed`**
- See [`UPSTREAM_TRACEABILITY_PR3.md`](UPSTREAM_TRACEABILITY_PR3.md)

## Non-goals (remaining)

- Grouping, virtualization.
- **`aria-activedescendant`** focus model (upstream keeps focus in the filter while highlighting the active option).

Legacy **`FilteredActionList`** (v1 **`ActionList`**) retains select-all for reference until PR3.

## Imports for views

From [`primer.slint`](../primer.slint): **`FilteredActionList2`**, **`ActionList2Line`**, **`ActionList2LineKind`**, **`ALVariant`**, plus defaults **`SelectPanelTokens`**, **`LayoutTokens`**, **`PrimerColors`**. Row chrome pulls **`ActionList2Tokens`** through **`ActionList2`** / **`ActionList2Lines`**.

# FilteredActionList2

Slint host for Primer **FilteredActionList** built on **ActionList2**: filter field, header hairline, and a bounded scroll region containing **`ActionList2`** + **`ActionList2Lines`**.

## Upstream

- [`FilteredActionList.tsx`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/FilteredActionList/FilteredActionList.tsx)
- CSS: [`FilteredActionList.module.css`](https://github.com/primer/primer-ui-react/blob/main/packages/react/src/FilteredActionList/FilteredActionList.module.css)
- Storybook: only **`Default`** and **`WithLongItems`** (see `FilteredActionList.stories.tsx` and `FilteredActionList.examples.stories.tsx`).

## Contract

- **Parent-owned filtering**: bind **`filter-text`** and handle **`filter-changed`**; the parent narrows **`lines`**: `[ActionList2Line]` (Slint has no `starts-with` helper in the language — hosts often filter in TypeScript / Rust, as in the gallery bridges).
- **Layout width**: callers set **`horizontal-stretch: 1`** and/or explicit width on the instance when the control should fill a toolbar or form row (see [`AGENTS.md`](../AGENTS.md) — no upstream-style **`block`** prop).

## Embedding

[`filtered-action-list2.slint`](filtered-action-list2.slint) uses **`ActionList2Lines`** with **`list-role: none`** and **`selection-mode: none`** to match the two upstream stories (no selection chrome). For menus / listboxes with roving focus, callers would compose differently or extend this component in a follow-up.

## Non-goals (not in this port)

- **`loading`** / **`loadingType`**, **`message`**, empty-state copy, **`onSelectAllChange`**, grouping, virtualization.
- **`aria-activedescendant`** focus model (upstream keeps focus in the filter while highlighting the active option). **`ActionList2Lines`** roving keyboard focus applies when **`list-role`** is **`menu`** or **`listbox`** — not used in the minimal shell.

Legacy **`FilteredActionList`** (v1 **`ActionList`**) retains loading, select-all, and message/empty UI for reference.

## Imports for views

From [`primer.slint`](../primer.slint): **`FilteredActionList2`**, **`ActionList2Line`**, **`ActionList2LineKind`**, **`ALVariant`**, plus defaults **`SelectPanelTokens`**, **`LayoutTokens`**, **`PrimerColors`**. Row chrome pulls **`ActionList2Tokens`** through **`ActionList2`** / **`ActionList2Lines`**.

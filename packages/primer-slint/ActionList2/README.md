# ActionList2

Primer **ActionList** port with a **compose-first** API (like **Dialog** / **SelectPanel**).

## Compose-first (preferred)

[`ActionList2`](action-list2.slint) is list chrome only (`list-variant` padding). Place leaf components as **`@children`**:

- [`ActionList2Row`](action-list2-row.slint) — row visuals, descriptions, danger, focus, hover
- [`ActionList2ItemDivider`](action-list2-item-divider.slint) — explicit block divider

Set **`margin-inline`** on each row/divider when using **inset** or **horizontal-inset** (use `0px` for **full**). Match list variant:

```slint
property <length> item-margin:
    list-variant == ActionList2ListVariant.full ? 0px : ActionList2Tokens.item-margin-inline-inset;

ActionList2 {
    list-variant: list-variant;
    ActionList2Row {
        margin-inline: item-margin;
        label: "Copy link";
        show-top-seam: false;
        clicked => { }
    }
}
```

For **`show-dividers`** seams, set **`show-top-seam: true`** on each row after the first row (see legacy **dashboard** `ActionListRow` pattern).

Dynamic data: `for row[ix] in model: ActionList2Row { ... }` inside **`ActionList2`**.

## Lines adapter (model / TS hosts)

[`ActionList2Lines`](action-list2-lines.slint) maps **`[ActionList2Line]`** to rows/dividers:

```slint
ActionList2 {
    list-variant: ActionList2ListVariant.inset;
    ActionList2Lines {
        lines: menu-lines;
        selection-mode: ActionList2SelectionMode.single;
        selected-index: selected-ix;
        show-dividers: true;
        item-activated(ix) => { selected-ix = ix; }
    }
}
```

## Single selection (PR 6)

On **`ActionList2Row`**: **`show-single-select-check: true`**, **`selected: ix == selected-ix`**, per-row **`clicked`** to update index.

With **`ActionList2Lines`**: set **`selection-mode: single`** and **`selected-index`**; adapter sets check column + **`selected`** on each row.

## Multiple selection (PR 7)

- **Listbox** (`list-role` not **`menu`**): **`show-multi-select-checkbox`** + toggle **`selected`** on click.
- **Menu** (`list-role: menu`): **`show-single-select-check`** (checkmarks, not checkboxes) with **`selection-mode: multiple`**.
- **`ActionList2Lines`**: pass **`multi-selected: [bool, …]`** aligned with row indices; adapter sets lead affordance per **`list-role`**.

## Do not

- Add row-only features to **`ActionList2Line`** when they belong on **`ActionList2Row`**.
- Grow **`ActionList2`** with `if line.kind` branches — add leaf components or extend **`ActionList2Lines`** only.

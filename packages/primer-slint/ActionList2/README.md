# ActionList2

Primer **ActionList** port with a **compose-first** API (like **Dialog** / **SelectPanel**).

## Compose-first (preferred)

[`ActionList2`](action-list2.slint) is list chrome only (`list-variant` padding). Place leaf components as **`@children`**:

- [`ActionList2Row`](action-list2-row.slint) — row visuals, **`row-size`** (`medium` | `large`), leading **avatar** or **icon**, descriptions, danger, disabled/inactive/loading, **`active`**, focus, hover
- [`ActionList2ItemDivider`](action-list2-item-divider.slint) — explicit block divider
- [`ActionList2ListVisualHeading`](action-list2-list-visual-heading.slint) — list title (**WithVisualListHeading**)
- [`ActionList2CustomHeading`](action-list2-custom-heading.slint) — medium custom title
- [`ActionList2SectionHeading`](action-list2-section-heading.slint) — group title (**subtle** | **filled**)

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

## Selection lead (`ActionList2SelectionLead`)

One enum per row — do not combine separate booleans. Matches upstream [`ActionList/Selection.tsx`](../../../../primer-ui-react/packages/react/src/ActionList/Selection.tsx).

| `ActionList2SelectionLead` | Upstream | When |
|----------------------------|----------|------|
| **`none`** | (no column) | `selection-mode: none` |
| **`checkmark`** | `.SingleSelectCheckmark` | `single`, or `multiple` + **`list-role: menu`** |
| **`checkbox`** | `.MultiSelectCheckbox` | `multiple` + **`list-role: listbox`** |

**Storybook naming trap:** **ListboxMultiSelect** in primer-ui-react still uses **`role="menu"`**, so it shows **checkmarks** like **MultiSelect** — not checkboxes. Use **`list-role: listbox`** when you want boxed checkboxes.

### Composed rows

```slint
ActionList2Row {
    selection-lead: ActionList2SelectionLead.checkmark;
    selected: ix == selected-ix;
    clicked => { selected-ix = ix; }
}
```

### `ActionList2Lines` derives lead from list props

```slint
ActionList2Lines {
    list-role: ActionList2ListRole.menu;       // → checkmark when multiple
    selection-mode: ActionList2SelectionMode.multiple;
    multi-selected: flags;
}

ActionList2Lines {
    list-role: ActionList2ListRole.listbox;    // → checkbox when multiple
    selection-mode: ActionList2SelectionMode.multiple;
    multi-selected: flags;
}
```

## Do not

- Add row-only features to **`ActionList2Line`** when they belong on **`ActionList2Row`**.
- Grow **`ActionList2`** with `if line.kind` branches — add leaf components or extend **`ActionList2Lines`** only.
- Set **`checkmark`** and **`checkbox`** at once — use **`ActionList2SelectionLead`** only.

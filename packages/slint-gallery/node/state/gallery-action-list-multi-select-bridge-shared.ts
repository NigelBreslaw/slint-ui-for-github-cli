import {
    assignProperties,
    checkedFlagsForLabels,
    formatSelectionSummary,
    isRowIndexInRange,
    toggleIndexInSet,
} from "slint-bridge-kit";

export type ActionListGalleryMultiSelectHandle = {
    row_checked: boolean[];
    last_activated_label: string;
    selection_summary: string;
    row_activated: (ix: number) => void;
};

const ACTION_LIST_GALLERY_MULTI_ROW_LABELS = [
    "Primer Backlog",
    "Accessibility",
    "Octicons",
    "Primer React",
] as const;

/** Index multi-select for any fixed row label list (Slint `row_checked` / summary globals). */
export function wireIndexMultiSelect(
    g: ActionListGalleryMultiSelectHandle,
    rowLabels: readonly string[],
    initialSelected: Iterable<number> = [0],
): void {
    const rowCount = rowLabels.length;
    let selected = new Set<number>(initialSelected);

    const pushToSlint = (clickedIx: number | null) => {
        assignProperties(g, {
            row_checked: checkedFlagsForLabels(rowLabels, selected),
            last_activated_label:
                clickedIx === null ? "" : (rowLabels[clickedIx] ?? ""),
            selection_summary: formatSelectionSummary(rowLabels, selected),
        });
    };

    g.row_activated = (ix: number) => {
        if (!isRowIndexInRange(ix, rowCount)) return;
        toggleIndexInSet(selected, ix);
        pushToSlint(ix);
    };

    selected = new Set(initialSelected);
    pushToSlint(null);
}

export function wireActionListGalleryMultiSelect(
    g: ActionListGalleryMultiSelectHandle,
): void {
    wireIndexMultiSelect(g, ACTION_LIST_GALLERY_MULTI_ROW_LABELS, [0]);
}

export const ACTION_LIST2_MENU_MULTI_ROW_LABELS = [
    "Copy link",
    "Quote reply",
    "Edit comment",
] as const;

export const ACTION_LIST2_LISTBOX_MULTI_ROW_LABELS = ACTION_LIST_GALLERY_MULTI_ROW_LABELS;

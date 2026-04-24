import { assignProperties } from "slint-bridge-kit";

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

function selectedIndicesToBoolRow(
    rowLabels: readonly string[],
    selected: ReadonlySet<number>,
): boolean[] {
    return rowLabels.map((_, i) => selected.has(i));
}

function formatSelectionSummary(
    rowLabels: readonly string[],
    selected: ReadonlySet<number>,
): string {
    const names = rowLabels.filter((_, i) => selected.has(i));
    return names.length === 0 ? "(none)" : names.join(", ");
}


export function wireActionListGalleryMultiSelect(
    g: ActionListGalleryMultiSelectHandle,
): void {
    const rowLabels = ACTION_LIST_GALLERY_MULTI_ROW_LABELS;
    const rowCount = rowLabels.length;
    let selected = new Set<number>([0]);

    const pushToSlint = (clickedIx: number | null) => {
        assignProperties(g, {
            row_checked: selectedIndicesToBoolRow(rowLabels, selected),
            last_activated_label:
                clickedIx === null ? "" : (rowLabels[clickedIx] ?? ""),
            selection_summary: formatSelectionSummary(rowLabels, selected),
        });
    };

    g.row_activated = (ix: number) => {
        if (ix < 0 || ix >= rowCount) return;
        if (selected.has(ix)) {
            selected.delete(ix);
        } else {
            selected.add(ix);
        }
        pushToSlint(ix);
    };

    selected = new Set<number>([0]);
    pushToSlint(null);
}

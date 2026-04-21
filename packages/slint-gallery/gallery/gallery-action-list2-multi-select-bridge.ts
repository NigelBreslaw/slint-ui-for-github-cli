import { assignProperties } from "slint-bridge-kit";

/** Node handle for `export global GalleryActionList2MultiSelect` in `gallery-action-list2-multi-select-state.slint`. */
export type GalleryActionList2MultiSelectHandle = {
    row_checked: boolean[];
    last_activated_label: string;
    selection_summary: string;
    row_activated: (ix: number) => void;
};

/** Row labels for the gallery multi-select demo (same order as `multi-select-lines` in `gallery-action-list2-page.slint`). */
const ROW_LABELS = [
    "Primer Backlog",
    "Accessibility",
    "Octicons",
    "Primer React",
] as const;

function selectedIndicesToBoolRow(selected: ReadonlySet<number>): boolean[] {
    return ROW_LABELS.map((_, i) => selected.has(i));
}

function formatSelectionSummary(selected: ReadonlySet<number>): string {
    const names = ROW_LABELS.filter((_, i) => selected.has(i));
    return names.length === 0 ? "(none)" : names.join(", ");
}

/** Wires `row_activated` to toggle membership in a `Set`; mirrors a bool[] into Slint for `ActionList2.multi-selected`. */
export function wireGalleryActionList2MultiSelect(g: GalleryActionList2MultiSelectHandle): void {
    const rowCount = ROW_LABELS.length;
    let selected = new Set<number>([0]);

    const pushToSlint = (clickedIx: number | null) => {
        assignProperties(g, {
            row_checked: selectedIndicesToBoolRow(selected),
            last_activated_label: clickedIx === null ? "" : (ROW_LABELS[clickedIx] ?? ""),
            selection_summary: formatSelectionSummary(selected),
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

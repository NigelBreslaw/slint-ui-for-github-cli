import { assignProperties } from "slint-bridge-kit";

/** Slint global handle: `row_checked` / `row_activated`. */
export type GallerySelectPanelMultiHandle = {
    row_checked: boolean[];
    row_activated: (ix: number) => void;
};

const SELECT_PANEL_GALLERY_MULTI_ROW_COUNT = 5;

function indicesToRowChecked(selected: ReadonlySet<number>): boolean[] {
    return Array.from({ length: SELECT_PANEL_GALLERY_MULTI_ROW_COUNT }, (_, i) =>
        selected.has(i),
    );
}

/**
 * Wires `row_activated` to toggle membership in a `Set`; mirrors a bool[] into Slint for `SelectPanel.multi-selected`.
 */
export function wireGallerySelectPanelMultiSelect(
    g: GallerySelectPanelMultiHandle,
): void {
    let selected = new Set<number>([1, 2]);

    const pushToSlint = () => {
        assignProperties(g, {
            row_checked: indicesToRowChecked(selected),
        });
    };

    g.row_activated = (ix: number) => {
        if (ix < 0 || ix >= SELECT_PANEL_GALLERY_MULTI_ROW_COUNT) return;
        if (selected.has(ix)) {
            selected.delete(ix);
        } else {
            selected.add(ix);
        }
        pushToSlint();
    };

    selected = new Set<number>([1, 2]);
    pushToSlint();
}

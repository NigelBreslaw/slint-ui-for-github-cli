import {
    applySelectAllOnVisibleKeys,
    assignProperties,
    checkedFlagsForVisibleKeys,
    selectAllStripState,
    toggleKeyInSet,
} from "slint-bridge-kit";
import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";

/** Slint global handle: **`lines`** / **`filter_changed`** */
export type GalleryFilteredActionListHandle = {
    lines: unknown;
    filter_changed: (text: string) => void;
};

/** Multi-select gallery global — label-keyed selection survives filter narrowing. */
export type GalleryFilteredActionListMultiHandle = GalleryFilteredActionListHandle & {
    multi_selected: boolean[];
    item_activated: (ix: number) => void;
};

/** Select-all strip + multi-select (**ActionList** rows). */
export type GalleryFilteredActionListSelectAllHandle = GalleryFilteredActionListHandle & {
    multi_selected: boolean[];
    select_all_checked: boolean;
    select_all_indeterminate: boolean;
    item_activated: (ix: number) => void;
    select_all_changed: (on: boolean) => void;
};

/**
 * `ActionListLine` rows for **`ArrayModel`**.
 *
 * Field keys use **underscores** matching Slint. Enum fields are **strings**.
 */
type ActionListLineJs = {
    kind: string;
    label: string;
    row_variant: string;
    row_size: string;
    disabled: boolean;
    has_leading_avatar: boolean;
    avatar_source: ImageData;
    has_leading_visual: boolean;
    leading_icon: ImageData;
    description: string;
    description_layout: string;
    truncate_inline_description: boolean;
    trailing_text: string;
    inactive_text: string;
    show_trailing_loading: boolean;
    active: boolean;
    section_heading_variant: string;
};

export const FILTERED_ACTION_LIST_DEFAULT_LABELS = [
    "enhancement",
    "bug",
    "good first issue",
    "design",
    "blocker",
    "backend",
    "frontend",
] as const;

/** Upstream `FilteredActionList.stories.tsx` — `getColorCircle` hex order. */
const FILTERED_ACTION_LIST_DEFAULT_LEADING_HEX = [
    "#a2eeef",
    "#d73a4a",
    "#0cf478",
    "#ffd78e",
    "#ff0000",
    "#a4f287",
    "#8dc6fc",
] as const;

const FILTERED_ACTION_LIST_LONG_LABELS = [
    "enhancement with a very long label that might wrap. enhancement with a very long label that might wrap. enhancement with a very long label that might wrap. ",
    "bug with an excessively verbose description that goes on and on. bug with an excessively verbose description that goes on and on. bug with an excessively verbose description that goes on and on.",
    "good first issue that is intended to be approachable for newcomers",
    "design related task that involves multiple stakeholders and considerations",
] as const;

const CIRCLE_PX = 16;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const h = hex.replace("#", "");
    return {
        r: Number.parseInt(h.slice(0, 2), 16),
        g: Number.parseInt(h.slice(2, 4), 16),
        b: Number.parseInt(h.slice(4, 6), 16),
    };
}

/** Filled circle RGBA for Slint **`image`** bindings (Node). */
function rgbaCircleImage(hex: string, size: number): ImageData {
    const { r, g, b } = hexToRgb(hex);
    const data = Buffer.alloc(size * size * 4, 0);
    const cx = (size - 1) / 2;
    const cy = (size - 1) / 2;
    const rad = size / 2 - 1;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy <= rad * rad) {
                const i = (y * size + x) * 4;
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
                data[i + 3] = 255;
            }
        }
    }
    return { width: size, height: size, data } as ImageData;
}

const transparent1: ImageData = {
    width: 1,
    height: 1,
    data: Buffer.from([0, 0, 0, 0]),
} as ImageData;

function actionListRowLong(label: string, rowIcon: ImageData): ActionListLineJs {
    return {
        kind: "row",
        label,
        row_variant: "default",
        row_size: "medium",
        disabled: false,
        has_leading_avatar: false,
        avatar_source: transparent1,
        has_leading_visual: false,
        leading_icon: rowIcon,
        description: "",
        description_layout: "none",
        truncate_inline_description: false,
        trailing_text: "",
        inactive_text: "",
        show_trailing_loading: false,
        active: false,
        section_heading_variant: "subtle",
    };
}

export function actionListRowDefaultWithLeading(
    label: string,
    labelIndex: number,
): ActionListLineJs {
    const hex = FILTERED_ACTION_LIST_DEFAULT_LEADING_HEX[labelIndex] ?? "#8dc6fc";
    const circle = rgbaCircleImage(hex, CIRCLE_PX);
    return {
        kind: "row",
        label,
        row_variant: "default",
        row_size: "medium",
        disabled: false,
        has_leading_avatar: false,
        avatar_source: circle,
        has_leading_visual: true,
        leading_icon: circle,
        description: "",
        description_layout: "none",
        truncate_inline_description: false,
        trailing_text: "",
        inactive_text: "",
        show_trailing_loading: false,
        active: false,
        section_heading_variant: "subtle",
    };
}

export function filterPrefixLabels(labels: readonly string[], filter: string): string[] {
    const q = filter.trim().toLowerCase();
    return labels.filter((l) => q === "" || l.toLowerCase().startsWith(q));
}

export function wireGalleryFilteredActionListDefault(g: GalleryFilteredActionListHandle): void {
    const push = (filter: string) => {
        const picked = filterPrefixLabels(FILTERED_ACTION_LIST_DEFAULT_LABELS, filter);
        const rows = picked.map((label) => {
            const fullIx = FILTERED_ACTION_LIST_DEFAULT_LABELS.findIndex((l) => l === label);
            return actionListRowDefaultWithLeading(label, fullIx >= 0 ? fullIx : 0);
        });
        assignProperties(g, {
            lines: new slint.ArrayModel(rows),
        });
    };

    g.filter_changed = (t: string) => {
        push(t);
    };
    push("");
}

export function wireGalleryFilteredActionListLong(
    g: GalleryFilteredActionListHandle,
    rowIcon: ImageData,
): void {
    const push = (filter: string) => {
        const picked = filterPrefixLabels(FILTERED_ACTION_LIST_LONG_LABELS, filter);
        assignProperties(g, {
            lines: new slint.ArrayModel(picked.map((l) => actionListRowLong(l, rowIcon))),
        });
    };

    g.filter_changed = (t: string) => {
        push(t);
    };
    push("");
}

/**
 * Upstream **SelectPanel** `MultiSelect` — initial selection **`items.slice(1, 3)`** → labels **bug**, **good first issue**.
 * Selection is stored by label so filtered rows keep correct checkbox state.
 */
export function wireGalleryFilteredActionListMulti(
    g: GalleryFilteredActionListMultiHandle,
): void {
    const selectedLabels = new Set<string>(["bug", "good first issue"]);
    let currentFilter = "";

    const push = (filter: string) => {
        currentFilter = filter;
        const picked = filterPrefixLabels(FILTERED_ACTION_LIST_DEFAULT_LABELS, filter);
        const rows = picked.map((label) => {
            const fullIx = FILTERED_ACTION_LIST_DEFAULT_LABELS.findIndex((l) => l === label);
            return actionListRowDefaultWithLeading(label, fullIx >= 0 ? fullIx : 0);
        });
        assignProperties(g, {
            lines: new slint.ArrayModel(rows),
            multi_selected: checkedFlagsForVisibleKeys(picked, selectedLabels),
        });
    };

    g.filter_changed = (t: string) => {
        push(t);
    };

    g.item_activated = (ix: number) => {
        const picked = filterPrefixLabels(
            FILTERED_ACTION_LIST_DEFAULT_LABELS,
            currentFilter,
        );
        const label = picked[ix];
        if (label === undefined) {
            return;
        }
        toggleKeyInSet(selectedLabels, label);
        push(currentFilter);
    };

    push("");
}

/**
 * Upstream **SelectPanel** `WithSelectAll` — select-all strip + **listbox** multi-select on filtered labels.
 */
export function wireGalleryFilteredActionListSelectAll(
    g: GalleryFilteredActionListSelectAllHandle,
): void {
    let filterText = "";
    const selectedLabels = new Set<string>();

    const sync = () => {
        const picked = filterPrefixLabels(
            FILTERED_ACTION_LIST_DEFAULT_LABELS,
            filterText,
        );
        const { checked, indeterminate } = selectAllStripState(picked, selectedLabels);
        const rows = picked.map((label) => {
            const fullIx = FILTERED_ACTION_LIST_DEFAULT_LABELS.findIndex((l) => l === label);
            return actionListRowDefaultWithLeading(label, fullIx >= 0 ? fullIx : 0);
        });
        assignProperties(g, {
            lines: new slint.ArrayModel(rows),
            multi_selected: checkedFlagsForVisibleKeys(picked, selectedLabels),
            select_all_checked: checked,
            select_all_indeterminate: indeterminate,
        });
    };

    g.filter_changed = (t: string) => {
        filterText = t;
        sync();
    };

    g.item_activated = (ix: number) => {
        const picked = filterPrefixLabels(
            FILTERED_ACTION_LIST_DEFAULT_LABELS,
            filterText,
        );
        const label = picked[ix];
        if (label === undefined) {
            return;
        }
        toggleKeyInSet(selectedLabels, label);
        sync();
    };

    g.select_all_changed = (on: boolean) => {
        const picked = filterPrefixLabels(
            FILTERED_ACTION_LIST_DEFAULT_LABELS,
            filterText,
        );
        applySelectAllOnVisibleKeys(selectedLabels, picked, on);
        sync();
    };

    sync();
}

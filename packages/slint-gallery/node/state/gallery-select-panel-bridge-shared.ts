import {
    assignProperties,
    checkedFlagsForVisibleKeys,
    toggleKeyInSet,
} from "slint-bridge-kit";
import * as slint from "slint-ui";
import {
    FILTERED_ACTION_LIST_DEFAULT_LABELS,
    actionListRowDefaultWithLeading,
    filterPrefixLabels,
    type GalleryFilteredActionListHandle,
    type GalleryFilteredActionListMultiHandle,
} from "./gallery-filtered-action-list-bridge-shared.ts";

/** **WithDisabledItem** — index 3 (**design**) is disabled. */
export function wireGallerySelectPanelDisabled(
    g: GalleryFilteredActionListMultiHandle,
): void {
    const selectedLabels = new Set<string>(["bug", "good first issue"]);
    let currentFilter = "";

    const push = (filter: string) => {
        currentFilter = filter;
        const picked = filterPrefixLabels(FILTERED_ACTION_LIST_DEFAULT_LABELS, filter);
        const rows = picked.map((label) => {
            const fullIx = FILTERED_ACTION_LIST_DEFAULT_LABELS.findIndex((l) => l === label);
            const row = actionListRowDefaultWithLeading(label, fullIx >= 0 ? fullIx : 0);
            const disabled = label === "design";
            return { ...row, disabled };
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
        if (label === undefined || label === "design") {
            return;
        }
        toggleKeyInSet(selectedLabels, label);
        push(currentFilter);
    };

    push("");
}

type GallerySelectPanelCancelHandle = GalleryFilteredActionListMultiHandle & {
    reset: () => void;
};

/** **WithOnCancel** — **Cancel** restores initial **bug** + **good first issue**. */
export function wireGallerySelectPanelCancel(g: GallerySelectPanelCancelHandle): void {
    const initialLabels = new Set<string>(["bug", "good first issue"]);
    const selectedLabels = new Set<string>(initialLabels);
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

    g.reset = () => {
        selectedLabels.clear();
        for (const l of initialLabels) {
            selectedLabels.add(l);
        }
        push(currentFilter);
    };

    push("");
}

export type { GallerySelectPanelCancelHandle };

/** Re-export for **AsyncFetch** / **NoResults** demos that only need default label rows. */
type GallerySelectPanelModalMultiHandle = GalleryFilteredActionListMultiHandle & {
    reset: () => void;
};

/** **MultiSelectModal** — **Cancel** restores **bug** + **good first issue**. */
export function wireGallerySelectPanelModalMulti(
    g: GallerySelectPanelModalMultiHandle,
): void {
    const initialLabels = new Set<string>(["bug", "good first issue"]);
    const selectedLabels = new Set<string>(initialLabels);
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

    g.reset = () => {
        selectedLabels.clear();
        for (const l of initialLabels) {
            selectedLabels.add(l);
        }
        push(currentFilter);
    };

    push("");
}

export type { GallerySelectPanelModalMultiHandle };

export function wireGallerySelectPanelFetchLines(
    g: GalleryFilteredActionListHandle,
): void {
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

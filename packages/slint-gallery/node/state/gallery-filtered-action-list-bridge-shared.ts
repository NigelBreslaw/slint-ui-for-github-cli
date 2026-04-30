import { assignProperties } from "slint-bridge-kit";
import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";

/** Slint global handle: **`lines`** / **`filter_changed`** */
export type GalleryFilteredActionListHandle = {
    lines: unknown;
    filter_changed: (text: string) => void;
};

/**
 * `ActionListLine` rows for **`ArrayModel`**.
 *
 * - Field keys use **underscores** matching Slint **`row-variant`** → **`row_variant`** (see Slint `to_value` for structs).
 * - **Enum** fields must be **strings** (`"row"`, `"default"`, `"none"`), not numeric indices — otherwise FFI fails with
 *   “cannot be represented in Rust”.
 * - Omit **`label_markdown`**: undefined yields Slint’s default **`styled-text`** for `has_markdown: false` rows.
 */
type ActionListLineJs = {
    kind: string;
    label: string;
    row_variant: string;
    disabled: boolean;
    has_leading_avatar: boolean;
    avatar_source: ImageData;
    has_leading_visual: boolean;
    leading_icon: ImageData;
    description: string;
    description_layout: string;
    has_markdown: boolean;
    inactive_text: string;
    active: boolean;
    show_trailing_loading: boolean;
    has_trailing_visual: boolean;
    trailing_icon: ImageData;
};

function actionListLineRow(label: string, icon: ImageData): ActionListLineJs {
    return {
        kind: "row",
        label,
        row_variant: "default",
        disabled: false,
        has_leading_avatar: false,
        avatar_source: icon,
        has_leading_visual: false,
        leading_icon: icon,
        description: "",
        description_layout: "none",
        has_markdown: false,
        inactive_text: "",
        active: false,
        show_trailing_loading: false,
        has_trailing_visual: false,
        trailing_icon: icon,
    };
}

/// Storybook **Default** labels (upstream `FilteredActionList.stories.tsx`).
const FILTERED_ACTION_LIST_DEFAULT_LABELS = [
    "enhancement",
    "bug",
    "good first issue",
    "design",
    "blocker",
    "backend",
    "frontend",
] as const;

/// Storybook **WithLongItems** (`FilteredActionList.examples.stories.tsx`).
const FILTERED_ACTION_LIST_LONG_LABELS = [
    "enhancement with a very long label that might wrap. enhancement with a very long label that might wrap. enhancement with a very long label that might wrap. ",
    "bug with an excessively verbose description that goes on and on. bug with an excessively verbose description that goes on and on. bug with an excessively verbose description that goes on and on.",
    "good first issue that is intended to be approachable for newcomers",
    "design related task that involves multiple stakeholders and considerations",
] as const;

function filterPrefixLabels(labels: readonly string[], filter: string): string[] {
    const q = filter.trim().toLowerCase();
    return labels.filter((l) => q === "" || l.toLowerCase().startsWith(q));
}

/**
 * Same prefix filter as **Rust** [`wire_gallery_filtered_action_list_*`](../../rust/src/lib.rs).
 *
 * **`rowIcon`**: **`window.Icons.dot_fill`** from the gallery Slint module (**`Icons`** is re-exported from **`gallery-window.slint`**).
 */
export function wireGalleryFilteredActionListDefault(
    g: GalleryFilteredActionListHandle,
    rowIcon: ImageData,
): void {
    wireGalleryFilteredActionList(g, FILTERED_ACTION_LIST_DEFAULT_LABELS, rowIcon);
}

export function wireGalleryFilteredActionListLong(
    g: GalleryFilteredActionListHandle,
    rowIcon: ImageData,
): void {
    wireGalleryFilteredActionList(g, FILTERED_ACTION_LIST_LONG_LABELS, rowIcon);
}

function wireGalleryFilteredActionList(
    g: GalleryFilteredActionListHandle,
    labels: readonly string[],
    rowIcon: ImageData,
): void {
    const push = (filter: string) => {
        const picked = filterPrefixLabels(labels, filter);
        assignProperties(g, {
            lines: new slint.ArrayModel(picked.map((l) => actionListLineRow(l, rowIcon))),
        });
    };

    g.filter_changed = (t: string) => {
        push(t);
    };
    push("");
}

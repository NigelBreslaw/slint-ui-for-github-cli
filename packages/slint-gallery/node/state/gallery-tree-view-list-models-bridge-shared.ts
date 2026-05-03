import { assignProperties } from "slint-bridge-kit";
import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";

/** Keep in sync with **`GALLERY_TREE_*`** in [`rust/src/lib.rs`](../../rust/src/lib.rs). */
const GALLERY_TREE_STRESS_CHILD_COUNT = 1000;
const GALLERY_TREE_NESTED_SCROLL_CHILD_COUNT = 100;

export type GalleryTreeViewListModelsHandle = {
    stress_list_rows: unknown;
    nested_scroll_list_rows: unknown;
};

type TreeViewRowJs = {
    id: string;
    label: string;
    level: number;
    has_children: boolean;
    expanded: boolean;
    current: boolean;
    leading_is_directory: boolean;
    has_leading_visual: boolean;
    trailing: string;
    has_leading_action: boolean;
    show_leading_action_icon: boolean;
    leading_action_icon: ImageData;
    leading_file_icon: ImageData;
    interactive: boolean;
    is_skeleton: boolean;
    has_secondary_actions: boolean;
    secondary_actions_badge: string;
    loading_children_badge: string;
};

function treeViewRowLeaf(
    id: string,
    label: string,
    dotFill: ImageData,
    fileIcon: ImageData,
): TreeViewRowJs {
    return {
        id,
        label,
        level: 2,
        has_children: false,
        expanded: false,
        current: false,
        leading_is_directory: false,
        has_leading_visual: true,
        trailing: "none",
        has_leading_action: false,
        show_leading_action_icon: false,
        leading_action_icon: dotFill,
        leading_file_icon: fileIcon,
        interactive: true,
        is_skeleton: false,
        has_secondary_actions: false,
        secondary_actions_badge: "",
        loading_children_badge: "",
    };
}

function treeViewRowStressRoot(dotFill: ImageData, fileIcon: ImageData): TreeViewRowJs {
    return {
        id: "stress-root",
        label: "stress-root",
        level: 1,
        has_children: true,
        expanded: true,
        current: false,
        leading_is_directory: true,
        has_leading_visual: true,
        trailing: "none",
        has_leading_action: false,
        show_leading_action_icon: false,
        leading_action_icon: dotFill,
        leading_file_icon: fileIcon,
        interactive: true,
        is_skeleton: false,
        has_secondary_actions: false,
        secondary_actions_badge: "",
        loading_children_badge: "",
    };
}

function treeViewRowNestedRoot(dotFill: ImageData, fileIcon: ImageData): TreeViewRowJs {
    return {
        id: "nested-root",
        label: "root",
        level: 1,
        has_children: true,
        expanded: true,
        current: false,
        leading_is_directory: true,
        has_leading_visual: true,
        trailing: "none",
        has_leading_action: false,
        show_leading_action_icon: false,
        leading_action_icon: dotFill,
        leading_file_icon: fileIcon,
        interactive: true,
        is_skeleton: false,
        has_secondary_actions: false,
        secondary_actions_badge: "",
        loading_children_badge: "",
    };
}

function galleryTreeViewStressRows(dotFill: ImageData, fileIcon: ImageData): TreeViewRowJs[] {
    const rows: TreeViewRowJs[] = [treeViewRowStressRoot(dotFill, fileIcon)];
    for (let i = 0; i < GALLERY_TREE_STRESS_CHILD_COUNT; i += 1) {
        rows.push(treeViewRowLeaf(`stress-${i}`, `row-${i}`, dotFill, fileIcon));
    }
    return rows;
}

function galleryTreeViewNestedScrollRows(dotFill: ImageData, fileIcon: ImageData): TreeViewRowJs[] {
    const rows: TreeViewRowJs[] = [treeViewRowNestedRoot(dotFill, fileIcon)];
    for (let i = 0; i < GALLERY_TREE_NESTED_SCROLL_CHILD_COUNT; i += 1) {
        rows.push(treeViewRowLeaf(`nested-${i}`, `item-${i}`, dotFill, fileIcon));
    }
    return rows;
}

/** Fills **StressTest** / **NestedScrollContainer** `ListView` models (matches Rust `fill_gallery_tree_view_list_models`). */
export function wireGalleryTreeViewListModels(
    g: GalleryTreeViewListModelsHandle,
    dotFill: ImageData,
    fileIcon: ImageData,
): void {
    assignProperties(g, {
        stress_list_rows: new slint.ArrayModel(galleryTreeViewStressRows(dotFill, fileIcon)),
        nested_scroll_list_rows: new slint.ArrayModel(galleryTreeViewNestedScrollRows(dotFill, fileIcon)),
    });
}

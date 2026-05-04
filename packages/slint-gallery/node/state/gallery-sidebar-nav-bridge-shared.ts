import { assignProperties } from "slint-bridge-kit";
import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";

/** One folder + single **Playground** leaf — order matches prior static [`gallery-sidebar.slint`](../../ui/components/gallery-sidebar.slint). Keep in sync with **`GALLERY_SIDEBAR_NAV`** in [`rust/src/lib.rs`](../../rust/src/lib.rs). */
const GALLERY_SIDEBAR_NAV: readonly { folderId: string; label: string; leafId: string }[] = [
    { folderId: "folder-action-list", label: "Action list", leafId: "action-list-playground" },
    { folderId: "folder-banner", label: "Banner", leafId: "banner-playground" },
    { folderId: "folder-buttons", label: "Buttons", leafId: "buttons-playground" },
    {
        folderId: "folder-counter-label",
        label: "Counter label",
        leafId: "counter-label-playground",
    },
    { folderId: "folder-data", label: "Data", leafId: "data-playground" },
    { folderId: "folder-dialogs", label: "Dialogs", leafId: "dialogs-playground" },
    { folderId: "folder-feedback", label: "Feedback", leafId: "feedback-playground" },
    { folderId: "folder-forms", label: "Forms", leafId: "forms-playground" },
    { folderId: "folder-navs", label: "Navs", leafId: "navs-playground" },
    { folderId: "folder-select", label: "Select", leafId: "select-playground" },
    {
        folderId: "folder-segmented-control",
        label: "Segmented control",
        leafId: "segmented-control-playground",
    },
    { folderId: "folder-state-label", label: "State label", leafId: "state-label-playground" },
    { folderId: "folder-text-input", label: "Text input", leafId: "text-input-playground" },
    { folderId: "folder-toggle-switch", label: "Toggle switch", leafId: "toggle-switch-playground" },
    { folderId: "folder-tree-view", label: "Tree view", leafId: "tree-view-playground" },
    { folderId: "folder-underline-nav", label: "Underline nav", leafId: "underline-nav-playground" },
] as const;

const PLAYGROUND_LEAF_IDS = new Set(GALLERY_SIDEBAR_NAV.map((e) => e.leafId));
const FOLDER_IDS = new Set(GALLERY_SIDEBAR_NAV.map((e) => e.folderId));

export type GallerySidebarNavHandle = {
    rows: unknown;
    row_current_requested: (id: string) => void;
    row_toggle_requested: (id: string) => void;
    row_secondary_actions_requested: (
        id: string,
        ax: number,
        ay: number,
        aw: number,
        ah: number,
    ) => void;
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

function treeViewRowFolder(
    id: string,
    label: string,
    expanded: boolean,
    current: boolean,
    dotFill: ImageData,
    fileIcon: ImageData,
): TreeViewRowJs {
    return {
        id,
        label,
        level: 1,
        has_children: true,
        expanded,
        current,
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

function treeViewRowPlaygroundLeaf(
    id: string,
    current: boolean,
    dotFill: ImageData,
    fileIcon: ImageData,
): TreeViewRowJs {
    return {
        id,
        label: "Playground",
        level: 2,
        has_children: false,
        expanded: false,
        current,
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

function buildVisibleNavRows(
    selectedPageId: string,
    expandedFolderIds: ReadonlySet<string>,
    dotFill: ImageData,
    fileIcon: ImageData,
): TreeViewRowJs[] {
    const rows: TreeViewRowJs[] = [];
    for (const entry of GALLERY_SIDEBAR_NAV) {
        const isOpen = expandedFolderIds.has(entry.folderId);
        const selectionInFolder = selectedPageId === entry.leafId;
        rows.push(
            treeViewRowFolder(
                entry.folderId,
                entry.label,
                isOpen,
                selectionInFolder && !isOpen,
                dotFill,
                fileIcon,
            ),
        );
        if (isOpen) {
            rows.push(
                treeViewRowPlaygroundLeaf(
                    entry.leafId,
                    selectionInFolder,
                    dotFill,
                    fileIcon,
                ),
            );
        }
    }
    return rows;
}

type GalleryStateNavHandle = {
    selected_page_id: string;
};

/** Owns expand state and rebuilds **`GallerySidebarNav.rows`** from **`GalleryState.selected_page_id`**. */
export function wireGallerySidebarNav(
    nav: GallerySidebarNavHandle,
    galleryState: GalleryStateNavHandle,
    dotFill: ImageData,
    fileIcon: ImageData,
): void {
    const expandedFolderIds = new Set<string>();

    const pushToSlint = () => {
        const rows = buildVisibleNavRows(
            galleryState.selected_page_id,
            expandedFolderIds,
            dotFill,
            fileIcon,
        );
        assignProperties(nav, {
            rows: new slint.ArrayModel(rows),
        });
    };

    nav.row_toggle_requested = (id: string) => {
        if (!FOLDER_IDS.has(id)) {
            return;
        }
        if (expandedFolderIds.has(id)) {
            expandedFolderIds.delete(id);
        } else {
            expandedFolderIds.add(id);
        }
        pushToSlint();
    };

    nav.row_current_requested = (id: string) => {
        if (!PLAYGROUND_LEAF_IDS.has(id)) {
            return;
        }
        galleryState.selected_page_id = id;
        pushToSlint();
    };

    nav.row_secondary_actions_requested = () => {};

    pushToSlint();
}

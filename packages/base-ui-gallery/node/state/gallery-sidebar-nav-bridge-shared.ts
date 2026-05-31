import { assignProperties } from "slint-bridge-kit";
import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";
import {
  GALLERY_SIDEBAR_NAV,
  STUB_BY_PAGE_ID,
} from "./base-ui-gallery-nav.ts";

const PLAYGROUND_LEAF_IDS = new Set<string>(
  GALLERY_SIDEBAR_NAV.flatMap((e) => e.leaves.map((l) => l.id)),
);
const FOLDER_IDS = new Set<string>(
  GALLERY_SIDEBAR_NAV.map((e) => e.folderId),
);

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

export type GalleryStubContentHandle = {
  title: string;
  upstream_path: string;
  target_phase: number;
  notes: string;
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

function treeViewRowNavLeaf(
  id: string,
  leafLabel: string,
  current: boolean,
  dotFill: ImageData,
  fileIcon: ImageData,
): TreeViewRowJs {
  return {
    id,
    label: leafLabel,
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
    const selectionInFolder = entry.leaves.some((l) => l.id === selectedPageId);
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
      for (const leaf of entry.leaves) {
        rows.push(
          treeViewRowNavLeaf(
            leaf.id,
            leaf.label,
            selectedPageId === leaf.id,
            dotFill,
            fileIcon,
          ),
        );
      }
    }
  }
  return rows;
}

type GalleryStateNavHandle = {
  selected_page_id: string;
};

function applyStubContent(
  stubContent: GalleryStubContentHandle,
  pageId: string,
): void {
  const meta = STUB_BY_PAGE_ID.get(pageId);
  if (!meta) {
    return;
  }
  assignProperties(stubContent, {
    title: meta.title,
    upstream_path: meta.upstreamPath,
    target_phase: meta.targetPhase,
    notes: meta.notes,
  });
}

/** Owns expand state and rebuilds GallerySidebarNav.rows from GalleryState.selected_page_id. */
export function wireGallerySidebarNav(
  nav: GallerySidebarNavHandle,
  galleryState: GalleryStateNavHandle,
  stubContent: GalleryStubContentHandle,
  dotFill: ImageData,
  fileIcon: ImageData,
): void {
  const expandedFolderIds = new Set<string>([
    "folder-welcome",
    "folder-foundation",
  ]);

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
    if (id.startsWith("stub-")) {
      applyStubContent(stubContent, id);
    }
    pushToSlint();
  };

  nav.row_secondary_actions_requested = () => {};

  pushToSlint();
}

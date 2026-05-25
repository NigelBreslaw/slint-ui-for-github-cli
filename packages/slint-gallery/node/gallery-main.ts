import type { ImageData } from "slint-ui";
import {
  wireIndexMultiSelect,
  ACTION_LIST_LISTBOX_MULTI_ROW_LABELS,
  ACTION_LIST_MENU_MULTI_ROW_LABELS,
  type ActionListGalleryMultiSelectHandle,
} from "./state/gallery-action-list-multi-select-bridge-shared.ts";
import {
  wireGalleryFilteredActionListDefault,
  wireGalleryFilteredActionListLong,
  wireGalleryFilteredActionListMulti,
  wireGalleryFilteredActionListSelectAll,
  type GalleryFilteredActionListHandle,
  type GalleryFilteredActionListMultiHandle,
  type GalleryFilteredActionListSelectAllHandle,
} from "./state/gallery-filtered-action-list-bridge-shared.ts";
import {
  wireGallerySelectPanelCancel,
  wireGallerySelectPanelDisabled,
  wireGallerySelectPanelFetchLines,
  wireGallerySelectPanelModalMulti,
  type GallerySelectPanelCancelHandle,
  type GallerySelectPanelModalMultiHandle,
} from "./state/gallery-select-panel-bridge-shared.ts";
import {
  wireGalleryTreeViewListModels,
  type GalleryTreeViewListModelsHandle,
} from "./state/gallery-tree-view-list-models-bridge-shared.ts";
import {
  wireGallerySidebarNav,
  type GallerySidebarNavHandle,
} from "./state/gallery-sidebar-nav-bridge-shared.ts";

type GalleryWindowModule = {
  GalleryWindow: new () => {
    show(): void;
    hide(): void;
    GalleryState: {
      selected_page_id: string;
    };
    GallerySidebarNav: GallerySidebarNavHandle;
    GalleryActionListMenuMultiSelect: ActionListGalleryMultiSelectHandle;
    GalleryActionListListboxMultiSelect: ActionListGalleryMultiSelectHandle;
    GalleryFilteredActionListDefault: GalleryFilteredActionListHandle;
    GalleryFilteredActionListLong: GalleryFilteredActionListHandle;
    GalleryFilteredActionListMulti: GalleryFilteredActionListMultiHandle;
    GalleryFilteredActionListSelectAll: GalleryFilteredActionListSelectAllHandle;
    GallerySelectPanelDefault: GalleryFilteredActionListMultiHandle;
    GallerySelectPanelSingle: GalleryFilteredActionListHandle;
    GallerySelectPanelDisabled: GalleryFilteredActionListMultiHandle;
    GallerySelectPanelCancel: GallerySelectPanelCancelHandle;
    GallerySelectPanelModalMulti: GallerySelectPanelModalMultiHandle;
    GallerySelectPanelFetch: GalleryFilteredActionListHandle;
    GalleryTreeViewListModels: GalleryTreeViewListModelsHandle;
    Icons: {
      dot_fill: ImageData;
      file: ImageData;
    };
  };
};

export async function runGallery(galleryWindowPath: string): Promise<void> {
  const slint = await import("slint-ui");

  const ui = slint.loadFile(galleryWindowPath) as GalleryWindowModule;
  const window = new ui.GalleryWindow();

  wireIndexMultiSelect(
    window.GalleryActionListMenuMultiSelect,
    ACTION_LIST_MENU_MULTI_ROW_LABELS,
    [],
  );
  wireIndexMultiSelect(
    window.GalleryActionListListboxMultiSelect,
    ACTION_LIST_LISTBOX_MULTI_ROW_LABELS,
    [0],
  );
  wireGalleryFilteredActionListDefault(window.GalleryFilteredActionListDefault);
  wireGalleryFilteredActionListLong(
    window.GalleryFilteredActionListLong,
    window.Icons.dot_fill,
  );
  wireGalleryFilteredActionListMulti(window.GalleryFilteredActionListMulti);
  wireGalleryFilteredActionListSelectAll(
    window.GalleryFilteredActionListSelectAll,
  );
  wireGalleryFilteredActionListMulti(window.GallerySelectPanelDefault);
  wireGalleryFilteredActionListDefault(window.GallerySelectPanelSingle);
  wireGallerySelectPanelDisabled(window.GallerySelectPanelDisabled);
  wireGallerySelectPanelCancel(window.GallerySelectPanelCancel);
  wireGallerySelectPanelModalMulti(window.GallerySelectPanelModalMulti);
  wireGallerySelectPanelFetchLines(window.GallerySelectPanelFetch);
  wireGalleryTreeViewListModels(
    window.GalleryTreeViewListModels,
    window.Icons.dot_fill,
    window.Icons.file,
  );
  wireGallerySidebarNav(
    window.GallerySidebarNav,
    window.GalleryState,
    window.Icons.dot_fill,
    window.Icons.file,
  );

  window.show();
  await slint.runEventLoop();
  window.hide();
}

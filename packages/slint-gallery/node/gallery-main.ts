import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";
import {
  wireIndexMultiSelect,
  ACTION_LIST2_LISTBOX_MULTI_ROW_LABELS,
  ACTION_LIST2_MENU_MULTI_ROW_LABELS,
  type ActionListGalleryMultiSelectHandle,
} from "./state/gallery-action-list-multi-select-bridge-shared.ts";
import {
  wireGalleryFilteredActionList2Default,
  wireGalleryFilteredActionList2Long,
  wireGalleryFilteredActionList2Multi,
  wireGalleryFilteredActionList2SelectAll,
  type GalleryFilteredActionList2Handle,
  type GalleryFilteredActionList2MultiHandle,
  type GalleryFilteredActionList2SelectAllHandle,
} from "./state/gallery-filtered-action-list2-bridge-shared.ts";
import {
  wireGallerySelectPanel2Cancel,
  wireGallerySelectPanel2Disabled,
  wireGallerySelectPanel2FetchLines,
  wireGallerySelectPanel2ModalMulti,
  type GallerySelectPanel2CancelHandle,
  type GallerySelectPanel2ModalMultiHandle,
} from "./state/gallery-select-panel2-bridge-shared.ts";
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
    GalleryActionList2MenuMultiSelect: ActionListGalleryMultiSelectHandle;
    GalleryActionList2ListboxMultiSelect: ActionListGalleryMultiSelectHandle;
    GalleryFilteredActionList2Default: GalleryFilteredActionList2Handle;
    GalleryFilteredActionList2Long: GalleryFilteredActionList2Handle;
    GalleryFilteredActionList2Multi: GalleryFilteredActionList2MultiHandle;
    GalleryFilteredActionList2SelectAll: GalleryFilteredActionList2SelectAllHandle;
    GallerySelectPanel2Default: GalleryFilteredActionList2MultiHandle;
    GallerySelectPanel2Single: GalleryFilteredActionList2Handle;
    GallerySelectPanel2Disabled: GalleryFilteredActionList2MultiHandle;
    GallerySelectPanel2Cancel: GallerySelectPanel2CancelHandle;
    GallerySelectPanel2ModalMulti: GallerySelectPanel2ModalMultiHandle;
    GallerySelectPanel2Fetch: GalleryFilteredActionList2Handle;
    GalleryTreeViewListModels: GalleryTreeViewListModelsHandle;
    Icons: {
      dot_fill: ImageData;
      file: ImageData;
    };
  };
};

const ui = slint.loadFile(
  new URL("../ui/gallery-window.slint", import.meta.url),
) as GalleryWindowModule;

const window = new ui.GalleryWindow();

wireIndexMultiSelect(
  window.GalleryActionList2MenuMultiSelect,
  ACTION_LIST2_MENU_MULTI_ROW_LABELS,
  [],
);
wireIndexMultiSelect(
  window.GalleryActionList2ListboxMultiSelect,
  ACTION_LIST2_LISTBOX_MULTI_ROW_LABELS,
  [0],
);
wireGalleryFilteredActionList2Default(window.GalleryFilteredActionList2Default);
wireGalleryFilteredActionList2Long(
  window.GalleryFilteredActionList2Long,
  window.Icons.dot_fill,
);
wireGalleryFilteredActionList2Multi(window.GalleryFilteredActionList2Multi);
wireGalleryFilteredActionList2SelectAll(window.GalleryFilteredActionList2SelectAll);
wireGalleryFilteredActionList2Multi(window.GallerySelectPanel2Default);
wireGalleryFilteredActionList2Default(window.GallerySelectPanel2Single);
wireGallerySelectPanel2Disabled(window.GallerySelectPanel2Disabled);
wireGallerySelectPanel2Cancel(window.GallerySelectPanel2Cancel);
wireGallerySelectPanel2ModalMulti(window.GallerySelectPanel2ModalMulti);
wireGallerySelectPanel2FetchLines(window.GallerySelectPanel2Fetch);
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
process.exit(0);

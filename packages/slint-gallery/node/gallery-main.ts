import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";
import {
  wireActionListGalleryMultiSelect,
  type ActionListGalleryMultiSelectHandle,
} from "./state/gallery-action-list-multi-select-bridge-shared.ts";
import {
  wireGalleryFilteredActionList2Default,
  wireGalleryFilteredActionList2Long,
  wireGalleryFilteredActionList2Multi,
  type GalleryFilteredActionList2Handle,
  type GalleryFilteredActionList2MultiHandle,
} from "./state/gallery-filtered-action-list2-bridge-shared.ts";
import {
  wireGallerySelectPanelMultiSelect,
  type GallerySelectPanelMultiHandle,
} from "./state/gallery-select-panel-multi-bridge-shared.ts";
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
    GalleryActionListMultiSelect: ActionListGalleryMultiSelectHandle;
    GalleryActionListListboxMultiSelect: ActionListGalleryMultiSelectHandle;
    GallerySelectPanelMulti: GallerySelectPanelMultiHandle;
    GalleryFilteredActionList2Default: GalleryFilteredActionList2Handle;
    GalleryFilteredActionList2Long: GalleryFilteredActionList2Handle;
    GalleryFilteredActionList2Multi: GalleryFilteredActionList2MultiHandle;
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

wireActionListGalleryMultiSelect(window.GalleryActionListMultiSelect);
wireActionListGalleryMultiSelect(
  window.GalleryActionListListboxMultiSelect,
);
wireGallerySelectPanelMultiSelect(window.GallerySelectPanelMulti);
wireGalleryFilteredActionList2Default(window.GalleryFilteredActionList2Default);
wireGalleryFilteredActionList2Long(
  window.GalleryFilteredActionList2Long,
  window.Icons.dot_fill,
);
wireGalleryFilteredActionList2Multi(window.GalleryFilteredActionList2Multi);
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

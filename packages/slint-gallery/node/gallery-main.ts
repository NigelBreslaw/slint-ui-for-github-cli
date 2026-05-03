import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";
import { assignProperties } from "slint-bridge-kit";
import {
  wireActionListGalleryMultiSelect,
  type ActionListGalleryMultiSelectHandle,
} from "./state/gallery-action-list-multi-select-bridge-shared.ts";
import {
    wireGalleryFilteredActionListDefault,
    wireGalleryFilteredActionListLong,
    wireGalleryFilteredActionListSelectAll,
    type GalleryFilteredActionListHandle,
    type GalleryFilteredActionListSelectAllHandle,
} from "./state/gallery-filtered-action-list-bridge-shared.ts";
import {
  wireGallerySelectPanelMultiSelect,
  type GallerySelectPanelMultiHandle,
} from "./state/gallery-select-panel-multi-bridge-shared.ts";
import {
  wireGalleryTreeViewListModels,
  type GalleryTreeViewListModelsHandle,
} from "./state/gallery-tree-view-list-models-bridge-shared.ts";

type GalleryWindowModule = {
  GalleryWindow: new () => {
    show(): void;
    hide(): void;
    GalleryState: {
      selected_group_index: number;
    };
    GalleryActionListMultiSelect: ActionListGalleryMultiSelectHandle;
    GalleryActionListListboxMultiSelect: ActionListGalleryMultiSelectHandle;
    GallerySelectPanelMulti: GallerySelectPanelMultiHandle;
    GalleryFilteredActionListDefault: GalleryFilteredActionListHandle;
    GalleryFilteredActionListLong: GalleryFilteredActionListHandle;
    GalleryFilteredActionListSelectAll: GalleryFilteredActionListSelectAllHandle;
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

assignProperties(window.GalleryState, {
  selected_group_index: 0,
});

wireActionListGalleryMultiSelect(window.GalleryActionListMultiSelect);
wireActionListGalleryMultiSelect(
  window.GalleryActionListListboxMultiSelect,
);
wireGallerySelectPanelMultiSelect(window.GallerySelectPanelMulti);
wireGalleryFilteredActionListDefault(
  window.GalleryFilteredActionListDefault,
  window.Icons.dot_fill,
);
wireGalleryFilteredActionListLong(
  window.GalleryFilteredActionListLong,
  window.Icons.dot_fill,
);
wireGalleryFilteredActionListSelectAll(
  window.GalleryFilteredActionListSelectAll,
  window.Icons.dot_fill,
);
wireGalleryTreeViewListModels(
  window.GalleryTreeViewListModels,
  window.Icons.dot_fill,
  window.Icons.file,
);

window.show();
await slint.runEventLoop();
window.hide();
process.exit(0);

import * as slint from "slint-ui";
import { assignProperties } from "slint-bridge-kit";
import {
  wireActionList2GalleryMultiSelect,
  type ActionList2GalleryMultiSelectHandle,
} from "./gallery/gallery-action-list2-multi-select-bridge-shared.ts";

type GalleryWindowModule = {
  GalleryWindow: new () => {
    show(): void;
    hide(): void;
    GalleryState: {
      selected_group_index: number;
    };
    GalleryActionList2MultiSelect: ActionList2GalleryMultiSelectHandle;
    GalleryActionList2ListboxMultiSelect: ActionList2GalleryMultiSelectHandle;
  };
};

const ui = slint.loadFile(
  new URL("./gallery/gallery-window.slint", import.meta.url),
) as GalleryWindowModule;

const window = new ui.GalleryWindow();

assignProperties(window.GalleryState, {
  selected_group_index: 0,
});

wireActionList2GalleryMultiSelect(window.GalleryActionList2MultiSelect);
wireActionList2GalleryMultiSelect(
  window.GalleryActionList2ListboxMultiSelect,
);

window.show();
await slint.runEventLoop();
window.hide();
process.exit(0);

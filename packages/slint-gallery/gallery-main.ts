import * as slint from "slint-ui";
import { assignProperties } from "slint-bridge-kit";
import {
  wireGalleryActionList2MultiSelect,
  type GalleryActionList2MultiSelectHandle,
} from "./gallery/gallery-action-list2-multi-select-bridge.ts";

type GalleryWindowModule = {
  GalleryWindow: new () => {
    show(): void;
    hide(): void;
    GalleryState: {
      selected_group_index: number;
    };
    GalleryActionList2MultiSelect: GalleryActionList2MultiSelectHandle;
  };
};

const ui = slint.loadFile(
  new URL("./gallery/gallery-window.slint", import.meta.url),
) as GalleryWindowModule;

const window = new ui.GalleryWindow();

assignProperties(window.GalleryState, {
  selected_group_index: 0,
});

wireGalleryActionList2MultiSelect(window.GalleryActionList2MultiSelect);

window.show();
await slint.runEventLoop();
window.hide();
process.exit(0);

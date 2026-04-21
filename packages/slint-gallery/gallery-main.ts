import * as slint from "slint-ui";
import { assignProperties } from "slint-bridge-kit";
import {
  wireActionListGalleryMultiSelect,
  type ActionListGalleryMultiSelectHandle,
} from "./gallery-action-list-multi-select-bridge-shared.ts";

type GalleryWindowModule = {
  GalleryWindow: new () => {
    show(): void;
    hide(): void;
    GalleryState: {
      selected_group_index: number;
    };
    GalleryActionListMultiSelect: ActionListGalleryMultiSelectHandle;
    GalleryActionListListboxMultiSelect: ActionListGalleryMultiSelectHandle;
  };
};

const ui = slint.loadFile(
  new URL("./gallery-window.slint", import.meta.url),
) as GalleryWindowModule;

const window = new ui.GalleryWindow();

assignProperties(window.GalleryState, {
  selected_group_index: 0,
});

wireActionListGalleryMultiSelect(window.GalleryActionListMultiSelect);
wireActionListGalleryMultiSelect(
  window.GalleryActionListListboxMultiSelect,
);

window.show();
await slint.runEventLoop();
window.hide();
process.exit(0);

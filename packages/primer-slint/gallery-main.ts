import * as slint from "slint-ui";
import { assignProperties } from "slint-bridge-kit";

type GalleryWindowModule = {
  GalleryWindow: new () => {
    show(): void;
    hide(): void;
    GalleryState: {
      selected_group_index: number;
    };
  };
};

const ui = slint.loadFile(
  new URL("./gallery/gallery-window.slint", import.meta.url),
) as GalleryWindowModule;

const window = new ui.GalleryWindow();

assignProperties(window.GalleryState, {
  selected_group_index: 0,
});

window.show();
await slint.runEventLoop();
window.hide();
process.exit(0);

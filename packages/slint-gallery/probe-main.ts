/**
 * Slint probe: dialog card (experimental FlexboxLayout column) + Flickable body. Uses SLINT_ENABLE_EXPERIMENTAL_FEATURES=1.
 * Debug toggles and body density are in the .slint window. No Primer imports.
 * Run: `pnpm --filter slint-gallery run probe`
 */
import * as slint from "slint-ui";

type ProbeModule = {
  ProbeWindow: new () => {
    show(): void;
    hide(): void;
  };
};

const ui = slint.loadFile(
  new URL("./probe-window.slint", import.meta.url),
) as ProbeModule;

const window = new ui.ProbeWindow();
window.show();
await slint.runEventLoop();
window.hide();
process.exit(0);

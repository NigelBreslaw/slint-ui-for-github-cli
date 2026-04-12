import * as slint from "slint-ui";
import type { ImageData } from "slint-ui";
import type { MainWindowInstance, SlintDataTableImage } from "../../bridges/node/slint-interface.ts";

/**
 * Copies RGBA bytes into a slint-ui **`ImageData`** instance. Plain `{ width, height, data }` objects
 * cannot be marshalled through **`ArrayModel`** when nested inside structs (Rust FFI error).
 */
export function toSlintImageData(payload: SlintDataTableImage): ImageData {
  const w = payload.width;
  const h = payload.height;
  const img = new slint.private_api.SlintImageData(w, h);
  const dest = img.data;
  const src = Buffer.isBuffer(payload.data) ? payload.data : Buffer.from(payload.data);
  if (src.length !== dest.length) {
    throw new Error(
      `toSlintImageData: expected ${dest.length} bytes for ${w}×${h} RGBA, got ${src.length}`,
    );
  }
  dest.set(src);
  return img as ImageData;
}

export type ProjectBoardDataTableIcons = {
  placeholder: ImageData;
  pullRequest: ImageData;
  issue: ImageData;
  draftIssue: ImageData;
};

/**
 * Reads the bundled **`Icons`** global from the Slint runtime (`assets/icons.slint`).
 * Icons must be declared with `@image-url` there so they are included in the app bundle.
 */
export function getProjectBoardDataTableIconsFromWindow(window: MainWindowInstance): ProjectBoardDataTableIcons {
  const { Icons } = window;
  return {
    placeholder: Icons.cell_placeholder,
    pullRequest: Icons.pr,
    issue: Icons.issue,
    draftIssue: Icons.issue_draft,
  };
}

import { fileURLToPath, pathToFileURL } from "node:url";
import { runGallery } from "./gallery-main.ts";

function defaultGalleryWindowPath(): string {
  return fileURLToPath(
    new URL("../ui/gallery-window.slint", import.meta.url),
  );
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  process.env.SLINT_ENABLE_EXPERIMENTAL_FEATURES ??= "1";
  await runGallery(defaultGalleryWindowPath());
  process.exit(0);
}

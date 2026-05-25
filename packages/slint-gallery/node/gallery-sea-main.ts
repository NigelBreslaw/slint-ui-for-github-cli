import { mkdtemp, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  extractGalleryAssets,
  galleryWindowSlintPath,
} from "./lib/extract-gallery-assets.ts";

process.env.SLINT_ENABLE_EXPERIMENTAL_FEATURES = "1";

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function seaAssetToBuffer(raw: ArrayBuffer | Buffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(raw)) {
    return raw;
  }
  if (raw instanceof ArrayBuffer) {
    return Buffer.from(raw);
  }
  return Buffer.from(raw);
}

async function materializeSeaAsset(name: string, fileName: string): Promise<string> {
  const { getRawAsset } = await import("node:sea");
  const bytes = seaAssetToBuffer(getRawAsset(name));
  const dir = await mkdtemp(join(tmpdir(), "primer-gallery-sea-"));
  const dest = join(dir, fileName);
  await writeFile(dest, bytes);
  return dest;
}

async function resolveGalleryWindowPath(): Promise<string> {
  process.env.NAPI_RS_NATIVE_LIBRARY_PATH = await materializeSeaAsset(
    "slint-ui.darwin-arm64.node",
    "slint-ui.darwin-arm64.node",
  );
  const tarPath = await materializeSeaAsset(
    "gallery-assets.tar",
    "gallery-assets.tar",
  );
  const extractedRoot = await extractGalleryAssets(tarPath);
  return galleryWindowSlintPath(extractedRoot);
}

void (async () => {
  process.env.GALLERY_PACK_ENTRY = "1";
  const galleryWindowPath = await resolveGalleryWindowPath();
  const { runGallery } = await import("./gallery-main.ts");
  await runGallery(galleryWindowPath);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

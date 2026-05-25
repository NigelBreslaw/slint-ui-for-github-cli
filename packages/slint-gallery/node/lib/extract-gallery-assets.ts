import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const EXTRACTED_MARKER = ".extracted";

/** Extracts gallery asset tar to a stable temp dir; returns extraction root. */
export async function extractGalleryAssets(tarPath: string): Promise<string> {
  const tarBytes = await readFile(tarPath);
  const hash = createHash("sha256").update(tarBytes).digest("hex").slice(0, 16);
  const dest = join(tmpdir(), "primer-slint-gallery", hash);
  const marker = join(dest, EXTRACTED_MARKER);

  try {
    await access(marker, constants.F_OK);
    return dest;
  } catch {
    // not extracted yet
  }

  await mkdir(dest, { recursive: true });
  const tmpTar = join(dest, "gallery-assets.tar");
  await writeFile(tmpTar, tarBytes);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("tar", ["-xf", tmpTar, "-C", dest], { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar exited with code ${code}`));
    });
  });

  await writeFile(marker, "");
  return dest;
}

export function galleryWindowSlintPath(extractedRoot: string): string {
  return join(
    extractedRoot,
    "packages",
    "slint-gallery",
    "ui",
    "gallery-window.slint",
  );
}

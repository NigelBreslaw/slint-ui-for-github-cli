import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as slint from "slint-ui";
import type { SlintDataTableImage } from "../../bridges/node/slint-interface.ts";

const assetsDir = fileURLToPath(new URL("../../assets/16px", import.meta.url));

export type ProjectBoardDataTableIcons = {
  placeholder: SlintDataTableImage;
  pullRequest: SlintDataTableImage;
  issue: SlintDataTableImage;
  draftIssue: SlintDataTableImage;
};

async function rasterizeSvg16(name: string): Promise<SlintDataTableImage> {
  const buf = readFileSync(join(assetsDir, name));
  const { data, info } = await sharp(buf).resize(16, 16).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
}

function placeholder1x1(): SlintDataTableImage {
  const img = new slint.private_api.SlintImageData(1, 1);
  return { width: img.width, height: img.height, data: img.data };
}

let cache: Promise<ProjectBoardDataTableIcons> | null = null;

/** Loads SVG assets once; used when building project-board `DataTable` rows in the bridge. */
export function getProjectBoardDataTableIcons(): Promise<ProjectBoardDataTableIcons> {
  if (cache === null) {
    cache = (async () => {
      const [pullRequest, issue, draftIssue] = await Promise.all([
        rasterizeSvg16("git-pull-request.svg"),
        rasterizeSvg16("issue-opened.svg"),
        rasterizeSvg16("issue-draft.svg"),
      ]);
      return {
        placeholder: placeholder1x1(),
        pullRequest,
        issue,
        draftIssue,
      };
    })();
  }
  return cache;
}

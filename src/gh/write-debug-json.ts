import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * When `GH_DEBUG_JSON=1`, writes pretty-printed JSON under `debug-json/` (gitignored).
 * Do not enable while screen-sharing; API responses may include PII or account details.
 */
export function writeDebugJsonStem(stem: string, value: unknown): void {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  const dir = join(process.cwd(), "debug-json");
  mkdirSync(dir, { recursive: true });
  const safe = stem.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const filePath = join(dir, `${safe}.json`);
  writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

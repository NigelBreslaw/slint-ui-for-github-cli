import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Always writes pretty-printed JSON under `debug-json/` (gitignored), independent of
 * `GH_DEBUG_JSON`. Used for Time reporting project snapshots; may include account or org data.
 */
export function writeTimeReportingDebugJson(stem: string, value: unknown): void {
  const dir = join(process.cwd(), "debug-json");
  mkdirSync(dir, { recursive: true });
  const safe = stem.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const filePath = join(dir, `${safe}.json`);
  writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

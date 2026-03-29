import { fetchProjectV2NodeGraphql } from "../gh/graphql-project-v2-node.ts";
import { readTimeReportingSelectedProjectKv } from "./time-reporting-selected-project-kv.ts";
import { sanitizeTimeReportingDebugStem } from "./sanitize-time-reporting-debug-stem.ts";
import { writeTimeReportingDebugJson } from "./write-time-reporting-debug-json.ts";

/**
 * Writes `debug-json/time-reporting--project-v2--<sanitizedId>.json` with the raw GraphQL
 * response body, or `…--error.json` on failure or unexpected throw.
 */
export async function dumpTimeReportingProjectNodeToDebugJson(nodeId: string): Promise<void> {
  const stemBase = `time-reporting--project-v2--${sanitizeTimeReportingDebugStem(nodeId)}`;
  try {
    const res = await fetchProjectV2NodeGraphql(nodeId);
    if (res.ok) {
      writeTimeReportingDebugJson(stemBase, res.value);
    } else {
      writeTimeReportingDebugJson(`${stemBase}--error`, { error: res.error });
    }
  } catch (e) {
    console.error("[time-reporting] debug dump failed:", e);
    try {
      writeTimeReportingDebugJson(`${stemBase}--error`, {
        error: e instanceof Error ? e.message : String(e),
      });
    } catch {
      /* ignore disk errors after primary failure */
    }
  }
}

/**
 * When `GH_DEBUG_JSON=1` (e.g. `pnpm dev:debug`), re-fetch and write the Time reporting project
 * snapshot if one is stored in KV—so debug-json is refreshed on startup without opening the picker.
 */
export function maybeDumpTimeReportingProjectFromKvWhenDebugJsonEnv(): void {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  const stored = readTimeReportingSelectedProjectKv();
  if (stored === null) {
    return;
  }
  void dumpTimeReportingProjectNodeToDebugJson(stored.nodeId).catch((e) => {
    console.error("[debug-json] time-reporting project dump failed:", e);
  });
}

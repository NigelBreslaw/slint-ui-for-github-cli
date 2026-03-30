import { fetchAllProjectV2ItemsGraphql } from "../gh/graphql-project-v2-items-all.ts";
import { fetchProjectV2NodeGraphql } from "../gh/graphql-project-v2-node.ts";
import { parseProjectV2NodeFromGraphqlResponse } from "../schemas/gh-graphql-project-v2-node-response.ts";
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
      const parsed = parseProjectV2NodeFromGraphqlResponse(res.value);
      if (!parsed.ok) {
        console.warn(
          "[time-reporting] GraphQL body did not match ProjectV2 shape:",
          parsed.message,
        );
      }
      writeTimeReportingDebugJson(stemBase, res.value);
      await dumpTimeReportingProjectItemsToDebugJson(nodeId);
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

async function dumpTimeReportingProjectItemsToDebugJson(nodeId: string): Promise<void> {
  const stemBase = `time-reporting--project-v2-items--${sanitizeTimeReportingDebugStem(nodeId)}`;
  try {
    const res = await fetchAllProjectV2ItemsGraphql(nodeId);
    if (res.ok) {
      const itemsFetched = res.items.length;
      if (itemsFetched !== res.itemsTotalCount) {
        console.warn(
          "[time-reporting] project items count mismatch: itemsFetched=",
          itemsFetched,
          "itemsTotalCount=",
          res.itemsTotalCount,
        );
      }
      writeTimeReportingDebugJson(stemBase, {
        source: "graphql-project-v2-items-all",
        projectNodeId: nodeId,
        projectNumber: res.projectNumber,
        itemsTotalCount: res.itemsTotalCount,
        itemsFetched,
        items: res.items,
      });
    } else {
      writeTimeReportingDebugJson(`${stemBase}--error`, { error: res.error });
    }
  } catch (e) {
    console.error("[time-reporting] items debug dump failed:", e);
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

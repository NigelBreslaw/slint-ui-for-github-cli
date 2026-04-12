import * as slint from "slint-ui";
import { assignProperties } from "slint-bridge-kit";
import type { MainWindowInstance } from "../../bridges/node/slint-interface.ts";
import type { ProjectV2NodeSnapshot } from "../schemas/gh-graphql-projectsv2-page.ts";
import { fetchAllProjectsV2ForOrgGraphql } from "./graphql-projects-v2.ts";

const SLINT_UI_ORG = "slint-ui";

/** Row shape must match `ProjectRow` in `app-state.slint`. */
export type SlintProjectRow = {
  id: string;
  title: string;
  number: number;
  url: string;
};

let nodesCache: ProjectV2NodeSnapshot[] | null = null;
let lastFetchResult: { ok: true; value: unknown[] } | { ok: false; error: string } | null = null;

/** Same payload shape as `fetchAllProjectsV2ForOrgGraphql` for debug dump reuse. */
export function getLastSlintUiOrgProjectsFetch():
  | { ok: true; value: unknown[] }
  | { ok: false; error: string }
  | null {
  return lastFetchResult;
}

export function clearSlintUiOrgProjectsCache(): void {
  nodesCache = null;
  lastFetchResult = null;
}

function mapOpenBoardsToRows(nodes: readonly ProjectV2NodeSnapshot[]): SlintProjectRow[] {
  const rows: SlintProjectRow[] = [];
  for (const n of nodes) {
    if (n.closed) {
      continue;
    }
    rows.push({ id: n.id, title: n.title, number: n.number, url: n.url });
  }
  return rows;
}

/** Default page size for the time-reporting project picker; assigned to `AppState.projects_picker_page_size` at startup. */
export const DEFAULT_PROJECT_PICKER_PAGE_SIZE = 25;

function clampPageIndex(pageIndex: number, total: number, pageSize: number): number {
  if (total <= 0) {
    return 0;
  }
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return Math.max(0, Math.min(pageIndex, pageCount - 1));
}

function effectivePickerPageSize(window: MainWindowInstance): number {
  const n = window.AppState.projects_picker_page_size;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_PROJECT_PICKER_PAGE_SIZE;
}

function filterProjectRows(rows: readonly SlintProjectRow[], query: string): SlintProjectRow[] {
  const q = query.trim().toLowerCase();
  if (q === "") {
    return [...rows];
  }
  return rows.filter((r) => {
    const numStr = String(r.number);
    return (
      r.title.toLowerCase().includes(q) ||
      numStr.includes(q) ||
      r.url.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });
}

/** Full filtered row list for **`query`** (search/filter); does not page. */
function getFilteredProjectRows(query: string): SlintProjectRow[] {
  const base = nodesCache === null ? [] : mapOpenBoardsToRows(nodesCache);
  return filterProjectRows(base, query);
}

/**
 * Updates **`projects_filtered_model`** to one page of results and syncs count / page index.
 * **`searchQuery`** defaults to **`window.AppState.projects_search`**; pass the string from
 * **`project_search_changed`** so the slice matches the query even if TS lags the Slint write.
 */
export function applyProjectPickerSliceToWindow(
  window: MainWindowInstance,
  pageIndex: number,
  searchQuery?: string,
): void {
  const q = searchQuery ?? window.AppState.projects_search;
  const rows = getFilteredProjectRows(q);
  const pageSize = effectivePickerPageSize(window);
  if (rows.length === 0) {
    assignProperties(window.AppState, {
      projects_filtered_model: new slint.ArrayModel<SlintProjectRow>([]),
      projects_filtered_count: 0,
      projects_picker_page_index: 0,
    });
    return;
  }
  const idx = clampPageIndex(pageIndex, rows.length, pageSize);
  const start = idx * pageSize;
  const slice = rows.slice(start, start + pageSize);
  assignProperties(window.AppState, {
    projects_filtered_model: new slint.ArrayModel<SlintProjectRow>(slice),
    projects_filtered_count: rows.length,
    projects_picker_page_index: idx,
  });
}

export async function refreshSlintUiOrgProjectsCache(): Promise<
  | {
      ok: true;
      nodes: ProjectV2NodeSnapshot[];
      error?: undefined;
    }
  | { ok: false; error: string; nodes?: undefined }
> {
  const res = await fetchAllProjectsV2ForOrgGraphql(SLINT_UI_ORG);
  lastFetchResult = res;
  if (!res.ok) {
    nodesCache = null;
    return { ok: false, error: res.error };
  }
  nodesCache = res.value as ProjectV2NodeSnapshot[];
  return { ok: true, nodes: nodesCache };
}

/** Open org boards only; returns null if cache is empty or id is unknown. */
export function findSlintUiOpenProjectRowByNodeId(nodeId: string): SlintProjectRow | null {
  if (nodesCache === null) {
    return null;
  }
  for (const n of nodesCache) {
    if (n.closed) {
      continue;
    }
    if (n.id === nodeId) {
      return { id: n.id, title: n.title, number: n.number, url: n.url };
    }
  }
  return null;
}

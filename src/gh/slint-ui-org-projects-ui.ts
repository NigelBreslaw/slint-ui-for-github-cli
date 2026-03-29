import { ArrayModel } from "slint-ui";
import type { ProjectV2NodeSnapshot } from "../schemas/gh-graphql-projectsv2-page.ts";
import { fetchAllProjectsV2ForOrgGraphql } from "./graphql-projects-v2.ts";

const SLINT_UI_ORG = "slint-ui";

/** Row shape must match `ProjectRow` in `app-state.slint`. */
export type SlintProjectRow = {
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
    rows.push({ title: n.title, number: n.number, url: n.url });
  }
  return rows;
}

function filterProjectRows(rows: readonly SlintProjectRow[], query: string): SlintProjectRow[] {
  const q = query.trim().toLowerCase();
  if (q === "") {
    return [...rows];
  }
  return rows.filter((r) => {
    const numStr = String(r.number);
    return (
      r.title.toLowerCase().includes(q) || numStr.includes(q) || r.url.toLowerCase().includes(q)
    );
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

export function buildFilteredProjectsModel(query: string): ArrayModel<SlintProjectRow> {
  const base = nodesCache === null ? [] : mapOpenBoardsToRows(nodesCache);
  return new ArrayModel(filterProjectRows(base, query));
}

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ProjectV2NodeSnapshot } from "../schemas/gh-graphql-projectsv2-page.ts";
import { fetchAllProjectsV2ForOrgGraphql } from "./graphql-projects-v2.ts";
import {
  dumpProjectItemsGraphqlBatched,
  fetchViewerLoginGraphql,
} from "./graphql-project-items-batch.ts";
import { mapGhExecError } from "./map-gh-exec-error.ts";
import { writeDebugJsonStem } from "./write-debug-json.ts";

const execFileAsync = promisify(execFile);

const GH_EXEC_MAX_BUFFER = 50 * 1024 * 1024;

/** Org whose open, assigned-to-viewer work we dump in debug mode. */
const ASSIGNED_OPEN_ORG = "slint-ui";

const SEARCH_STEM = `assigned-open--search--${ASSIGNED_OPEN_ORG}`;
const PROJECT_LIST_STEM = `assigned-open--projects-list--${ASSIGNED_OPEN_ORG}`;

/** Projects filter: assigned to viewer, open, not archived (verify tokens in GitHub docs if results look wrong). */
const PROJECT_ITEM_QUERY = "assignee:@me is:open -is:archived";

const SEARCH_RESULT_LIMIT = 500;
const PROJECT_ITEM_LIMIT = 500;

/** When `graphql`, use batched `gh api graphql` for project items instead of `gh project item-list`. */
function useGraphqlProjectItems(): boolean {
  return process.env.GH_DEBUG_ASSIGNED_PROJECT_ITEMS === "graphql";
}

/**
 * `gh project item-list` uses GraphQL; high concurrency plus other debug GraphQL (e.g. `projects-v2--org--…`)
 * easily hits the **GraphQL primary rate limit** → `*--error.json` with "rate limit exceeded".
 * Default **1** (sequential). Override with `GH_DEBUG_ASSIGNED_ITEM_LIST_CONCURRENCY` (integer ≥ 1, capped at 8).
 */
function itemListConcurrency(): number {
  const raw = process.env.GH_DEBUG_ASSIGNED_ITEM_LIST_CONCURRENCY;
  if (raw === undefined || raw.trim() === "") {
    return 1;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(n, 8);
}

async function runPool<T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }
  let next = 0;
  async function worker(): Promise<void> {
    while (true) {
      const i = next++;
      if (i >= items.length) {
        return;
      }
      await fn(items[i]!);
    }
  }
  const pool = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: pool }, () => worker()));
}

function stemForAssignedProjectItems(projectNumber: number): string {
  return `assigned-open--project-items--${ASSIGNED_OPEN_ORG}--${projectNumber}`;
}

async function dumpProjectItemListCli(num: number, stem: string): Promise<void> {
  try {
    const { stdout } = await execFileAsync(
      "gh",
      [
        "project",
        "item-list",
        String(num),
        "--owner",
        ASSIGNED_OPEN_ORG,
        "--format",
        "json",
        "--query",
        PROJECT_ITEM_QUERY,
        "-L",
        String(PROJECT_ITEM_LIMIT),
      ],
      {
        encoding: "utf8",
        env: { ...process.env, GH_PAGER: "cat" },
        maxBuffer: GH_EXEC_MAX_BUFFER,
      },
    );
    const trimmed = (stdout as string).trim();
    writeDebugJsonStem(
      stem,
      trimmed.length === 0 ? { items: [], totalCount: 0 } : JSON.parse(trimmed),
    );
  } catch (e) {
    writeDebugJsonStem(`${stem}--error`, { error: mapGhExecError(e) });
  }
}

type ItemDumpTask = { num: number; stem: string; projectId: string };

/** Reuse a single `fetchAllProjectsV2ForOrgGraphql("slint-ui")` from the same debug run (see `main.ts`). */
export type SlintUiProjectsV2ForAssignedDebug =
  | { ok: true; nodes: ProjectV2NodeSnapshot[] }
  | { ok: false; error: string };

/**
 * When `GH_DEBUG_JSON=1`, dumps open items assigned to the signed-in user for {@link ASSIGNED_OPEN_ORG}:
 * - `gh search issues` (with PRs) → `assigned-open--search--slint-ui.json`
 * - GraphQL `organization.projectsV2` (incl. `items.totalCount`) → `assigned-open--projects-list--slint-ui.json`
 * - per org project with items: `gh project item-list` **or** batched GraphQL (see `GH_DEBUG_ASSIGNED_PROJECT_ITEMS`)
 *   → `assigned-open--project-items--slint-ui--<number>.json`
 *   (projects with `items.totalCount === 0` skip item fetch and write `{ items: [], totalCount: 0 }`).
 *   CLI path: concurrency defaults to 1; see `itemListConcurrency`.
 *
 * Pass {@link SlintUiProjectsV2ForAssignedDebug} to avoid a second org `projectsV2` pagination when `main` already fetched it.
 */
export async function maybeDumpAssignedOpenWorkDebugAsync(
  slintUiProjectsV2?: SlintUiProjectsV2ForAssignedDebug,
): Promise<void> {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }

  try {
    const { stdout } = await execFileAsync(
      "gh",
      [
        "search",
        "issues",
        "--assignee",
        "@me",
        "--owner",
        ASSIGNED_OPEN_ORG,
        "--include-prs",
        "--state",
        "open",
        "-L",
        String(SEARCH_RESULT_LIMIT),
        "--json",
        "number,title,state,isPullRequest,url,repository,assignees,labels",
      ],
      {
        encoding: "utf8",
        env: { ...process.env, GH_PAGER: "cat" },
        maxBuffer: GH_EXEC_MAX_BUFFER,
      },
    );
    const trimmed = (stdout as string).trim();
    const parsed = trimmed.length === 0 ? [] : (JSON.parse(trimmed) as unknown);
    writeDebugJsonStem(SEARCH_STEM, parsed);
  } catch (e) {
    writeDebugJsonStem(`${SEARCH_STEM}--error`, { error: mapGhExecError(e) });
  }

  const listRes =
    slintUiProjectsV2 === undefined
      ? await fetchAllProjectsV2ForOrgGraphql(ASSIGNED_OPEN_ORG)
      : slintUiProjectsV2.ok
        ? { ok: true as const, value: slintUiProjectsV2.nodes }
        : { ok: false as const, error: slintUiProjectsV2.error };
  if (!listRes.ok) {
    writeDebugJsonStem(`${PROJECT_LIST_STEM}--error`, { error: listRes.error });
    return;
  }

  const nodes = listRes.value as ProjectV2NodeSnapshot[];
  writeDebugJsonStem(PROJECT_LIST_STEM, {
    organization: ASSIGNED_OPEN_ORG,
    source: "graphql.organization.projectsV2",
    totalProjectCount: nodes.length,
    projects: nodes,
  });

  const tasks: ItemDumpTask[] = [];

  for (const node of nodes) {
    if (node.closed) {
      continue;
    }
    const num = node.number;
    const stem = stemForAssignedProjectItems(num);
    if (node.items.totalCount === 0) {
      writeDebugJsonStem(stem, { items: [], totalCount: 0 });
      continue;
    }
    tasks.push({ num, stem, projectId: node.id });
  }

  if (tasks.length === 0) {
    return;
  }

  if (useGraphqlProjectItems()) {
    const viewer = await fetchViewerLoginGraphql();
    if (!viewer.ok) {
      console.error(
        "[debug-json] fetchViewerLoginGraphql failed; falling back to gh project item-list:",
        viewer.error,
      );
      await runPool(tasks, itemListConcurrency(), ({ num, stem }) =>
        dumpProjectItemListCli(num, stem),
      );
      return;
    }
    await dumpProjectItemsGraphqlBatched({
      orgLogin: ASSIGNED_OPEN_ORG,
      projects: tasks.map((t) => ({ id: t.projectId, number: t.num })),
      viewerLogin: viewer.login,
      stemForProject: stemForAssignedProjectItems,
    });
    return;
  }

  await runPool(tasks, itemListConcurrency(), ({ num, stem }) => dumpProjectItemListCli(num, stem));
}

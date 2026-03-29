import {
  maybeDumpAssignedOpenWorkDebugAsync,
  type SlintUiProjectsV2ForAssignedDebug,
} from "../gh/debug-assigned-open-slint-ui.ts";
import {
  fetchAllProjectsV2ForOrgGraphql,
  fetchAllProjectsV2ForUserGraphql,
} from "../gh/graphql-projects-v2.ts";
import { ghApiGraphql, ghApiJson } from "../gh/gh-app-client.ts";
import { getLastSlintUiOrgProjectsFetch } from "../gh/slint-ui-org-projects-ui.ts";
import { writeDebugJsonStem } from "../gh/write-debug-json.ts";
import type { ProjectV2NodeSnapshot } from "../schemas/gh-graphql-projectsv2-page.ts";
import { VIEWER_DEBUG_GRAPHQL_QUERY } from "../gh/viewer-queries.ts";
import { parseOrgLogins } from "./parse-org-logins.ts";

const SLINT_UI_ORG = "slint-ui";

/**
 * REST `GET /notifications` (paginated) → `debug-json/notifications--threads.json` when `GH_DEBUG_JSON=1`.
 * `gh api` uses POST when `-f` is present unless `--method GET` is set (POST `/notifications` is 404).
 * Requires classic scope **`notifications`** (or **`repo`**) on the token; otherwise expect `*--error.json`.
 */
export async function maybeDumpNotificationsThreadsDebugAsync(): Promise<void> {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  const stem = "notifications--threads";
  const res = await ghApiJson(
    ["--method", "GET", "notifications", "-f", "per_page=50", "-f", "all=true", "--paginate"],
    { debugStem: stem },
  );
  if (!res.ok) {
    writeDebugJsonStem(`${stem}--error`, { error: res.error });
  }
}

/** Wide GraphQL `viewer` dump to `debug-json/` when `GH_DEBUG_JSON=1`. */
export async function debugUserData(): Promise<void> {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  const res = await ghApiGraphql(VIEWER_DEBUG_GRAPHQL_QUERY);
  if (res.ok) {
    writeDebugJsonStem("gh-graphql--viewer-status", res.value);
  } else {
    writeDebugJsonStem("gh-graphql--viewer-status", { error: res.error });
  }
}

/** When set with `GH_DEBUG_JSON=1` (e.g. `pnpm dev:debug`), skips org/assigned project JSON dumps to save GraphQL quota. */
export function shouldRunSlintUiProjectDebugDumps(): boolean {
  return (
    process.env.GH_DEBUG_JSON === "1" && process.env.GH_DEBUG_SKIP_SLINT_UI_PROJECT_DUMPS !== "1"
  );
}

type DumpGitHubProjectsDebugOptions = {
  /**
   * When set, limits per-org dumps to these orgs (intersected with `user/orgs`) and **skips** user-scoped
   * GraphQL `projectsV2` (no `projects-v2--user--…`).
   * When omitted, user-level dumps run and every org from `user/orgs` is dumped.
   */
  orgs?: readonly string[];
  /**
   * When present, uses this result instead of calling `fetchAllProjectsV2ForOrgGraphql` for that org
   * (shared with assigned-open debug in the same run).
   */
  precachedOrgProjectsV2?: ReadonlyMap<
    string,
    { ok: true; value: unknown[] } | { ok: false; error: string }
  >;
};

/**
 * When `GH_DEBUG_JSON=1`, dumps GitHub project data for debugging via GraphQL **`projectsV2`**
 * (user and/or org; user only when no `options.orgs`).
 *
 * Uses async `gh` so the event loop can run during subprocess I/O. Empty lists skip files.
 * `gh` / API failures still write `*--error.json` for that request.
 */
async function maybeDumpGitHubProjectsDebugAsync(
  login: string,
  options?: DumpGitHubProjectsDebugOptions,
): Promise<void> {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }

  if (options?.orgs === undefined) {
    const userV2Stem = `projects-v2--user--${login}`;
    const userV2Res = await fetchAllProjectsV2ForUserGraphql(login);
    if (!userV2Res.ok) {
      writeDebugJsonStem(`${userV2Stem}--error`, { error: userV2Res.error });
    } else if (userV2Res.value.length > 0) {
      writeDebugJsonStem(userV2Stem, userV2Res.value);
    }
  }

  const orgsStem = "projects-v2--orgs-membership";
  const orgsRes = await ghApiJson(["user/orgs", "--paginate"], { debugStem: orgsStem });
  if (!orgsRes.ok) {
    writeDebugJsonStem(`${orgsStem}--error`, { error: orgsRes.error });
    return;
  }

  const allOrgs = parseOrgLogins(orgsRes.value);
  const orgsToDump =
    options?.orgs === undefined ? allOrgs : options.orgs.filter((o) => allOrgs.includes(o));

  for (const org of orgsToDump) {
    const orgV2Stem = `projects-v2--org--${org}`;
    const cached = options?.precachedOrgProjectsV2?.get(org);
    if (cached !== undefined) {
      if (!cached.ok) {
        writeDebugJsonStem(`${orgV2Stem}--error`, { error: cached.error });
      } else if (cached.value.length > 0) {
        writeDebugJsonStem(orgV2Stem, cached.value);
      }
      continue;
    }
    const orgV2 = await fetchAllProjectsV2ForOrgGraphql(org);
    if (!orgV2.ok) {
      writeDebugJsonStem(`${orgV2Stem}--error`, { error: orgV2.error });
    } else if (orgV2.value.length > 0) {
      writeDebugJsonStem(orgV2Stem, orgV2.value);
    }
  }
}

/**
 * When `GH_DEBUG_JSON=1` and `GH_DEBUG_SKIP_SLINT_UI_PROJECT_DUMPS=1` (e.g. `pnpm dev:debug`), write the
 * org project list JSON from the same fetch used for the Settings UI—no extra GraphQL. Does not run
 * assigned-open search or per-project item dumps.
 */
export function maybeDumpSlintUiProjectListJsonFromUiFetch(): void {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  if (process.env.GH_DEBUG_SKIP_SLINT_UI_PROJECT_DUMPS !== "1") {
    return;
  }
  const fetched = getLastSlintUiOrgProjectsFetch();
  const orgStem = `projects-v2--org--${SLINT_UI_ORG}`;
  const listStem = `assigned-open--projects-list--${SLINT_UI_ORG}`;
  if (fetched === null) {
    return;
  }
  if (!fetched.ok) {
    writeDebugJsonStem(`${orgStem}--error`, { error: fetched.error });
    writeDebugJsonStem(`${listStem}--error`, { error: fetched.error });
    return;
  }
  const value = fetched.value;
  if (value.length > 0) {
    writeDebugJsonStem(orgStem, value);
  }
  const nodes = value as ProjectV2NodeSnapshot[];
  writeDebugJsonStem(listStem, {
    organization: SLINT_UI_ORG,
    source: "graphql.organization.projectsV2",
    totalProjectCount: nodes.length,
    projects: nodes,
  });
}

/** One `organization.projectsV2` pagination for `slint-ui`; feeds org dump + assigned-open list. */
export async function runDebugJsonSlintUiDumpsAsync(
  login: string,
  precached?: { ok: true; value: unknown[] } | { ok: false; error: string } | null,
): Promise<void> {
  if (!shouldRunSlintUiProjectDebugDumps()) {
    return;
  }
  const slintRes =
    precached !== undefined && precached !== null
      ? precached
      : await fetchAllProjectsV2ForOrgGraphql(SLINT_UI_ORG);
  const precachedOrgMap = new Map<
    string,
    { ok: true; value: unknown[] } | { ok: false; error: string }
  >([[SLINT_UI_ORG, slintRes]]);
  const assignedInput: SlintUiProjectsV2ForAssignedDebug = slintRes.ok
    ? { ok: true, nodes: slintRes.value as ProjectV2NodeSnapshot[] }
    : { ok: false, error: slintRes.error };
  await Promise.all([
    maybeDumpGitHubProjectsDebugAsync(login, {
      orgs: [SLINT_UI_ORG],
      precachedOrgProjectsV2: precachedOrgMap,
    }),
    maybeDumpAssignedOpenWorkDebugAsync(assignedInput),
  ]);
}

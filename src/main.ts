import * as slint from "slint-ui";
import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { closeAppDb, openAppDb } from "./db/app-db.ts";
import { checkRequiredGitHubCliScopes, ghAuthLogout, spawnGhAuthLogin } from "./gh/auth.ts";
import {
  maybeDumpAssignedOpenWorkDebugAsync,
  type SlintUiProjectsV2ForAssignedDebug,
} from "./gh/debug-assigned-open-slint-ui.ts";
import {
  buildFilteredProjectsModel,
  clearSlintUiOrgProjectsCache,
  getLastSlintUiOrgProjectsFetch,
  refreshSlintUiOrgProjectsCache,
  type SlintProjectRow,
} from "./gh/slint-ui-org-projects-ui.ts";
import {
  fetchAllProjectsV2ForOrgGraphql,
  fetchAllProjectsV2ForUserGraphql,
} from "./gh/graphql-projects-v2.ts";
import { mapGhExecError } from "./gh/map-gh-exec-error.ts";
import type { ProjectV2NodeSnapshot } from "./schemas/gh-graphql-projectsv2-page.ts";
import { writeDebugJsonStem } from "./gh/write-debug-json.ts";
import {
  emptyTransparentAvatarImage,
  loadAvatarRgba,
  type SlintRgbaImage,
} from "./gh/avatar-image.ts";
import { statusEmojiFromGraphqlHtml } from "./gh/status-emoji-from-graphql.ts";
import { parseGhGraphqlViewerMinimalResponse } from "./schemas/gh-graphql-viewer-minimal.ts";
import { copyTextToClipboard } from "./utils/clipboard-write.ts";
import { openUrlInBrowser } from "./utils/open-url.ts";
import { fetchAllReviewRequestsSearch } from "./gh/graphql-review-requests.ts";
import { getGhCliVersionLine } from "./gh/gh-cli-version.ts";
import { fetchGraphqlRateLimit } from "./gh/graphql-rate-limit.ts";
import { GIT_COMMIT_COUNT } from "./generated/build-info.ts";
import { formatCountdownMs } from "./utils/format-countdown.ts";
import { formatRateLimitResetLocal } from "./utils/format-reset-at-local.ts";
import {
  clearViewerSessionCache,
  readViewerSessionCache,
  viewerSessionFromMinimalViewer,
  writeViewerSessionCache,
  type ViewerSessionV1,
} from "./session/viewer-session-cache.ts";
import { uiPerfMarkT1Text, uiPerfMarkT2Avatar, uiPerfResetSession } from "./ui-perf.ts";

const execFileAsync = promisify(execFile);

let settingsRateLimitDeadlineMs: number | null = null;
let settingsCountdownHandle: ReturnType<typeof setInterval> | null = null;
/** Bumped on panel teardown and each new load so stale async work cannot touch UI or timers. */
let settingsDebugEpoch = 0;

/** Row shape must match `ReviewRequestRow` in `app-state.slint`. */
type SlintReviewRequestRow = {
  title: string;
  url: string;
  repo_label: string;
};

/** Large enough for paginated `gh api` project payloads. */
const GH_EXEC_MAX_BUFFER = 50 * 1024 * 1024;

/** Minimal `viewer` fields for normal app load (replaces REST `GET /user`). */
const VIEWER_APP_GRAPHQL_QUERY = `
query ViewerApp {
  viewer {
    login
    name
    url
    avatarUrl
    status {
      message
      emojiHTML
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

/**
 * Broad `viewer { ... }` snapshot for `debug-json/gh-graphql--viewer-status.json` when
 * `GH_DEBUG_JSON=1` (trim this query once you know what you need).
 * `email` is omitted: GraphQL fails the entire query without `read:user` / `user:email` scope.
 */
const VIEWER_DEBUG_GRAPHQL_QUERY = `
query ViewerDebugDump {
  viewer {
    avatarUrl
    bio
    bioHTML
    company
    companyHTML
    createdAt
    databaseId
    id
    isBountyHunter
    isCampusExpert
    isDeveloperProgramMember
    isEmployee
    isGitHubStar
    isHireable
    isSiteAdmin
    isViewer
    location
    login
    name
    pronouns
    resourcePath
    twitterUsername
    updatedAt
    url
    websiteUrl
    status {
      createdAt
      emojiHTML
      expiresAt
      id
      indicatesLimitedAvailability
      message
      updatedAt
    }
    followers(first: 1) { totalCount }
    following(first: 1) { totalCount }
    gists(first: 1) { totalCount }
    issueComments(first: 1) { totalCount }
    issues(first: 1) { totalCount }
    organizations(first: 1) { totalCount }
    pullRequests(first: 1) { totalCount }
    repositories(first: 1) { totalCount }
    repositoriesContributedTo(first: 1) { totalCount }
    starredRepositories(first: 1) { totalCount }
    sponsorshipsAsMaintainer(first: 1) { totalCount }
    sponsorshipsAsSponsor(first: 1) { totalCount }
    watching(first: 1) { totalCount }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

openAppDb();

async function ghApiGraphql(query: string): Promise<GhJsonResult> {
  try {
    const { stdout } = await execFileAsync("gh", ["api", "graphql", "-f", `query=${query}`], {
      encoding: "utf8",
      env: { ...process.env, GH_PAGER: "cat" },
      maxBuffer: GH_EXEC_MAX_BUFFER,
    });
    const trimmed = (stdout as string).trim();
    if (trimmed.length === 0) {
      return { ok: false, error: "gh: empty graphql response" };
    }
    try {
      return { ok: true, value: JSON.parse(trimmed) as unknown };
    } catch {
      return { ok: false, error: "gh: graphql response was not valid JSON" };
    }
  } catch (e) {
    return { ok: false, error: mapGhExecError(e) };
  }
}

function maybeWriteDebugJsonFromRestArgs(restArgs: string[], value: unknown): void {
  const segments = restArgs.map((a) => a.replace(/[^a-zA-Z0-9._-]+/g, "_"));
  writeDebugJsonStem(`gh-api--${segments.join("--")}`, value);
}

type GhJsonOk = { ok: true; value: unknown };
type GhJsonErr = { ok: false; error: string };
type GhJsonResult = GhJsonOk | GhJsonErr;

type GhApiJsonOptions = {
  /** When set, write debug JSON to this stem (no `.json`) instead of deriving from `restArgs`. */
  debugStem?: string;
  /** If stdout is empty after trim, use this value instead of failing (e.g. `[]` for list endpoints). */
  emptyResponseAs?: unknown;
  /** When true with `debugStem`, do not write a file if the payload is an empty array (e.g. no projects). */
  omitDebugFileIfEmptyArray?: boolean;
};

async function ghApiJson(restArgs: string[], options?: GhApiJsonOptions): Promise<GhJsonResult> {
  try {
    const { stdout } = await execFileAsync("gh", ["api", ...restArgs], {
      encoding: "utf8",
      env: { ...process.env, GH_PAGER: "cat" },
      maxBuffer: GH_EXEC_MAX_BUFFER,
    });
    const trimmed = (stdout as string).trim();
    let value: unknown;
    if (trimmed.length === 0) {
      if (options?.emptyResponseAs !== undefined) {
        value = options.emptyResponseAs;
      } else {
        return { ok: false, error: "gh: empty response (try gh auth login)" };
      }
    } else {
      try {
        value = JSON.parse(trimmed);
      } catch {
        return { ok: false, error: "gh: response was not valid JSON" };
      }
    }
    if (options?.debugStem !== undefined) {
      const omit =
        options.omitDebugFileIfEmptyArray === true && Array.isArray(value) && value.length === 0;
      if (!omit) {
        writeDebugJsonStem(options.debugStem, value);
      }
    } else {
      maybeWriteDebugJsonFromRestArgs(restArgs, value);
    }
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: mapGhExecError(e) };
  }
}

/**
 * REST `GET /notifications` (paginated) → `debug-json/notifications--threads.json` when `GH_DEBUG_JSON=1`.
 * `gh api` uses POST when `-f` is present unless `--method GET` is set (POST `/notifications` is 404).
 * Requires classic scope **`notifications`** (or **`repo`**) on the token; otherwise expect `*--error.json`.
 */
async function maybeDumpNotificationsThreadsDebugAsync(): Promise<void> {
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
async function debugUserData(): Promise<void> {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  try {
    const { stdout } = await execFileAsync(
      "gh",
      ["api", "graphql", "-f", `query=${VIEWER_DEBUG_GRAPHQL_QUERY}`],
      {
        encoding: "utf8",
        env: { ...process.env, GH_PAGER: "cat" },
        maxBuffer: GH_EXEC_MAX_BUFFER,
      },
    );
    const trimmed = (stdout as string).trim();
    try {
      writeDebugJsonStem("gh-graphql--viewer-status", JSON.parse(trimmed) as unknown);
    } catch {
      writeDebugJsonStem("gh-graphql--viewer-status", {
        error: "gh graphql stdout was not valid JSON",
        stdout_preview: trimmed.slice(0, 500),
      });
    }
  } catch (e) {
    writeDebugJsonStem("gh-graphql--viewer-status", { error: mapGhExecError(e) });
  }
}

function parseOrgLogins(orgsPayload: unknown): string[] {
  if (!Array.isArray(orgsPayload)) {
    return [];
  }
  const logins: string[] = [];
  for (const row of orgsPayload) {
    if (
      row !== null &&
      typeof row === "object" &&
      "login" in row &&
      typeof (row as { login: unknown }).login === "string"
    ) {
      logins.push((row as { login: string }).login);
    }
  }
  return logins;
}

let initialProjectsDebugPending: string | null = null;
let slintEventLoopHasStarted = false;

/** Bumped on each `applyAuthUi` run so stale async work does not touch UI or session KV. */
let authOperationEpoch = 0;

function beginAuthOperation(): number {
  authOperationEpoch += 1;
  return authOperationEpoch;
}

function isAuthEpochCurrent(op: number): boolean {
  return op === authOperationEpoch;
}

/** When set with `GH_DEBUG_JSON=1` (e.g. `pnpm dev:debug`), skips org/assigned project JSON dumps to save GraphQL quota. */
function shouldRunSlintUiProjectDebugDumps(): boolean {
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

const SLINT_UI_ORG = "slint-ui";

/**
 * When `GH_DEBUG_JSON=1` and `GH_DEBUG_SKIP_SLINT_UI_PROJECT_DUMPS=1` (e.g. `pnpm dev:debug`), write the
 * org project list JSON from the same fetch used for the Settings UI—no extra GraphQL. Does not run
 * assigned-open search or per-project item dumps.
 */
function maybeDumpSlintUiProjectListJsonFromUiFetch(): void {
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
async function runDebugJsonSlintUiDumpsAsync(
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

/** Slint-node maps enum variants to kebab-case strings on `AppState.auth` (not `ui.Authed.*` values). */
type AuthedAuthState = "loggedOut" | "noGhCliInstalled" | "loggedIn" | "authorizing";

type AppStateView = "none" | "dashboard" | "settings";

type AppStateHandle = {
  auth: AuthedAuthState;
  user_login: string;
  user_name: string;
  user_profile_url: string;
  user_status_message: string;
  user_status_emoji: string;
  avatar?: SlintRgbaImage;
  view: AppStateView;
  review_requests_data_ready: boolean;
  review_requests_total: number;
  review_requests_load_status: string;
  review_requests_model: slint.ArrayModel<SlintReviewRequestRow>;
  projects_search: string;
  projects_load_status: string;
  projects_filtered_model: slint.ArrayModel<SlintProjectRow>;
  project_search_changed: (query: string) => void;
  sign_out: () => void;
  sign_in: () => void;
  open_project_url: (url: string) => void;
  dashboard_init: () => void;
};

type SettingsStateHandle = {
  settings_init: () => void;
  settings_exited: () => void;
  settings_debug_gh_version: string;
  settings_debug_rate_limit: string;
  settings_debug_reset_at: string;
  settings_debug_countdown: string;
  settings_debug_app_version: string;
  settings_debug_commit_label: string;
  settings_debug_error: string;
};

type MainWindowInstance = {
  run(): Promise<void>;
  show(): void;
  hide(): void;
  AppState: AppStateHandle;
  SettingsState: SettingsStateHandle;
  login_clicked?: () => void;
  open_github_device_clicked?: () => void;
  show_auth_window: () => void;
  close_auth_window: () => void;
  show_no_gh_cli_installed: () => void;
  open_cli_install_page: () => void;
  status_message: string;
  auth_device_code: string;
  auth_device_url: string;
};

type MainWindowOpts = {
  status_message?: string;
  "auth-device-code"?: string;
  "auth-device-url"?: string;
};

function readPackageVersion(): string {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
    const raw = readFileSync(pkgPath, "utf8");
    const j = JSON.parse(raw) as { version?: string };
    return j.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function buildCommitLabel(count: number): string {
  if (count <= 0) {
    return "— (run dev script to refresh)";
  }
  if (count < 1000) {
    return `v0.${String(count)}`;
  }
  return `v${String(count)}`;
}

function clearSettingsDebugStrings(window: MainWindowInstance): void {
  window.SettingsState.settings_debug_gh_version = "";
  window.SettingsState.settings_debug_rate_limit = "";
  window.SettingsState.settings_debug_reset_at = "";
  window.SettingsState.settings_debug_countdown = "";
  window.SettingsState.settings_debug_app_version = "";
  window.SettingsState.settings_debug_commit_label = "";
  window.SettingsState.settings_debug_error = "";
}

function stopSettingsDebugCountdown(): void {
  if (settingsCountdownHandle !== null) {
    clearInterval(settingsCountdownHandle);
    settingsCountdownHandle = null;
  }
}

function invalidateInFlightSettingsDebugLoads(): void {
  settingsDebugEpoch++;
}

function resetSettingsDebugPanelState(window: MainWindowInstance): void {
  stopSettingsDebugCountdown();
  settingsRateLimitDeadlineMs = null;
  clearSettingsDebugStrings(window);
}

function teardownSettingsDebugPanel(window: MainWindowInstance): void {
  invalidateInFlightSettingsDebugLoads();
  resetSettingsDebugPanelState(window);
}

function tickSettingsCountdown(window: MainWindowInstance): void {
  if (settingsRateLimitDeadlineMs === null) {
    window.SettingsState.settings_debug_countdown = "—";
    return;
  }
  window.SettingsState.settings_debug_countdown = formatCountdownMs(
    settingsRateLimitDeadlineMs - Date.now(),
  );
}

async function loadSettingsDebugPanel(window: MainWindowInstance): Promise<void> {
  invalidateInFlightSettingsDebugLoads();
  const epoch = settingsDebugEpoch;
  resetSettingsDebugPanelState(window);
  window.SettingsState.settings_debug_app_version = `v${readPackageVersion()}`;
  window.SettingsState.settings_debug_commit_label = buildCommitLabel(GIT_COMMIT_COUNT);

  const errors: string[] = [];
  const [ghVer, rl] = await Promise.all([getGhCliVersionLine(), fetchGraphqlRateLimit()]);
  if (epoch !== settingsDebugEpoch) {
    return;
  }

  if (ghVer.ok) {
    window.SettingsState.settings_debug_gh_version = ghVer.line;
  } else {
    window.SettingsState.settings_debug_gh_version = "—";
    errors.push(ghVer.error);
  }

  if (rl.ok) {
    const { limit, remaining, resetAt } = rl.rateLimit;
    const used = limit - remaining;
    window.SettingsState.settings_debug_rate_limit = `${used} / ${limit} used (${remaining} left)`;
    const t = Date.parse(resetAt);
    if (!Number.isFinite(t)) {
      errors.push("Invalid rateLimit.resetAt from API");
      window.SettingsState.settings_debug_reset_at = resetAt;
      window.SettingsState.settings_debug_countdown = "—";
    } else {
      window.SettingsState.settings_debug_reset_at = formatRateLimitResetLocal(resetAt);
      settingsRateLimitDeadlineMs = t;
      tickSettingsCountdown(window);
      settingsCountdownHandle = setInterval(() => {
        if (epoch !== settingsDebugEpoch) {
          return;
        }
        tickSettingsCountdown(window);
      }, 1000);
    }
  } else {
    window.SettingsState.settings_debug_rate_limit = "—";
    window.SettingsState.settings_debug_reset_at = "—";
    window.SettingsState.settings_debug_countdown = "—";
    errors.push(rl.error);
  }

  window.SettingsState.settings_debug_error = errors.join(" · ");
}

function resetListsWithoutClearingProfile(window: MainWindowInstance): void {
  window.AppState.view = "none";
  window.AppState.review_requests_data_ready = false;
  window.AppState.review_requests_total = 0;
  window.AppState.review_requests_load_status = "";
  window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>([]);
  clearSlintUiOrgProjectsCache();
  window.AppState.projects_search = "";
  window.AppState.projects_load_status = "";
  window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
  teardownSettingsDebugPanel(window);
}

function applyCachedViewerToAppState(window: MainWindowInstance, cached: ViewerSessionV1): void {
  const v = cached.viewer;
  window.AppState.user_login = v.login;
  window.AppState.user_name = v.name ?? "";
  window.AppState.user_profile_url = v.url;
  window.AppState.user_status_message = v.statusMessage;
  window.AppState.user_status_emoji = v.statusEmoji;
}

function clearUserIdentity(window: MainWindowInstance): void {
  clearViewerSessionCache();
  window.AppState.avatar = emptyTransparentAvatarImage;
  window.AppState.user_login = "";
  window.AppState.user_name = "";
  window.AppState.user_profile_url = "";
  window.AppState.user_status_message = "";
  window.AppState.user_status_emoji = "";
  window.AppState.view = "none";
  window.AppState.review_requests_data_ready = false;
  window.AppState.review_requests_total = 0;
  window.AppState.review_requests_load_status = "";
  window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>([]);
  clearSlintUiOrgProjectsCache();
  window.AppState.projects_search = "";
  window.AppState.projects_load_status = "";
  window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
  teardownSettingsDebugPanel(window);
}

async function refreshDashboardReviewRequests(window: MainWindowInstance): Promise<void> {
  window.AppState.review_requests_data_ready = false;
  window.AppState.review_requests_load_status = "Loading review requests…";
  window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>([]);
  window.AppState.review_requests_total = 0;
  const res = await fetchAllReviewRequestsSearch();
  if (!res.ok) {
    window.AppState.review_requests_load_status = res.error;
    return;
  }
  window.AppState.review_requests_total = res.issueCount;
  window.AppState.review_requests_load_status = "";
  window.AppState.review_requests_data_ready = true;
  window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>(
    res.rows.map((r) => ({
      title: r.title,
      url: r.url,
      repo_label: r.repo_label,
    })),
  );
}

function clearAuthDeviceFields(window: MainWindowInstance): void {
  window.auth_device_code = "";
  window.auth_device_url = "";
}

async function refreshSlintUiOrgProjectsForWindow(window: MainWindowInstance): Promise<void> {
  window.AppState.projects_load_status = "Loading projects…";
  window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
  const res = await refreshSlintUiOrgProjectsCache();
  if (!res.ok) {
    window.AppState.projects_load_status = res.error;
    window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
    return;
  }
  window.AppState.projects_load_status = "";
  window.AppState.projects_filtered_model = buildFilteredProjectsModel(
    window.AppState.projects_search,
  );
}

async function fetchAndApplyGitHubUser(
  window: MainWindowInstance,
  options: { op: number },
): Promise<void> {
  const { op } = options;
  const result = await ghApiGraphql(VIEWER_APP_GRAPHQL_QUERY);
  if (!isAuthEpochCurrent(op)) {
    return;
  }
  if (!result.ok) {
    window.status_message = result.error;
    clearUserIdentity(window);
    return;
  }
  const parsed = parseGhGraphqlViewerMinimalResponse(result.value);
  if (!isAuthEpochCurrent(op)) {
    return;
  }
  if (!parsed.ok) {
    window.status_message = parsed.message;
    clearUserIdentity(window);
    return;
  }
  const viewer = parsed.viewer;
  window.status_message = "";
  window.AppState.user_login = viewer.login;
  window.AppState.user_name = viewer.name ?? "";
  window.AppState.user_profile_url = viewer.url;
  const st = viewer.status;
  window.AppState.user_status_message = st?.message ?? "";
  const emojiPlain = statusEmojiFromGraphqlHtml(st?.emojiHTML ?? null);
  window.AppState.user_status_emoji = emojiPlain;
  uiPerfMarkT1Text("network");
  writeViewerSessionCache(viewerSessionFromMinimalViewer(viewer, emojiPlain));
  // Do not set emptyTransparentAvatarImage here: it would blank the avatar for the whole
  // `refreshSlintUiOrgProjectsForWindow` await (and any debug work). Keep the prior image
  // (e.g. from cache hydrate) until `loadAvatarRgba` replaces it.
  void loadAvatarRgba(viewer.avatarUrl).then((loaded) => {
    if (!isAuthEpochCurrent(op)) {
      return;
    }
    if (loaded !== undefined) {
      window.AppState.avatar = loaded;
      uiPerfMarkT2Avatar("network", loaded);
    } else {
      window.AppState.avatar = emptyTransparentAvatarImage;
    }
  });

  await refreshSlintUiOrgProjectsForWindow(window);
  if (!isAuthEpochCurrent(op)) {
    return;
  }
  maybeDumpSlintUiProjectListJsonFromUiFetch();

  if (process.env.GH_DEBUG_JSON === "1") {
    void debugUserData().catch((e) => {
      console.error("[debug-json] debugUserData failed:", e);
    });
    void maybeDumpNotificationsThreadsDebugAsync().catch((e) => {
      console.error("[debug-json] maybeDumpNotificationsThreadsDebugAsync failed:", e);
    });
    if (shouldRunSlintUiProjectDebugDumps()) {
      if (!slintEventLoopHasStarted) {
        initialProjectsDebugPending = viewer.login;
      } else {
        void runDebugJsonSlintUiDumpsAsync(viewer.login, getLastSlintUiOrgProjectsFetch()).catch(
          (e) => {
            console.error("[debug-json] runDebugJsonSlintUiDumpsAsync failed:", e);
          },
        );
      }
    }
  }
}

function applyAuthUi(window: MainWindowInstance): void {
  uiPerfResetSession();
  const op = beginAuthOperation();

  window.AppState.auth = "loggedIn";
  window.status_message = "Checking…";
  clearAuthDeviceFields(window);
  window.close_auth_window();

  const cached = readViewerSessionCache();
  const hadCachedSession = cached !== null;
  if (cached !== null) {
    resetListsWithoutClearingProfile(window);
    applyCachedViewerToAppState(window, cached);
    uiPerfMarkT1Text("cache");
    window.status_message = "";
    // Avoid forcing emptyTransparent here: keep whatever the window had until decode finishes
    // (same idea as `fetchAndApplyGitHubUser` — no intentional blank before async load).
    void loadAvatarRgba(cached.viewer.avatarUrl).then((loaded) => {
      if (!isAuthEpochCurrent(op)) {
        return;
      }
      if (loaded !== undefined) {
        window.AppState.avatar = loaded;
        uiPerfMarkT2Avatar("cache", loaded);
      } else {
        window.AppState.avatar = emptyTransparentAvatarImage;
      }
    });
  } else {
    clearUserIdentity(window);
  }

  void (async () => {
    const scopeCheck = await checkRequiredGitHubCliScopes();
    if (!isAuthEpochCurrent(op)) {
      return;
    }
    if (!scopeCheck.ok && scopeCheck.noGh === true) {
      window.AppState.auth = "noGhCliInstalled";
      window.status_message = "gh not found (install GitHub CLI)";
      window.show_no_gh_cli_installed();
      clearAuthDeviceFields(window);
      window.close_auth_window();
      clearUserIdentity(window);
      return;
    }
    if (!scopeCheck.ok) {
      window.AppState.auth = "loggedOut";
      window.status_message = `${scopeCheck.message} Click Login to authorize with the required scopes.`;
      clearAuthDeviceFields(window);
      window.close_auth_window();
      clearUserIdentity(window);
      return;
    }
    window.status_message = hadCachedSession ? "" : "Loading…";
    await fetchAndApplyGitHubUser(window, { op });
  })().catch((e) => {
    console.error("[github-app] scope check or user fetch failed:", e);
    window.status_message = "Something went wrong";
    clearUserIdentity(window);
  });
}

const ui = slint.loadFile(new URL("./ui/main.slint", import.meta.url)) as {
  MainWindow: new (opts: MainWindowOpts) => MainWindowInstance;
};

const window = new ui.MainWindow({
  status_message: "",
  "auth-device-code": "",
  "auth-device-url": "",
});

window.AppState.projects_filtered_model = new slint.ArrayModel<SlintProjectRow>([]);
window.AppState.review_requests_model = new slint.ArrayModel<SlintReviewRequestRow>([]);
window.AppState.project_search_changed = (query: string) => {
  window.AppState.projects_filtered_model = buildFilteredProjectsModel(query);
};

window.AppState.open_project_url = (url: string) => {
  openUrlInBrowser(url);
};

window.AppState.dashboard_init = () => {
  void refreshDashboardReviewRequests(window);
};

window.SettingsState.settings_init = () => {
  void loadSettingsDebugPanel(window);
};

window.SettingsState.settings_exited = () => {
  teardownSettingsDebugPanel(window);
};

window.open_github_device_clicked = () => {
  void copyTextToClipboard(window.auth_device_code).finally(() => {
    openUrlInBrowser(window.auth_device_url);
  });
};

window.AppState.sign_in = () => {
  clearAuthDeviceFields(window);
  window.AppState.auth = "authorizing";
  window.show_auth_window();
  spawnGhAuthLogin({
    onDeviceFlowInfo: (info) => {
      window.auth_device_code = info.code;
      window.auth_device_url = info.url;
    },
    onClose: () => {
      clearAuthDeviceFields(window);
      void applyAuthUi(window);
    },
  });
};

window.AppState.sign_out = () => {
  ghAuthLogout();
  clearViewerSessionCache();
  void applyAuthUi(window);
};

window.open_cli_install_page = () => {
  console.log("open_cli_install_page");
  openUrlInBrowser("https://cli.github.com/");
};

applyAuthUi(window);
window.show();
await slint.runEventLoop({
  runningCallback: () => {
    slintEventLoopHasStarted = true;
    const login = initialProjectsDebugPending;
    initialProjectsDebugPending = null;
    if (login !== null && shouldRunSlintUiProjectDebugDumps()) {
      void runDebugJsonSlintUiDumpsAsync(login, getLastSlintUiOrgProjectsFetch()).catch((e) => {
        console.error("[debug-json] runDebugJsonSlintUiDumpsAsync failed:", e);
      });
    }
  },
});
teardownSettingsDebugPanel(window);
window.hide();
closeAppDb();
// Slint's Node bridge uses a repeating timer (~16 ms) merged with Node's loop; a TTY also
// keeps stdin/stdout/stderr referenced, so the process would not exit on its own after the UI closes.
process.exit(0);

import * as slint from "slint-ui";
import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { openAppDb } from "./db/app-db.ts";
import { checkRequiredGitHubCliScopes, ghAuthLogout, spawnGhAuthLogin } from "./gh/auth.ts";
import {
  emptyTransparentAvatarImage,
  loadAvatarRgba,
  type SlintRgbaImage,
} from "./gh/avatar-image.ts";
import { statusEmojiFromGraphqlHtml } from "./gh/status-emoji-from-graphql.ts";
import { parseGhGraphqlViewerMinimalResponse } from "./schemas/gh-graphql-viewer-minimal.ts";
import { copyTextToClipboard } from "./utils/clipboard-write.ts";
import { openUrlInBrowser } from "./utils/open-url.ts";

const execFileAsync = promisify(execFile);

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

/**
 * When `GH_DEBUG_JSON=1`, writes pretty-printed JSON under `debug-json/` (gitignored).
 * Do not enable while screen-sharing; API responses may include PII or account details.
 */
function writeDebugJsonStem(stem: string, value: unknown): void {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  const dir = join(process.cwd(), "debug-json");
  mkdirSync(dir, { recursive: true });
  const safe = stem.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const filePath = join(dir, `${safe}.json`);
  writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function maybeWriteDebugJsonFromRestArgs(restArgs: string[], value: unknown): void {
  const segments = restArgs.map((a) => a.replace(/[^a-zA-Z0-9._-]+/g, "_"));
  writeDebugJsonStem(`gh-api--${segments.join("--")}`, value);
}

function mapGhExecError(e: unknown): string {
  if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
    return "gh not found (install GitHub CLI)";
  }
  if (e !== null && typeof e === "object" && "stderr" in e) {
    const stderr = (e as { stderr?: Buffer }).stderr;
    const msg = stderr ? stderr.toString("utf8").trim() : "";
    if (msg.length > 0) {
      return `gh: ${msg}`;
    }
  }
  return e instanceof Error ? e.message : String(e);
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

/** Options for project list calls: empty stdout / `[]` means nothing to dump — skip file. */
function projectListDebugOptions(stem: string): GhApiJsonOptions {
  return {
    debugStem: stem,
    emptyResponseAs: [],
    omitDebugFileIfEmptyArray: true,
  };
}

/**
 * `gh project list` (Projects V2 / unified CLI view). Org kanban boards are often visible here
 * even when REST `orgs/.../projectsV2` is empty or 404 for your token.
 */
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

async function ghProjectListForDebugAsync(debugStem: string, owner?: string): Promise<void> {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  const args = ["project", "list", "--format", "json", "--closed", "-L", "200"];
  if (owner !== undefined) {
    args.push("--owner", owner);
  }
  try {
    const { stdout } = await execFileAsync("gh", args, {
      encoding: "utf8",
      env: { ...process.env, GH_PAGER: "cat" },
      maxBuffer: GH_EXEC_MAX_BUFFER,
    });
    const trimmed = (stdout as string).trim();
    let value: unknown;
    if (trimmed.length === 0) {
      value = [];
    } else {
      value = JSON.parse(trimmed) as unknown;
    }
    if (Array.isArray(value) && value.length === 0) {
      return;
    }
    writeDebugJsonStem(debugStem, value);
  } catch (e) {
    writeDebugJsonStem(`${debugStem}--error`, { error: mapGhExecError(e) });
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

/**
 * When `GH_DEBUG_JSON=1`, dumps GitHub project data for debugging:
 * - REST **Projects V2** (`…/projectsV2`) — new table projects.
 * - REST **Projects (classic)** (`…/projects?state=all`) — org/user **kanban** boards.
 * - **`gh project list`** for the signed-in user and for each org — CLI view of projects.
 *
 * Uses async `gh` so the event loop can run during subprocess I/O. Empty lists skip files.
 * `gh` / API failures still write `*--error.json` for that request.
 */
async function maybeDumpGitHubProjectsDebugAsync(login: string): Promise<void> {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }

  const userV2Stem = `projects-v2--user--${login}`;
  const userV2Res = await ghApiJson(
    [`users/${login}/projectsV2`, "--paginate"],
    projectListDebugOptions(userV2Stem),
  );
  if (!userV2Res.ok) {
    writeDebugJsonStem(`${userV2Stem}--error`, { error: userV2Res.error });
  }

  const userClassicStem = `projects-classic--user--${login}`;
  const userClassicRes = await ghApiJson(
    [`users/${login}/projects?state=all&per_page=100`, "--paginate"],
    projectListDebugOptions(userClassicStem),
  );
  if (!userClassicRes.ok) {
    writeDebugJsonStem(`${userClassicStem}--error`, { error: userClassicRes.error });
  }

  await ghProjectListForDebugAsync("projects-gh-cli--user");

  const orgsStem = "projects-v2--orgs-membership";
  const orgsRes = await ghApiJson(["user/orgs", "--paginate"], { debugStem: orgsStem });
  if (!orgsRes.ok) {
    writeDebugJsonStem(`${orgsStem}--error`, { error: orgsRes.error });
    return;
  }

  for (const org of parseOrgLogins(orgsRes.value)) {
    const orgV2Stem = `projects-v2--org--${org}`;
    const orgV2 = await ghApiJson(
      [`orgs/${org}/projectsV2`, "--paginate"],
      projectListDebugOptions(orgV2Stem),
    );
    if (!orgV2.ok) {
      writeDebugJsonStem(`${orgV2Stem}--error`, { error: orgV2.error });
    }

    const orgClassicStem = `projects-classic--org--${org}`;
    const orgClassic = await ghApiJson(
      [`orgs/${org}/projects?state=all&per_page=100`, "--paginate"],
      projectListDebugOptions(orgClassicStem),
    );
    if (!orgClassic.ok) {
      writeDebugJsonStem(`${orgClassicStem}--error`, { error: orgClassic.error });
    }

    await ghProjectListForDebugAsync(`projects-gh-cli--org--${org}`, org);
  }
}

/** Slint-node maps enum variants to kebab-case strings on `AppState.auth` (not `ui.Authed.*` values). */
type AuthedAuthState = "loggedOut" | "noGhCliInstalled" | "loggedIn" | "authorizing";

type AppStateHandle = {
  auth: AuthedAuthState;
  user_login: string;
  user_name: string;
  user_profile_url: string;
  user_status_message: string;
  user_status_emoji: string;
  avatar?: SlintRgbaImage;
  sign_out: () => void;
};

type MainWindowInstance = {
  run(): Promise<void>;
  show(): void;
  hide(): void;
  AppState: AppStateHandle;
  login_clicked?: () => void;
  open_github_device_clicked?: () => void;
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

function clearUserIdentity(window: MainWindowInstance): void {
  window.AppState.avatar = emptyTransparentAvatarImage;
  window.AppState.user_login = "";
  window.AppState.user_name = "";
  window.AppState.user_profile_url = "";
  window.AppState.user_status_message = "";
  window.AppState.user_status_emoji = "";
}

function clearAuthDeviceFields(window: MainWindowInstance): void {
  window.auth_device_code = "";
  window.auth_device_url = "";
}

async function fetchAndApplyGitHubUser(window: MainWindowInstance): Promise<void> {
  const result = await ghApiGraphql(VIEWER_APP_GRAPHQL_QUERY);
  if (!result.ok) {
    window.status_message = result.error;
    clearUserIdentity(window);
    return;
  }
  const parsed = parseGhGraphqlViewerMinimalResponse(result.value);
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
  window.AppState.user_status_emoji = statusEmojiFromGraphqlHtml(st?.emojiHTML ?? null);
  window.AppState.avatar = emptyTransparentAvatarImage;

  if (process.env.GH_DEBUG_JSON === "1") {
    void debugUserData().catch((e) => {
      console.error("[debug-json] debugUserData failed:", e);
    });
    if (!slintEventLoopHasStarted) {
      initialProjectsDebugPending = viewer.login;
    } else {
      void maybeDumpGitHubProjectsDebugAsync(viewer.login).catch((e) => {
        console.error("[debug-json] maybeDumpGitHubProjectsDebugAsync failed:", e);
      });
    }
  }

  void loadAvatarRgba(viewer.avatarUrl).then((loaded) => {
    if (loaded !== undefined) {
      window.AppState.avatar = loaded;
    } else {
      window.AppState.avatar = emptyTransparentAvatarImage;
    }
  });
}

function applyAuthUi(window: MainWindowInstance): void {
  window.AppState.auth = "loggedIn";
  window.status_message = "Checking…";
  clearAuthDeviceFields(window);
  window.close_auth_window();
  clearUserIdentity(window);
  void (async () => {
    const scopeCheck = await checkRequiredGitHubCliScopes();
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
    window.status_message = "Loading…";
    await fetchAndApplyGitHubUser(window);
  })().catch((e) => {
    console.error("[github-app] scope check or user fetch failed:", e);
    window.status_message = "Something went wrong";
    clearUserIdentity(window);
  });
}

const ui = slint.loadFile(new URL("./main.slint", import.meta.url)) as {
  MainWindow: new (opts: MainWindowOpts) => MainWindowInstance;
};

const window = new ui.MainWindow({
  status_message: "",
  "auth-device-code": "",
  "auth-device-url": "",
});

window.open_github_device_clicked = () => {
  void copyTextToClipboard(window.auth_device_code).finally(() => {
    openUrlInBrowser(window.auth_device_url);
  });
};

window.login_clicked = () => {
  clearAuthDeviceFields(window);
  window.AppState.auth = "authorizing";
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
  void applyAuthUi(window);
};

window.open_cli_install_page = () => {
  openUrlInBrowser("https://cli.github.com/");
};

applyAuthUi(window);
window.show();
await slint.runEventLoop({
  runningCallback: () => {
    slintEventLoopHasStarted = true;
    const login = initialProjectsDebugPending;
    initialProjectsDebugPending = null;
    if (login !== null) {
      void maybeDumpGitHubProjectsDebugAsync(login).catch((e) => {
        console.error("[debug-json] maybeDumpGitHubProjectsDebugAsync failed:", e);
      });
    }
  },
});
window.hide();

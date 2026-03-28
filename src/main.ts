import * as slint from "slint-ui";
import { execFile } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Large enough for paginated `gh api` project payloads. */
const GH_EXEC_MAX_BUFFER = 50 * 1024 * 1024;
import { openAppDb } from "./db/app-db.ts";
import {
  checkRequiredGitHubCliScopes,
  ghAuthLogout,
  ghAuthStatus,
  requiredGhOAuthScopesCsv,
  spawnGhAuthLogin,
  spawnGhAuthRefreshScopes,
} from "./gh/auth.ts";
import {
  emptyTransparentAvatarImage,
  loadAvatarRgba,
  type SlintRgbaImage,
} from "./gh/avatar-image.ts";
import { parseGhApiUserPayload } from "./schemas/gh-api-user.ts";

openAppDb();

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
type AuthedAuthState = "loggedOut" | "loggedIn" | "needsScopes" | "authorizing";

type AppStateHandle = {
  auth: AuthedAuthState;
};

type MainWindowInstance = {
  run(): Promise<void>;
  show(): void;
  hide(): void;
  AppState: AppStateHandle;
  login_clicked?: () => void;
  logout_clicked?: () => void;
  add_scopes_clicked?: () => void;
  close_auth_window: () => void;
  gh_label: string;
  scope_message: string;
  avatar?: SlintRgbaImage;
};

type MainWindowOpts = {
  "gh-label"?: string;
  "scope-message"?: string;
  avatar?: SlintRgbaImage;
};

function clearAvatar(window: MainWindowInstance): void {
  window.avatar = emptyTransparentAvatarImage;
}

async function fetchAndApplyGitHubUser(window: MainWindowInstance): Promise<void> {
  const result = await ghApiJson(["user"]);
  if (ghAuthStatus() !== "ok") {
    return;
  }
  if (!result.ok) {
    window.gh_label = result.error;
    clearAvatar(window);
    return;
  }
  const parsed = parseGhApiUserPayload(result.value);
  if (!parsed.ok) {
    window.gh_label = parsed.message;
    clearAvatar(window);
    return;
  }
  const user = parsed.user;
  window.gh_label = user.login;
  clearAvatar(window);

  if (process.env.GH_DEBUG_JSON === "1") {
    if (!slintEventLoopHasStarted) {
      initialProjectsDebugPending = user.login;
    } else {
      void maybeDumpGitHubProjectsDebugAsync(user.login).catch((e) => {
        console.error("[debug-json] maybeDumpGitHubProjectsDebugAsync failed:", e);
      });
    }
  }

  void loadAvatarRgba(user.avatar_url).then((loaded) => {
    if (loaded !== undefined) {
      window.avatar = loaded;
    } else {
      clearAvatar(window);
    }
  });
}

function applyAuthUi(window: MainWindowInstance): void {
  const status = ghAuthStatus();
  if (status === "no_gh") {
    window.AppState.auth = "loggedOut";
    window.gh_label = "gh not found (install GitHub CLI)";
    window.scope_message = "";
    clearAvatar(window);
    return;
  }
  if (status === "not_authed") {
    window.AppState.auth = "loggedOut";
    window.gh_label = "Not signed in";
    window.scope_message = "";
    clearAvatar(window);
    return;
  }

  window.AppState.auth = "loggedIn";
  window.gh_label = "Checking…";
  window.scope_message = "";
  window.close_auth_window();
  clearAvatar(window);
  void (async () => {
    const scopeCheck = await checkRequiredGitHubCliScopes();
    if (ghAuthStatus() !== "ok") {
      applyAuthUi(window);
      return;
    }
    if (!scopeCheck.ok) {
      window.AppState.auth = "needsScopes";
      window.scope_message = scopeCheck.message;
      window.gh_label = "";
      clearAvatar(window);
      return;
    }
    window.gh_label = "Loading…";
    await fetchAndApplyGitHubUser(window);
  })().catch((e) => {
    console.error("[github-app] scope check or user fetch failed:", e);
    window.gh_label = "Something went wrong";
    clearAvatar(window);
  });
}

const ui = slint.loadFile(new URL("./main.slint", import.meta.url)) as {
  MainWindow: new (opts: MainWindowOpts) => MainWindowInstance;
};

const window = new ui.MainWindow({ "gh-label": "", "scope-message": "" });

window.login_clicked = () => {
  window.AppState.auth = "authorizing";
  spawnGhAuthLogin(() => {
    void applyAuthUi(window);
  });
};

window.logout_clicked = () => {
  ghAuthLogout();
  void applyAuthUi(window);
};

window.add_scopes_clicked = () => {
  window.AppState.auth = "authorizing";
  spawnGhAuthRefreshScopes(requiredGhOAuthScopesCsv(), () => {
    void applyAuthUi(window);
  });
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

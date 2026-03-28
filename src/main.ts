import * as slint from "slint-ui";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { openAppDb } from "./db/app-db.ts";
import { ghAuthLogout, ghAuthStatus, spawnGhAuthLogin } from "./gh/auth.ts";
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

function ghApiJson(restArgs: string[], options?: GhApiJsonOptions): GhJsonResult {
  try {
    const out = execFileSync("gh", ["api", ...restArgs], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GH_PAGER: "cat" },
    });
    const trimmed = out.trim();
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

/** Options for Projects V2 list calls: empty stdout / `[]` means “no projects” — no debug file in that case. */
function projectsV2ListDebugOptions(stem: string): GhApiJsonOptions {
  return {
    debugStem: stem,
    emptyResponseAs: [],
    omitDebugFileIfEmptyArray: true,
  };
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

/**
 * When `GH_DEBUG_JSON=1`, dumps Projects (V2) for the user and each org membership.
 * Empty project lists write no file (not an error). Real `gh` failures still write `*--error.json`.
 */
function maybeDumpProjectsV2Debug(login: string): void {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }

  const userStem = `projects-v2--user--${login}`;
  const userRes = ghApiJson(
    [`users/${login}/projectsV2`, "--paginate"],
    projectsV2ListDebugOptions(userStem),
  );
  if (!userRes.ok) {
    writeDebugJsonStem(`${userStem}--error`, { error: userRes.error });
  }

  const orgsStem = "projects-v2--orgs-membership";
  const orgsRes = ghApiJson(["user/orgs", "--paginate"], { debugStem: orgsStem });
  if (!orgsRes.ok) {
    writeDebugJsonStem(`${orgsStem}--error`, { error: orgsRes.error });
    return;
  }

  for (const org of parseOrgLogins(orgsRes.value)) {
    const orgStem = `projects-v2--org--${org}`;
    const pr = ghApiJson(
      [`orgs/${org}/projectsV2`, "--paginate"],
      projectsV2ListDebugOptions(orgStem),
    );
    if (!pr.ok) {
      writeDebugJsonStem(`${orgStem}--error`, { error: pr.error });
    }
  }
}

/** Slint-node maps enum variants to kebab-case strings on `AppState.auth` (not `ui.Authed.*` values). */
type AuthedAuthState = "loggedOut" | "loggedIn" | "authorizing";

type AppStateHandle = {
  auth: AuthedAuthState;
};

type MainWindowInstance = {
  run(): Promise<void>;
  AppState: AppStateHandle;
  login_clicked?: () => void;
  logout_clicked?: () => void;
  gh_label: string;
  avatar?: SlintRgbaImage;
};

type MainWindowOpts = {
  "gh-label"?: string;
  avatar?: SlintRgbaImage;
};

function clearAvatar(window: MainWindowInstance): void {
  window.avatar = emptyTransparentAvatarImage;
}

async function applyAuthUi(window: MainWindowInstance): Promise<void> {
  const status = ghAuthStatus();
  if (status === "no_gh") {
    window.AppState.auth = "loggedOut";
    window.gh_label = "gh not found (install GitHub CLI)";
    clearAvatar(window);
    return;
  }
  if (status === "not_authed") {
    window.AppState.auth = "loggedOut";
    window.gh_label = "Not signed in";
    clearAvatar(window);
    return;
  }

  window.AppState.auth = "loggedIn";
  const result = ghApiJson(["user"]);
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
  maybeDumpProjectsV2Debug(user.login);
  const loaded = await loadAvatarRgba(user.avatar_url);
  window.gh_label = user.login;
  if (loaded !== undefined) {
    window.avatar = loaded;
  } else {
    clearAvatar(window);
  }
}

const ui = slint.loadFile(new URL("./main.slint", import.meta.url)) as {
  MainWindow: new (opts: MainWindowOpts) => MainWindowInstance;
};

const window = new ui.MainWindow({ "gh-label": "" });

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

await applyAuthUi(window);
await window.run();

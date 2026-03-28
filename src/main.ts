import * as slint from "slint-ui";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ghAuthLogout,
  ghAuthStatus,
  spawnGhAuthLogin,
} from "./gh/auth.ts";
import {
  emptyTransparentAvatarImage,
  loadAvatarRgba,
  type SlintRgbaImage,
} from "./gh/avatar-image.ts";
import { parseGhApiUserPayload } from "./schemas/gh-api-user.ts";

/**
 * When `GH_DEBUG_JSON=1`, writes pretty-printed JSON under `debug-json/` (gitignored).
 * Do not enable while screen-sharing; API responses may include PII or account details.
 */
function maybeWriteDebugJson(restArgs: string[], value: unknown): void {
  if (process.env.GH_DEBUG_JSON !== "1") {
    return;
  }
  const dir = join(process.cwd(), "debug-json");
  mkdirSync(dir, { recursive: true });
  const segments = restArgs.map((a) => a.replace(/[^a-zA-Z0-9._-]+/g, "_"));
  const filename = `gh-api--${segments.join("--")}.json`;
  const filePath = join(dir, filename);
  writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function mapGhExecError(e: unknown): string {
  if (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    e.code === "ENOENT"
  ) {
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

function ghApiJson(restArgs: string[]): GhJsonResult {
  try {
    const out = execFileSync("gh", ["api", ...restArgs], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GH_PAGER: "cat" },
    });
    const trimmed = out.trim();
    if (trimmed.length === 0) {
      return { ok: false, error: "gh: empty response (try gh auth login)" };
    }
    let value: unknown;
    try {
      value = JSON.parse(trimmed);
    } catch {
      return { ok: false, error: "gh: response was not valid JSON" };
    }
    maybeWriteDebugJson(restArgs, value);
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: mapGhExecError(e) };
  }
}

type AppStateHandle = {
  is_logged_in: boolean;
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
    window.AppState.is_logged_in = false;
    window.gh_label = "gh not found (install GitHub CLI)";
    clearAvatar(window);
    return;
  }
  if (status === "not_authed") {
    window.AppState.is_logged_in = false;
    window.gh_label = "Not signed in";
    clearAvatar(window);
    return;
  }

  window.AppState.is_logged_in = true;
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

import * as slint from "slint-ui";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
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

async function buildMainWindowProps(): Promise<{
  "gh-label": string;
  avatar?: SlintRgbaImage;
}> {
  const result = ghApiJson(["user"]);
  if (!result.ok) {
    return { "gh-label": result.error };
  }
  const parsed = parseGhApiUserPayload(result.value);
  if (!parsed.ok) {
    return { "gh-label": parsed.message };
  }
  const user = parsed.user;
  const loaded = await loadAvatarRgba(user.avatar_url);
  return {
    "gh-label": user.login,
    ...(loaded !== undefined ? { avatar: loaded } : {}),
  };
}

type MainWindowInstance = {
  run(): Promise<void>;
};

type MainWindowOpts = {
  "gh-label"?: string;
  avatar?: SlintRgbaImage;
};

const ui = slint.loadFile(new URL("./main.slint", import.meta.url)) as {
  MainWindow: new (opts: MainWindowOpts) => MainWindowInstance;
};

const props = await buildMainWindowProps();
const window = new ui.MainWindow(props);

await window.run();

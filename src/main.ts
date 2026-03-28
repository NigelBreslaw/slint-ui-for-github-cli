import * as slint from "slint-ui";
import { execFileSync } from "node:child_process";

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
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: mapGhExecError(e) };
  }
}

function readLoginFromUserPayload(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  if (!("login" in value)) {
    return null;
  }
  const rec = value as Record<string, unknown>;
  const login = rec.login;
  if (typeof login !== "string" || login.length === 0) {
    return null;
  }
  return login;
}

function getGhLogin(): string {
  const result = ghApiJson(["user"]);
  if (!result.ok) {
    return result.error;
  }
  const login = readLoginFromUserPayload(result.value);
  if (login === null) {
    return "gh: unexpected response (missing login)";
  }
  return login;
}

type MainWindowInstance = {
  run(): Promise<void>;
};

type MainWindowOpts = {
  "gh-label"?: string;
};

const ui = slint.loadFile(new URL("./main.slint", import.meta.url)) as {
  MainWindow: new (opts: MainWindowOpts) => MainWindowInstance;
};

const label = getGhLogin();
const window = new ui.MainWindow({ "gh-label": label });

await window.run();

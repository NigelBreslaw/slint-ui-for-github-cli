import { execFile, execFileSync, spawn } from "node:child_process";
import { promisify } from "node:util";
import {
  type ScopeCheckResult,
  REQUIRED_GH_OAUTH_SCOPES,
  checkRequiredScopesAgainstGranted,
  grantedScopesFromAuthStatusHostsJson,
} from "./required-scopes.ts";

const execFileAsync = promisify(execFile);

/** Result of `gh auth status`: CLI missing, not logged in, or authenticated. */
type GhAuthStatus = "no_gh" | "not_authed" | "ok";

/**
 * Uses exit code of `gh auth status` (plain, not `--json`).
 * See https://cli.github.com/manual/gh_auth_status
 */
export function ghAuthStatus(): GhAuthStatus {
  try {
    execFileSync("gh", ["auth", "status"], { stdio: "ignore" });
    return "ok";
  } catch (e: unknown) {
    if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return "no_gh";
    }
    return "not_authed";
  }
}

export function ghAuthLogout(): void {
  try {
    execFileSync("gh", ["auth", "logout"], { stdio: "inherit" });
  } catch (e) {
    console.error("gh auth logout failed", e);
  }
}

/**
 * Runs interactive `gh auth login` with inherited stdio (use from a terminal).
 * Invokes `onClose` when the child exits (including spawn failure).
 */
export function spawnGhAuthLogin(onClose: (code: number | null) => void): void {
  const child = spawn("gh", ["auth", "login"], {
    stdio: "inherit",
    detached: false,
  });
  child.on("close", (code) => {
    onClose(code);
  });
  child.on("error", (err) => {
    console.error("gh auth login failed to start", err);
    onClose(null);
  });
}

/**
 * Comma-separated list of scopes to request via `gh auth refresh --scopes` (idempotent add).
 */
export function requiredGhOAuthScopesCsv(): string {
  return REQUIRED_GH_OAUTH_SCOPES.join(",");
}

/**
 * Runs `gh auth status --json hosts` and checks token scopes against {@link REQUIRED_GH_OAUTH_SCOPES}.
 * Call only when {@link ghAuthStatus} is `"ok"`; on subprocess/JSON failure, returns `unknown` so the UI can offer refresh.
 */
export async function checkRequiredGitHubCliScopes(): Promise<ScopeCheckResult> {
  try {
    const { stdout } = await execFileAsync("gh", ["auth", "status", "--json", "hosts"], {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    });
    let json: unknown;
    try {
      json = JSON.parse((stdout as string).trim());
    } catch {
      return {
        ok: false,
        unknown: true,
        message: "Could not verify scopes (unexpected `gh auth status` output).",
      };
    }
    const granted = grantedScopesFromAuthStatusHostsJson(json);
    return checkRequiredScopesAgainstGranted(granted, REQUIRED_GH_OAUTH_SCOPES);
  } catch (e: unknown) {
    if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return {
        ok: false,
        unknown: true,
        message: "Could not verify scopes (`gh` not found).",
      };
    }
    return {
      ok: false,
      unknown: true,
      message: "Could not verify scopes (run `gh auth status` in a terminal).",
    };
  }
}

/**
 * Runs interactive `gh auth refresh --scopes …` with inherited stdio.
 * Invokes `onClose` when the child exits (including spawn failure).
 */
export function spawnGhAuthRefreshScopes(
  scopesCsv: string,
  onClose: (code: number | null) => void,
): void {
  const child = spawn("gh", ["auth", "refresh", "--scopes", scopesCsv], {
    stdio: "inherit",
    detached: false,
  });
  child.on("close", (code) => {
    onClose(code);
  });
  child.on("error", (err) => {
    console.error("gh auth refresh failed to start", err);
    onClose(null);
  });
}

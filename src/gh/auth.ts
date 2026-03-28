import { execFileSync, spawn } from "node:child_process";

/** Result of `gh auth status`: CLI missing, not logged in, or authenticated. */
export type GhAuthStatus = "no_gh" | "not_authed" | "ok";

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

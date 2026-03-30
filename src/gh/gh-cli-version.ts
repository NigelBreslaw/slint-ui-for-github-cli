import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mapGhExecError } from "./map-gh-exec-error.ts";

const execFileAsync = promisify(execFile);

/** Minimum `gh` version required by this app (inclusive). */
export const MIN_GH_CLI_VERSION = { major: 2, minor: 89, patch: 0 } as const;

export function formatMinGhCliVersion(): string {
  const { major, minor, patch } = MIN_GH_CLI_VERSION;
  return `${major}.${minor}.${patch}`;
}

type GhSemver = { major: number; minor: number; patch: number };

/**
 * Parses the first line of `gh --version`, e.g. `gh version 2.89.0 (2026-03-26)`.
 * Returns null if the pattern does not match.
 */
export function parseSemverFromGhVersionLine(line: string): GhSemver | null {
  const m = /^gh\s+version\s+(\d+)\.(\d+)\.(\d+)/i.exec(line.trim());
  if (m === null) {
    return null;
  }
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const patch = Number(m[3]);
  if (![major, minor, patch].every((n) => Number.isFinite(n))) {
    return null;
  }
  return { major, minor, patch };
}

/** True iff `v` is greater than or equal to `min` (lexicographic on major, minor, patch). */
export function isGhSemverAtLeast(
  v: GhSemver,
  min: {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
  } = MIN_GH_CLI_VERSION,
): boolean {
  if (v.major !== min.major) {
    return v.major > min.major;
  }
  if (v.minor !== min.minor) {
    return v.minor > min.minor;
  }
  return v.patch >= min.patch;
}

type GhVersionGateResult =
  | { kind: "ok" }
  | { kind: "not_found" }
  | { kind: "too_old"; line: string; parsed: GhSemver }
  | { kind: "unparseable"; line: string }
  | { kind: "exec_failed"; error: string };

/**
 * Runs `gh --version` and checks against {@link MIN_GH_CLI_VERSION}.
 * `not_found` means treat like missing `gh` (defer to existing scope-check UX).
 */
export async function checkGhCliVersionGate(): Promise<GhVersionGateResult> {
  const r = await getGhCliVersionLine();
  if (!r.ok) {
    if (r.error.includes("not found")) {
      return { kind: "not_found" };
    }
    return { kind: "exec_failed", error: r.error };
  }
  const parsed = parseSemverFromGhVersionLine(r.line);
  if (parsed === null) {
    return { kind: "unparseable", line: r.line };
  }
  if (!isGhSemverAtLeast(parsed)) {
    return { kind: "too_old", line: r.line, parsed };
  }
  return { kind: "ok" };
}

/** First line of `gh --version`, e.g. `gh version 2.89.0 (2026-03-26)`. */
export async function getGhCliVersionLine(): Promise<
  { ok: true; line: string } | { ok: false; error: string }
> {
  try {
    const { stdout } = await execFileAsync("gh", ["--version"], {
      encoding: "utf8",
      env: { ...process.env, GH_PAGER: "cat" },
    });
    const first = (stdout as string).trim().split("\n")[0]?.trim() ?? "";
    if (first.length === 0) {
      return { ok: false, error: "gh --version returned empty output" };
    }
    return { ok: true, line: first };
  } catch (e) {
    return { ok: false, error: mapGhExecError(e) };
  }
}

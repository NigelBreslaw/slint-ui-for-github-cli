import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mapGhExecError } from "./map-gh-exec-error.ts";

const execFileAsync = promisify(execFile);

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

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mapGhExecError } from "./map-gh-exec-error.ts";

const execFileAsync = promisify(execFile);

const GH_GRAPHQL_MAX_BUFFER = 50 * 1024 * 1024;

/**
 * Run `gh api graphql` with a query string and optional variables (`-F key=value`).
 */
export async function ghGraphqlWithVars(
  query: string,
  variables: Record<string, string | number | undefined>,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  const args: string[] = ["api", "graphql", "-f", `query=${query}`];
  for (const [key, val] of Object.entries(variables)) {
    if (val === undefined) {
      continue;
    }
    args.push("-F", `${key}=${val}`);
  }
  try {
    const { stdout } = await execFileAsync("gh", args, {
      encoding: "utf8",
      env: { ...process.env, GH_PAGER: "cat" },
      maxBuffer: GH_GRAPHQL_MAX_BUFFER,
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

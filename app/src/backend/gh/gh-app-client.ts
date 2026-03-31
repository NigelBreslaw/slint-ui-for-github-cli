import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mapGhExecError } from "./map-gh-exec-error.ts";
import { writeDebugJsonStem } from "./write-debug-json.ts";

const execFileAsync = promisify(execFile);

/** Large enough for paginated `gh api` project payloads. */
const GH_EXEC_MAX_BUFFER = 50 * 1024 * 1024;

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

function maybeWriteDebugJsonFromRestArgs(restArgs: string[], value: unknown): void {
  const segments = restArgs.map((a) => a.replace(/[^a-zA-Z0-9._-]+/g, "_"));
  writeDebugJsonStem(`gh-api--${segments.join("--")}`, value);
}

export async function ghApiGraphql(query: string): Promise<GhJsonResult> {
  try {
    const { stdout } = await execFileAsync("gh", ["api", "graphql", "-f", `query=${query}`], {
      encoding: "utf8",
      env: { ...process.env, GH_PAGER: "cat" },
      maxBuffer: GH_EXEC_MAX_BUFFER,
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

export async function ghApiJson(
  restArgs: string[],
  options?: GhApiJsonOptions,
): Promise<GhJsonResult> {
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

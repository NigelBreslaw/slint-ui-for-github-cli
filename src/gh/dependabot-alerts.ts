import {
  parseDependabotAlertsList,
  type DependabotAlertRow,
} from "../schemas/gh-rest-dependabot-alerts.ts";
import { ghApiJson } from "./gh-app-client.ts";

function validateOwnerRepo(
  owner: string,
  repo: string,
): { ok: true } | { ok: false; error: string } {
  const o = owner.trim();
  const r = repo.trim();
  if (o.length === 0 || r.length === 0) {
    return { ok: false, error: "owner and repo are required" };
  }
  if (o.includes("/") || r.includes("/")) {
    return { ok: false, error: "owner and repo must not contain '/'" };
  }
  return { ok: true };
}

/**
 * Lists Dependabot alerts for a repository via `gh api` with `--paginate`.
 * Requires a token with `repo` or `security_events` for private or alert data.
 */
export async function fetchDependabotAlertsForRepo(
  owner: string,
  repo: string,
): Promise<{ ok: true; rows: DependabotAlertRow[] } | { ok: false; error: string }> {
  const v = validateOwnerRepo(owner, repo);
  if (!v.ok) {
    return { ok: false, error: v.error };
  }
  const o = owner.trim();
  const r = repo.trim();
  const path = `repos/${o}/${r}/dependabot/alerts`;
  const raw = await ghApiJson([path, "--paginate"], {
    omitDebugFileIfEmptyArray: true,
    debugStem: "dependabot-alerts--rest",
  });
  if (!raw.ok) {
    return { ok: false, error: raw.error };
  }
  const parsed = parseDependabotAlertsList(raw.value);
  if (!parsed.ok) {
    return { ok: false, error: parsed.message };
  }
  return { ok: true, rows: parsed.rows };
}

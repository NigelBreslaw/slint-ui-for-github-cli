import { parseOrgReposListJson, type OrgRepoRow } from "../schemas/gh-rest-org-repos.ts";
import { ghApiJson } from "./gh-app-client.ts";

/** Same org as [`slint-ui-org-projects-ui.ts`](./slint-ui-org-projects-ui.ts) project list flows. */
const SLINT_UI_ORG = "slint-ui";

/**
 * Lists all repositories for the **slint-ui** org via `gh api` with `--paginate`
 * (`per_page=100` per request).
 */
export async function fetchAllSlintUiOrgReposRest(): Promise<
  { ok: true; repos: OrgRepoRow[] } | { ok: false; error: string }
> {
  const path = `orgs/${SLINT_UI_ORG}/repos`;
  const raw = await ghApiJson([path, "-f", "per_page=100", "--paginate"], {
    omitDebugFileIfEmptyArray: true,
    debugStem: "org-repos--slint-ui",
  });
  if (!raw.ok) {
    return { ok: false, error: raw.error };
  }
  const parsed = parseOrgReposListJson(raw.value);
  if (!parsed.ok) {
    return { ok: false, error: parsed.message };
  }
  return { ok: true, repos: parsed.repos };
}

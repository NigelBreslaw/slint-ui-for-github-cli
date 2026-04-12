import { parseOrgReposListJson, type OrgRepoRow } from "../schemas/gh-rest-org-repos.ts";
import { ghApiJson } from "./gh-app-client.ts";

/** Same org as [`slint-ui-org-projects-ui.ts`](./slint-ui-org-projects-ui.ts) project list flows. */
const SLINT_UI_ORG = "slint-ui";

/**
 * Lists all repositories for the **slint-ui** org via `gh api` with `--paginate`
 * (`per_page=100` per request).
 *
 * **Do not** use `-f per_page=…` without `--method GET`: `gh api` switches to POST when
 * any `-f` is present, so `orgs/{org}/repos` would hit “create repository” and return 422
 * (“New repository name must not be blank”). Query params in the path keep the method GET.
 */
export async function fetchAllSlintUiOrgReposRest(): Promise<
  { ok: true; repos: OrgRepoRow[] } | { ok: false; error: string }
> {
  const path = `orgs/${SLINT_UI_ORG}/repos?per_page=100`;
  const raw = await ghApiJson([path, "--paginate"], {
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

/**
 * Minimal repo row from `gh api orgs/{org}/repos?per_page=100 --paginate` (merged JSON array).
 * @see https://docs.github.com/en/rest/repos/repos#list-organization-repositories
 */
import { type } from "arktype";

const orgRepoItemSchema = type({
  name: "string",
  full_name: "string",
  default_branch: "string | null",
});

type OrgRepoItem = typeof orgRepoItemSchema.infer;

export type OrgRepoRow = {
  name: string;
  fullName: string;
  defaultBranch: string;
};

function mapItemToRow(item: OrgRepoItem): OrgRepoRow {
  return {
    name: item.name,
    fullName: item.full_name,
    defaultBranch: item.default_branch ?? "",
  };
}

/**
 * Validates the merged JSON array from `gh api orgs/…/repos --paginate`.
 */
export function parseOrgReposListJson(
  value: unknown,
): { ok: true; repos: OrgRepoRow[] } | { ok: false; message: string } {
  if (!Array.isArray(value)) {
    return { ok: false, message: "gh: org repos response was not a JSON array" };
  }
  const repos: OrgRepoRow[] = [];
  for (let i = 0; i < value.length; i++) {
    const el = value[i];
    const result = orgRepoItemSchema(el);
    if (result instanceof type.errors) {
      const detail = result.summary.trim();
      return {
        ok: false,
        message:
          detail.length > 0
            ? `gh: org repo at index ${i} (${detail})`
            : `gh: org repo at index ${i} did not match expected shape`,
      };
    }
    repos.push(mapItemToRow(result));
  }
  return { ok: true, repos };
}

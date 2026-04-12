import {
  parseRepoCandidatesGraphqlData,
  type RepoCandidatesParsedPage,
} from "../schemas/gh-graphql-repo-candidates.ts";
import { ghGraphqlWithVars } from "./gh-graphql.ts";

const REPO_ISSUES_PRS_QUERY = `
query RepoIssuesAndPullRequests($owner: String!, $name: String!, $first: Int!, $issuesAfter: String, $prsAfter: String) {
  repository(owner: $owner, name: $name) {
    issues(first: $first, after: $issuesAfter, orderBy: {field: UPDATED_AT, direction: DESC}, states: [OPEN]) {
      pageInfo { hasNextPage endCursor }
      nodes { id number title updatedAt url }
    }
    pullRequests(first: $first, after: $prsAfter, orderBy: {field: UPDATED_AT, direction: DESC}, states: [OPEN]) {
      pageInfo { hasNextPage endCursor }
      nodes { id number title updatedAt url }
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

const MAX_PAGE = 100;

function graphqlErrorsMessage(root: unknown): string | null {
  if (root === null || typeof root !== "object") {
    return null;
  }
  const errors = (root as Record<string, unknown>).errors;
  if (!Array.isArray(errors) || errors.length === 0) {
    return null;
  }
  const first = errors[0];
  if (
    first !== null &&
    typeof first === "object" &&
    "message" in first &&
    typeof (first as { message: unknown }).message === "string"
  ) {
    return (first as { message: string }).message;
  }
  return "GraphQL error";
}

function validateOwnerRepoName(
  owner: string,
  name: string,
): { ok: true } | { ok: false; error: string } {
  const o = owner.trim();
  const n = name.trim();
  if (o.length === 0 || n.length === 0) {
    return { ok: false, error: "owner and name are required" };
  }
  if (o.includes("/") || n.includes("/")) {
    return { ok: false, error: "owner and name must not contain '/'" };
  }
  return { ok: true };
}

function clampFirst(first: number): number {
  if (!Number.isFinite(first)) {
    return 25;
  }
  const i = Math.floor(first);
  return Math.min(MAX_PAGE, Math.max(1, i));
}

/**
 * Fetches one page of **open** issues and **open** pull requests for a repository, ordered by
 * `UPDATED_AT` descending per connection. Returns merged `rows` sorted by `updatedAt` descending.
 *
 * Pagination is independent per connection: use `issuesAfter` / `pullRequestsAfter` cursors from the
 * previous response’s `issuesPageInfo` / `pullRequestsPageInfo`.
 */
export async function fetchRepoCandidatesPageGraphql(
  owner: string,
  name: string,
  options: {
    first: number;
    issuesAfter?: string | null;
    pullRequestsAfter?: string | null;
  },
): Promise<{ ok: true; value: RepoCandidatesParsedPage } | { ok: false; error: string }> {
  const v = validateOwnerRepoName(owner, name);
  if (!v.ok) {
    return { ok: false, error: v.error };
  }
  const o = owner.trim();
  const r = name.trim();
  const first = clampFirst(options.first);
  const variables: Record<string, string | number | undefined> = {
    owner: o,
    name: r,
    first,
    issuesAfter: options.issuesAfter?.trim() || undefined,
    prsAfter: options.pullRequestsAfter?.trim() || undefined,
  };
  const res = await ghGraphqlWithVars(REPO_ISSUES_PRS_QUERY, variables);
  if (!res.ok) {
    return { ok: false, error: res.error };
  }
  const gqlErr = graphqlErrorsMessage(res.value);
  if (gqlErr !== null) {
    return { ok: false, error: `gh: ${gqlErr}` };
  }
  const parsed = parseRepoCandidatesGraphqlData(res.value);
  if (!parsed.ok) {
    return { ok: false, error: parsed.message };
  }
  return { ok: true, value: parsed.value };
}

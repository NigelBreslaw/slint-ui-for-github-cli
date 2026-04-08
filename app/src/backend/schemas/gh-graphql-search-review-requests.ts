/**
 * Runtime shape for `gh api graphql` with `search(type: ISSUE, …)` for open PRs
 * where the viewer was directly asked to review (`user-review-requested:@me`).
 */
import { type } from "arktype";

const pageInfoSchema = type({
  hasNextPage: "boolean",
  endCursor: "string | null",
});

const repositorySchema = type({
  nameWithOwner: "string",
});

const authorActorSchema = type({ login: "string" });

/** `Issue` and `PullRequest` search hits both expose these fields. */
const searchResultNodeSchema = type({
  title: "string",
  url: "string",
  repository: repositorySchema,
  /** PR/issue author login; null for e.g. ghost users. Omitted in rare API shapes — treat as unknown. */
  author: authorActorSchema.or(type.null).optional(),
});

const searchEdgeSchema = type({
  cursor: "string",
  node: searchResultNodeSchema.or(type.null),
});

const searchConnectionSchema = type({
  issueCount: "number",
  pageInfo: pageInfoSchema,
  edges: searchEdgeSchema.array(),
});

type ReviewRequestSearchPage = typeof searchConnectionSchema.infer;

export type ReviewRequestRow = {
  title: string;
  url: string;
  repo_label: string;
  /** `author.login` when present; empty when author is null or missing (not the same as “who clicked Request review”). */
  author_login: string;
};

function graphqlErrorMessage(errors: unknown): string {
  if (!Array.isArray(errors) || errors.length === 0) {
    return "GraphQL error";
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

function mapPageToRows(page: ReviewRequestSearchPage): ReviewRequestRow[] {
  const rows: ReviewRequestRow[] = [];
  for (const edge of page.edges) {
    const node = edge.node;
    if (node === null) {
      continue;
    }
    rows.push({
      title: node.title,
      url: node.url,
      repo_label: node.repository.nameWithOwner,
      author_login: node.author?.login ?? "",
    });
  }
  return rows;
}

/**
 * Validates one page of `data.search` from the review-requests GraphQL query.
 */
export function parseReviewRequestsSearchPage(
  value: unknown,
):
  | { ok: true; page: ReviewRequestSearchPage; rows: ReviewRequestRow[] }
  | { ok: false; message: string } {
  if (value === null || typeof value !== "object") {
    return { ok: false, message: "gh: graphql response was not an object" };
  }
  const root = value as Record<string, unknown>;
  const data = root.data;
  if (data === null || typeof data !== "object" || !("search" in data)) {
    const hint =
      Array.isArray(root.errors) && root.errors.length > 0
        ? graphqlErrorMessage(root.errors)
        : "graphql response missing data.search";
    return { ok: false, message: `gh: ${hint}` };
  }
  const search = (data as { search: unknown }).search;
  if (search === null || search === undefined) {
    const hint =
      Array.isArray(root.errors) && root.errors.length > 0
        ? graphqlErrorMessage(root.errors)
        : "data.search was null";
    return { ok: false, message: `gh: ${hint}` };
  }

  const result = searchConnectionSchema(search);
  if (result instanceof type.errors) {
    const detail = result.summary.trim();
    return {
      ok: false,
      message:
        detail.length > 0
          ? `gh: search shape (${detail})`
          : "gh: search shape did not match GraphQL selection",
    };
  }
  return { ok: true, page: result, rows: mapPageToRows(result) };
}

export const REVIEW_REQUESTS_SEARCH_GRAPHQL = `
query ReviewRequests($searchQuery: String!, $first: Int!, $after: String) {
  search(query: $searchQuery, type: ISSUE, first: $first, after: $after) {
    issueCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        ... on PullRequest {
          title
          url
          author {
            login
          }
          repository {
            nameWithOwner
          }
        }
        ... on Issue {
          title
          url
          author {
            login
          }
          repository {
            nameWithOwner
          }
        }
      }
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

export const REVIEW_REQUESTS_SEARCH_QUERY_STRING = "is:open is:pr user-review-requested:@me";

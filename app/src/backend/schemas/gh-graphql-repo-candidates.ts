/**
 * Parses `repository { issues pullRequests }` pages for import-from-repo candidate lists.
 * @see https://docs.github.com/en/graphql/reference/objects#repository
 */
import { type } from "arktype";

const pageInfoSchema = type({
  hasNextPage: "boolean",
  endCursor: "string | null",
});

const candidateNodeSchema = type({
  id: "string",
  number: "number",
  title: "string",
  updatedAt: "string",
  url: "string",
});

export type RepoCandidateNode = typeof candidateNodeSchema.infer;

export type RepoCandidateKind = "issue" | "pullRequest";

/** Unified row for issues and pull requests (open only in the GraphQL query). */
export type RepoCandidateRow = {
  nodeId: string;
  kind: RepoCandidateKind;
  number: number;
  title: string;
  updatedAt: string;
  url: string;
};

export type RepoCandidatesConnectionPageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export type RepoCandidatesParsedPage = {
  rows: RepoCandidateRow[];
  issuesPageInfo: RepoCandidatesConnectionPageInfo;
  pullRequestsPageInfo: RepoCandidatesConnectionPageInfo;
};

/** Descending sort key for GitHub ISO-8601 timestamps (UTC `…Z`). */
export function compareUpdatedAtDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

export function mergeIssueAndPullRequestNodesByUpdatedAt(
  issueNodes: readonly RepoCandidateNode[],
  prNodes: readonly RepoCandidateNode[],
): RepoCandidateRow[] {
  const rows: RepoCandidateRow[] = [];
  for (const n of issueNodes) {
    rows.push({
      nodeId: n.id,
      kind: "issue",
      number: n.number,
      title: n.title,
      updatedAt: n.updatedAt,
      url: n.url,
    });
  }
  for (const n of prNodes) {
    rows.push({
      nodeId: n.id,
      kind: "pullRequest",
      number: n.number,
      title: n.title,
      updatedAt: n.updatedAt,
      url: n.url,
    });
  }
  rows.sort((x, y) => compareUpdatedAtDesc(x.updatedAt, y.updatedAt));
  return rows;
}

function parseConnection(
  label: string,
  conn: unknown,
):
  | { ok: true; pageInfo: RepoCandidatesConnectionPageInfo; nodes: RepoCandidateNode[] }
  | { ok: false; message: string } {
  if (conn === null || typeof conn !== "object") {
    return { ok: false, message: `gh: ${label} connection was missing` };
  }
  const c = conn as Record<string, unknown>;
  const pi = c.pageInfo;
  const piResult = pageInfoSchema(pi);
  if (piResult instanceof type.errors) {
    return {
      ok: false,
      message: `gh: ${label}.pageInfo (${piResult.summary.trim() || "invalid"})`,
    };
  }
  const pageInfo: RepoCandidatesConnectionPageInfo = {
    hasNextPage: piResult.hasNextPage,
    endCursor: piResult.endCursor,
  };
  const rawNodes = c.nodes;
  if (!Array.isArray(rawNodes)) {
    return { ok: false, message: `gh: ${label}.nodes was not an array` };
  }
  const nodes: RepoCandidateNode[] = [];
  for (let i = 0; i < rawNodes.length; i++) {
    const el = rawNodes[i];
    const nr = candidateNodeSchema(el);
    if (nr instanceof type.errors) {
      return {
        ok: false,
        message: `gh: ${label} node at index ${i} (${nr.summary.trim() || "invalid"})`,
      };
    }
    nodes.push(nr);
  }
  return { ok: true, pageInfo, nodes };
}

/**
 * Parses `data.repository` from `RepoIssuesAndPullRequests` GraphQL query results.
 */
export function parseRepoCandidatesGraphqlData(
  root: unknown,
): { ok: true; value: RepoCandidatesParsedPage } | { ok: false; message: string } {
  if (root === null || typeof root !== "object") {
    return { ok: false, message: "gh: graphql response was not an object" };
  }
  const data = (root as Record<string, unknown>).data;
  if (data === null || typeof data !== "object") {
    return { ok: false, message: "gh: graphql response missing data" };
  }
  const repo = (data as Record<string, unknown>).repository;
  if (repo === null) {
    return { ok: false, message: "gh: repository not found or not accessible" };
  }
  if (typeof repo !== "object") {
    return { ok: false, message: "gh: data.repository was not an object" };
  }
  const r = repo as Record<string, unknown>;
  const issuesConn = parseConnection("issues", r.issues);
  if (!issuesConn.ok) {
    return issuesConn;
  }
  const prsConn = parseConnection("pullRequests", r.pullRequests);
  if (!prsConn.ok) {
    return prsConn;
  }
  const rows = mergeIssueAndPullRequestNodesByUpdatedAt(issuesConn.nodes, prsConn.nodes);
  return {
    ok: true,
    value: {
      rows,
      issuesPageInfo: issuesConn.pageInfo,
      pullRequestsPageInfo: prsConn.pageInfo,
    },
  };
}

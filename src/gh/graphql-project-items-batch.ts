/**
 * Batched `node(id: …)` GraphQL fetches for Project V2 `items`, with client-side filtering
 * approximating `gh project item-list --query "assignee:@me is:open -is:archived"`.
 *
 * GitHub GraphQL does not expose the Projects search string on `items`; `isArchived` exists on
 * ProjectV2Item (see GitHub GraphQL reference).
 */
import { ghGraphqlWithVars } from "./gh-graphql.ts";
import { writeDebugJsonStem } from "./write-debug-json.ts";

const ITEM_PAGE_FIRST = 50;
const MAX_RAW_ITEMS_PER_PROJECT = 500;
const DEFAULT_BATCH_SIZE = 5;

function batchSize(): number {
  const raw = process.env.GH_DEBUG_ASSIGNED_PROJECT_ITEMS_BATCH;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_BATCH_SIZE;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return DEFAULT_BATCH_SIZE;
  }
  return Math.min(n, 10);
}

function escapeGraphqlString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

type GqlAssignees = { nodes?: Array<{ login?: string } | null> | null } | null;

type GqlContent =
  | {
      __typename?: string;
      number?: number;
      title?: string;
      body?: string;
      url?: string;
      state?: string;
      assignees?: GqlAssignees;
      repository?: { nameWithOwner?: string } | null;
    }
  | null
  | undefined;

type GqlItemNode = {
  id?: string;
  type?: string;
  isArchived?: boolean;
  content?: GqlContent;
};

function assigneeLoginsFromContent(content: GqlContent): string[] {
  if (content === null || content === undefined) {
    return [];
  }
  const nodes = content.assignees?.nodes;
  if (!Array.isArray(nodes)) {
    return [];
  }
  const out: string[] = [];
  for (const n of nodes) {
    if (n !== null && typeof n === "object" && typeof n.login === "string") {
      out.push(n.login);
    }
  }
  return out;
}

function viewerIsAssignee(content: GqlContent, viewerLogin: string): boolean {
  const lower = viewerLogin.toLowerCase();
  return assigneeLoginsFromContent(content).some((l) => l.toLowerCase() === lower);
}

function passesAssignOpenNonArchived(item: GqlItemNode, viewerLogin: string): boolean {
  if (item.isArchived === true) {
    return false;
  }
  const c = item.content;
  if (c === null || c === undefined) {
    return false;
  }
  const tn = c.__typename;
  if (tn === "Issue" || tn === "PullRequest") {
    return c.state === "OPEN" && viewerIsAssignee(c, viewerLogin);
  }
  if (tn === "DraftIssue") {
    return viewerIsAssignee(c, viewerLogin);
  }
  return false;
}

function mapNodeToCliLikeItem(item: GqlItemNode): Record<string, unknown> | null {
  const c = item.content;
  if (c === null || c === undefined) {
    return null;
  }
  const assignees = assigneeLoginsFromContent(c);
  const tn = c.__typename;
  if (tn === "Issue" || tn === "PullRequest") {
    const repo = c.repository?.nameWithOwner ?? "";
    const type = tn === "PullRequest" ? "PullRequest" : "Issue";
    return {
      id: item.id,
      assignees,
      title: c.title ?? "",
      repository: repo.length > 0 ? `https://github.com/${repo}` : "",
      content: {
        body: c.body ?? "",
        number: c.number,
        repository: repo,
        title: c.title ?? "",
        type,
        url: c.url ?? "",
      },
    };
  }
  if (tn === "DraftIssue") {
    return {
      id: item.id,
      assignees,
      title: c.title ?? "",
      repository: "",
      content: {
        body: c.body ?? "",
        type: "DraftIssue",
        title: c.title ?? "",
      },
    };
  }
  return null;
}

function buildBatchQuery(
  chunk: ReadonlyArray<{ projectId: string; after: string | null }>,
): string {
  const parts = chunk.map((c, i) => {
    const afterArg =
      c.after !== null && c.after.length > 0 ? `, after: "${escapeGraphqlString(c.after)}"` : "";
    return `p${i}: node(id: "${escapeGraphqlString(c.projectId)}") {
      ... on ProjectV2 {
        number
        items(first: ${ITEM_PAGE_FIRST}${afterArg}) {
          totalCount
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            type
            isArchived
            content {
              __typename
              ... on Issue {
                number
                title
                body
                url
                state
                assignees(first: 20) { nodes { login } }
                repository { nameWithOwner }
              }
              ... on PullRequest {
                number
                title
                body
                url
                state
                assignees(first: 20) { nodes { login } }
                repository { nameWithOwner }
              }
              ... on DraftIssue {
                title
                body
                assignees(first: 20) { nodes { login } }
              }
            }
          }
        }
      }
    }`;
  });
  return `query { ${parts.join("\n")} }`.replace(/\s+/g, " ").trim();
}

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

export async function fetchViewerLoginGraphql(): Promise<
  { ok: true; login: string } | { ok: false; error: string }
> {
  const res = await ghGraphqlWithVars(`query { viewer { login } }`, {});
  if (!res.ok) {
    return res;
  }
  const root = res.value;
  const gqlErr = graphqlErrorsMessage(root);
  if (gqlErr !== null) {
    return { ok: false, error: `gh: ${gqlErr}` };
  }
  if (root === null || typeof root !== "object") {
    return { ok: false, error: "gh: invalid viewer response" };
  }
  const data = (root as Record<string, unknown>).data;
  if (data === null || typeof data !== "object") {
    return { ok: false, error: "gh: viewer response missing data" };
  }
  const viewer = (data as Record<string, unknown>).viewer;
  if (viewer === null || typeof viewer !== "object") {
    return { ok: false, error: "gh: viewer was null" };
  }
  const login = (viewer as Record<string, unknown>).login;
  if (typeof login !== "string" || login.length === 0) {
    return { ok: false, error: "gh: viewer.login missing" };
  }
  return { ok: true, login };
}

type ProjectWork = {
  projectId: string;
  number: number;
  /** Accumulated raw item nodes before filtering. */
  rawNodes: GqlItemNode[];
};

/**
 * For each project, paginates items via batched `node` queries, filters, writes
 * `assigned-open--project-items--…` in a CLI-like `{ items, totalCount, … }` shape.
 */
export async function dumpProjectItemsGraphqlBatched(options: {
  orgLogin: string;
  projects: ReadonlyArray<{ id: string; number: number }>;
  viewerLogin: string;
  stemForProject: (projectNumber: number) => string;
}): Promise<void> {
  const { orgLogin, projects, viewerLogin, stemForProject } = options;

  const work = new Map<number, ProjectWork>();
  for (const p of projects) {
    work.set(p.number, { projectId: p.id, number: p.number, rawNodes: [] });
  }

  type QueueRow = { projectId: string; number: number; after: string | null };
  let queue: QueueRow[] = projects.map((p) => ({
    projectId: p.id,
    number: p.number,
    after: null,
  }));

  const batch = batchSize();

  while (queue.length > 0) {
    const chunk = queue.slice(0, batch);
    queue = queue.slice(batch);

    const query = buildBatchQuery(chunk);
    const res = await ghGraphqlWithVars(query, {});

    if (!res.ok) {
      const failed = new Set<number>();
      for (const row of chunk) {
        failed.add(row.number);
        writeDebugJsonStem(`${stemForProject(row.number)}--error`, {
          error: res.error,
        });
        work.delete(row.number);
      }
      queue = queue.filter((q) => !failed.has(q.number));
      continue;
    }

    const gqlErr = graphqlErrorsMessage(res.value);
    if (gqlErr !== null) {
      const failed = new Set<number>();
      for (const row of chunk) {
        failed.add(row.number);
        writeDebugJsonStem(`${stemForProject(row.number)}--error`, {
          error: `gh: ${gqlErr}`,
        });
        work.delete(row.number);
      }
      queue = queue.filter((q) => !failed.has(q.number));
      continue;
    }

    const root = res.value;
    const data =
      root !== null && typeof root === "object" ? (root as Record<string, unknown>).data : null;
    if (data === null || typeof data !== "object") {
      const failed = new Set<number>();
      for (const row of chunk) {
        failed.add(row.number);
        writeDebugJsonStem(`${stemForProject(row.number)}--error`, {
          error: "gh: batch response missing data",
        });
        work.delete(row.number);
      }
      queue = queue.filter((q) => !failed.has(q.number));
      continue;
    }

    const dataObj = data as Record<string, unknown>;

    for (let i = 0; i < chunk.length; i++) {
      const row = chunk[i]!;
      const alias = `p${i}`;
      const nodeVal = dataObj[alias];
      const w = work.get(row.number);
      if (w === undefined) {
        continue;
      }

      if (nodeVal === null || nodeVal === undefined) {
        writeDebugJsonStem(`${stemForProject(row.number)}--error`, {
          error: "gh: project node was null",
        });
        work.delete(row.number);
        queue = queue.filter((q) => q.number !== row.number);
        continue;
      }

      if (typeof nodeVal !== "object") {
        writeDebugJsonStem(`${stemForProject(row.number)}--error`, {
          error: "gh: project node was not an object",
        });
        work.delete(row.number);
        queue = queue.filter((q) => q.number !== row.number);
        continue;
      }

      const pv2 = nodeVal as Record<string, unknown>;
      const itemsConn = pv2.items;
      if (itemsConn === null || typeof itemsConn !== "object") {
        writeDebugJsonStem(`${stemForProject(row.number)}--error`, {
          error: "gh: project.items was missing",
        });
        work.delete(row.number);
        queue = queue.filter((q) => q.number !== row.number);
        continue;
      }

      const ic = itemsConn as Record<string, unknown>;
      const nodes = ic.nodes;
      const pageInfo = ic.pageInfo;

      if (!Array.isArray(nodes)) {
        writeDebugJsonStem(`${stemForProject(row.number)}--error`, {
          error: "gh: items.nodes was not an array",
        });
        work.delete(row.number);
        queue = queue.filter((q) => q.number !== row.number);
        continue;
      }

      for (const n of nodes) {
        if (w.rawNodes.length >= MAX_RAW_ITEMS_PER_PROJECT) {
          break;
        }
        if (n !== null && typeof n === "object") {
          w.rawNodes.push(n as GqlItemNode);
        }
      }

      let hasNext = false;
      let endCursor: string | null = null;
      if (pageInfo !== null && typeof pageInfo === "object") {
        const pi = pageInfo as Record<string, unknown>;
        if (pi.hasNextPage === true) {
          const ec = pi.endCursor;
          if (typeof ec === "string" && ec.length > 0) {
            hasNext = true;
            endCursor = ec;
          }
        }
      }

      if (hasNext && endCursor !== null && w.rawNodes.length < MAX_RAW_ITEMS_PER_PROJECT) {
        queue.push({
          projectId: row.projectId,
          number: row.number,
          after: endCursor,
        });
      }
    }
  }

  for (const w of work.values()) {
    const filtered = w.rawNodes.filter((n) => passesAssignOpenNonArchived(n, viewerLogin));
    const items: Record<string, unknown>[] = [];
    for (const n of filtered) {
      const mapped = mapNodeToCliLikeItem(n);
      if (mapped !== null) {
        items.push(mapped);
      }
    }
    writeDebugJsonStem(stemForProject(w.number), {
      items,
      totalCount: items.length,
      source: "graphql-batched",
      filter:
        "client: viewer assignee + OPEN issue/PR + non-archived + DraftIssue assignee (approx. gh item-list --query assignee:@me is:open -is:archived)",
      organization: orgLogin,
      projectNumber: w.number,
    });
  }
}

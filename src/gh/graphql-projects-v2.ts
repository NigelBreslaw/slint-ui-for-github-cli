import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseProjectsV2ConnectionPage } from "../schemas/gh-graphql-projectsv2-page.ts";
import { mapGhExecError } from "./map-gh-exec-error.ts";

const execFileAsync = promisify(execFile);

const GH_EXEC_MAX_BUFFER = 50 * 1024 * 1024;

const PROJECTS_V2_PAGE_SIZE = 100;

const ORG_PROJECTS_V2_QUERY = `
query OrgProjectsV2($login: String!, $first: Int!, $after: String) {
  organization(login: $login) {
    projectsV2(first: $first, after: $after) {
      nodes {
        id
        number
        title
        url
        closed
        shortDescription
        createdAt
        updatedAt
        public
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

const USER_PROJECTS_V2_QUERY = `
query UserProjectsV2($login: String!, $first: Int!, $after: String) {
  user(login: $login) {
    projectsV2(first: $first, after: $after) {
      nodes {
        id
        number
        title
        url
        closed
        shortDescription
        createdAt
        updatedAt
        public
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

type GhGraphqlOk = { ok: true; value: unknown };
type GhGraphqlErr = { ok: false; error: string };
type GhGraphqlResult = GhGraphqlOk | GhGraphqlErr;

async function ghGraphqlWithVars(
  query: string,
  variables: Record<string, string | number | undefined>,
): Promise<GhGraphqlResult> {
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

export async function fetchAllProjectsV2ForOrgGraphql(
  orgLogin: string,
): Promise<{ ok: true; value: unknown[] } | { ok: false; error: string }> {
  const all: unknown[] = [];
  let after: string | undefined;
  while (true) {
    const res = await ghGraphqlWithVars(ORG_PROJECTS_V2_QUERY, {
      login: orgLogin,
      first: PROJECTS_V2_PAGE_SIZE,
      after: after,
    });
    if (!res.ok) {
      return res;
    }
    const page = parseProjectsV2ConnectionPage(res.value, "organization");
    if (!page.ok) {
      return { ok: false, error: `gh: ${page.message}` };
    }
    all.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) {
      break;
    }
    const cursor = page.pageInfo.endCursor;
    if (cursor === null || cursor.length === 0) {
      break;
    }
    after = cursor;
  }
  return { ok: true, value: all };
}

export async function fetchAllProjectsV2ForUserGraphql(
  userLogin: string,
): Promise<{ ok: true; value: unknown[] } | { ok: false; error: string }> {
  const all: unknown[] = [];
  let after: string | undefined;
  while (true) {
    const res = await ghGraphqlWithVars(USER_PROJECTS_V2_QUERY, {
      login: userLogin,
      first: PROJECTS_V2_PAGE_SIZE,
      after: after,
    });
    if (!res.ok) {
      return res;
    }
    const page = parseProjectsV2ConnectionPage(res.value, "user");
    if (!page.ok) {
      return { ok: false, error: `gh: ${page.message}` };
    }
    all.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) {
      break;
    }
    const cursor = page.pageInfo.endCursor;
    if (cursor === null || cursor.length === 0) {
      break;
    }
    after = cursor;
  }
  return { ok: true, value: all };
}

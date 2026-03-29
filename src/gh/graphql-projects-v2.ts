import { parseProjectsV2ConnectionPage } from "../schemas/gh-graphql-projectsv2-page.ts";
import { ghGraphqlWithVars } from "./gh-graphql.ts";

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
        items {
          totalCount
        }
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
        items {
          totalCount
        }
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

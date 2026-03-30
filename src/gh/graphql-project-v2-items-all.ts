/**
 * Paginated `ProjectV2.items` via `gh api graphql` (all cards, no client-side filter).
 * Item `content` matches [`graphql-project-items-batch.ts`](./graphql-project-items-batch.ts) except **`body` is omitted** to keep dumps small.
 * Includes `fieldValues` (number, single-select, text, date) so board custom fields such as
 * “BOT-Total Time Spent(h)” appear in dumps. Issue/PullRequest `content` includes `closedAt` / `mergedAt` for time reporting.
 */
import { ghGraphqlWithVars } from "./gh-graphql.ts";

const ITEM_PAGE_FIRST = 50;
const MAX_ITEMS_CAP = 500;
/** Max custom-field values per item (GitHub caps connection `first`). */
const FIELD_VALUES_FIRST = 50;

const PROJECT_V2_ITEMS_PAGE_QUERY = `
query ProjectV2ItemsPage($id: ID!, $first: Int!, $after: String) {
  node(id: $id) {
    ... on ProjectV2 {
      number
      items(first: $first, after: $after) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          type
          isArchived
          content {
            __typename
            ... on Issue {
              number
              title
              url
              state
              closedAt
              assignees(first: 20) {
                nodes {
                  login
                }
              }
              repository {
                nameWithOwner
              }
            }
            ... on PullRequest {
              number
              title
              url
              state
              mergedAt
              closedAt
              assignees(first: 20) {
                nodes {
                  login
                }
              }
              repository {
                nameWithOwner
              }
            }
            ... on DraftIssue {
              title
              assignees(first: 20) {
                nodes {
                  login
                }
              }
            }
          }
          fieldValues(first: ${FIELD_VALUES_FIRST}) {
            nodes {
              __typename
              ... on ProjectV2ItemFieldNumberValue {
                number
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldTextValue {
                text
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
              ... on ProjectV2ItemFieldDateValue {
                date
                field {
                  ... on ProjectV2FieldCommon {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

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

type FetchAllProjectV2ItemsResult =
  | { ok: true; projectNumber: number; itemsTotalCount: number; items: unknown[] }
  | { ok: false; error: string };

export async function fetchAllProjectV2ItemsGraphql(
  projectNodeId: string,
): Promise<FetchAllProjectV2ItemsResult> {
  const items: unknown[] = [];
  let after: string | undefined;
  let projectNumber: number | undefined;
  let itemsTotalCount: number | undefined;

  while (items.length < MAX_ITEMS_CAP) {
    const variables: Record<string, string | number | undefined> = {
      id: projectNodeId,
      first: ITEM_PAGE_FIRST,
      after: after,
    };
    const res = await ghGraphqlWithVars(PROJECT_V2_ITEMS_PAGE_QUERY, variables);
    if (!res.ok) {
      return { ok: false, error: res.error };
    }
    const gqlErr = graphqlErrorsMessage(res.value);
    if (gqlErr !== null) {
      return { ok: false, error: `gh: ${gqlErr}` };
    }
    const root = res.value;
    if (root === null || typeof root !== "object") {
      return { ok: false, error: "graphql response was not an object" };
    }
    const data = (root as Record<string, unknown>).data;
    if (data === null || typeof data !== "object") {
      return { ok: false, error: "graphql response missing data" };
    }
    const node = (data as Record<string, unknown>).node;
    if (node === null || node === undefined) {
      return { ok: false, error: "data.node was null or missing" };
    }
    if (typeof node !== "object") {
      return { ok: false, error: "data.node was not an object" };
    }
    const pv2 = node as Record<string, unknown>;
    const num = pv2.number;
    if (typeof num === "number" && Number.isFinite(num)) {
      projectNumber = num;
    }
    const itemsConn = pv2.items;
    if (itemsConn === null || typeof itemsConn !== "object") {
      return { ok: false, error: "project.items was missing" };
    }
    const ic = itemsConn as Record<string, unknown>;
    const tc = ic.totalCount;
    if (typeof tc === "number" && Number.isFinite(tc)) {
      itemsTotalCount = tc;
    }
    const nodes = ic.nodes;
    if (!Array.isArray(nodes)) {
      return { ok: false, error: "items.nodes was not an array" };
    }
    for (const n of nodes) {
      if (items.length >= MAX_ITEMS_CAP) {
        break;
      }
      if (n !== null && typeof n === "object") {
        items.push(n);
      }
    }
    const pageInfo = ic.pageInfo;
    let hasNext = false;
    let endCursor: string | undefined;
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
    if (!hasNext || endCursor === undefined) {
      break;
    }
    after = endCursor;
  }

  if (projectNumber === undefined) {
    return { ok: false, error: "project number was missing from GraphQL response" };
  }
  if (itemsTotalCount === undefined) {
    return { ok: false, error: "items.totalCount was missing from GraphQL response" };
  }

  return {
    ok: true,
    projectNumber,
    itemsTotalCount,
    items,
  };
}

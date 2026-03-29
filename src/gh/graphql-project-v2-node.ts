import { ghGraphqlWithVars } from "./gh-graphql.ts";

const PROJECT_V2_NODE_QUERY = `
query ProjectV2Node($id: ID!) {
  node(id: $id) {
    ... on ProjectV2 {
      id
      number
      title
      url
      shortDescription
      closed
      public
      createdAt
      updatedAt
      items {
        totalCount
      }
    }
  }
}
`
  .replace(/\s+/g, " ")
  .trim();

/**
 * Fetches a single ProjectV2 by global node id (`gh api graphql`). Returns the raw JSON object
 * (typically `{ data: { node: … } }` or GraphQL `errors`).
 */
export async function fetchProjectV2NodeGraphql(
  nodeId: string,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  return ghGraphqlWithVars(PROJECT_V2_NODE_QUERY, { id: nodeId });
}

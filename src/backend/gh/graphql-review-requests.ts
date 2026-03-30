import { writeDebugJsonStem } from "./write-debug-json.ts";
import { ghGraphqlWithVars } from "./gh-graphql.ts";
import {
  parseReviewRequestsSearchPage,
  REVIEW_REQUESTS_SEARCH_GRAPHQL,
  REVIEW_REQUESTS_SEARCH_QUERY_STRING,
  type ReviewRequestRow,
} from "../schemas/gh-graphql-search-review-requests.ts";

const PAGE_SIZE = 100;

/**
 * Paginates `search` until `hasNextPage` is false or a page fails to parse.
 * `issueCount` comes from the first successful page (same for all pages).
 */
export async function fetchAllReviewRequestsSearch(): Promise<
  { ok: true; issueCount: number; rows: ReviewRequestRow[] } | { ok: false; error: string }
> {
  const allRows: ReviewRequestRow[] = [];
  let issueCount = 0;
  let after: string | undefined;

  for (;;) {
    const raw = await ghGraphqlWithVars(REVIEW_REQUESTS_SEARCH_GRAPHQL, {
      searchQuery: REVIEW_REQUESTS_SEARCH_QUERY_STRING,
      first: PAGE_SIZE,
      after,
    });

    if (!raw.ok) {
      return { ok: false, error: raw.error };
    }

    if (process.env.GH_DEBUG_JSON === "1") {
      writeDebugJsonStem("dashboard--review-requests--graphql", raw.value);
    }

    const parsed = parseReviewRequestsSearchPage(raw.value);
    if (!parsed.ok) {
      return { ok: false, error: parsed.message };
    }

    if (issueCount === 0) {
      issueCount = parsed.page.issueCount;
    }
    allRows.push(...parsed.rows);

    if (!parsed.page.pageInfo.hasNextPage || parsed.page.pageInfo.endCursor === null) {
      break;
    }
    after = parsed.page.pageInfo.endCursor;
  }

  return { ok: true, issueCount, rows: allRows };
}

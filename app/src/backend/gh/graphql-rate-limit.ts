import { ghGraphqlWithVars } from "./gh-graphql.ts";
import {
  parseGhGraphqlRateLimitResponse,
  RATE_LIMIT_GRAPHQL_QUERY,
  type GhGraphqlRateLimit,
} from "../schemas/gh-graphql-rate-limit.ts";

export async function fetchGraphqlRateLimit(): Promise<
  { ok: true; rateLimit: GhGraphqlRateLimit } | { ok: false; error: string }
> {
  const raw = await ghGraphqlWithVars(RATE_LIMIT_GRAPHQL_QUERY, {});
  if (!raw.ok) {
    return { ok: false, error: raw.error };
  }
  const parsed = parseGhGraphqlRateLimitResponse(raw.value);
  if (!parsed.ok) {
    return { ok: false, error: parsed.message };
  }
  return { ok: true, rateLimit: parsed.rateLimit };
}

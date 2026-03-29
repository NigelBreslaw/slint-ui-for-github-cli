/**
 * Runtime shape for `gh api graphql` with `query { rateLimit { limit remaining resetAt } }`.
 */
import { type } from "arktype";

const rateLimitNodeSchema = type({
  limit: "number",
  remaining: "number",
  resetAt: "string",
});

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

export type GhGraphqlRateLimit = typeof rateLimitNodeSchema.infer;

export function parseGhGraphqlRateLimitResponse(
  value: unknown,
): { ok: true; rateLimit: GhGraphqlRateLimit } | { ok: false; message: string } {
  if (value === null || typeof value !== "object") {
    return { ok: false, message: "gh: graphql response was not an object" };
  }
  const root = value as Record<string, unknown>;
  const data = root.data;
  if (data === null || typeof data !== "object" || !("rateLimit" in data)) {
    const hint =
      Array.isArray(root.errors) && root.errors.length > 0
        ? graphqlErrorMessage(root.errors)
        : "graphql response missing data.rateLimit";
    return { ok: false, message: `gh: ${hint}` };
  }
  const rl = (data as { rateLimit: unknown }).rateLimit;
  if (rl === null || rl === undefined) {
    const hint =
      Array.isArray(root.errors) && root.errors.length > 0
        ? graphqlErrorMessage(root.errors)
        : "data.rateLimit was null";
    return { ok: false, message: `gh: ${hint}` };
  }
  const result = rateLimitNodeSchema(rl);
  if (result instanceof type.errors) {
    const detail = result.summary.trim();
    return {
      ok: false,
      message:
        detail.length > 0
          ? `gh: rateLimit shape (${detail})`
          : "gh: rateLimit shape did not match GraphQL selection",
    };
  }
  return { ok: true, rateLimit: result };
}

export const RATE_LIMIT_GRAPHQL_QUERY = `query { rateLimit { limit remaining resetAt } }`
  .replace(/\s+/g, " ")
  .trim();

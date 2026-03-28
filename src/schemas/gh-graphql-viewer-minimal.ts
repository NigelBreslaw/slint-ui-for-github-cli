/**
 * Runtime shape for `gh api graphql` with the app’s minimal `viewer { ... }` selection set.
 *
 * GitHub may return HTTP 200 with top-level `errors` and partial or missing `data`.
 */
import { type } from "arktype";

const nullableString = "string | null";

const viewerStatusSchema = type({
  message: nullableString,
  emojiHTML: nullableString,
});

const viewerMinimalSchema = type({
  login: "string",
  name: nullableString,
  url: "string",
  avatarUrl: "string",
  status: viewerStatusSchema.or(type.null),
});

type GhGraphqlViewerMinimal = typeof viewerMinimalSchema.infer;

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

export function parseGhGraphqlViewerMinimalResponse(
  value: unknown,
): { ok: true; viewer: GhGraphqlViewerMinimal } | { ok: false; message: string } {
  if (value === null || typeof value !== "object") {
    return { ok: false, message: "gh: graphql response was not an object" };
  }
  const root = value as Record<string, unknown>;
  const data = root.data;
  if (data === null || typeof data !== "object" || !("viewer" in data)) {
    const hint =
      Array.isArray(root.errors) && root.errors.length > 0
        ? graphqlErrorMessage(root.errors)
        : "graphql response missing data.viewer";
    return { ok: false, message: `gh: ${hint}` };
  }
  const viewer = (data as { viewer: unknown }).viewer;
  if (viewer === null || viewer === undefined) {
    const hint =
      Array.isArray(root.errors) && root.errors.length > 0
        ? graphqlErrorMessage(root.errors)
        : "data.viewer was null";
    return { ok: false, message: `gh: ${hint}` };
  }

  const result = viewerMinimalSchema(viewer);
  if (result instanceof type.errors) {
    const detail = result.summary.trim();
    return {
      ok: false,
      message:
        detail.length > 0
          ? `gh: viewer shape (${detail})`
          : "gh: viewer shape did not match minimal GraphQL selection",
    };
  }
  return { ok: true, viewer: result };
}

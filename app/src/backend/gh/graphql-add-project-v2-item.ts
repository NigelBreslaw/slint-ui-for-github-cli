import {
  parseAddProjectV2ItemByIdResponse,
  type AddProjectV2ItemByIdParsed,
} from "../schemas/gh-graphql-add-project-v2-item.ts";
import { ghGraphqlWithVars } from "./gh-graphql.ts";

const ADD_PROJECT_V2_ITEM_MUTATION = `
mutation AddProjectV2ItemById($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
    item {
      id
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

/**
 * Adds a single Issue or PullRequest (by global node id) to a Project V2 board.
 */
export async function addProjectV2ItemByIdGraphql(
  projectId: string,
  contentId: string,
): Promise<{ ok: true; value: AddProjectV2ItemByIdParsed } | { ok: false; error: string }> {
  const p = projectId.trim();
  const c = contentId.trim();
  if (p.length === 0 || c.length === 0) {
    return { ok: false, error: "projectId and contentId are required" };
  }
  const res = await ghGraphqlWithVars(ADD_PROJECT_V2_ITEM_MUTATION, {
    projectId: p,
    contentId: c,
  });
  if (!res.ok) {
    return { ok: false, error: res.error };
  }
  const gqlErr = graphqlErrorsMessage(res.value);
  if (gqlErr !== null) {
    return { ok: false, error: `gh: ${gqlErr}` };
  }
  const parsed = parseAddProjectV2ItemByIdResponse(res.value);
  if (!parsed.ok) {
    return { ok: false, error: parsed.message };
  }
  return { ok: true, value: parsed.value };
}

export type AddProjectV2ItemOutcome =
  | { contentId: string; ok: true; projectItemId: string }
  | { contentId: string; ok: false; error: string };

export type AddProjectV2ItemsSequentialOptions = {
  /** Wait this many milliseconds between successful mutations (not before the first). */
  delayMsBetween?: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Runs `addProjectV2ItemById` once per content id, in order. Continues after failures; inspect each
 * `AddProjectV2ItemOutcome` for per-item errors.
 */
export async function addProjectV2ItemsByContentIdsSequential(
  projectId: string,
  contentIds: readonly string[],
  options?: AddProjectV2ItemsSequentialOptions,
): Promise<AddProjectV2ItemOutcome[]> {
  const delayMs = options?.delayMsBetween;
  const useDelay =
    typeof delayMs === "number" && Number.isFinite(delayMs) && delayMs > 0 ? delayMs : 0;

  const outcomes: AddProjectV2ItemOutcome[] = [];
  for (let i = 0; i < contentIds.length; i++) {
    const contentId = contentIds[i] ?? "";
    if (i > 0 && useDelay > 0) {
      await delay(useDelay);
    }
    const r = await addProjectV2ItemByIdGraphql(projectId, contentId);
    if (r.ok) {
      outcomes.push({
        contentId: contentId.trim(),
        ok: true,
        projectItemId: r.value.projectItemId,
      });
    } else {
      outcomes.push({ contentId: contentId.trim(), ok: false, error: r.error });
    }
  }
  return outcomes;
}

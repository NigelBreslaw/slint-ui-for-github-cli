/**
 * One page of `organization.projectsV2` or `user.projectsV2` from `gh api graphql`.
 */
import { type } from "arktype";

/** Shared shape for a single `ProjectV2` node from GraphQL (list pages or `node(id: …)`). */
export const projectV2NodeSchema = type({
  id: "string",
  number: "number",
  title: "string",
  url: "string",
  closed: "boolean",
  shortDescription: "string | null",
  createdAt: "string",
  updatedAt: "string",
  public: "boolean",
  /** All items on the board (not filtered to open or assignee). Used to skip `gh project item-list` when zero. */
  items: type({ totalCount: "number" }),
});

export type ProjectV2NodeSnapshot = typeof projectV2NodeSchema.infer;

const pageInfoSchema = type({
  hasNextPage: "boolean",
  endCursor: "string | null",
});

const projectsV2ConnectionSchema = type({
  nodes: projectV2NodeSchema.array(),
  pageInfo: pageInfoSchema,
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

export function parseProjectsV2ConnectionPage(
  value: unknown,
  owner: "organization" | "user",
):
  | { ok: true; nodes: ProjectV2NodeSnapshot[]; pageInfo: typeof pageInfoSchema.infer }
  | { ok: false; message: string } {
  if (value === null || typeof value !== "object") {
    return { ok: false, message: "graphql response was not an object" };
  }
  const root = value as Record<string, unknown>;
  if (Array.isArray(root.errors) && root.errors.length > 0) {
    return { ok: false, message: graphqlErrorMessage(root.errors) };
  }
  const data = root.data;
  if (data === null || typeof data !== "object") {
    return { ok: false, message: "graphql response missing data" };
  }
  const ownerObj = (data as Record<string, unknown>)[owner];
  if (ownerObj === null || ownerObj === undefined) {
    return { ok: false, message: `${owner} was null or missing` };
  }
  if (typeof ownerObj !== "object") {
    return { ok: false, message: `${owner} was not an object` };
  }
  const pv2 = (ownerObj as Record<string, unknown>).projectsV2;
  if (pv2 === null || pv2 === undefined) {
    return { ok: false, message: `${owner}.projectsV2 was null` };
  }
  const parsed = projectsV2ConnectionSchema(pv2);
  if (parsed instanceof type.errors) {
    const detail = parsed.summary.trim();
    return {
      ok: false,
      message: detail.length > 0 ? `projectsV2 shape (${detail})` : "projectsV2 shape mismatch",
    };
  }
  return { ok: true, nodes: parsed.nodes, pageInfo: parsed.pageInfo };
}

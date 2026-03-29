/**
 * Parse `gh api graphql` body for `query { node(id: $id) { ... on ProjectV2 { ... } } }`.
 */
import { type } from "arktype";
import { projectV2NodeSchema, type ProjectV2NodeSnapshot } from "./gh-graphql-projectsv2-page.ts";

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

export function parseProjectV2NodeFromGraphqlResponse(
  value: unknown,
): { ok: true; project: ProjectV2NodeSnapshot } | { ok: false; message: string } {
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
  if (!("node" in data)) {
    return { ok: false, message: "data has no node field" };
  }
  const node = (data as Record<string, unknown>).node;
  if (node === undefined) {
    return { ok: false, message: "data.node was undefined" };
  }
  if (node === null) {
    return { ok: false, message: "data.node was null" };
  }
  if (typeof node !== "object") {
    return { ok: false, message: "data.node was not an object" };
  }
  const n = node as Record<string, unknown>;
  if ("__typename" in n && n.__typename !== "ProjectV2") {
    return {
      ok: false,
      message: `expected ProjectV2 node, got ${String(n.__typename)}`,
    };
  }
  const parsed = projectV2NodeSchema(node);
  if (parsed instanceof type.errors) {
    const detail = parsed.summary.trim();
    return {
      ok: false,
      message: detail.length > 0 ? `ProjectV2 shape (${detail})` : "ProjectV2 shape mismatch",
    };
  }
  return { ok: true, project: parsed };
}

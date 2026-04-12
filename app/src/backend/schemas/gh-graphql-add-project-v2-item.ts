/**
 * Parses `addProjectV2ItemById` mutation responses from `gh api graphql`.
 * @see https://docs.github.com/en/graphql/reference/mutations#addprojectv2itembyid
 */

export type AddProjectV2ItemByIdParsed = {
  projectItemId: string;
};

/**
 * Parses the JSON body from a successful GraphQL HTTP response (may still contain `errors`).
 */
export function parseAddProjectV2ItemByIdResponse(
  root: unknown,
): { ok: true; value: AddProjectV2ItemByIdParsed } | { ok: false; message: string } {
  if (root === null || typeof root !== "object") {
    return { ok: false, message: "gh: graphql response was not an object" };
  }
  const errors = (root as Record<string, unknown>).errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (
      first !== null &&
      typeof first === "object" &&
      "message" in first &&
      typeof (first as { message: unknown }).message === "string"
    ) {
      return { ok: false, message: `gh: ${(first as { message: string }).message}` };
    }
    return { ok: false, message: "gh: GraphQL error" };
  }
  const data = (root as Record<string, unknown>).data;
  if (data === null || typeof data !== "object") {
    return { ok: false, message: "gh: graphql response missing data" };
  }
  const payload = (data as Record<string, unknown>).addProjectV2ItemById;
  if (payload === null || typeof payload !== "object") {
    return { ok: false, message: "gh: addProjectV2ItemById payload was missing" };
  }
  const item = (payload as Record<string, unknown>).item;
  if (item === null || typeof item !== "object") {
    return { ok: false, message: "gh: addProjectV2ItemById.item was missing" };
  }
  const id = (item as Record<string, unknown>).id;
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, message: "gh: project item id was missing" };
  }
  return { ok: true, value: { projectItemId: id } };
}

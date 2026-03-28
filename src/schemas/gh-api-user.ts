/**
 * Runtime shape for `GET /user` (what `gh api user` returns when authenticated).
 * Derived from GitHub’s OpenAPI (component often named private-user / full-user in
 * github/rest-api-description) and validated against real CLI output.
 */
import { type } from "arktype";

const nullableString = "string | null";
const nullableBoolean = "boolean | null";

export const ghApiUserSchema = type({
  login: "string",
  id: "number.integer",
  node_id: "string",
  avatar_url: "string",
  gravatar_id: "string",
  url: "string",
  html_url: "string",
  followers_url: "string",
  following_url: "string",
  gists_url: "string",
  starred_url: "string",
  subscriptions_url: "string",
  organizations_url: "string",
  repos_url: "string",
  events_url: "string",
  received_events_url: "string",
  type: type.unit("User"),
  user_view_type: "string",
  site_admin: "boolean",
  name: nullableString,
  company: nullableString,
  blog: "string",
  location: nullableString,
  email: nullableString,
  hireable: nullableBoolean,
  bio: nullableString,
  twitter_username: nullableString,
  notification_email: nullableString,
  public_repos: "number.integer",
  public_gists: "number.integer",
  followers: "number.integer",
  following: "number.integer",
  created_at: "string",
  updated_at: "string",
});

export type GhApiUser = typeof ghApiUserSchema.infer;

export function parseGhApiUserPayload(
  value: unknown,
): { ok: true; user: GhApiUser } | { ok: false; message: string } {
  const result = ghApiUserSchema(value);
  if (result instanceof type.errors) {
    const detail = result.summary.trim();
    return {
      ok: false,
      message:
        detail.length > 0
          ? `gh: response did not match GET /user shape (${detail})`
          : "gh: response did not match GET /user shape",
    };
  }
  return { ok: true, user: result };
}

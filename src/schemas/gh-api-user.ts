/**
 * Runtime shape for `GET /user` (`gh api user` when authenticated).
 *
 * Based on GitHub’s published OpenAPI (`github/rest-api-description`,
 * `descriptions/api.github.com/api.github.com.json`):
 * - Operation: `paths["/user"].get`
 * - Response `200`: `oneOf` `components.schemas.private-user` |
 *   `components.schemas.public-user`, discriminator `user_view_type`.
 *
 * We require the **intersection** of `public-user.required` and
 * `private-user.required` (31 fields) with `type` / `nullable` taken from
 * `private-user.properties` (equivalent for those keys). Additional properties
 * that exist only on `private-user` or are optional in the spec are **optional**
 * here so both profile modes and real CLI payloads still validate.
 */
import { type } from "arktype";

const nullableString = "string | null";
const nullableBoolean = "boolean | null";

/** `components.schemas.private-user.properties.plan` (when present). */
const ghApiUserPlanSchema = type({
  collaborators: "number.integer",
  name: "string",
  space: "number.integer",
  private_repos: "number.integer",
});

const ghApiUserSchema = type({
  login: "string",
  id: "number.integer",
  node_id: "string",
  avatar_url: "string",
  gravatar_id: nullableString,
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
  type: "string",
  site_admin: "boolean",
  name: nullableString,
  company: nullableString,
  blog: nullableString,
  location: nullableString,
  email: nullableString,
  hireable: nullableBoolean,
  bio: nullableString,
  public_repos: "number.integer",
  public_gists: "number.integer",
  followers: "number.integer",
  following: "number.integer",
  created_at: "string",
  updated_at: "string",
  "user_view_type?": "string",
  "notification_email?": nullableString,
  "twitter_username?": nullableString,
  "private_gists?": "number.integer",
  "total_private_repos?": "number.integer",
  "owned_private_repos?": "number.integer",
  "disk_usage?": "number.integer",
  "collaborators?": "number.integer",
  "two_factor_authentication?": "boolean",
  "plan?": ghApiUserPlanSchema,
  "ldap_dn?": nullableString,
  "business_plus?": "boolean",
});

type GhApiUser = typeof ghApiUserSchema.infer;

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

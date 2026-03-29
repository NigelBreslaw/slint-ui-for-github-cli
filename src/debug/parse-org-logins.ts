/**
 * Parses `gh api user/orgs --paginate` JSON: array of `{ login: string, ... }`.
 */
export function parseOrgLogins(orgsPayload: unknown): string[] {
  if (!Array.isArray(orgsPayload)) {
    return [];
  }
  const logins: string[] = [];
  for (const row of orgsPayload) {
    if (
      row !== null &&
      typeof row === "object" &&
      "login" in row &&
      typeof (row as { login: unknown }).login === "string"
    ) {
      logins.push((row as { login: string }).login);
    }
  }
  return logins;
}

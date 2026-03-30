/**
 * Runtime shape for `gh api repos/{owner}/{repo}/dependabot/alerts --paginate` (JSON array).
 * @see https://docs.github.com/en/rest/dependabot/alerts#list-dependabot-alerts-for-a-repository
 */
import { type } from "arktype";

const packageSchema = type({
  ecosystem: "string",
  name: "string",
});

const dependabotAlertItemSchema = type({
  number: "number",
  state: "string",
  dependency: type({
    package: packageSchema,
  }),
  security_advisory: type({
    summary: "string",
  }),
  security_vulnerability: type({
    severity: "string",
  }),
  html_url: "string",
});

type DependabotAlertItem = typeof dependabotAlertItemSchema.infer;

export type DependabotAlertRow = {
  number: number;
  state: string;
  summary: string;
  severity: string;
  packageName: string;
  ecosystem: string;
  htmlUrl: string;
};

function mapItemToRow(item: DependabotAlertItem): DependabotAlertRow {
  return {
    number: item.number,
    state: item.state,
    summary: item.security_advisory.summary,
    severity: item.security_vulnerability.severity,
    packageName: item.dependency.package.name,
    ecosystem: item.dependency.package.ecosystem,
    htmlUrl: item.html_url,
  };
}

/**
 * Validates the merged JSON array from `gh api …/dependabot/alerts --paginate`.
 */
export function parseDependabotAlertsList(
  value: unknown,
): { ok: true; rows: DependabotAlertRow[] } | { ok: false; message: string } {
  if (!Array.isArray(value)) {
    return { ok: false, message: "gh: dependabot alerts response was not a JSON array" };
  }
  const rows: DependabotAlertRow[] = [];
  for (let i = 0; i < value.length; i++) {
    const el = value[i];
    const result = dependabotAlertItemSchema(el);
    if (result instanceof type.errors) {
      const detail = result.summary.trim();
      return {
        ok: false,
        message:
          detail.length > 0
            ? `gh: dependabot alert at index ${i} (${detail})`
            : `gh: dependabot alert at index ${i} did not match expected shape`,
      };
    }
    rows.push(mapItemToRow(result));
  }
  return { ok: true, rows };
}

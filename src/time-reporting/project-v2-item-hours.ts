/**
 * Helpers for Project V2 item payloads: hours → integer minutes and field extraction.
 */

/** Board custom field for per-session hours (GitHub stores a float in hours). */
export const TIME_SPENT_FIELD_NAME = "Time Spent(h)";

/**
 * Converts GitHub’s hours float to integer minutes (`Math.round(hours * 60)`).
 * Sub-minute precision is intentionally discarded.
 */
export function projectHoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

function fieldNameFromNode(node: Record<string, unknown>): string | null {
  const field = node.field;
  if (field === null || typeof field !== "object") {
    return null;
  }
  const name = (field as Record<string, unknown>).name;
  return typeof name === "string" ? name : null;
}

/**
 * Reads a `ProjectV2ItemFieldNumberValue` by custom field name from `fieldValues.nodes`.
 * Returns the GraphQL `number` (hours) when finite, else null.
 */
export function extractProjectV2NumberFieldHours(item: unknown, fieldName: string): number | null {
  if (item === null || typeof item !== "object") {
    return null;
  }
  const fv = (item as Record<string, unknown>).fieldValues;
  if (fv === null || typeof fv !== "object") {
    return null;
  }
  const nodes = (fv as Record<string, unknown>).nodes;
  if (!Array.isArray(nodes)) {
    return null;
  }
  for (const n of nodes) {
    if (n === null || typeof n !== "object") {
      continue;
    }
    const rec = n as Record<string, unknown>;
    if (rec.__typename !== "ProjectV2ItemFieldNumberValue") {
      continue;
    }
    if (fieldNameFromNode(rec) !== fieldName) {
      continue;
    }
    const num = rec.number;
    if (typeof num === "number" && Number.isFinite(num)) {
      return num;
    }
  }
  return null;
}

/**
 * Title and URL from Issue, PullRequest, or DraftIssue `content` (no `body` required).
 */
export function itemContentTitleUrl(item: unknown): { title: string; url: string } | null {
  if (item === null || typeof item !== "object") {
    return null;
  }
  const content = (item as Record<string, unknown>).content;
  if (content === null || typeof content !== "object") {
    return null;
  }
  const c = content as Record<string, unknown>;
  const tn = c.__typename;
  if (tn !== "Issue" && tn !== "PullRequest" && tn !== "DraftIssue") {
    return null;
  }
  const title = c.title;
  if (typeof title !== "string" || title.length === 0) {
    return null;
  }
  const url = c.url;
  const urlStr = typeof url === "string" ? url : "";
  return { title, url: urlStr };
}

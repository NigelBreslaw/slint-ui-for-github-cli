import {
  isoWeekAndYearFromUtcDate,
  utcDateYmdFromDate,
  weekdayDatesMondayToFriday,
} from "./iso-week.ts";

/**
 * GitHub GraphQL `mergedAt` / `closedAt` ISO DateTime string for week placement, or null if none.
 * PullRequest: `mergedAt` else `closedAt`. Issue: `closedAt`. DraftIssue: none.
 */
export function referenceCloseOrMergeInstantIso(content: unknown): string | null {
  if (content === null || typeof content !== "object") {
    return null;
  }
  const c = content as Record<string, unknown>;
  const tn = c.__typename;
  if (tn === "PullRequest") {
    const merged = c.mergedAt;
    if (typeof merged === "string" && merged.length > 0) {
      return merged;
    }
    const closed = c.closedAt;
    if (typeof closed === "string" && closed.length > 0) {
      return closed;
    }
    return null;
  }
  if (tn === "Issue") {
    const closed = c.closedAt;
    if (typeof closed === "string" && closed.length > 0) {
      return closed;
    }
    return null;
  }
  return null;
}

/**
 * UTC calendar `YYYY-MM-DD` for the weekday grid column: actual day Mon–Fri, else Friday of that ISO week.
 */
export function assignmentYmdForWeekdayColumn(isoDateTime: string): string | null {
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const { isoYear, isoWeek } = isoWeekAndYearFromUtcDate(d);
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) {
    const week = weekdayDatesMondayToFriday(isoYear, isoWeek);
    return week[4] ?? null;
  }
  return utcDateYmdFromDate(d);
}

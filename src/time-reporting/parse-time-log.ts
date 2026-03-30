/**
 * Parses dated lines from a Project V2 text field into integer minutes (same rounding as hours→minutes).
 * Each line: `YYYY-MM-DD` then whitespace or `:` then a duration (`1.5h`, `90m`, `1h 30m`, bare hours float).
 */

import { projectHoursToMinutes } from "./project-v2-item-hours.ts";

/** Board custom field for per-line dated time (optional on the board). */
export const TIME_LOG_FIELD_NAME = "Time Log";

type ParsedTimeLogEntry = {
  date: string;
  minutes: number;
  rawLine: string;
};

const LINE_RE = /^(\d{4}-\d{2}-\d{2})(?:\s+|\s*:\s*)(.+)$/;

/**
 * Parses a duration fragment after the date into integer minutes, or null if unrecognized.
 */
export function parseDurationToMinutes(fragment: string): number | null {
  const t = fragment.trim().toLowerCase();
  if (t.length === 0) {
    return null;
  }
  const hm = t.match(/^(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*m)?$/);
  if (hm !== null) {
    let total = projectHoursToMinutes(Number(hm[1]));
    if (hm[2] !== undefined) {
      total += Number(hm[2]);
    }
    return total;
  }
  const mOnly = t.match(/^(\d+)\s*m$/);
  if (mOnly !== null) {
    return Number(mOnly[1]);
  }
  const bare = t.match(/^(\d+(?:\.\d+)?)$/);
  if (bare !== null) {
    return projectHoursToMinutes(Number(bare[1]));
  }
  return null;
}

/**
 * Parses non-empty lines into dated entries. Skips blank lines and `#` comments.
 * Minutes are integers (`Math.round` for hour-derived values).
 */
export function parseTimeLogLines(text: string): ParsedTimeLogEntry[] {
  const out: ParsedTimeLogEntry[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }
    const m = trimmed.match(LINE_RE);
    if (m === null) {
      continue;
    }
    const date = m[1];
    const minutes = parseDurationToMinutes(m[2]);
    if (minutes === null || minutes < 0) {
      continue;
    }
    out.push({ date, minutes, rawLine: trimmed });
  }
  return out;
}

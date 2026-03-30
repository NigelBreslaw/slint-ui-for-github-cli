/**
 * ISO 8601 week date helpers (UTC). Used for time-reporting week navigation and column dates.
 */

export type IsoWeek = { isoYear: number; isoWeek: number };

/** `YYYY-Www` e.g. `2026-W01` (week padded to two digits). */
export function formatIsoWeekLabel(isoYear: number, isoWeek: number): string {
  const w = isoWeek < 10 ? `0${isoWeek}` : String(isoWeek);
  return `${isoYear}-W${w}`;
}

/**
 * ISO week-year and week number for the UTC calendar day (same rules as ISO 8601).
 */
export function isoWeekAndYearFromUtcDate(d: Date): IsoWeek {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - dow);
  const isoYear = x.getUTCFullYear();
  const week1Thursday = new Date(Date.UTC(isoYear, 0, 4));
  const w1d = week1Thursday.getUTCDay() || 7;
  const week1Monday = new Date(week1Thursday);
  week1Monday.setUTCDate(week1Thursday.getUTCDate() - (w1d - 1));
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const tDow = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - tDow);
  const diffDays = Math.round((target.getTime() - week1Monday.getTime()) / 86400000);
  const isoWeek = 1 + Math.floor(diffDays / 7);
  return { isoYear, isoWeek };
}

/** Monday 00:00 UTC of ISO week `isoWeek` in ISO year `isoYear`. */
export function utcMondayOfIsoWeek(isoYear: number, isoWeek: number): Date {
  const week1Thursday = new Date(Date.UTC(isoYear, 0, 4));
  const w1d = week1Thursday.getUTCDay() || 7;
  const week1Monday = new Date(week1Thursday);
  week1Monday.setUTCDate(week1Thursday.getUTCDate() - (w1d - 1));
  const monday = new Date(week1Monday);
  monday.setUTCDate(week1Monday.getUTCDate() + (isoWeek - 1) * 7);
  return monday;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** `YYYY-MM-DD` UTC for the given UTC date. */
function formatUtcDateYmd(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Monday–Friday `YYYY-MM-DD` (UTC) for the given ISO week. */
export function weekdayDatesMondayToFriday(isoYear: number, isoWeek: number): string[] {
  const mon = utcMondayOfIsoWeek(isoYear, isoWeek);
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + i);
    out.push(formatUtcDateYmd(d));
  }
  return out;
}

/** Add `delta` ISO weeks (delta may be negative). */
export function addIsoWeeks(isoYear: number, isoWeek: number, delta: number): IsoWeek {
  const monday = utcMondayOfIsoWeek(isoYear, isoWeek);
  monday.setUTCDate(monday.getUTCDate() + delta * 7);
  return isoWeekAndYearFromUtcDate(monday);
}

/** ISO week for “today” (UTC). */
export function currentIsoWeekUtc(): IsoWeek {
  return isoWeekAndYearFromUtcDate(new Date());
}

import { extractProjectV2TextField, itemContentTitleUrl } from "./project-v2-item-hours.ts";
import { type IsoWeek, weekdayDatesMondayToFriday } from "./iso-week.ts";
import { parseTimeLogLines } from "./parse-time-log.ts";

/** One grid row; `item_id` is the ProjectV2 item id (`PVTI_…`). */
type TimeReportingWeekRowTs = {
  item_id: string;
  title: string;
  url: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  total: string;
};

/** One line (or synthetic entry) contributing minutes to a grid cell. */
export type TimeReportingCellContribution = {
  minutes: number;
  rawLine?: string;
};

type BuildTimeReportingWeekRowsOptions = {
  timeSpentFieldName: string;
  /** Selected week (Mo–Fr columns and log filtering). */
  targetWeek: IsoWeek;
  /**
   * Text field name for dated lines (`parseTimeLogLines`). When missing or empty, weekday cells stay `—`.
   */
  timeLogFieldName?: string;
};

function formatMinutesAsHoursLabel(minutes: number): string {
  if (minutes === 0) {
    return "0h";
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) {
    return `${h}h`;
  }
  if (h === 0) {
    return `${m}m`;
  }
  return `${h}h ${m}m`;
}

export function cellDetailKey(itemId: string, ymd: string): string {
  return `${itemId}|${ymd}`;
}

/**
 * Builds week grid rows and a provenance map (`cellDetailsByKey`).
 * Only includes items with **at least one minute** from the Time Log on Mon–Fri of `targetWeek`.
 * The **Total** column is the sum of those weekday minutes (not the board `Time Spent(h)` field).
 */
export function buildTimeReportingWeekRows(
  items: unknown[],
  options: BuildTimeReportingWeekRowsOptions,
): {
  rows: TimeReportingWeekRowTs[];
  cellDetailsByKey: Map<string, TimeReportingCellContribution[]>;
} {
  const { targetWeek } = options;
  const timeLogName = options.timeLogFieldName?.trim() ?? "";
  const weekDates = weekdayDatesMondayToFriday(targetWeek.isoYear, targetWeek.isoWeek);
  const dateToCol = new Map<string, number>(weekDates.map((d, i) => [d, i]));
  const weekDateSet = new Set(weekDates);

  const cellDetailsByKey = new Map<string, TimeReportingCellContribution[]>();
  const rows: TimeReportingWeekRowTs[] = [];
  const placeholder = "—";

  for (const item of items) {
    if (item === null || typeof item !== "object") {
      continue;
    }
    const id = (item as Record<string, unknown>).id;
    if (typeof id !== "string" || id.length === 0) {
      continue;
    }
    const meta = itemContentTitleUrl(item);
    if (meta === null) {
      continue;
    }
    const dayMinutes = [0, 0, 0, 0, 0];
    const pendingContribs: { ymd: string; minutes: number; rawLine: string }[] = [];
    if (timeLogName.length > 0) {
      const logText = extractProjectV2TextField(item, timeLogName);
      if (logText !== null && logText.length > 0) {
        for (const e of parseTimeLogLines(logText)) {
          if (!weekDateSet.has(e.date)) {
            continue;
          }
          const col = dateToCol.get(e.date);
          if (col === undefined || col > 4) {
            continue;
          }
          dayMinutes[col] += e.minutes;
          pendingContribs.push({ ymd: e.date, minutes: e.minutes, rawLine: e.rawLine });
        }
      }
    }

    const weekMinutesSum =
      dayMinutes[0] + dayMinutes[1] + dayMinutes[2] + dayMinutes[3] + dayMinutes[4];
    if (weekMinutesSum === 0) {
      continue;
    }

    for (const p of pendingContribs) {
      const key = cellDetailKey(id, p.ymd);
      const arr = cellDetailsByKey.get(key) ?? [];
      arr.push({ minutes: p.minutes, rawLine: p.rawLine });
      cellDetailsByKey.set(key, arr);
    }

    const dayLabels = dayMinutes.map((m) => (m > 0 ? formatMinutesAsHoursLabel(m) : placeholder));
    const total = formatMinutesAsHoursLabel(weekMinutesSum);

    rows.push({
      item_id: id,
      title: meta.title,
      url: meta.url,
      mon: dayLabels[0] ?? placeholder,
      tue: dayLabels[1] ?? placeholder,
      wed: dayLabels[2] ?? placeholder,
      thu: dayLabels[3] ?? placeholder,
      fri: dayLabels[4] ?? placeholder,
      total,
    });
  }

  return { rows, cellDetailsByKey };
}

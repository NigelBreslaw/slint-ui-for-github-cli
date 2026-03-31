import {
  BOT_TOTAL_TIME_SPENT_FIELD_NAME,
  extractProjectV2NumberFieldHours,
  itemContentTitleUrl,
  projectHoursToMinutes,
} from "./project-v2-item-hours.ts";
import { isoWeekAndYearFromUtcDate, type IsoWeek, weekdayDatesMondayToFriday } from "./iso-week.ts";
import {
  assignmentYmdForWeekdayColumn,
  referenceCloseOrMergeInstantIso,
} from "./time-reporting-item-reference.ts";

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
  targetWeek: IsoWeek;
  /** Defaults to [`BOT_TOTAL_TIME_SPENT_FIELD_NAME`](./project-v2-item-hours.ts). */
  botTotalFieldName?: string;
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

function weeksEqual(a: IsoWeek, b: IsoWeek): boolean {
  return a.isoYear === b.isoYear && a.isoWeek === b.isoWeek;
}

/**
 * Builds week grid rows from **BOT-Total Time Spent(h)** and merge/close instant on `content`.
 * A row appears only when the reference instant falls in `targetWeek` (UTC ISO week) and BOT minutes &gt; 0.
 */
export function buildTimeReportingWeekRows(
  items: unknown[],
  options: BuildTimeReportingWeekRowsOptions,
): {
  rows: TimeReportingWeekRowTs[];
  cellDetailsByKey: Map<string, TimeReportingCellContribution[]>;
} {
  const { targetWeek } = options;
  const botField = options.botTotalFieldName ?? BOT_TOTAL_TIME_SPENT_FIELD_NAME;
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
    const rec = item as Record<string, unknown>;
    const id = rec.id;
    if (typeof id !== "string" || id.length === 0) {
      continue;
    }
    const meta = itemContentTitleUrl(item);
    if (meta === null) {
      continue;
    }
    const content = rec.content;
    const instantIso = referenceCloseOrMergeInstantIso(content);
    if (instantIso === null) {
      continue;
    }
    const refDate = new Date(instantIso);
    if (Number.isNaN(refDate.getTime())) {
      continue;
    }
    const itemWeek = isoWeekAndYearFromUtcDate(refDate);
    if (!weeksEqual(itemWeek, targetWeek)) {
      continue;
    }
    const hours = extractProjectV2NumberFieldHours(item, botField);
    if (hours === null || !Number.isFinite(hours) || hours <= 0) {
      continue;
    }
    const minutes = projectHoursToMinutes(hours);
    if (minutes <= 0) {
      continue;
    }
    const assignYmd = assignmentYmdForWeekdayColumn(instantIso);
    if (assignYmd === null || !weekDateSet.has(assignYmd)) {
      continue;
    }
    const col = dateToCol.get(assignYmd);
    if (col === undefined || col > 4) {
      continue;
    }

    const dayMinutes = [0, 0, 0, 0, 0];
    dayMinutes[col] = minutes;

    const key = cellDetailKey(id, assignYmd);
    const rawLine = `BOT-Total Time Spent(h): ${hours}h\nMerged/closed: ${instantIso}`;
    const arr = cellDetailsByKey.get(key) ?? [];
    arr.push({ minutes, rawLine });
    cellDetailsByKey.set(key, arr);

    const dayLabels = dayMinutes.map((m) => (m > 0 ? formatMinutesAsHoursLabel(m) : placeholder));
    const total = formatMinutesAsHoursLabel(minutes);

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

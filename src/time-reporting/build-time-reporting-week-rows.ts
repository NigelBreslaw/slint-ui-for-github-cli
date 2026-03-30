import {
  extractProjectV2NumberFieldHours,
  itemContentTitleUrl,
  projectHoursToMinutes,
} from "./project-v2-item-hours.ts";
import type { IsoWeek } from "./iso-week.ts";

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

type TimeReportingCellContribution = {
  minutes: number;
  rawLine?: string;
};

type BuildTimeReportingWeekRowsOptions = {
  timeSpentFieldName: string;
  /** Selected week (drives PR5 day columns; stub uses placeholders until then). */
  targetWeek: IsoWeek;
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
 * Builds week grid rows and an empty-or-filled provenance map (`cellDetailsByKey`).
 * Weekday display cells are `"—"` until text-log parsing (PR5) runs inside this pipeline.
 */
export function buildTimeReportingWeekRows(
  items: unknown[],
  options: BuildTimeReportingWeekRowsOptions,
): {
  rows: TimeReportingWeekRowTs[];
  cellDetailsByKey: Map<string, TimeReportingCellContribution[]>;
} {
  const { timeSpentFieldName } = options;
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
    const hours = extractProjectV2NumberFieldHours(item, timeSpentFieldName);
    const total =
      hours === null ? placeholder : formatMinutesAsHoursLabel(projectHoursToMinutes(hours));

    rows.push({
      item_id: id,
      title: meta.title,
      url: meta.url,
      mon: placeholder,
      tue: placeholder,
      wed: placeholder,
      thu: placeholder,
      fri: placeholder,
      total,
    });
  }

  return { rows, cellDetailsByKey };
}

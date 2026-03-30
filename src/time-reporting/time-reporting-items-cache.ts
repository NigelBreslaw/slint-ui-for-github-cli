import type { TimeReportingCellContribution } from "./build-time-reporting-week-rows.ts";
import { currentIsoWeekUtc, type IsoWeek } from "./iso-week.ts";

let cachedItems: unknown[] | null = null;
let cachedProjectNodeId: string | null = null;
let selectedWeek: IsoWeek = currentIsoWeekUtc();
let cellDetailsByKey = new Map<string, TimeReportingCellContribution[]>();

export function resetTimeReportingItemsState(): void {
  cachedItems = null;
  cachedProjectNodeId = null;
  selectedWeek = currentIsoWeekUtc();
  cellDetailsByKey = new Map();
}

export function getTimeReportingSelectedWeek(): IsoWeek {
  return selectedWeek;
}

export function setTimeReportingSelectedWeek(w: IsoWeek): void {
  selectedWeek = w;
}

export function setTimeReportingCachedItems(
  nodeId: string,
  items: unknown[],
  details: Map<string, TimeReportingCellContribution[]>,
): void {
  cachedProjectNodeId = nodeId;
  cachedItems = items;
  cellDetailsByKey = details;
}

export function getTimeReportingCachedProjectNodeId(): string | null {
  return cachedProjectNodeId;
}

export function getTimeReportingCachedItems(): unknown[] | null {
  return cachedItems;
}

/** Used by time-log parsing and cell drill-down (later PRs). */
export function getTimeReportingCellDetailsByKey(): Map<string, TimeReportingCellContribution[]> {
  return cellDetailsByKey;
}

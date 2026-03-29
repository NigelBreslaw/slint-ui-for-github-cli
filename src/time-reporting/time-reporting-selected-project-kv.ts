/**
 * Persisted GitHub ProjectV2 choice for the Time reporting feature (SQLite KV).
 */
import { kvDelete, kvGet } from "../db/app-db.ts";

const TIME_REPORTING_SELECTED_PROJECT_KV_KEY = "time_reporting/selected_project_v1";

export const TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION = 1 as const;

export type TimeReportingSelectedProjectV1 = {
  schemaVersion: typeof TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION;
  nodeId: string;
  number: number;
  title: string;
  url: string;
};

export function parseTimeReportingSelectedProjectJson(
  raw: string,
): TimeReportingSelectedProjectV1 | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (v === null || typeof v !== "object") {
      return null;
    }
    const o = v as Record<string, unknown>;
    if (o.schemaVersion !== TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION) {
      return null;
    }
    if (typeof o.nodeId !== "string" || o.nodeId.length === 0) {
      return null;
    }
    if (typeof o.number !== "number" || !Number.isFinite(o.number)) {
      return null;
    }
    if (typeof o.title !== "string") {
      return null;
    }
    if (typeof o.url !== "string") {
      return null;
    }
    return {
      schemaVersion: TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
      nodeId: o.nodeId,
      number: o.number,
      title: o.title,
      url: o.url,
    };
  } catch {
    return null;
  }
}

export function readTimeReportingSelectedProjectKv(): TimeReportingSelectedProjectV1 | null {
  const raw = kvGet(TIME_REPORTING_SELECTED_PROJECT_KV_KEY);
  if (raw === undefined || raw.length === 0) {
    return null;
  }
  return parseTimeReportingSelectedProjectJson(raw);
}

export function clearTimeReportingSelectedProjectKv(): void {
  kvDelete(TIME_REPORTING_SELECTED_PROJECT_KV_KEY);
}

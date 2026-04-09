/**
 * Persisted main window logical size and maximized flag (SQLite KV). Used by UI wiring in a follow-up PR.
 */
import { kvGet, kvSet } from "../db/app-db.ts";

export const WINDOW_GEOMETRY_KV_KEY = "window_geometry_v1";

export const WINDOW_GEOMETRY_SCHEMA_VERSION = 1 as const;

/** Matches [`main.slint`](../../ui/main.slint) `min-width` / `min-height`. */
export const WINDOW_GEOMETRY_MIN_LENGTH = 400;

/** Reject absurd values from corrupted KV or manual DB edits. */
export const WINDOW_GEOMETRY_MAX_LENGTH = 100_000;

export type WindowGeometryV1 = {
  schemaVersion: typeof WINDOW_GEOMETRY_SCHEMA_VERSION;
  width: number;
  height: number;
  maximized: boolean;
};

export type WindowGeometryWrite = {
  width: number;
  height: number;
  maximized?: boolean;
};

export function clampWindowGeometryWidthHeight(
  width: number,
  height: number,
): { width: number; height: number } {
  const w = Math.round(width);
  const h = Math.round(height);
  const cw = Number.isFinite(w)
    ? Math.min(WINDOW_GEOMETRY_MAX_LENGTH, Math.max(WINDOW_GEOMETRY_MIN_LENGTH, w))
    : WINDOW_GEOMETRY_MIN_LENGTH;
  const ch = Number.isFinite(h)
    ? Math.min(WINDOW_GEOMETRY_MAX_LENGTH, Math.max(WINDOW_GEOMETRY_MIN_LENGTH, h))
    : WINDOW_GEOMETRY_MIN_LENGTH;
  return { width: cw, height: ch };
}

export function parseWindowGeometryJson(raw: string): WindowGeometryV1 | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (v === null || typeof v !== "object") {
      return null;
    }
    const o = v as Record<string, unknown>;
    if (o.schemaVersion !== WINDOW_GEOMETRY_SCHEMA_VERSION) {
      return null;
    }
    if (typeof o.width !== "number" || typeof o.height !== "number") {
      return null;
    }
    if (!Number.isFinite(o.width) || !Number.isFinite(o.height)) {
      return null;
    }
    let maximized = false;
    if (o.maximized !== undefined) {
      if (typeof o.maximized !== "boolean") {
        return null;
      }
      maximized = o.maximized;
    }
    const { width, height } = clampWindowGeometryWidthHeight(o.width, o.height);
    return {
      schemaVersion: WINDOW_GEOMETRY_SCHEMA_VERSION,
      width,
      height,
      maximized,
    };
  } catch {
    return null;
  }
}

function serializeWindowGeometry(geometry: WindowGeometryV1): string {
  return JSON.stringify(geometry);
}

export function readWindowGeometryKv(): WindowGeometryV1 | null {
  const raw = kvGet(WINDOW_GEOMETRY_KV_KEY);
  if (raw === undefined || raw.length === 0) {
    return null;
  }
  return parseWindowGeometryJson(raw);
}

export function writeWindowGeometryKv(snapshot: WindowGeometryWrite): void {
  const maximized = snapshot.maximized === true;
  const { width, height } = clampWindowGeometryWidthHeight(snapshot.width, snapshot.height);
  const geometry: WindowGeometryV1 = {
    schemaVersion: WINDOW_GEOMETRY_SCHEMA_VERSION,
    width,
    height,
    maximized,
  };
  kvSet(WINDOW_GEOMETRY_KV_KEY, serializeWindowGeometry(geometry));
}

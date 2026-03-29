/**
 * Persisted viewer snapshot for fast first paint (SQLite KV). Avatar bytes stay on disk only.
 */
import { kvDelete, kvGet, kvSet } from "../db/app-db.ts";

export const VIEWER_SESSION_KV_KEY = "viewer_session_v1";

export const VIEWER_SESSION_SCHEMA_VERSION = 1 as const;

export type CachedViewerFields = {
  login: string;
  name: string | null;
  url: string;
  avatarUrl: string;
  statusMessage: string;
  statusEmoji: string;
};

export type ViewerSessionV1 = {
  schemaVersion: typeof VIEWER_SESSION_SCHEMA_VERSION;
  authenticated: boolean;
  viewer: CachedViewerFields;
  updatedAt: string;
};

export function parseViewerSessionJson(raw: string): ViewerSessionV1 | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (v === null || typeof v !== "object") {
      return null;
    }
    const o = v as Record<string, unknown>;
    if (o.schemaVersion !== VIEWER_SESSION_SCHEMA_VERSION) {
      return null;
    }
    if (o.authenticated !== true) {
      return null;
    }
    const viewer = o.viewer;
    if (viewer === null || typeof viewer !== "object") {
      return null;
    }
    const w = viewer as Record<string, unknown>;
    if (typeof w.login !== "string" || w.login.length === 0) {
      return null;
    }
    if (w.name !== null && typeof w.name !== "string") {
      return null;
    }
    if (typeof w.url !== "string" || typeof w.avatarUrl !== "string") {
      return null;
    }
    if (typeof w.statusMessage !== "string" || typeof w.statusEmoji !== "string") {
      return null;
    }
    if (typeof o.updatedAt !== "string") {
      return null;
    }
    return {
      schemaVersion: VIEWER_SESSION_SCHEMA_VERSION,
      authenticated: true,
      viewer: {
        login: w.login,
        name: w.name as string | null,
        url: w.url,
        avatarUrl: w.avatarUrl,
        statusMessage: w.statusMessage,
        statusEmoji: w.statusEmoji,
      },
      updatedAt: o.updatedAt,
    };
  } catch {
    return null;
  }
}

export function serializeViewerSession(session: ViewerSessionV1): string {
  return JSON.stringify(session);
}

export function readViewerSessionCache(): ViewerSessionV1 | null {
  const raw = kvGet(VIEWER_SESSION_KV_KEY);
  if (raw === undefined || raw.length === 0) {
    return null;
  }
  return parseViewerSessionJson(raw);
}

export function writeViewerSessionCache(session: ViewerSessionV1): void {
  kvSet(VIEWER_SESSION_KV_KEY, serializeViewerSession(session));
}

export function clearViewerSessionCache(): void {
  kvDelete(VIEWER_SESSION_KV_KEY);
}

export function viewerSessionFromMinimalViewer(
  viewer: {
    login: string;
    name: string | null;
    url: string;
    avatarUrl: string;
    status: { message: string | null; emojiHTML: string | null } | null;
  },
  statusEmojiPlain: string,
): ViewerSessionV1 {
  const st = viewer.status;
  return {
    schemaVersion: VIEWER_SESSION_SCHEMA_VERSION,
    authenticated: true,
    viewer: {
      login: viewer.login,
      name: viewer.name,
      url: viewer.url,
      avatarUrl: viewer.avatarUrl,
      statusMessage: st?.message ?? "",
      statusEmoji: statusEmojiPlain,
    },
    updatedAt: new Date().toISOString(),
  };
}

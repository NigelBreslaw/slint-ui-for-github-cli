import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseViewerSessionJson,
  serializeViewerSession,
  VIEWER_SESSION_KV_KEY,
  VIEWER_SESSION_SCHEMA_VERSION,
  type ViewerSessionV1,
} from "./viewer-session-cache.ts";

const validSession: ViewerSessionV1 = {
  schemaVersion: VIEWER_SESSION_SCHEMA_VERSION,
  authenticated: true,
  viewer: {
    login: "octocat",
    name: "The Octocat",
    url: "https://github.com/octocat",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    statusMessage: "Busy",
    statusEmoji: "⌚",
  },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("viewer session KV", () => {
  it("uses a stable KV key", () => {
    assert.equal(VIEWER_SESSION_KV_KEY, "viewer_session_v1");
  });
});

describe("parseViewerSessionJson", () => {
  it("accepts a valid v1 session", () => {
    const raw = serializeViewerSession(validSession);
    const parsed = parseViewerSessionJson(raw);
    assert.deepEqual(parsed, validSession);
  });

  it("returns null for wrong schema version", () => {
    const bad = { ...validSession, schemaVersion: 999 };
    assert.equal(parseViewerSessionJson(JSON.stringify(bad)), null);
  });

  it("returns null when authenticated is not true", () => {
    const bad = { ...validSession, authenticated: false };
    assert.equal(parseViewerSessionJson(JSON.stringify(bad)), null);
  });

  it("returns null for invalid JSON", () => {
    assert.equal(parseViewerSessionJson("not json"), null);
  });

  it("returns null when login is missing", () => {
    const bad = {
      ...validSession,
      viewer: { ...validSession.viewer, login: "" },
    };
    assert.equal(parseViewerSessionJson(JSON.stringify(bad)), null);
  });

  it("returns null when name has wrong type", () => {
    const bad = {
      ...validSession,
      viewer: { ...validSession.viewer, name: 1 },
    };
    assert.equal(parseViewerSessionJson(JSON.stringify(bad)), null);
  });
});

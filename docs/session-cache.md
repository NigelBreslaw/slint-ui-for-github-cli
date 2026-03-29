# Viewer session cache

## Purpose

To reduce the “empty header” period on startup, the app can restore the last known GitHub **viewer** identity (login, name, profile URL, status text, emoji, and `avatarUrl`) from **SQLite** before the asynchronous `gh` scope check and GraphQL `viewer` query finish.

**Avatar image bytes are not stored in the database.** They remain in the filesystem cache under the app data directory (keyed by `avatarUrl`), same as before.

## Storage

- **Backend:** [`kv` table](../src/db/app-db.ts) via `kvGet` / `kvSet` / `kvDelete`.
- **Key:** `viewer_session_v1` (see [`VIEWER_SESSION_KV_KEY`](../src/session/viewer-session-cache.ts)).
- **Value:** JSON with `schemaVersion: 1`, `authenticated: true`, `viewer` fields, and `updatedAt` (ISO-8601).

The snapshot is written after a **successful** GraphQL viewer parse during refresh. It is **cleared** when:

- The user chooses **Sign out** (in addition to `gh auth logout`).
- Any path calls [`clearUserIdentity`](../src/main.ts) after an auth/GraphQL failure (which includes `clearViewerSessionCache()`).

## Stale or invalid sessions

If `gh` is logged out, scopes are wrong, or the viewer query fails, the app clears the cache and returns to the logged-out UI. A short period where the **cached** identity is visible can occur until that background check finishes; refresh is intended to be fast.

## Privacy

The SQLite file and JSON value contain **profile metadata** (login, name, public URL, status strings), not OAuth tokens. Treat app data directory like local user data.

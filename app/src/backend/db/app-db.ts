import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { appDataRoot } from "../utils/app-data-root.ts";

const SCHEMA_META_KEY = "__github_app/schema_version";

let db: Database.Database | undefined;

function ensureDb(): Database.Database {
  if (db === undefined) {
    throw new Error("openAppDb() must be called before using the KV store");
  }
  return db;
}

/**
 * Opens the app SQLite database and runs migrations. Safe to call once at startup.
 */
/**
 * Closes the DB if it was opened. Idempotent; safe to call at process shutdown.
 */
export function closeAppDb(): void {
  if (db === undefined) {
    return;
  }
  db.close();
  db = undefined;
}

export function openAppDb(): Database.Database {
  if (db !== undefined) {
    return db;
  }
  const root = appDataRoot();
  mkdirSync(root, { recursive: true });
  const path = join(root, "app.db");
  const instance = new Database(path);
  instance.exec(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  const row = instance.prepare("SELECT value FROM kv WHERE key = ?").get(SCHEMA_META_KEY) as
    | { value: string }
    | undefined;
  if (row === undefined) {
    instance.prepare("INSERT INTO kv (key, value) VALUES (?, ?)").run(SCHEMA_META_KEY, "1");
  }
  db = instance;
  return db;
}

export function kvGet(key: string): string | undefined {
  const row = ensureDb().prepare("SELECT value FROM kv WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function kvSet(key: string, value: string): void {
  ensureDb().prepare("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)").run(key, value);
}

export function kvDelete(key: string): void {
  ensureDb().prepare("DELETE FROM kv WHERE key = ?").run(key);
}

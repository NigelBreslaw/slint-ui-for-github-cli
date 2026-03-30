/**
 * Persisted `owner/repo` for the Dashboard Security alerts tab (SQLite KV).
 */
import { kvDelete, kvGet, kvSet } from "../db/app-db.ts";

const SECURITY_ALERTS_REPO_KV_KEY = "security_alerts/repository_full_name_v1";

type SecurityAlertsRepoValidation = { ok: true; value: string } | { ok: false; message: string };

/**
 * Empty string is valid (clears the setting). Otherwise exactly one slash: `owner/repo`, both parts non-empty.
 */
export function validateSecurityAlertsRepoFullName(raw: string): SecurityAlertsRepoValidation {
  const t = raw.trim();
  if (t.length === 0) {
    return { ok: true, value: "" };
  }
  const idx = t.indexOf("/");
  if (idx === -1) {
    return { ok: false, message: "Use owner/repo (include one slash)." };
  }
  const owner = t.slice(0, idx).trim();
  const repo = t.slice(idx + 1).trim();
  if (owner.length === 0 || repo.length === 0) {
    return { ok: false, message: "Owner and repository name must not be empty." };
  }
  if (repo.includes("/")) {
    return { ok: false, message: "Use exactly owner/repo (only one slash)." };
  }
  return { ok: true, value: `${owner}/${repo}` };
}

export function readSecurityAlertsRepositoryKv(): string {
  const raw = kvGet(SECURITY_ALERTS_REPO_KV_KEY);
  if (raw === undefined) {
    return "";
  }
  return raw.trim();
}

/** Owner and repo from persisted KV, or null if unset or malformed. */
export function readSecurityAlertsRepositoryOwnerRepo(): { owner: string; repo: string } | null {
  const full = readSecurityAlertsRepositoryKv();
  if (full.length === 0) {
    return null;
  }
  const idx = full.indexOf("/");
  if (idx <= 0 || idx >= full.length - 1) {
    return null;
  }
  const owner = full.slice(0, idx).trim();
  const repo = full.slice(idx + 1).trim();
  if (owner.length === 0 || repo.length === 0 || repo.includes("/")) {
    return null;
  }
  return { owner, repo };
}

export function writeSecurityAlertsRepositoryKv(fullName: string): void {
  const t = fullName.trim();
  if (t.length === 0) {
    kvDelete(SECURITY_ALERTS_REPO_KV_KEY);
    return;
  }
  kvSet(SECURITY_ALERTS_REPO_KV_KEY, t);
}

/** Classic OAuth scopes this app expects on the active `github.com` token. */
export const REQUIRED_GH_OAUTH_SCOPES = ["read:org", "read:project"] as const;

export type ScopeCheckOk = { ok: true };

export type ScopeCheckNeedsAttention = {
  ok: false;
  /** When true, we could not read a reliable scope list (e.g. fine-grained PAT). */
  unknown: boolean;
  /** User-facing explanation. */
  message: string;
  /** Present when `unknown` is false: scopes still missing from the token. */
  missing?: readonly string[];
};

export type ScopeCheckResult = ScopeCheckOk | ScopeCheckNeedsAttention;

function normalizeScopeToken(s: string): string {
  return s.trim().toLowerCase();
}

/** Parses comma-separated scope string from `gh auth status --json hosts`. */
function parseScopesCsv(scopes: string | undefined): string[] | null {
  if (scopes === undefined) {
    return null;
  }
  const trimmed = scopes.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parts = trimmed.split(",");
  const out: string[] = [];
  for (const p of parts) {
    const n = normalizeScopeToken(p);
    if (n.length > 0) {
      out.push(n);
    }
  }
  return out.length > 0 ? out : null;
}

type HostEntry = {
  active?: boolean;
  host?: string;
  scopes?: string;
  state?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function asHostEntry(v: unknown): HostEntry | null {
  if (!isRecord(v)) {
    return null;
  }
  const active = v.active;
  const host = v.host;
  const scopes = v.scopes;
  const state = v.state;
  return {
    active: typeof active === "boolean" ? active : undefined,
    host: typeof host === "string" ? host : undefined,
    scopes: typeof scopes === "string" ? scopes : undefined,
    state: typeof state === "string" ? state : undefined,
  };
}

/**
 * Reads granted scopes from `gh auth status --json hosts` payload.
 * Returns `null` if the payload has no usable scope list for github.com.
 */
export function grantedScopesFromAuthStatusHostsJson(json: unknown): string[] | null {
  if (!isRecord(json)) {
    return null;
  }
  const hosts = json.hosts;
  if (!isRecord(hosts)) {
    return null;
  }
  const github = hosts["github.com"];
  if (!Array.isArray(github)) {
    return null;
  }

  let chosen: HostEntry | null = null;
  for (const item of github) {
    const entry = asHostEntry(item);
    if (entry === null) {
      continue;
    }
    if (entry.active === true && entry.state === "success") {
      chosen = entry;
      break;
    }
  }
  if (chosen === null) {
    for (const item of github) {
      const entry = asHostEntry(item);
      if (entry !== null && entry.state === "success") {
        chosen = entry;
        break;
      }
    }
  }
  if (chosen === null) {
    return null;
  }

  return parseScopesCsv(chosen.scopes);
}

export function checkRequiredScopesAgainstGranted(
  granted: string[] | null,
  required: readonly string[] = REQUIRED_GH_OAUTH_SCOPES,
): ScopeCheckResult {
  if (granted === null) {
    return {
      ok: false,
      unknown: true,
      message: "Could not verify scopes (e.g. fine-grained token).",
    };
  }
  const grantedSet = new Set(granted);
  const missing = required.filter((s) => !grantedSet.has(s));
  if (missing.length === 0) {
    return { ok: true };
  }
  return {
    ok: false,
    unknown: false,
    missing,
    message: `Missing GitHub token scope(s): ${missing.join(", ")}.`,
  };
}

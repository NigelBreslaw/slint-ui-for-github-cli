/**
 * Formats GitHub GraphQL `rateLimit.resetAt` (ISO-8601, UTC) for display in the
 * machine's local timezone and default locale.
 */
export function formatRateLimitResetLocal(isoUtc: string): string {
  const ms = Date.parse(isoUtc);
  if (!Number.isFinite(ms)) {
    return isoUtc;
  }
  return new Date(ms).toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Safe filename segment for `debug-json/time-reporting--project-v2--….json` stems. */
export function sanitizeTimeReportingDebugStem(nodeId: string): string {
  return nodeId.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

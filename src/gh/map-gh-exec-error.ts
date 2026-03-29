export function mapGhExecError(e: unknown): string {
  if (e !== null && typeof e === "object" && "code" in e && e.code === "ENOENT") {
    return "gh not found (install GitHub CLI)";
  }
  if (e !== null && typeof e === "object" && "stderr" in e) {
    const stderr = (e as { stderr?: Buffer }).stderr;
    const msg = stderr ? stderr.toString("utf8").trim() : "";
    if (msg.length > 0) {
      return `gh: ${msg}`;
    }
  }
  return e instanceof Error ? e.message : String(e);
}

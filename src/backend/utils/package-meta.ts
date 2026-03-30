
export function buildCommitLabel(count: number): string {
  if (count <= 0) {
    return "— (run dev script to refresh)";
  }
  if (count < 1000) {
    return `v0.${String(count)}`;
  }
  return `v${String(count)}`;
}

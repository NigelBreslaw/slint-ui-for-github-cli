import clipboard from "clipboardy";

/**
 * Writes text to the system clipboard. No-ops on empty input.
 * Logs and swallows errors so callers can continue (e.g. still open a URL).
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return;
  }
  try {
    await clipboard.write(trimmed);
  } catch (e) {
    console.error("[github-app] copyTextToClipboard failed:", e);
  }
}

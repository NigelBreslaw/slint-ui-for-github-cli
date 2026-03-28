/**
 * GitHub GraphQL `UserStatus.emojiHTML` wraps the glyph (e.g. `<div>🤓</div>`).
 * Slint `Text` needs plain Unicode — strip tags.
 */
export function statusEmojiFromGraphqlHtml(emojiHTML: string | null): string {
  if (emojiHTML == null || emojiHTML.length === 0) {
    return "";
  }
  const stripped = emojiHTML.replace(/<[^>]*>/g, "").trim();
  return stripped.length > 0 ? stripped : "";
}

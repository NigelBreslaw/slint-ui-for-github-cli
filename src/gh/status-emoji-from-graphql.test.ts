import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { statusEmojiFromGraphqlHtml } from "./status-emoji-from-graphql.ts";

describe("statusEmojiFromGraphqlHtml", () => {
  it("returns empty for null and empty string", () => {
    assert.equal(statusEmojiFromGraphqlHtml(null), "");
    assert.equal(statusEmojiFromGraphqlHtml(""), "");
  });

  it("strips a single wrapper div", () => {
    assert.equal(statusEmojiFromGraphqlHtml("<div>🤓</div>"), "🤓");
  });

  it("strips nested tags", () => {
    assert.equal(statusEmojiFromGraphqlHtml("<span><b>✅</b></span>"), "✅");
  });

  it("returns empty when only tags remain after strip", () => {
    assert.equal(statusEmojiFromGraphqlHtml("<div></div>"), "");
    assert.equal(statusEmojiFromGraphqlHtml("   <br>  "), "");
  });
});

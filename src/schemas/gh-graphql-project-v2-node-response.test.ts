import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseProjectV2NodeFromGraphqlResponse } from "./gh-graphql-project-v2-node-response.ts";

const minimalOk = {
  data: {
    node: {
      id: "PVT_kwDOA",
      number: 46,
      title: "Example",
      url: "https://github.com/orgs/foo/projects/46",
      shortDescription: null,
      closed: false,
      public: false,
      createdAt: "2026-03-19T20:53:40Z",
      updatedAt: "2026-03-29T06:11:43Z",
      items: { totalCount: 32 },
    },
  },
};

describe("parseProjectV2NodeFromGraphqlResponse", () => {
  it("accepts a minimal valid ProjectV2 node payload", () => {
    const r = parseProjectV2NodeFromGraphqlResponse(minimalOk);
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.project.id, "PVT_kwDOA");
      assert.equal(r.project.number, 46);
      assert.equal(r.project.items.totalCount, 32);
    }
  });

  it("surfaces top-level GraphQL errors", () => {
    const r = parseProjectV2NodeFromGraphqlResponse({
      errors: [{ message: "Not found" }],
      data: { node: null },
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.message, "Not found");
    }
  });

  it("rejects when data.node is null", () => {
    const r = parseProjectV2NodeFromGraphqlResponse({ data: { node: null } });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /null/);
    }
  });

  it("rejects when data has no node field", () => {
    const r = parseProjectV2NodeFromGraphqlResponse({ data: {} });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /no node/);
    }
  });

  it("rejects non-object root", () => {
    const r = parseProjectV2NodeFromGraphqlResponse(null);
    assert.equal(r.ok, false);
  });

  it("rejects wrong __typename when present", () => {
    const r = parseProjectV2NodeFromGraphqlResponse({
      data: {
        node: {
          __typename: "Issue",
          id: "I_kw",
        },
      },
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.message, /Issue/);
    }
  });

  it("accepts ProjectV2 when __typename is ProjectV2", () => {
    const r = parseProjectV2NodeFromGraphqlResponse({
      data: {
        node: {
          __typename: "ProjectV2",
          id: "PVT_x",
          number: 1,
          title: "T",
          url: "https://github.com/orgs/o/projects/1",
          shortDescription: null,
          closed: false,
          public: true,
          createdAt: "2020-01-01T00:00:00Z",
          updatedAt: "2020-01-02T00:00:00Z",
          items: { totalCount: 0 },
        },
      },
    });
    assert.equal(r.ok, true);
  });
});

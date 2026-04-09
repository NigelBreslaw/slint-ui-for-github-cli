import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WINDOW_GEOMETRY_MAX_LENGTH,
  WINDOW_GEOMETRY_MIN_LENGTH,
  clampWindowGeometryWidthHeight,
  parseWindowGeometryJson,
} from "./window-geometry-kv.ts";

describe("clampWindowGeometryWidthHeight", () => {
  it("clamps below minimum to minimum on both axes", () => {
    assert.deepEqual(clampWindowGeometryWidthHeight(100, 200), {
      width: WINDOW_GEOMETRY_MIN_LENGTH,
      height: WINDOW_GEOMETRY_MIN_LENGTH,
    });
  });

  it("clamps above maximum to maximum on both axes", () => {
    assert.deepEqual(
      clampWindowGeometryWidthHeight(
        WINDOW_GEOMETRY_MAX_LENGTH + 1,
        WINDOW_GEOMETRY_MAX_LENGTH + 9,
      ),
      { width: WINDOW_GEOMETRY_MAX_LENGTH, height: WINDOW_GEOMETRY_MAX_LENGTH },
    );
  });

  it("rounds fractional lengths", () => {
    assert.deepEqual(clampWindowGeometryWidthHeight(800.4, 540.6), { width: 800, height: 541 });
  });

  it("uses minimum for non-finite inputs", () => {
    assert.deepEqual(clampWindowGeometryWidthHeight(NaN, 600), {
      width: WINDOW_GEOMETRY_MIN_LENGTH,
      height: 600,
    });
    assert.deepEqual(clampWindowGeometryWidthHeight(600, Number.POSITIVE_INFINITY), {
      width: 600,
      height: WINDOW_GEOMETRY_MIN_LENGTH,
    });
  });
});

describe("parseWindowGeometryJson", () => {
  it("returns null for invalid JSON", () => {
    assert.equal(parseWindowGeometryJson(""), null);
    assert.equal(parseWindowGeometryJson("{"), null);
    assert.equal(parseWindowGeometryJson("[]"), null);
  });

  it("returns null when schemaVersion is wrong or missing", () => {
    assert.equal(
      parseWindowGeometryJson(JSON.stringify({ schemaVersion: 2, width: 800, height: 600 })),
      null,
    );
    assert.equal(parseWindowGeometryJson(JSON.stringify({ width: 800, height: 600 })), null);
  });

  it("returns null when width or height are not finite numbers", () => {
    assert.equal(
      parseWindowGeometryJson(JSON.stringify({ schemaVersion: 1, width: "800", height: 600 })),
      null,
    );
    assert.equal(
      parseWindowGeometryJson(JSON.stringify({ schemaVersion: 1, width: 800, height: null })),
      null,
    );
  });

  it("returns null when maximized is present but not boolean", () => {
    assert.equal(
      parseWindowGeometryJson(
        JSON.stringify({ schemaVersion: 1, width: 800, height: 600, maximized: 1 }),
      ),
      null,
    );
  });

  it("parses valid payload and clamps dimensions", () => {
    assert.deepEqual(
      parseWindowGeometryJson(
        JSON.stringify({ schemaVersion: 1, width: 800, height: 540, maximized: false }),
      ),
      { schemaVersion: 1, width: 800, height: 540, maximized: false },
    );
    assert.deepEqual(
      parseWindowGeometryJson(JSON.stringify({ schemaVersion: 1, width: 50, height: 9999 })),
      { schemaVersion: 1, width: WINDOW_GEOMETRY_MIN_LENGTH, height: 9999, maximized: false },
    );
  });

  it("defaults maximized to false when omitted", () => {
    assert.deepEqual(
      parseWindowGeometryJson(JSON.stringify({ schemaVersion: 1, width: 640, height: 480 })),
      { schemaVersion: 1, width: 640, height: 480, maximized: false },
    );
  });

  it("preserves maximized true", () => {
    assert.deepEqual(
      parseWindowGeometryJson(
        JSON.stringify({ schemaVersion: 1, width: 1024, height: 768, maximized: true }),
      ),
      { schemaVersion: 1, width: 1024, height: 768, maximized: true },
    );
  });
});

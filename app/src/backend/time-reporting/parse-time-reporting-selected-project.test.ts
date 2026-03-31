import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseTimeReportingSelectedProjectJson,
  TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
  type TimeReportingSelectedProjectV1,
} from "./time-reporting-selected-project-kv.ts";

const valid: TimeReportingSelectedProjectV1 = {
  schemaVersion: TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
  nodeId: "PVT_kwDOABC",
  number: 42,
  title: "My project",
  url: "https://github.com/orgs/foo/projects/42",
};

describe("parseTimeReportingSelectedProjectJson", () => {
  it("returns null for invalid JSON", () => {
    assert.equal(parseTimeReportingSelectedProjectJson("{"), null);
  });

  it("returns null for wrong schema version", () => {
    assert.equal(
      parseTimeReportingSelectedProjectJson(JSON.stringify({ ...valid, schemaVersion: 0 })),
      null,
    );
  });

  it("returns null when nodeId is missing or empty", () => {
    assert.equal(
      parseTimeReportingSelectedProjectJson(JSON.stringify({ ...valid, nodeId: "" })),
      null,
    );
    assert.equal(
      parseTimeReportingSelectedProjectJson(JSON.stringify({ ...valid, nodeId: 1 })),
      null,
    );
  });

  it("returns null when number is not a finite number", () => {
    assert.equal(
      parseTimeReportingSelectedProjectJson(JSON.stringify({ ...valid, number: "42" })),
      null,
    );
    assert.equal(
      parseTimeReportingSelectedProjectJson(JSON.stringify({ ...valid, number: NaN })),
      null,
    );
  });

  it("returns null when title or url is not a string", () => {
    assert.equal(
      parseTimeReportingSelectedProjectJson(JSON.stringify({ ...valid, title: null })),
      null,
    );
    assert.equal(
      parseTimeReportingSelectedProjectJson(JSON.stringify({ ...valid, url: null })),
      null,
    );
  });

  it("accepts a valid v1 payload", () => {
    const raw = JSON.stringify(valid);
    assert.deepEqual(parseTimeReportingSelectedProjectJson(raw), valid);
  });
});

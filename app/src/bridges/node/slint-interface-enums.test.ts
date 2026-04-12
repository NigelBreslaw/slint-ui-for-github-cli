import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appView,
  authed,
  dashboardTab,
  dataTableCellKind,
  labelSize,
  labelVariant,
  projectBoardItemKind,
} from "./slint-interface.ts";

/**
 * Runtime checks on `slintEnumMembers` objects so wire strings stay aligned with
 * Slint enums in `app-state.slint` and `project-board-list-state.slint` (see slint-interface.ts).
 */
describe("Slint wire enum members", () => {
  it("dashboard tab members match DashboardTab in app-state.slint", () => {
    const values = Object.values(dashboardTab);
    assert.ok(values.includes("itemsToReview"));
    assert.ok(values.includes("securityAlerts"));
    assert.equal(values.length, 2);
  });

  it("authed members match Authed in app-state.slint", () => {
    const values = Object.values(authed) as string[];
    for (const s of [
      "loggedOut",
      "noGhCliInstalled",
      "ghCliVersionTooOld",
      "loggedIn",
      "authorizing",
    ]) {
      assert.ok(values.includes(s), `missing ${s}`);
    }
    assert.equal(values.length, 5);
  });

  it("app view members match AppView in app-state.slint", () => {
    const values = Object.values(appView);
    assert.ok(values.includes("dashboard"));
    assert.ok(values.includes("settings"));
    assert.ok(values.includes("timeReporting"));
    assert.ok(values.includes("projectBoardList"));
    assert.ok(values.includes("primerGallery"));
    assert.equal(values.length, 5);
  });

  it("project board item kind members match ProjectBoardItemKind in project-board-list-state.slint", () => {
    const values = Object.values(projectBoardItemKind);
    assert.ok(values.includes("pullRequest"));
    assert.ok(values.includes("issue"));
    assert.ok(values.includes("draftIssue"));
    assert.equal(values.length, 3);
  });

  it("data table cell kind members match DataTableCellKind in DataTable/types.slint", () => {
    const values = Object.values(dataTableCellKind);
    for (const s of ["text", "label", "icon_text", "action"]) {
      assert.ok(values.includes(s), `missing ${s}`);
    }
    assert.equal(values.length, 4);
  });

  it("label variant members match LabelVariant in Label/types.slint", () => {
    const values = Object.values(labelVariant);
    assert.equal(values.length, 10);
  });

  it("label size members match LabelSize in Label/types.slint", () => {
    const values = Object.values(labelSize);
    assert.ok(values.includes("small"));
    assert.ok(values.includes("large"));
    assert.equal(values.length, 2);
  });
});

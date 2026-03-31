import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appStateViewWire,
  authedWire,
  dashboardTabWire,
} from "./slint-interface.ts";

/**
 * Runtime checks on `slintEnumMembers` objects so wire strings stay aligned with
 * `data-bridges/app-state.slint` enums (see slint-interface.ts).
 */
describe("Slint wire enum members", () => {
  it("dashboard tab members match DashboardTab in app-state.slint", () => {
    const values = Object.values(dashboardTabWire);
    assert.ok(values.includes("itemsToReview"));
    assert.ok(values.includes("securityAlerts"));
    assert.equal(values.length, 2);
  });

  it("authed members match Authed in app-state.slint", () => {
    const values = Object.values(authedWire) as string[];
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

  it("view members match View in app-state.slint", () => {
    const values = Object.values(appStateViewWire);
    assert.ok(values.includes("dashboard"));
    assert.ok(values.includes("settings"));
    assert.ok(values.includes("timeReporting"));
    assert.equal(values.length, 3);
  });
});

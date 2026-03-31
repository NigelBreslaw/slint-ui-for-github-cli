import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appStateViewLiterals,
  authedAuthLiterals,
  dashboardTabWireLiterals,
} from "./slint-interface.ts";

/**
 * Runtime checks on `slintEnumLiterals` tuples so wire strings stay aligned with
 * `data-bridges/app-state.slint` enums (see slint-interface.ts).
 */
describe("Slint wire enum literals", () => {
  it("dashboard tab literals match DashboardTab in app-state.slint", () => {
    const values = dashboardTabWireLiterals as readonly string[];
    assert.ok(values.includes("itemsToReview"));
    assert.ok(values.includes("securityAlerts"));
    assert.equal(values.length, 2);
  });

  it("authed literals match Authed in app-state.slint", () => {
    const values = authedAuthLiterals as readonly string[];
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

  it("view literals match View in app-state.slint", () => {
    const values = appStateViewLiterals as readonly string[];
    assert.ok(values.includes("dashboard"));
    assert.ok(values.includes("settings"));
    assert.ok(values.includes("timeReporting"));
    assert.equal(values.length, 3);
  });
});

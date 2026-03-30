import * as slint from "slint-ui";
import type { MainWindowInstance, SlintTimeReportingWeekRow } from "../slint-interface.ts";
import {
  buildFilteredProjectsModel,
  findSlintUiOpenProjectRowByNodeId,
} from "../gh/slint-ui-org-projects-ui.ts";
import { fetchAllProjectV2ItemsGraphql } from "../gh/graphql-project-v2-items-all.ts";
import { refreshSlintUiOrgProjectsForWindow } from "../ui/app-window-bridge.ts";
import { dumpTimeReportingProjectNodeToDebugJson } from "./dump-time-reporting-project-debug.ts";
import { buildTimeReportingWeekRows } from "./build-time-reporting-week-rows.ts";
import { formatTimeReportingCellDetail } from "./format-time-reporting-cell-detail.ts";
import {
  addIsoWeeks,
  currentIsoWeekUtc,
  formatIsoWeekLabel,
  weekdayDatesMondayToFriday,
} from "./iso-week.ts";
import { TIME_LOG_FIELD_NAME } from "./parse-time-log.ts";
import { TIME_SPENT_FIELD_NAME } from "./project-v2-item-hours.ts";
import {
  getTimeReportingCachedItems,
  getTimeReportingCachedProjectNodeId,
  getTimeReportingCellDetailsByKey,
  getTimeReportingWeekRowOrder,
  setTimeReportingCachedItems,
  getTimeReportingSelectedWeek,
  setTimeReportingSelectedWeek,
  setTimeReportingWeekRowOrder,
} from "./time-reporting-items-cache.ts";
import {
  readTimeReportingSelectedProjectKv,
  TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
  writeTimeReportingSelectedProjectKv,
} from "./time-reporting-selected-project-kv.ts";
/** Week navigation / grid refresh traces. Disable: `TIME_REPORTING_DEBUG_WEEK_NAV=false pnpm start`. */
const weekNavLog =
  typeof process !== "undefined" && process.env.TIME_REPORTING_DEBUG_WEEK_NAV !== "false";

/** `YYYY-MM-DD` → `MM-DD` for compact column headers. */
function ymdToMmDd(ymd: string): string {
  return ymd.length >= 10 ? ymd.slice(5, 10) : "";
}

function clearWeekGridColumnHeaders(window: MainWindowInstance): void {
  window.TimeReportingState.week_hdr_mo = "";
  window.TimeReportingState.week_hdr_tu = "";
  window.TimeReportingState.week_hdr_we = "";
  window.TimeReportingState.week_hdr_th = "";
  window.TimeReportingState.week_hdr_fr = "";
}

function setWeekGridColumnHeaders(window: MainWindowInstance, weekDates: string[]): void {
  window.TimeReportingState.week_hdr_mo = ymdToMmDd(weekDates[0] ?? "");
  window.TimeReportingState.week_hdr_tu = ymdToMmDd(weekDates[1] ?? "");
  window.TimeReportingState.week_hdr_we = ymdToMmDd(weekDates[2] ?? "");
  window.TimeReportingState.week_hdr_th = ymdToMmDd(weekDates[3] ?? "");
  window.TimeReportingState.week_hdr_fr = ymdToMmDd(weekDates[4] ?? "");
}

function closeTimeReportingPicker(window: MainWindowInstance): void {
  window.TimeReportingState.picker_open = false;
  window.TimeReportingState.picker_allow_cancel = false;
}

function closeTimeReportingDetail(window: MainWindowInstance): void {
  window.TimeReportingState.detail_open = false;
}

function findCachedProjectItemById(items: unknown[], id: string): unknown | null {
  for (const it of items) {
    if (it !== null && typeof it === "object" && (it as Record<string, unknown>).id === id) {
      return it;
    }
  }
  return null;
}

function applyWeekRowsToWindow(window: MainWindowInstance): void {
  const items = getTimeReportingCachedItems();
  const nodeId = getTimeReportingCachedProjectNodeId();
  if (items === null || nodeId === null) {
    if (weekNavLog) {
      console.log("[time-reporting:week] applyWeekRowsToWindow early exit (no cache)", {
        itemsNull: items === null,
        nodeIdNull: nodeId === null,
      });
    }
    setTimeReportingWeekRowOrder([]);
    window.TimeReportingState.week_rows_model = new slint.ArrayModel<SlintTimeReportingWeekRow>([]);
    window.TimeReportingState.week_label = "";
    window.TimeReportingState.week_range_subtitle = "";
    clearWeekGridColumnHeaders(window);
    window.TimeReportingState.week_grid_hint = "";
    return;
  }
  const week = getTimeReportingSelectedWeek();
  const weekDates = weekdayDatesMondayToFriday(week.isoYear, week.isoWeek);
  const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(items, {
    timeSpentFieldName: TIME_SPENT_FIELD_NAME,
    timeLogFieldName: TIME_LOG_FIELD_NAME,
    targetWeek: week,
  });
  setTimeReportingCachedItems(nodeId, items, cellDetailsByKey);
  setTimeReportingWeekRowOrder(rows.map((r) => r.item_id));
  window.TimeReportingState.week_label = formatIsoWeekLabel(week.isoYear, week.isoWeek);
  window.TimeReportingState.week_range_subtitle =
    weekDates.length >= 5 ? `${weekDates[0]} – ${weekDates[4]}` : "";
  setWeekGridColumnHeaders(window, weekDates);
  if (rows.length === 0 && window.TimeReportingState.items_load_status === "") {
    window.TimeReportingState.week_grid_hint =
      items.length === 0
        ? "No items on this board."
        : "No time logged for this week (Time Log field, Mon–Fri of the selected ISO week).";
  } else {
    window.TimeReportingState.week_grid_hint = "";
  }
  const weekKey = formatIsoWeekLabel(week.isoYear, week.isoWeek);
  const slintRows = rows.map(
    (r): SlintTimeReportingWeekRow => ({
      item_id: r.item_id,
      grid_week_key: weekKey,
      title: r.title,
      url: r.url,
      mon: r.mon,
      tue: r.tue,
      wed: r.wed,
      thu: r.thu,
      fri: r.fri,
      total: r.total,
    }),
  );
  if (weekNavLog) {
    const first = rows[0];
    console.log("[time-reporting:week] applyWeekRowsToWindow", {
      targetWeek: { isoYear: week.isoYear, isoWeek: week.isoWeek },
      weekDates,
      itemsCount: items.length,
      builtRowCount: rows.length,
      cellDetailKeys: cellDetailsByKey.size,
      weekLabelAssigned: formatIsoWeekLabel(week.isoYear, week.isoWeek),
      firstRow: first
        ? {
            title: first.title,
            mon: first.mon,
            tue: first.tue,
            wed: first.wed,
            thu: first.thu,
            fri: first.fri,
            total: first.total,
          }
        : null,
    });
  }
  window.TimeReportingState.week_rows_model = new slint.ArrayModel<SlintTimeReportingWeekRow>(
    slintRows,
  );
}

async function loadProjectItemsIntoUi(window: MainWindowInstance, nodeId: string): Promise<void> {
  closeTimeReportingDetail(window);
  window.TimeReportingState.items_load_status = "Loading board items…";
  const res = await fetchAllProjectV2ItemsGraphql(nodeId);
  if (!res.ok) {
    window.TimeReportingState.items_load_status = res.error;
    window.TimeReportingState.week_rows_model = new slint.ArrayModel<SlintTimeReportingWeekRow>([]);
    window.TimeReportingState.week_label = "";
    window.TimeReportingState.week_range_subtitle = "";
    clearWeekGridColumnHeaders(window);
    window.TimeReportingState.week_grid_hint = "";
    setTimeReportingWeekRowOrder([]);
    return;
  }
  setTimeReportingSelectedWeek(currentIsoWeekUtc());
  setTimeReportingCachedItems(nodeId, res.items, new Map());
  window.TimeReportingState.items_load_status = "";
  applyWeekRowsToWindow(window);
}

/** Apply `time_reporting/selected_project_v1` from SQLite to `TimeReportingState` (call on startup and when entering the view). */
export function hydrateTimeReportingFromKv(window: MainWindowInstance): void {
  const stored = readTimeReportingSelectedProjectKv();
  if (stored === null) {
    window.TimeReportingState.has_selected_project = false;
    window.TimeReportingState.selected_project_label = "";
    return;
  }
  window.TimeReportingState.has_selected_project = true;
  window.TimeReportingState.selected_project_label = stored.title;
}

function openMandatoryPicker(window: MainWindowInstance): void {
  window.TimeReportingState.picker_allow_cancel = false;
  window.TimeReportingState.picker_open = true;
}

function openOptionalPicker(window: MainWindowInstance): void {
  window.TimeReportingState.picker_allow_cancel = true;
  window.TimeReportingState.picker_open = true;
}

/** Wire `TimeReportingState` callbacks. On project pick, persists KV and writes unconditional `debug-json`. */
export function wireTimeReportingUi(window: MainWindowInstance): void {
  window.TimeReportingState.time_reporting_week_prev = () => {
    closeTimeReportingDetail(window);
    const w = getTimeReportingSelectedWeek();
    const next = addIsoWeeks(w.isoYear, w.isoWeek, -1);
    if (weekNavLog) {
      console.log("[time-reporting:week] Prev clicked", { from: w, to: next });
    }
    setTimeReportingSelectedWeek(next);
    applyWeekRowsToWindow(window);
  };

  window.TimeReportingState.time_reporting_week_next = () => {
    closeTimeReportingDetail(window);
    const w = getTimeReportingSelectedWeek();
    const next = addIsoWeeks(w.isoYear, w.isoWeek, 1);
    if (weekNavLog) {
      console.log("[time-reporting:week] Next clicked", { from: w, to: next });
    }
    setTimeReportingSelectedWeek(next);
    applyWeekRowsToWindow(window);
  };

  window.TimeReportingState.time_reporting_week_this = () => {
    closeTimeReportingDetail(window);
    const now = currentIsoWeekUtc();
    if (weekNavLog) {
      console.log("[time-reporting:week] This week clicked", {
        was: getTimeReportingSelectedWeek(),
        now,
      });
    }
    setTimeReportingSelectedWeek(now);
    applyWeekRowsToWindow(window);
  };

  window.TimeReportingState.time_reporting_refresh = () => {
    const id = getTimeReportingCachedProjectNodeId();
    if (id !== null) {
      void loadProjectItemsIntoUi(window, id);
    }
  };

  window.TimeReportingState.time_reporting_detail_close = () => {
    closeTimeReportingDetail(window);
  };

  window.TimeReportingState.time_reporting_time_cell_clicked = (rowIndex, dayIndex) => {
    const order = getTimeReportingWeekRowOrder();
    const cached = getTimeReportingCachedItems();
    const w = getTimeReportingSelectedWeek();
    if (cached === null || rowIndex < 0 || rowIndex >= order.length) {
      return;
    }
    const itemId = order[rowIndex];
    if (itemId === undefined) {
      return;
    }
    const item = findCachedProjectItemById(cached, itemId);
    if (item === null) {
      return;
    }
    const weekDates = weekdayDatesMondayToFriday(w.isoYear, w.isoWeek);
    const { title, body } = formatTimeReportingCellDetail({
      item,
      itemId,
      dayIndex,
      weekDates,
      detailsMap: getTimeReportingCellDetailsByKey(),
    });
    window.TimeReportingState.detail_title = title;
    window.TimeReportingState.detail_body = body;
    window.TimeReportingState.detail_open = true;
  };

  window.TimeReportingState.time_reporting_view_init = () => {
    void (async () => {
      hydrateTimeReportingFromKv(window);
      await refreshSlintUiOrgProjectsForWindow(window);
      if (!window.TimeReportingState.has_selected_project) {
        openMandatoryPicker(window);
      } else {
        const stored = readTimeReportingSelectedProjectKv();
        if (stored !== null) {
          await loadProjectItemsIntoUi(window, stored.nodeId);
        }
      }
    })();
  };

  window.TimeReportingState.time_reporting_view_exited = () => {
    closeTimeReportingDetail(window);
    closeTimeReportingPicker(window);
  };

  window.TimeReportingState.time_reporting_picker_cancel = () => {
    if (!window.TimeReportingState.picker_allow_cancel) {
      return;
    }
    closeTimeReportingPicker(window);
  };

  window.TimeReportingState.time_reporting_open_change_project = () => {
    closeTimeReportingDetail(window);
    window.AppState.projects_search = "";
    window.AppState.projects_filtered_model = buildFilteredProjectsModel("");
    openOptionalPicker(window);
    void refreshSlintUiOrgProjectsForWindow(window);
  };

  window.TimeReportingState.time_reporting_project_chosen = (id: string) => {
    void (async () => {
      let row = findSlintUiOpenProjectRowByNodeId(id);
      if (row === null) {
        await refreshSlintUiOrgProjectsForWindow(window);
        row = findSlintUiOpenProjectRowByNodeId(id);
      }
      if (row === null) {
        console.error("[time-reporting] Unknown project id after refresh:", id);
        return;
      }
      closeTimeReportingDetail(window);
      writeTimeReportingSelectedProjectKv({
        schemaVersion: TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
        nodeId: row.id,
        number: row.number,
        title: row.title,
        url: row.url,
      });
      window.TimeReportingState.has_selected_project = true;
      window.TimeReportingState.selected_project_label = row.title;
      closeTimeReportingPicker(window);
      await dumpTimeReportingProjectNodeToDebugJson(row.id);
      await loadProjectItemsIntoUi(window, row.id);
    })();
  };
}

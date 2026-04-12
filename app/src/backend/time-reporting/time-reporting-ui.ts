import * as slint from "slint-ui";
import { assignProperties, type ExhaustiveAllCallbacks } from "slint-bridge-kit";
import type {
  MainWindowInstance,
  SlintDataTableRow,
  SlintProjectBoardListRow,
  SlintTimeReportingWeekRow,
  TimeReportingStateHandle,
} from "../../bridges/node/slint-interface.ts";
import {
  applyProjectBoardListToWindow,
  clearProjectBoardPagingCache,
} from "../project-board/apply-project-board-list-to-window.ts";
import { hydrateProjectBoardListLabelsFromKv } from "../project-board/hydrate-project-board-list-from-kv.ts";
import {
  applyProjectPickerSliceToWindow,
  findSlintUiOpenProjectRowByNodeId,
} from "../gh/slint-ui-org-projects-ui.ts";
import { fetchAllProjectV2ItemsGraphql } from "../gh/graphql-project-v2-items-all.ts";
import { openUrlInBrowser } from "../utils/open-url.ts";
import { refreshSlintUiOrgProjectsForWindow } from "../../bridges/node/slint-window-bridge.ts";
import { dumpTimeReportingProjectNodeToDebugJson } from "./dump-time-reporting-project-debug.ts";
import { buildTimeReportingWeekRows } from "./build-time-reporting-week-rows.ts";
import { formatTimeReportingCellDetail } from "./format-time-reporting-cell-detail.ts";
import {
  addIsoWeeks,
  currentIsoWeekUtc,
  formatIsoWeekLabel,
  weekdayDatesMondayToFriday,
} from "./iso-week.ts";
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

/** `YYYY-MM-DD` → `MM-DD` for compact column headers. */
function ymdToMmDd(ymd: string): string {
  return ymd.length >= 10 ? ymd.slice(5, 10) : "";
}

function clearWeekGridColumnHeaders(window: MainWindowInstance): void {
  assignProperties(window.TimeReportingState, {
    week_hdr_mo: "",
    week_hdr_tu: "",
    week_hdr_we: "",
    week_hdr_th: "",
    week_hdr_fr: "",
  });
}

function setWeekGridColumnHeaders(window: MainWindowInstance, weekDates: string[]): void {
  assignProperties(window.TimeReportingState, {
    week_hdr_mo: ymdToMmDd(weekDates[0] ?? ""),
    week_hdr_tu: ymdToMmDd(weekDates[1] ?? ""),
    week_hdr_we: ymdToMmDd(weekDates[2] ?? ""),
    week_hdr_th: ymdToMmDd(weekDates[3] ?? ""),
    week_hdr_fr: ymdToMmDd(weekDates[4] ?? ""),
  });
}

function closeTimeReportingPicker(window: MainWindowInstance): void {
  assignProperties(window.TimeReportingState, {
    picker_open: false,
    picker_allow_cancel: false,
  });
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
    setTimeReportingWeekRowOrder([]);
    assignProperties(window.TimeReportingState, {
      week_rows_model: new slint.ArrayModel<SlintTimeReportingWeekRow>([]),
      week_label: "",
      week_range_subtitle: "",
    });
    clearWeekGridColumnHeaders(window);
    window.TimeReportingState.week_grid_hint = "";
    return;
  }
  const week = getTimeReportingSelectedWeek();
  const weekDates = weekdayDatesMondayToFriday(week.isoYear, week.isoWeek);
  const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(items, { targetWeek: week });
  setTimeReportingCachedItems(nodeId, items, cellDetailsByKey);
  setTimeReportingWeekRowOrder(rows.map((r) => r.item_id));
  assignProperties(window.TimeReportingState, {
    week_label: formatIsoWeekLabel(week.isoYear, week.isoWeek),
    week_range_subtitle: weekDates.length >= 5 ? `${weekDates[0]} – ${weekDates[4]}` : "",
  });
  setWeekGridColumnHeaders(window, weekDates);
  const week_grid_hint =
    rows.length === 0 && window.TimeReportingState.items_load_status === ""
      ? items.length === 0
        ? "No items on this board."
        : "No items merged or closed in this week with BOT-Total Time Spent(h) > 0."
      : "";
  window.TimeReportingState.week_grid_hint = week_grid_hint;
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
  assignProperties(window.TimeReportingState, {
    week_rows_model: new slint.ArrayModel<SlintTimeReportingWeekRow>(slintRows),
  });
}

/**
 * One GraphQL fetch for `ProjectV2.items`, then updates in-memory cache, the time-reporting week
 * grid, and the project board list model. Debug JSON dumps stay on the existing paths (e.g. project pick).
 */
export async function reloadProjectV2ItemsIntoCacheAndUi(
  window: MainWindowInstance,
  nodeId: string,
): Promise<void> {
  closeTimeReportingDetail(window);
  window.TimeReportingState.items_load_status = "Loading board items…";
  assignProperties(window.ProjectBoardListState, {
    items_load_status: "Loading board items…",
  });
  const res = await fetchAllProjectV2ItemsGraphql(nodeId);
  if (!res.ok) {
    clearProjectBoardPagingCache();
    assignProperties(window.TimeReportingState, {
      items_load_status: res.error,
      week_rows_model: new slint.ArrayModel<SlintTimeReportingWeekRow>([]),
      week_label: "",
      week_range_subtitle: "",
    });
    clearWeekGridColumnHeaders(window);
    window.TimeReportingState.week_grid_hint = "";
    setTimeReportingWeekRowOrder([]);
    assignProperties(window.ProjectBoardListState, {
      items_load_status: res.error,
      board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
      board_data_table_rows: new slint.ArrayModel<SlintDataTableRow>([]),
      board_items_count: 0,
      board_page_index: 0,
    });
    return;
  }
  setTimeReportingSelectedWeek(currentIsoWeekUtc());
  setTimeReportingCachedItems(nodeId, res.items, new Map());
  window.TimeReportingState.items_load_status = "";
  applyWeekRowsToWindow(window);
  applyProjectBoardListToWindow(window);
  const stored = readTimeReportingSelectedProjectKv();
  if (stored !== null && stored.nodeId === nodeId) {
    assignProperties(window.ProjectBoardListState, {
      items_load_status: "",
      has_selected_project: true,
      selected_project_label: stored.title,
    });
  } else {
    assignProperties(window.ProjectBoardListState, {
      items_load_status: "",
    });
  }
}

/** Apply `time_reporting/selected_project_v1` from SQLite to `TimeReportingState` (call on startup and when entering the view). */
export function hydrateTimeReportingFromKv(window: MainWindowInstance): void {
  const stored = readTimeReportingSelectedProjectKv();
  if (stored === null) {
    assignProperties(window.TimeReportingState, {
      has_selected_project: false,
      selected_project_label: "",
    });
    return;
  }
  assignProperties(window.TimeReportingState, {
    has_selected_project: true,
    selected_project_label: stored.title,
  });
}

function openMandatoryPicker(window: MainWindowInstance): void {
  assignProperties(window.TimeReportingState, {
    picker_allow_cancel: false,
    picker_open: true,
  });
}

function openOptionalPicker(window: MainWindowInstance): void {
  assignProperties(window.TimeReportingState, {
    picker_allow_cancel: true,
    picker_open: true,
  });
}

/**
 * All `TimeReportingState` callbacks for `wireFunctions(window.TimeReportingState, …)`.
 * On project pick, persists KV and writes unconditional `debug-json`.
 */
export function buildTimeReportingStateCallbacks(
  window: MainWindowInstance,
): ExhaustiveAllCallbacks<TimeReportingStateHandle> {
  return {
    time_reporting_week_prev: () => {
      closeTimeReportingDetail(window);
      const w = getTimeReportingSelectedWeek();
      const next = addIsoWeeks(w.isoYear, w.isoWeek, -1);
      setTimeReportingSelectedWeek(next);
      applyWeekRowsToWindow(window);
    },

    time_reporting_week_next: () => {
      closeTimeReportingDetail(window);
      const w = getTimeReportingSelectedWeek();
      const next = addIsoWeeks(w.isoYear, w.isoWeek, 1);
      setTimeReportingSelectedWeek(next);
      applyWeekRowsToWindow(window);
    },

    time_reporting_week_this: () => {
      closeTimeReportingDetail(window);
      const now = currentIsoWeekUtc();
      setTimeReportingSelectedWeek(now);
      applyWeekRowsToWindow(window);
    },

    time_reporting_refresh: () => {
      const id = getTimeReportingCachedProjectNodeId();
      if (id !== null) {
        void reloadProjectV2ItemsIntoCacheAndUi(window, id);
      }
    },

    time_reporting_detail_close: () => {
      closeTimeReportingDetail(window);
    },

    time_reporting_time_cell_clicked: (rowIndex, dayIndex) => {
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
      assignProperties(window.TimeReportingState, {
        detail_title: title,
        detail_body: body,
        detail_open: true,
      });
    },

    time_reporting_open_row_url: (url: string) => {
      if (url.length > 0) {
        openUrlInBrowser(url);
      }
    },

    time_reporting_view_init: () => {
      void (async () => {
        hydrateTimeReportingFromKv(window);
        hydrateProjectBoardListLabelsFromKv(window);
        await refreshSlintUiOrgProjectsForWindow(window);
        if (!window.TimeReportingState.has_selected_project) {
          openMandatoryPicker(window);
        } else {
          const stored = readTimeReportingSelectedProjectKv();
          if (stored !== null) {
            await reloadProjectV2ItemsIntoCacheAndUi(window, stored.nodeId);
          }
        }
      })();
    },

    time_reporting_view_exited: () => {
      closeTimeReportingDetail(window);
      closeTimeReportingPicker(window);
    },

    time_reporting_picker_cancel: () => {
      if (!window.TimeReportingState.picker_allow_cancel) {
        return;
      }
      closeTimeReportingPicker(window);
    },

    time_reporting_open_change_project: () => {
      closeTimeReportingDetail(window);
      assignProperties(window.AppState, {
        projects_search: "",
      });
      applyProjectPickerSliceToWindow(window, 0);
      openOptionalPicker(window);
      void refreshSlintUiOrgProjectsForWindow(window);
    },

    time_reporting_project_chosen: (id: string) => {
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
        assignProperties(window.TimeReportingState, {
          has_selected_project: true,
          selected_project_label: row.title,
        });
        assignProperties(window.ProjectBoardListState, {
          has_selected_project: true,
          selected_project_label: row.title,
        });
        closeTimeReportingPicker(window);
        await dumpTimeReportingProjectNodeToDebugJson(row.id);
        await reloadProjectV2ItemsIntoCacheAndUi(window, row.id);
      })();
    },
  };
}

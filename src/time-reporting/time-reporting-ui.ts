import type { MainWindowInstance, SlintTimeReportingWeekRow } from "../slint-interface.ts";
import * as slint from "slint-ui";
import {
  buildFilteredProjectsModel,
  findSlintUiOpenProjectRowByNodeId,
} from "../gh/slint-ui-org-projects-ui.ts";
import { fetchAllProjectV2ItemsGraphql } from "../gh/graphql-project-v2-items-all.ts";
import { refreshSlintUiOrgProjectsForWindow } from "../ui/app-window-bridge.ts";
import { dumpTimeReportingProjectNodeToDebugJson } from "./dump-time-reporting-project-debug.ts";
import { buildTimeReportingWeekRows } from "./build-time-reporting-week-rows.ts";
import { addIsoWeeks, currentIsoWeekUtc, formatIsoWeekLabel } from "./iso-week.ts";
import { TIME_SPENT_FIELD_NAME } from "./project-v2-item-hours.ts";
import {
  getTimeReportingCachedItems,
  getTimeReportingCachedProjectNodeId,
  setTimeReportingCachedItems,
  getTimeReportingSelectedWeek,
  setTimeReportingSelectedWeek,
} from "./time-reporting-items-cache.ts";
import {
  readTimeReportingSelectedProjectKv,
  TIME_REPORTING_SELECTED_PROJECT_SCHEMA_VERSION,
  writeTimeReportingSelectedProjectKv,
} from "./time-reporting-selected-project-kv.ts";

function closeTimeReportingPicker(window: MainWindowInstance): void {
  window.TimeReportingState.picker_open = false;
  window.TimeReportingState.picker_allow_cancel = false;
}

function applyWeekRowsToWindow(window: MainWindowInstance): void {
  const items = getTimeReportingCachedItems();
  const nodeId = getTimeReportingCachedProjectNodeId();
  if (items === null || nodeId === null) {
    window.TimeReportingState.week_rows_model = new slint.ArrayModel<SlintTimeReportingWeekRow>([]);
    window.TimeReportingState.week_label = "";
    return;
  }
  const week = getTimeReportingSelectedWeek();
  const { rows, cellDetailsByKey } = buildTimeReportingWeekRows(items, {
    timeSpentFieldName: TIME_SPENT_FIELD_NAME,
    targetWeek: week,
  });
  setTimeReportingCachedItems(nodeId, items, cellDetailsByKey);
  window.TimeReportingState.week_label = formatIsoWeekLabel(week.isoYear, week.isoWeek);
  window.TimeReportingState.week_rows_model = new slint.ArrayModel<SlintTimeReportingWeekRow>(
    rows.map(
      (r): SlintTimeReportingWeekRow => ({
        item_id: r.item_id,
        title: r.title,
        url: r.url,
        mon: r.mon,
        tue: r.tue,
        wed: r.wed,
        thu: r.thu,
        fri: r.fri,
        total: r.total,
      }),
    ),
  );
}

async function loadProjectItemsIntoUi(window: MainWindowInstance, nodeId: string): Promise<void> {
  window.TimeReportingState.items_load_status = "Loading board items…";
  const res = await fetchAllProjectV2ItemsGraphql(nodeId);
  if (!res.ok) {
    window.TimeReportingState.items_load_status = res.error;
    window.TimeReportingState.week_rows_model = new slint.ArrayModel<SlintTimeReportingWeekRow>([]);
    window.TimeReportingState.week_label = "";
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
    const w = getTimeReportingSelectedWeek();
    setTimeReportingSelectedWeek(addIsoWeeks(w.isoYear, w.isoWeek, -1));
    applyWeekRowsToWindow(window);
  };

  window.TimeReportingState.time_reporting_week_next = () => {
    const w = getTimeReportingSelectedWeek();
    setTimeReportingSelectedWeek(addIsoWeeks(w.isoYear, w.isoWeek, 1));
    applyWeekRowsToWindow(window);
  };

  window.TimeReportingState.time_reporting_week_this = () => {
    setTimeReportingSelectedWeek(currentIsoWeekUtc());
    applyWeekRowsToWindow(window);
  };

  window.TimeReportingState.time_reporting_refresh = () => {
    const id = getTimeReportingCachedProjectNodeId();
    if (id !== null) {
      void loadProjectItemsIntoUi(window, id);
    }
  };

  window.TimeReportingState.time_reporting_time_cell_clicked = () => {};

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
    closeTimeReportingPicker(window);
  };

  window.TimeReportingState.time_reporting_picker_cancel = () => {
    if (!window.TimeReportingState.picker_allow_cancel) {
      return;
    }
    closeTimeReportingPicker(window);
  };

  window.TimeReportingState.time_reporting_open_change_project = () => {
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

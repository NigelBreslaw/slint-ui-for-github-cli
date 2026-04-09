import { assignProperties } from "slint-bridge-kit";
import type { MainWindowInstance } from "../../bridges/node/slint-interface.ts";
import { readTimeReportingSelectedProjectKv } from "../time-reporting/time-reporting-selected-project-kv.ts";

/** Mirror `time_reporting/selected_project_v1` into `ProjectBoardListState` labels (no fetch). */
export function hydrateProjectBoardListLabelsFromKv(window: MainWindowInstance): void {
  const stored = readTimeReportingSelectedProjectKv();
  if (stored === null) {
    assignProperties(window.ProjectBoardListState, {
      has_selected_project: false,
      selected_project_label: "",
    });
    return;
  }
  assignProperties(window.ProjectBoardListState, {
    has_selected_project: true,
    selected_project_label: stored.title,
  });
}

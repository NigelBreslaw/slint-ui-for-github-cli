import * as slint from "slint-ui";
import { assignProperties, type ExhaustiveAllCallbacks } from "slint-bridge-kit";
import type {
  MainWindowInstance,
  ProjectBoardListStateHandle,
  SlintProjectBoardListRow,
} from "../../bridges/node/slint-interface.ts";
import { openUrlInBrowser } from "../utils/open-url.ts";
import { reloadProjectV2ItemsIntoCacheAndUi } from "../time-reporting/time-reporting-ui.ts";
import { applyProjectBoardListToWindow } from "./apply-project-board-list-to-window.ts";
import {
  getTimeReportingCachedItems,
  getTimeReportingCachedProjectNodeId,
} from "../time-reporting/time-reporting-items-cache.ts";
import { readTimeReportingSelectedProjectKv } from "../time-reporting/time-reporting-selected-project-kv.ts";

export function buildProjectBoardListStateCallbacks(
  window: MainWindowInstance,
): ExhaustiveAllCallbacks<ProjectBoardListStateHandle> {
  return {
    project_board_list_view_init: () => {
      void (async () => {
        const stored = readTimeReportingSelectedProjectKv();
        if (stored === null) {
          assignProperties(window.ProjectBoardListState, {
            has_selected_project: false,
            selected_project_label: "",
            items_load_status: "",
            board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
            board_items_count: 0,
          });
          return;
        }
        assignProperties(window.ProjectBoardListState, {
          has_selected_project: true,
          selected_project_label: stored.title,
        });
        const cachedId = getTimeReportingCachedProjectNodeId();
        const items = getTimeReportingCachedItems();
        if (cachedId === stored.nodeId && items !== null) {
          assignProperties(window.ProjectBoardListState, { items_load_status: "" });
          applyProjectBoardListToWindow(window);
          return;
        }
        await reloadProjectV2ItemsIntoCacheAndUi(window, stored.nodeId);
      })();
    },

    project_board_list_view_exited: () => {
      assignProperties(window.ProjectBoardListState, { items_load_status: "" });
    },

    project_board_list_refresh: () => {
      const stored = readTimeReportingSelectedProjectKv();
      if (stored === null) {
        return;
      }
      void reloadProjectV2ItemsIntoCacheAndUi(window, stored.nodeId);
    },

    project_board_list_open_row_url: (url: string) => {
      if (url.length > 0) {
        openUrlInBrowser(url);
      }
    },
  };
}

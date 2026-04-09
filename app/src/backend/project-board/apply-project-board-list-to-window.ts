import * as slint from "slint-ui";
import { assignProperties } from "slint-bridge-kit";
import type {
  MainWindowInstance,
  SlintProjectBoardListRow,
} from "../../bridges/node/slint-interface.ts";
import { getTimeReportingCachedItems } from "../time-reporting/time-reporting-items-cache.ts";
import { mapProjectV2ItemsToListRows } from "./map-project-v2-items-to-list-rows.ts";

/** Fills `ProjectBoardListState.board_rows_model` from the time-reporting items cache (full board, not week-filtered). */
export function applyProjectBoardListToWindow(window: MainWindowInstance): void {
  const items = getTimeReportingCachedItems();
  if (items === null) {
    assignProperties(window.ProjectBoardListState, {
      board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>([]),
      board_items_count: 0,
    });
    return;
  }
  const rows = mapProjectV2ItemsToListRows(items);
  assignProperties(window.ProjectBoardListState, {
    board_rows_model: new slint.ArrayModel<SlintProjectBoardListRow>(rows),
    board_items_count: rows.length,
  });
}

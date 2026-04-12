import {
  dataTableCellKind,
  dataTableIconTint,
  labelSize,
  labelVariant,
  projectBoardItemKind,
  type DataTableCellKindWire,
  type DataTableIconTintWire,
  type ProjectBoardItemKind,
  type SlintDataTableCell,
  type SlintDataTableRow,
} from "../../bridges/node/slint-interface.ts";
import type { ImageData } from "slint-ui";
import type { ProjectBoardDataTableIcons } from "./project-board-datatable-icons.ts";

/** Matches `ProjectBoardListRow` / `mapProjectV2ItemsToListRows` row shape. */
type ProjectBoardListRowTs = {
  kind: ProjectBoardItemKind;
  state: string;
  number: number;
  title: string;
  subtitle: string;
  url: string;
};

function kindLabel(kind: ProjectBoardItemKind): string {
  if (kind === projectBoardItemKind.pullRequest) {
    return "Pull request";
  }
  if (kind === projectBoardItemKind.issue) {
    return "Issue";
  }
  return "Draft";
}

function kindIcon(icons: ProjectBoardDataTableIcons, kind: ProjectBoardItemKind): ImageData {
  if (kind === projectBoardItemKind.pullRequest) {
    return icons.pullRequest;
  }
  if (kind === projectBoardItemKind.issue) {
    return icons.issue;
  }
  return icons.draftIssue;
}

function iconTintForRow(row: ProjectBoardListRowTs): DataTableIconTintWire {
  if (row.kind === projectBoardItemKind.draftIssue) {
    return dataTableIconTint.default;
  }
  const s = row.state.toUpperCase();
  if (s === "OPEN") {
    return dataTableIconTint.success;
  }
  if (s === "CLOSED" || s === "MERGED") {
    return dataTableIconTint.done;
  }
  return dataTableIconTint.default;
}

function metaText(row: ProjectBoardListRowTs): string {
  if (row.kind === projectBoardItemKind.draftIssue) {
    return "Draft";
  }
  if (row.number > 0) {
    return `#${row.number}`;
  }
  return "";
}

function dataTableCell(
  kind: DataTableCellKindWire,
  text: string,
  icon: ImageData,
  iconTint: DataTableIconTintWire = dataTableIconTint.default,
): SlintDataTableCell {
  return {
    kind,
    text,
    label_variant: labelVariant.default,
    label_size: labelSize.small,
    icon,
    icon_tint: iconTint,
  };
}

/**
 * Builds `DataTableRow` data for the project board (column order: `#`, Type, Title, Meta).
 * Row **`id`** is the issue/PR URL so `row-clicked` can open it in PR9.
 * **`rowIndexStart`** — 0-based offset for the `#` column when showing a **slice** of a larger list (paging).
 */
export function mapProjectBoardListRowsToDataTableRows(
  rows: ProjectBoardListRowTs[],
  icons: ProjectBoardDataTableIcons,
  rowIndexStart: number = 0,
): SlintDataTableRow[] {
  const out: SlintDataTableRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const ph = icons.placeholder;
    const displayIndex = rowIndexStart + i + 1;
    out.push({
      id: row.url,
      cells: [
        dataTableCell(dataTableCellKind.text, String(displayIndex), ph),
        dataTableCell(
          dataTableCellKind.iconText,
          kindLabel(row.kind),
          kindIcon(icons, row.kind),
          iconTintForRow(row),
        ),
        dataTableCell(dataTableCellKind.text, row.title, ph),
        dataTableCell(dataTableCellKind.text, metaText(row), ph),
      ],
    });
  }
  return out;
}

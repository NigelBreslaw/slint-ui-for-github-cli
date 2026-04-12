import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dataTableCellKind, projectBoardItemKind } from "../../bridges/node/slint-interface.ts";
import {
  toSlintImageData,
  type ProjectBoardDataTableIcons,
} from "./project-board-datatable-icons.ts";
import { mapProjectBoardListRowsToDataTableRows } from "./map-project-board-list-to-data-table-rows.ts";

function mockIcons(): ProjectBoardDataTableIcons {
  const p = toSlintImageData({ width: 1, height: 1, data: Buffer.alloc(4) });
  return {
    placeholder: p,
    pullRequest: p,
    issue: p,
    draftIssue: p,
  };
}

describe("mapProjectBoardListRowsToDataTableRows", () => {
  it("maps rows with four columns and uses url as id", () => {
    const rows = [
      {
        kind: projectBoardItemKind.pullRequest,
        state: "OPEN",
        number: 99,
        title: "Fix bug",
        subtitle: "",
        url: "https://github.com/o/r/pull/99",
      },
    ];
    const out = mapProjectBoardListRowsToDataTableRows(rows, mockIcons());
    assert.equal(out.length, 1);
    assert.equal(out[0]!.id, "https://github.com/o/r/pull/99");
    assert.equal(out[0]!.cells.length, 4);
    assert.equal(out[0]!.cells[0]!.kind, dataTableCellKind.text);
    assert.equal(out[0]!.cells[0]!.text, "1");
    assert.equal(out[0]!.cells[1]!.kind, dataTableCellKind.iconText);
    assert.equal(out[0]!.cells[1]!.text, "Pull request");
    assert.equal(out[0]!.cells[2]!.text, "Fix bug");
    assert.equal(out[0]!.cells[3]!.text, "#99");
  });

  it("offsets the # column when rowIndexStart is non-zero (paging)", () => {
    const rows = [
      {
        kind: projectBoardItemKind.issue,
        state: "OPEN",
        number: 1,
        title: "A",
        subtitle: "",
        url: "https://github.com/o/r/issues/1",
      },
    ];
    const out = mapProjectBoardListRowsToDataTableRows(rows, mockIcons(), 25);
    assert.equal(out[0]!.cells[0]!.text, "26");
  });

  it("uses Draft meta for draft issues", () => {
    const rows = [
      {
        kind: projectBoardItemKind.draftIssue,
        state: "",
        number: 0,
        title: "WIP",
        subtitle: "",
        url: "https://github.com/o/r/issues/1",
      },
    ];
    const out = mapProjectBoardListRowsToDataTableRows(rows, mockIcons());
    assert.equal(out[0]!.cells[3]!.text, "Draft");
  });
});

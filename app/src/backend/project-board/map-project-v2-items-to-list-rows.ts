import {
  projectBoardItemKind,
  type ProjectBoardItemKind,
} from "../../bridges/node/slint-interface.ts";
import { itemContentTitleUrl } from "../time-reporting/project-v2-item-hours.ts";

/** Matches Slint `ProjectBoardListRow` / wire `SlintProjectBoardListRow`. */
type ProjectBoardListRowTs = {
  kind: ProjectBoardItemKind;
  state: string;
  number: number;
  title: string;
  subtitle: string;
  url: string;
};

function graphqlStateString(content: Record<string, unknown>): string {
  const s = content.state;
  return typeof s === "string" ? s : "";
}

function contentIssueNumber(content: Record<string, unknown>): number {
  const n = content.number;
  if (typeof n === "number" && Number.isFinite(n)) {
    return n;
  }
  return 0;
}

function kindStateNumberFromContent(content: Record<string, unknown>): {
  kind: ProjectBoardItemKind;
  state: string;
  number: number;
} {
  const tn = content.__typename;
  if (tn === "PullRequest") {
    return {
      kind: projectBoardItemKind.pullRequest,
      state: graphqlStateString(content),
      number: contentIssueNumber(content),
    };
  }
  if (tn === "Issue") {
    return {
      kind: projectBoardItemKind.issue,
      state: graphqlStateString(content),
      number: contentIssueNumber(content),
    };
  }
  return {
    kind: projectBoardItemKind.draftIssue,
    state: "",
    number: 0,
  };
}

/** GitHub Projects single-select column often named `Status`. */
export const PROJECT_BOARD_STATUS_FIELD_NAME = "Status";

function fieldNameFromNode(node: Record<string, unknown>): string | null {
  const field = node.field;
  if (field === null || typeof field !== "object") {
    return null;
  }
  const name = (field as Record<string, unknown>).name;
  return typeof name === "string" ? name : null;
}

/**
 * Reads a `ProjectV2ItemFieldSingleSelectValue` by custom field name from `fieldValues.nodes`.
 */
export function extractProjectV2SingleSelectName(item: unknown, fieldName: string): string | null {
  if (item === null || typeof item !== "object") {
    return null;
  }
  const fv = (item as Record<string, unknown>).fieldValues;
  if (fv === null || typeof fv !== "object") {
    return null;
  }
  const nodes = (fv as Record<string, unknown>).nodes;
  if (!Array.isArray(nodes)) {
    return null;
  }
  for (const n of nodes) {
    if (n === null || typeof n !== "object") {
      continue;
    }
    const rec = n as Record<string, unknown>;
    if (rec.__typename !== "ProjectV2ItemFieldSingleSelectValue") {
      continue;
    }
    if (fieldNameFromNode(rec) !== fieldName) {
      continue;
    }
    const optName = rec.name;
    if (typeof optName === "string" && optName.length > 0) {
      return optName;
    }
  }
  return null;
}

/**
 * Maps raw `ProjectV2.items` nodes (GraphQL shape from
 * [`graphql-project-v2-items-all.ts`](../gh/graphql-project-v2-items-all.ts)) to UI rows.
 * Preserves input order; skips items without a usable Issue / PullRequest / DraftIssue title.
 */
export function mapProjectV2ItemsToListRows(items: unknown[]): ProjectBoardListRowTs[] {
  const rows: ProjectBoardListRowTs[] = [];
  for (const item of items) {
    const meta = itemContentTitleUrl(item);
    if (meta === null) {
      continue;
    }
    if (item === null || typeof item !== "object") {
      continue;
    }
    const content = (item as Record<string, unknown>).content;
    if (content === null || typeof content !== "object") {
      continue;
    }
    const c = content as Record<string, unknown>;
    const { kind, state, number } = kindStateNumberFromContent(c);
    rows.push({
      kind,
      state,
      number,
      title: meta.title,
      url: meta.url,
      subtitle: "",
    });
  }
  return rows;
}

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

function collectAssigneeLogins(content: Record<string, unknown>): string[] {
  const assignees = content.assignees;
  if (assignees === null || typeof assignees !== "object") {
    return [];
  }
  const nodes = (assignees as Record<string, unknown>).nodes;
  if (!Array.isArray(nodes)) {
    return [];
  }
  const out: string[] = [];
  for (const n of nodes) {
    if (n === null || typeof n !== "object") {
      continue;
    }
    const login = (n as Record<string, unknown>).login;
    if (typeof login === "string" && login.length > 0) {
      out.push(login);
    }
  }
  return out;
}

function formatAssigneeSegment(logins: string[]): string | null {
  if (logins.length === 0) {
    return null;
  }
  if (logins.length <= 2) {
    return logins.join(", ");
  }
  return `${logins[0]}, ${logins[1]} +${logins.length - 2}`;
}

function repositoryLabel(content: Record<string, unknown>): string | null {
  const repo = content.repository;
  if (repo === null || typeof repo !== "object") {
    return null;
  }
  const nwo = (repo as Record<string, unknown>).nameWithOwner;
  return typeof nwo === "string" && nwo.length > 0 ? nwo : null;
}

function buildSubtitle(content: Record<string, unknown>, projectStatus: string | null): string {
  const tn = content.__typename;
  const logins = collectAssigneeLogins(content);
  const assigneeSeg = formatAssigneeSegment(logins);

  const parts: string[] = [];

  if (tn === "PullRequest" || tn === "Issue") {
    const nwo = repositoryLabel(content);
    const num = content.number;
    if (typeof num === "number" && Number.isFinite(num) && nwo !== null) {
      parts.push(`${nwo}#${num}`);
    }
    const state = content.state;
    const stateStr = typeof state === "string" && state.length > 0 ? state : "";
    if (tn === "PullRequest") {
      parts.push(stateStr.length > 0 ? `Pull request · ${stateStr}` : "Pull request");
    } else {
      parts.push(stateStr.length > 0 ? `Issue · ${stateStr}` : "Issue");
    }
  } else if (tn === "DraftIssue") {
    parts.push("Draft");
  }

  if (assigneeSeg !== null) {
    parts.push(assigneeSeg);
  }
  if (projectStatus !== null) {
    parts.push(projectStatus);
  }

  return parts.join(" · ");
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
    const status = extractProjectV2SingleSelectName(item, PROJECT_BOARD_STATUS_FIELD_NAME);
    const { kind, state, number } = kindStateNumberFromContent(c);
    rows.push({
      kind,
      state,
      number,
      title: meta.title,
      url: meta.url,
      subtitle: buildSubtitle(c, status),
    });
  }
  return rows;
}

import {
  cellDetailKey,
  type TimeReportingCellContribution,
} from "./build-time-reporting-week-rows.ts";

const WEEKDAY_TITLES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

function formatMinutesLabel(minutes: number): string {
  if (minutes === 0) {
    return "0h";
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) {
    return `${h}h`;
  }
  if (h === 0) {
    return `${m}m`;
  }
  return `${h}h ${m}m`;
}

function contentMeta(item: unknown): { label: string; title: string; url: string } {
  if (item === null || typeof item !== "object") {
    return { label: "Item", title: "(unknown)", url: "" };
  }
  const content = (item as Record<string, unknown>).content;
  if (content === null || typeof content !== "object") {
    return { label: "Item", title: "(no content)", url: "" };
  }
  const c = content as Record<string, unknown>;
  const tn = c.__typename;
  let label = "Item";
  if (tn === "PullRequest") {
    label = "Pull request";
  } else if (tn === "Issue") {
    label = "Issue";
  } else if (tn === "DraftIssue") {
    label = "Draft issue";
  }
  const title = typeof c.title === "string" && c.title.length > 0 ? c.title : "(untitled)";
  const url = typeof c.url === "string" ? c.url : "";
  return { label, title, url };
}

type TimeReportingCellDetailArgs = {
  item: unknown;
  itemId: string;
  dayIndex: number;
  /** Monday–Friday `YYYY-MM-DD` for the selected ISO week. */
  weekDates: string[];
  detailsMap: Map<string, TimeReportingCellContribution[]>;
};

/**
 * Builds modal title and multi-line body for the time-reporting cell drill-down.
 */
export function formatTimeReportingCellDetail(args: TimeReportingCellDetailArgs): {
  title: string;
  body: string;
} {
  const { item, itemId, dayIndex, weekDates, detailsMap } = args;
  const meta = contentMeta(item);
  const headerLines = [`${meta.label}: ${meta.title}`];
  if (meta.url.length > 0) {
    headerLines.push(meta.url);
  }
  const header = headerLines.join("\n");

  if (dayIndex === 5) {
    const title = "Time — Total";
    let sum = 0;
    const bulletLines: string[] = [];
    for (const ymd of weekDates) {
      const contribs = detailsMap.get(cellDetailKey(itemId, ymd)) ?? [];
      for (const c of contribs) {
        sum += c.minutes;
        const dur = formatMinutesLabel(c.minutes);
        const snippet =
          c.rawLine !== undefined && c.rawLine.length > 0 ? c.rawLine : "(no line text)";
        bulletLines.push(`• ${dur} — ${ymd}: ${snippet}`);
      }
    }
    if (sum === 0) {
      return {
        title,
        body: `${header}\n\nNo BOT-Total Time Spent(h) for this card in the selected week.`,
      };
    }
    return {
      title,
      body: `${header}\n\nWeek total (BOT-Total Time Spent(h)): ${formatMinutesLabel(sum)} (${sum} minutes).\n${bulletLines.join("\n")}`,
    };
  }

  const ymd = weekDates[dayIndex];
  const dayTitle = WEEKDAY_TITLES[dayIndex] ?? "Weekday";
  const modalTitle = ymd !== undefined ? `Time — ${dayTitle} ${ymd}` : `Time — ${dayTitle}`;

  const key = ymd !== undefined ? cellDetailKey(itemId, ymd) : "";
  const contribs = key.length > 0 ? (detailsMap.get(key) ?? []) : [];

  if (contribs.length > 0) {
    const lines = contribs.map((c) => {
      const dur = formatMinutesLabel(c.minutes);
      const snippet =
        c.rawLine !== undefined && c.rawLine.length > 0 ? c.rawLine : "(no line text)";
      return `• ${dur} — ${snippet}`;
    });
    return {
      title: modalTitle,
      body: `${header}\n\nBOT-Total Time Spent(h) for this day:\n${lines.join("\n")}`,
    };
  }

  return {
    title: modalTitle,
    body: `${header}\n\nNo BOT-Total Time Spent(h) attributed to this weekday in the selected week.`,
  };
}

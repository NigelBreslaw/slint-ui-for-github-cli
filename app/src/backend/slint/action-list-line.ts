import type { ImageData } from "slint-ui";
import type { SlintActionListLine } from "../../bridges/node/slint-interface.ts";
import { emptyTransparentAvatarImage } from "../gh/avatar-image.ts";

const transparentPlaceholder = emptyTransparentAvatarImage as ImageData;

export function actionListRowFromLabel(label: string, disabled = false): SlintActionListLine {
  return {
    kind: "row",
    label,
    row_variant: "default",
    row_size: "medium",
    disabled,
    has_leading_avatar: false,
    avatar_source: transparentPlaceholder,
    has_leading_visual: false,
    leading_icon: transparentPlaceholder,
    description: "",
    description_layout: "none",
    truncate_inline_description: false,
    trailing_text: "",
    inactive_text: "",
    show_trailing_loading: false,
    active: false,
    section_heading_variant: "subtle",
  };
}

export function actionListLinesFromLabels(
  labels: readonly string[],
  disabled = false,
): SlintActionListLine[] {
  return labels.map((label) => actionListRowFromLabel(label, disabled));
}

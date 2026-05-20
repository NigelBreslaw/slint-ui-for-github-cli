import type { ImageData } from "slint-ui";
import type { SlintActionList2Line } from "../../bridges/node/slint-interface.ts";
import { emptyTransparentAvatarImage } from "../gh/avatar-image.ts";

const transparentPlaceholder = emptyTransparentAvatarImage as ImageData;

/** Default **ActionList2** row for picker / filter lists (label-only, no leading visual). */
export function actionList2RowFromLabel(label: string, disabled = false): SlintActionList2Line {
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

export function actionList2LinesFromLabels(
  labels: readonly string[],
  disabled = false,
): SlintActionList2Line[] {
  return labels.map((label) => actionList2RowFromLabel(label, disabled));
}

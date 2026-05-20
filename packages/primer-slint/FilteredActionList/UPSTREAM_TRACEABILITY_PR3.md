# PR3 — FilteredActionList select-all (upstream traceability)

## Gallery scenario

| ix | Label | Upstream story | React / CSS |
|----|-------|----------------|-------------|
| 9 | SelectAll | **SelectPanel** `WithSelectAll` (`showSelectAll={true}`) | `FilteredActionList` select-all strip; `FilteredActionList.module.css` muted strip + `--fgColor-muted` label |

## Slint API

| Upstream | Slint |
|----------|-------|
| `showSelectAll` | `select-all-visible: true` |
| `onSelectAllChange` | `select-all-changed(bool)`; host updates visible-row selection |
| Tri-state header checkbox | `select-all-checked`, `select-all-indeterminate` (`in-out`) |
| Operates on filtered visible items | Gallery bridge syncs `multi-selected` + strip from **picked** labels only |

## Tokens

| Visual | Slint |
|--------|-------|
| Strip background `--bgColor-muted` | `PrimerColors.bgColor-muted` |
| Label `--fgColor-muted`, `--text-body-size-medium` | `PrimerColors.fgColor-muted`, `LayoutTokens.text-body-size-medium` |
| Strip padding/gap | `FilteredActionListTokens.select-all-*` |

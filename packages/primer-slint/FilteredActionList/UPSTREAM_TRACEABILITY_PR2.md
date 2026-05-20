# PR2 — FilteredActionList loading / empty / message (upstream traceability)

## Gallery scenarios

| ix | Label | Upstream | React / CSS |
|----|-------|----------|-------------|
| 4 | LoadingInput | FilteredActionList loading **input** | `FilteredActionListLoadingTypes.input`; `PrimerTextInput` loading slot |
| 5 | LoadingBodySpinner | **body-spinner**; SelectPanel **AsyncFetch** | `FilteredActionListLoaders.tsx` **LoadingSpinner**; `loading-message` |
| 6 | LoadingBodySkeleton | **body-skeleton** | `FilteredActionListLoaders.tsx` **LoadingSkeleton** + `SkeletonBox` |
| 7 | MessageVsList | Custom message replaces list | `FilteredActionList` **`message`** / **SelectPanelMessage** layout |
| 8 | EmptyBody | Filtered empty / no rows | `lines.length === 0` + **`empty-*`** / SelectPanel default empty copy pattern |

## Tokens (primer-tokens → Slint)

| CSS variable (FilteredActionList / shared) | Slint global |
|--------------------------------------------|--------------|
| `--borderColor-default` (hairline) | `PrimerColors.borderColor-default` |
| `--bgColor-canvas-subtle` (body chrome) | `PrimerColors.bgColor-canvas-subtle` |
| `--fgColor-default` / `--fgColor-muted` (message text) | `PrimerColors.fgColor-*` |
| `--text-body-size-medium` / `--text-body-size-small` | `LayoutTokens.text-body-size-*` |
| Skeleton spacing | `FilteredActionListTokens.skeleton-*` |
| Message region padding | `SelectPanelTokens.message-region-padding`, `message-stack-gap` |

## Slint implementation

- **`filtered-action-list.slint`**: `loading`, `loading-kind`, `loading-message`, `show-message`, `message-title` / `message-description`, `empty-title` / `empty-message`; body branches mirror v1 **FilteredActionList**.
- **`filtered-action-list-body-spinner.slint`**: **Spinner** + label (no **SelectPanelCompose** import).

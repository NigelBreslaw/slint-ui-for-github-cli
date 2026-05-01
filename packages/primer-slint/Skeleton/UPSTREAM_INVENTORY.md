# Upstream inventory — Skeleton (Primer React)

Primary sources: [`primer-ui-react`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src) and [`primer-tokens`](file:///Users/nigelb/slint/primer-tokens/src/tokens). This document is research-only for the Slint port; it does not prescribe repo PR splits beyond mapping stories to gallery ideas.

---

## 1. SkeletonBox

### React

| File | Role |
|------|------|
| [`Skeleton/SkeletonBox.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/Skeleton/SkeletonBox.tsx) | Component |
| [`Skeleton/SkeletonBox.module.css`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/Skeleton/SkeletonBox.module.css) | Shimmer, fill, radius |

### Props (`SkeletonBoxProps`)

| Prop | Type | Default / notes |
|------|------|-----------------|
| `height` | `CSSProperties['height']` | Unset; CSS default block height **`1rem`** on `.SkeletonBox` |
| `width` | `CSSProperties['width']` | Unset (block fills parent width) |
| `className` | `string` | Appends `classes.SkeletonBox` |
| `delay` | `'short' \| 'long' \| number` | If set, component returns **`null`** until timeout: **`300ms`** (`short`), **`1000ms`** (`long`), or custom `number` ms |
| … | `HTMLProps<HTMLElement>` | Spread to root `<div>` |

No `data-*` attributes set by `SkeletonBox` itself (consumers may pass via `HTMLProps`).

### CSS (`SkeletonBox.module.css`)

| Rule / selector | Behavior |
|-----------------|----------|
| `@keyframes shimmer` | Animates **`mask-position`** from **`200%`** → **`0%`** |
| `.SkeletonBox` | `display: block`; default **`height: 1rem`**; **`background-color: var(--skeletonLoader-bgColor)`**; **`border-radius: var(--borderRadius-small)`**; **`animation: shimmer`** |
| `@media (prefers-reduced-motion: no-preference)` | **`mask-image`**: `linear-gradient(75deg, #000 30%, rgb(0, 0, 0, 0.65) 80%)`; **`mask-size: 200%`**; **`animation: shimmer`**; **`animation-duration: var(--base-duration-1000)`**; **`animation-iteration-count: infinite`** |
| `@media (forced-colors: active)` | **`outline: 1px solid transparent`**; **`outline-offset: -1px`** |

**Shimmer duration (token trace):**

- CSS uses **`var(--base-duration-1000)`** for one shimmer cycle.
- Primer duration token: [`primer-tokens/src/tokens/base/motion/timing.json5`](file:///Users/nigelb/slint/primer-tokens/src/tokens/base/motion/timing.json5) → **`base.duration.1000`** → **`$value: { value: 1000, unit: 'ms' }`** (compiled to web as **`--base-duration-1000`** in the design token pipeline).

**Reduced motion:** When `prefers-reduced-motion` is not `no-preference`, the mask + explicit duration/iteration block is skipped; the outer rule still sets `animation: shimmer` without duration/mask (browser-dependent; Slint should treat as **static or no shimmer**).

### Storybook — `SkeletonBox`

| File | Title prefix |
|------|----------------|
| [`SkeletonBox.stories.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/Skeleton/SkeletonBox.stories.tsx) | `Components/Skeleton/SkeletonBox` |
| [`SkeletonBox.features.stories.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/Skeleton/SkeletonBox.features.stories.tsx) | `Components/Skeleton/SkeletonBox/Features` |

**Named exports (variant checklist):**

| Story ID | Args / behavior | Gallery note |
|----------|-----------------|--------------|
| `Default` | Plain `<SkeletonBox />` | Default 1rem bar |
| `Playground` | `height`, `width` string controls | Matrix / controls |
| `CustomHeight` | `height="4rem"` | Tall bar |
| `CustomWidth` | `width="300px"` | Fixed width |
| `WithDelay` | `delay="long"` | 1s delayed mount |

### Storybook — cross-component examples

| File | Title | Named exports |
|------|-------|---------------|
| [`Skeleton.examples.stories.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/Skeleton/Skeleton.examples.stories.tsx) | `Components/Skeleton/Examples` | `CommentsLoading`, `CommentsLoadingWithSuspense` |

Uses [`Skeleton.examples.stories.module.css`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/Skeleton/Skeleton.examples.stories.module.css) (layout: cards, borders, typography vars — not part of `SkeletonBox` core).

---

## 2. SkeletonText

### React

| File | Role |
|------|------|
| [`SkeletonText/SkeletonText.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/SkeletonText/SkeletonText.tsx) | Composes **`SkeletonBox`** |
| [`SkeletonText/SkeletonText.module.css`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/SkeletonText/SkeletonText.module.css) | Typography-sized bars, multiline layout |

### Props (`SkeletonTextProps`)

| Prop | Type | Default |
|------|------|---------|
| `size` | `'display' \| 'titleLarge' \| 'titleMedium' \| 'titleSmall' \| 'bodyLarge' \| 'bodyMedium' \| 'bodySmall' \| 'subtitle'` | **`bodyMedium`** |
| `lines` | `number` | **`1`** |
| `maxWidth` | `CSSProperties['maxWidth']` | Unset |
| `className` | `string` | Merged with `classes.SkeletonText` |
| … | `HTMLProps` (minus `size`) | Spread to `SkeletonBox` or wrapper |

### DOM / data hooks

- Single line: one **`SkeletonBox`** with **`data-component="SkeletonText"`**, **`data-text-skeleton-size={size}`**, **`width="100%"`**, **`maxWidth`** on style.
- Multiline (`lines >= 2`): wrapper **`data-component="multilineContainer"`**; each row: **`data-component="SkeletonText"`**, **`data-in-multiline="true"`**, **`data-text-skeleton-size={size}`**.

### CSS variables consumed (`SkeletonText.module.css`)

Per-size **`--font-size`** / **`--line-height`** map to Primer typography CSS variables, for example:

- Default ( **`bodyMedium`** ): `--text-body-size-medium`, `--text-body-lineHeight-medium`
- **`display`**: `--text-display-size`, `--text-display-lineHeight`
- **`titleLarge`**, **`titleMedium`**, **`titleSmall`**: `--text-title-size-*`, `--text-title-lineHeight-*`
- **`subtitle`**: `--text-subtitle-size`, `--text-subtitle-lineHeight`
- **`bodyLarge`**, **`bodySmall`**: `--text-body-size-*`, `--text-body-lineHeight-*`

**Layout:**

- Row **`height`** = `--font-size`; vertical rhythm via **`--leading`** (`calc` / `mod` with `@supports`).
- **`border-radius`**: **`var(--borderRadius-small)`** by default; **`var(--borderRadius-medium)`** for **`display`** and **`titleLarge`**.
- Multiline: last child gets **`min-width: 50px`**, **`max-width: 65%`**, **`margin-bottom: 0`**; intermediate lines use increased **`margin-block-end`**.

Shimmer/fill still come from **`SkeletonBox`** (i.e. **`--skeletonLoader-bgColor`** + shimmer rules).

### Storybook — `SkeletonText`

| File | Title prefix |
|------|----------------|
| [`SkeletonText.stories.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/SkeletonText/SkeletonText.stories.tsx) | `Components/Skeleton/SkeletonText` |
| [`SkeletonText.features.stories.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/SkeletonText/SkeletonText.features.stories.tsx) | `Components/Skeleton/SkeletonText/Features` |

**Named exports (variant checklist):**

| Story ID | Args / behavior |
|----------|-----------------|
| `Default` | `<SkeletonText />` |
| `Playground` | `size`, `lines` (1–10), `maxWidth` |
| `WithMaxWidth` | `maxWidth={200}` |
| `WithMultipleLines` | `lines={3}` |
| `Display` | `size="display"` |
| `Subtitle` | `size="subtitle"` |
| `TitleLarge` | `size="titleLarge"` |
| `TitleMedium` | `size="titleMedium"` |
| `TitleSmall` | `size="titleSmall"` |
| `BodyLarge` | `size="bodyLarge"` |
| `BodyMedium` | `size="bodyMedium"` |
| `BodySmall` | `size="bodySmall"` |

---

## 3. SkeletonAvatar

### React

| File | Role |
|------|------|
| [`SkeletonAvatar/SkeletonAvatar.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/SkeletonAvatar/SkeletonAvatar.tsx) | Composes **`SkeletonBox`** |
| [`SkeletonAvatar/SkeletonAvatar.module.css`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/SkeletonAvatar/SkeletonAvatar.module.css) | Size + shape |

### Props (`SkeletonAvatarProps`)

| Prop | Type | Default |
|------|------|---------|
| `size` | `AvatarProps['size']` → **`number` \| `ResponsiveValue<number>`** | **`DEFAULT_AVATAR_SIZE`** from [`Avatar/Avatar.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/Avatar/Avatar.tsx) = **`20`** (px) |
| `square` | `boolean` | **`false`** |
| `className` | `string` | Merged with `classes.SkeletonAvatar` |

### DOM / data hooks

- **`data-component="SkeletonAvatar"`**
- **`data-responsive`** present (empty) when `size` is a responsive map
- **`data-square`** present (empty) when `square` is true

### CSS (`SkeletonAvatar.module.css`)

| State | Behavior |
|-------|----------|
| Base | `display: inline-block`; **`width` / `height`**: **`var(--avatarSize-regular)`** (set inline as px); **`border-radius: 50%`** |
| `[data-square]` | **`border-radius: clamp(4px, var(--avatarSize-regular) - 24px, var(--borderRadius-medium))`** |
| `[data-responsive]` | Media queries **`--viewportRange-narrow` / `regular` / `wide`** swap **`--avatarSize-narrow`**, **`--avatarSize-regular`**, **`--avatarSize-wide`** |

### Storybook — `SkeletonAvatar`

| File | Title prefix |
|------|----------------|
| [`SkeletonAvatar.stories.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/SkeletonAvatar/SkeletonAvatar.stories.tsx) | `Components/Skeleton/SkeletonAvatar` |
| [`SkeletonAvatar.features.stories.tsx`](file:///Users/nigelb/slint/primer-ui-react/packages/react/src/SkeletonAvatar/SkeletonAvatar.features.stories.tsx) | `Components/Skeleton/SkeletonAvatar/Features` |

**Named exports (variant checklist):**

| Story ID | Args / behavior |
|----------|-----------------|
| `Default` | `<SkeletonAvatar />` (size 20) |
| `Playground` | `size` (number or parsed responsive from `sizeAtNarrow` / `sizeAtRegular` / `sizeAtWide`), `square` |
| `Square` | `square` |
| `Size` | Fixed sizes **4, 8, 12, …, 64** px |
| `SizeResponsive` | Maps **`{ narrow, regular, wide }`** across several tuples |
| `InAStack` | Four **`SkeletonAvatar`** inside **`AvatarStack`** |

---

## 4. Component tokens — `skeletonLoader`

| File | Key path |
|------|----------|
| [`primer-tokens/src/tokens/component/skeletonLoader.json5`](file:///Users/nigelb/slint/primer-tokens/src/tokens/component/skeletonLoader.json5) | **`skeletonLoader.bgColor`** |

Summary:

- Base **`$value`**: **`{base.color.neutral.8}`** with **`alpha: 0.1`** (default modes).
- **`$extensions['org.primer.overrides'].dark`**: **`alpha: 0.2`**.
- Several high-contrast modes override to **`{base.color.neutral.5}`** with **`alpha: 1`**.

Compiled CSS hook used by React: **`var(--skeletonLoader-bgColor)`**.

### Related functional tokens (referenced by CSS above)

| Concern | Token / CSS | Source (primer-tokens) |
|---------|-------------|-------------------------|
| Small radius | `--borderRadius-small` | [`functional/size/radius.json5`](file:///Users/nigelb/slint/primer-tokens/src/tokens/functional/size/radius.json5) → **`borderRadius.small`** (**3px**) |
| Medium radius | `--borderRadius-medium` | Same file → **`borderRadius.medium`** (**6px**) |
| Shimmer period | `--base-duration-1000` | [`base/motion/timing.json5`](file:///Users/nigelb/slint/primer-tokens/src/tokens/base/motion/timing.json5) → **`base.duration.1000`** (**1000ms**) |

Typography variables for **`SkeletonText`** live under Primer’s functional typography tokens (referenced by name in `SkeletonText.module.css`); trace those files under `primer-tokens/src/tokens/functional/` when wiring Slint **`LayoutTokens`** / label parity.

---

## 5. Interaction and a11y (upstream)

| Concern | Where |
|---------|--------|
| Hover / pressed / focus | **None** on skeleton primitives |
| **`prefers-reduced-motion`** | Shimmer mask + timed animation only inside **`no-preference`** query |
| **`forced-colors: active`** | **`SkeletonBox`**: transparent outline on the bar |
| Examples | **`Skeleton.examples`**: **`VisuallyHidden`**, **`aria-busy`**, **`AriaStatus`** — patterns for app code, not intrinsic to **`SkeletonBox`** |

---

## 6. PR / gallery mapping (reference)

The port plan in-repo sequences work as: **tokens + `SkeletonBox`** → **`SkeletonText`** → **`SkeletonAvatar`** → consumers → docs. Storybook rows above should be covered across the **Feedback** gallery Skeleton section (single PR may bundle multiple small stories, e.g. all `SkeletonText` sizes in one gallery subsection).

| Upstream cluster | Suggested Slint / gallery slice |
|------------------|----------------------------------|
| `SkeletonBox` Default + Features + delay | `SkeletonBox` default size, custom W/H, delay |
| `SkeletonText` Default + Features + Playground sizes/lines | `SkeletonText` matrix |
| `SkeletonAvatar` Default + Square + Size (+ responsive if deferred, document gap) | `SkeletonAvatar` round/square/sizes |
| `Skeleton.examples` | Optional composed card (a11y strings app-level in Slint) |

---

## 7. Explicit parity notes for Slint

1. **Shimmer:** Upstream uses **`mask-image`** + **`mask-position`** animation; Slint will approximate (e.g. tick-driven overlay) per port plan.
2. **`SkeletonAvatar` responsive `size`:** React supports breakpoint maps; Slint v1 may ship **fixed diameter only** — document if responsive is out of scope.
3. **`delay`:** React unmounts until timeout; Slint may use **`Timer`** / visibility — verify embedded/tests if added.

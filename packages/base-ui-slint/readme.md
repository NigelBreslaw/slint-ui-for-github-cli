# base-ui-slint

Headless [Base UI](https://base-ui.com) primitives for Slint — neutral tokens, floating/focus/composite foundation, and (Phase 2+) widget namespaces.

**Not** a Primer skin. [`packages/primer-slint`](../primer-slint) stays GitHub-styled.

## Imports

```slint
import { BaseUiColors, BaseUiFocusTokens } from "../base-ui-slint/tokens.slint";
// or
import { BaseUiColors } from "../base-ui-slint/base-ui.slint";
```

## Namespace status

| Namespace | Phase | Slint |
|-----------|-------|-------|
| Tokens / anchor / dismiss / focus / floating / composite / field / store / a11y | 1 | Phase 1 foundation complete (PR4–PR9) |
| Accordion … Tooltip (42) | 2–5 | Stub `components/<name>/README.md` only |
| merge-props, use-render | — | Web-only; documented in gallery stubs |
| csp-provider, direction-provider | 2 | App-level / stub |

Upstream paths: [`component-imports.md`](component-imports.md).

## Gallery

[`packages/base-ui-gallery`](../base-ui-gallery) — `pnpm dev:base-ui-gallery`.

Phase 1 foundation pages: design tokens (PR3), anchor, dismiss, focus, floating-tree, composite, field, store, a11y (PR4–PR9).

## Agent docs

[`AGENTS.md`](AGENTS.md) — conventions and verification.

# Primer gallery

Standalone Slint window for browsing Primer components. This folder holds gallery-only UI; the library lives in the parent directory.

**Content:** the **Buttons** sidebar group (`gallery-buttons-page.slint`) mirrors the Buttons demos from `app/src/ui/views/primer-gallery.slint`. Other groups still show a placeholder until migrated.

**Direction:** evolve toward a Storybook-like experience: named demos per component, optional metadata (variants, tokens), and room for visual or manual QA notes in later PRs.

Run from the monorepo root:

```bash
pnpm dev:gallery
```

# Changelog

Semver per [docs/11](docs/11-docs-site-and-dx.md): the `@layer` order string, token
names/tiers, component classes/parts/attribute axes, and custom-element APIs are the
major-version surface. Components marked **Experimental** in their spec are exempt and
say so there.

## 1.0.0 — 2026-07-14

First stable release. Everything below is the v1 surface; the
[success criteria of doc 01](docs/01-vision-and-principles.md) were verified against
this build (see the release audit in the project tracker).

### Fixed

- **Distribution ([ADR-0003](docs/decisions/ADR-0003-distribution-and-imports.md)):
  every dist stylesheet now opens with the full canonical `@layer` declaration.**
  The minifier had been dropping "unused" layer names from the pre-declaration, which
  silently re-introduced first-use ordering — loading a component file that skips a
  layer (e.g. combobox, which has no `variants`) before one that uses it could invert
  `variants`/`states` priority. The build now re-prepends the canonical line to
  minified artifacts, ships unminified artifacts as the raw source concatenation
  (comments intact — "source = shipped" is now literal), and fails if any artifact
  is missing the line.

### Added

- Docs site generated from the component specs themselves (`npm run build:site`):
  live examples, behaviour-tier badges, a no-JS demonstration mode, and browsable
  design docs/ADRs — styled exclusively by `dist/welkin.css`.
- Token playground: live Level-1 theming with per-edit contrast read-outs of the
  CI-guaranteed pairings in both schemes, and copy-theme-CSS export.

## 0.2.0 — 2026-07-14

The full component set.

### Added

- **Layout primitives** ([docs/06](docs/06-layout-system.md)): `.stack`, `.cluster`,
  `.sidebar-layout`, `.switcher`, `.grid`, `.center`, `.cover`, `.frame` — container-
  query-first, every primitive establishes a container.
- **Pure-CSS components**: button, card, badge/tag, alert/callout, breadcrumb, table,
  prose, progress/spinner/skeleton, navbar, pagination.
- **Platform-primitive components**: dialog, popover/menu, accordion, select, form
  controls + validation styling, tooltip, carousel — zero-JS by construction.
- **JS-enhanced components** ([docs/08](docs/08-javascript-policy.md), all ≤ 2 KB
  min+gzip, zero dependencies, usable no-JS baselines): `<wel-tabs>`,
  `<wel-combobox>`, `<wel-toast-region>`, sortable table headers (`table-sort.js`),
  and the interim fallback modules `wel-tooltip.js`, `wel-dialog.js`, `wel-anchor.js`,
  `carousel-buttons.js` (each deleted when its platform feature graduates,
  [ADR-0012](docs/decisions/ADR-0012-feature-graduation-criteria.md)).
- **CakePHP plugin**: FormHelper templates emitting Welkin field markup; server
  validation errors map to `[aria-invalid="true"]` + the error element.
- npm package now ships per-component CSS and the ES modules; `unpkg`/`jsdelivr`
  fields; tag-triggered publish workflow with provenance.

## 0.1.0 — 2026-07-13

Preview: design tokens (three tiers, typed `@property`, `oklch`, `light-dark()` dark
mode), reset, classless-ish base styles, CI-enforced contrast pairings and size
budgets.

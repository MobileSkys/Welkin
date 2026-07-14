# Changelog

Semver per [docs/11](docs/11-docs-site-and-dx.md): the `@layer` order string, token
names/tiers, component classes/parts/attribute axes, and custom-element APIs are the
major-version surface. Components marked **Experimental** in their spec are exempt and
say so there.

## Unreleased

### Added

- **Cross-document view transitions module (T-89)** —
  `dist/components/view-transitions.css`, an **opt-in** à-la-carte file that is
  deliberately excluded from `welkin.css`/`welkin-core.css` (linking it is the
  opt-in; `@view-transition { navigation: auto }` changes every same-origin
  navigation, and both pages of a navigation must carry it). Pages cross-fade on
  navigation; elements sharing a `--wel-vt: <name>` custom property (the tabs
  `--wel-tabs-vt` convention, registered non-inheriting) morph between pages.
  Everything sits under `@media (prefers-reduced-motion: no-preference)` per
  docs/09 — reduce means instant navigations, and durations ride
  `--wel-motion-duration-3 * --wel-motion`. Firefox (View Transitions Level 1,
  same-document only) ignores the unknown at-rule and navigates instantly — no
  `@supports` gate exists or is needed; see the new opt-in-module lane in
  [docs/03](docs/03-browser-support-policy.md). ≤ 0.5 KB min+gzip, budget-gated.
  Probed (Chromium 149, local HTTP): the module also ships
  `:root:active-view-transition { scroll-behavior: auto }` because the reset's
  smooth scrolling animates cross-document *fragment* navigations from the top of
  the new page under a running transition (history back/forward restoration is
  immune); with the rule, capture lands at the fragment.

## 1.0.1 — 2026-07-14

### Fixed

- **`[data-theme]` scheme pinning and sub-brand derivation now actually work
  ([ADR-0007](docs/decisions/ADR-0007-dark-mode-mechanism.md) amendment, T-84).**
  The semantic colour tokens are typed (`@property "<color>"`), so `light-dark()`
  and the accent derivations resolve on the element that declares them and
  descendants inherit the finished colour. As shipped in 1.0.0, a
  `data-theme="dark"` subtree re-rendered native widgets but kept the outer
  scheme's token values, and a scoped accent kept the page accent's
  hover/active/tint shades — the docs-site playground's per-scheme contrast
  columns were computing the same scheme twice for the same reason. The token
  blocks in `tokens/color.css` and `tokens/radius-border-shadow.css` now declare
  on `:root, [data-theme]`, so every `[data-theme]` subtree root re-resolves the
  full palette against its own `color-scheme` and locally cascaded accent. The
  a11y smoke gates this permanently.

  **Theme guidance change ([doc 10](docs/10-theming-and-customisation.md)):
  declare themes on `:root, [data-theme]`, not `:root` alone** — a `:root`-only
  theme is shadowed inside pinned/named subtrees by the re-declaration. The
  playground's "Copy theme CSS" now emits the widened selector. (Token *values*
  and names are unchanged; a `:root`-only theme on a page with no `data-theme`
  usage behaves exactly as before.)

### Added

- **Showcase** (docs site): four complete mock sites — Solstice (SaaS landing),
  Nimbus (analytics dashboard), Aster & Vale (literary journal), Fern & Forage
  (storefront) — each restyled from the same `welkin.css` by nothing but its
  footer-visible theme block, demonstrating theming Levels 1–3.

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

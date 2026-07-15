# Changelog

Semver per [docs/11](docs/11-docs-site-and-dx.md): the `@layer` order string, token
names/tiers, component classes/parts/attribute axes, and custom-element APIs are the
major-version surface. Components marked **Experimental** in their spec are exempt and
say so there.

## Unreleased

### Changed

- **Navbar sticky shadow legibility** (T-101): the `data-sticky` shadow is now
  `--wel-shadow-2` (was `-1`, which doesn't read on dark surfaces — both in
  the scroll-driven reveal and the static fallback shown by browsers without
  scroll-driven animations, e.g. Firefox). The menu-open bar raises
  `--wel-shadow-3` so the open-state raise stays one tier above the stuck
  rest shadow. Visual-only; no API surface change.

### Added

- **Image FX wave-2 spec + doctrine (T-122)**: `docs/components/image-fx.md`
  documents all six wave-2 utilities (anatomy, markup, variants, token
  contracts, tier fallbacks, composition rules incl. the new
  wrapper-vs-media entries and forbidden nestings). Doc 03 gains
  `backdrop-filter`, `clip-path: shape()`, and `corner-shape` contract rows;
  doc 09's preference matrix records `.color-reveal`'s multiplier-ridden
  instant swap and names `.frosted-caption` the first occupant of the
  reduced-transparency rule. Compliance fix riding along: the frosted
  caption bar now goes fully opaque (no blur) under
  `prefers-reduced-transparency: reduce`, as doc 09 already required.

- **Image FX: `.squircle` (T-116, wave 2)**: superellipse ("iOS icon") corner
  crop on media via `corner-shape: squircle` over a generous
  `--wel-squircle-radius` (default `25%`). The fallback is built in:
  `corner-shape` only reshapes how `border-radius` corners are drawn, so
  engines without it render the same radius as plain round corners — no
  `@supports` gate needed.

- **Image FX: `.glow` (T-115, wave 2)**: ambient halo behind media. Default is
  a two-layer accent-derived drop-shadow on the wrapper (`--wel-glow-color`,
  `--wel-glow-size`) — it follows the composite silhouette, so an
  `.organic-frame` crop glows in its clipped shape, and one accent override
  retints it. `data-glow="ambient"` swaps to the ambilight look: a blurred
  cover-fit pseudo painting the image's own colours, fed zero-JS via
  `--wel-glow-image: url(…)` on the wrapper. Wrapper-level filter keeps the
  family's contended media `filter` untouched; forced colors drops the halo.

- **Image FX: `.adaptive-crop` (T-112, wave 2)**: one class, container-driven
  art direction — square tight crop (`--wel-crop-narrow`, default `1`) in
  layout containers under 30rem, cinematic full-bleed band (`--wel-crop-wide`,
  default `21 / 9`) at 30rem and up, `object-fit: cover` so neither crop
  distorts. Queries the nearest layout primitive (`container-name: layout`)
  like every container-aware component; with no layout ancestor neither
  branch matches and the media keeps its natural aspect.

- **Image FX: `.organic-frame` (T-107, wave 2)**: blob (default), `data-shape`
  `arch` and `scallop` image crops via `clip-path: shape()`, applied to the
  media element directly. All coordinates are percentages, so crops track any
  box and aspect ratio. Engines without `shape()` keep ungated `border-radius`
  approximations (blob/arch have honest radius analogues; scallop falls back
  to a plain rounded crop) — never a broken image; the fallback radius is
  zeroed inside the `@supports` gate so the clips don't intersect.

- **Image FX: `.color-reveal` (T-105, wave 2)**: media rests desaturated
  (`--wel-color-reveal-rest`, default full grayscale) and saturates on hover —
  or on keyboard `:focus-visible` when wrapped in a link/button/summary. The
  whole effect is gated behind `@media (hover: hover)`: touch users get the
  plain colour image, never one stuck gray. The filter transition rides the
  `--wel-motion` multiplier, so reduced-motion users get an instant swap.
  Composes with `.dim` via an explicit combo rule (the family's contended
  `filter` doctrine); meaningless inside `.duotone` (already grayscale) —
  forbidden nesting.

- **Image FX: `.frosted-caption` (T-104, wave 2)**: wrapper utility (canonically
  `<figure>` + `<figcaption>`) pinning the caption to the media's block-end
  edge as a translucent surface bar — `backdrop-filter` blur+saturate glass
  where supported, an ungated near-solid surface scrim otherwise, so caption
  text is never unreadable over imagery (never-a-broken-image doctrine).
  Tokens: `--wel-frosted-bg`, `--wel-frosted-blur`, `--wel-frosted-saturate`.
  Caption paints above `.duotone` blend overlays (D-12 stacking rule);
  `overflow: clip` on the wrapper crops media + caption to a wrapper radius.

- **Consumer skill: image FX (T-121)**: `skill/welkin` gains
  `references/image-fx.md` (per-utility markup, knobs, fallbacks, and the
  wrapper-vs-media combination table), a SKILL.md effects section +
  updated trigger description, and a `data-vt-image` trap entry in
  gotchas.md. Live copy at `~/.claude/skills/welkin` re-synced
  (dual-copy rule).

- **Image FX spec + doctrine touchpoints (T-119)**: new
  `docs/components/image-fx.md` documents the wave-1 utilities — shared
  never-a-broken-image doctrine, per-utility fallback contracts, the token
  table, and composition rules (which class goes on the wrapper vs the
  media, the shared-`filter` combo rule, the D-12 overlay-stacking trap).
  Doc 03 gains mask and relative-colour-syntax contract rows and extends
  the scroll-driven/opt-in-module rows; doc 09's reduced-motion matrix
  names the gated utilities; doc 05 records the pin-faithful pattern for
  non-colour scheme-coupled tokens (first occupant `--wel-img-dim`).

- **Image FX page** (docs site, T-120): `examples/image-fx.html` demos every
  wave-1 image utility live with copyable markup — `.dim` (inside a
  dark-pinned panel so it shows in either OS scheme), `.duotone`
  (default/retinted/custom endpoints), `.edge-fade` (all-edges, hero
  bleed, vignette), `.reveal` (scroll to see), and a `data-vt-image`
  same-document gallery morph whose few lines of wiring are the page's
  only script (inline, so file:// keeps working). Artwork is local SVG
  (`examples/img/`). Site + example navbars gain an "Image FX" item and
  the a11y smoke covers the page in both schemes and forced colors.

- **`.dim` dark-mode image dimming (T-102)**: photos glare on dark
  surfaces — `.dim` on media applies `--wel-img-dim`, which resolves to
  the identity filter in light scheme and `--wel-img-dim-amount`
  (default `brightness(0.85) contrast(1.05)`) in dark. Scheme resolution
  is pin-faithful: OS preference at the root, re-declared per
  `[data-theme]` subtree exactly like the palette; forced-colors resets
  to identity. The token is composable by design (identity, never
  `none`, inside filter lists) — `.duotone` + `.dim` combine via an
  explicit rule that dims the grayscale base before the overlays remap
  it. Completes the image-FX wave 1 features (T-118).

- **VT image morph — `data-vt-image` (T-109)**: the view-transitions module
  gains an image treatment. Tag a `--wel-vt`-named image on both sides and
  its snapshots cover-fit the morphing group (no stretch between aspect
  ratios) and swap opaquely instead of the default cross-fade
  (double-exposure flash on photos). Implemented with Level 2
  `view-transition-class` — graduating the spec's open question — so
  engines without it simply keep the default morph. Also applies to author
  same-document `startViewTransition` calls (lightboxes) while the module
  is linked. Fourth of the image-FX wave (T-118).

- **`.reveal` scroll-driven utility (T-108)**: fade/scale-in as the element
  enters the viewport, via `animation-timeline: view()` with
  `animation-range: entry` — zero JS. Tune with `--wel-reveal-scale`
  (start scale, default 0.96) and `--wel-reveal-distance` (start
  block-axis offset, default 0). The hidden start state exists only
  inside the `@supports (animation-timeline: view())` +
  `prefers-reduced-motion: no-preference` gate, so no-support engines
  (e.g. Firefox stable) and reduced-motion users always see the element —
  never a stuck opacity-0. Third of the image-FX wave (T-118).

- **`.edge-fade` mask utility (T-106)**: gradient `mask-image` so media
  melts into the backdrop (hero bleeds). Default fades all four edges
  (two-layer `mask-composite: intersect`); a `data-edges` axis narrows it
  (`block`, `inline`, `block-start`/`-end`, `inline-start`/`-end`, or
  `radial` vignette) — the asymmetric inline values flip under `:dir(rtl)`.
  Fade depth is `--wel-edge-fade` (default `--wel-space-8`). Applied
  directly to the element, no wrapper; engines without mask support show
  the unfaded image. Second of the image-FX wave (T-118).

- **`.duotone` image utility (T-103)**: wrapper class that grayscales the
  media and gradient-maps it through two `mix-blend-mode` overlays —
  blacks rise to `--wel-duotone-shadow`, whites drop to
  `--wel-duotone-highlight`. Both endpoints derive from the cascaded
  `--wel-color-accent` (relative oklch at fixed lightnesses), so one accent
  override retints the effect; override the endpoint tokens for a custom
  mapping. Zero JS, `utilities` layer, `isolation: isolate` so blending
  never reaches the page backdrop; under forced colors the overlays are
  dropped and the original image shows. First of the image-FX wave (T-118).

- **Showcase 6 — Waypoint** (docs site): a multi-page travel journal
  (`examples/waypoint/`, four pages) demonstrating the cross-document
  view-transitions module end to end — brand wordmark, hero panorama, and the
  featured entry's artwork morph between pages (Chrome/Safari over http;
  Firefox 151 verified falling back to instant navigation, no errors) — plus
  vendored jQuery 3.7.1 enhancing Welkin components with zero conflicts (live
  card filter, `wel-toast-region.push()` on form submit, `data-variant`
  toggling) and an `@layer overrides` escape-hatch rule beating a component
  style. jQuery loads `async` — probing the review kickback showed Chrome
  skips the inbound cross-document transition whenever a destination page's
  `DOMContentLoaded` loses the race to first paint, which slow `defer`red
  scripts guarantee; the constraint is documented in the module spec. Pages
  also carry an early `<meta name="color-scheme">` so the pre-CSS canvas
  matches the scheme (kills Firefox's white first paint). The docs-site generator now copies directory-shaped showcases; the
  a11y smoke covers all four pages. jQuery stays showcase-side, never in dist.

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

### Fixed

- **Showcase layout: `.center`'s measure cap was silently dead on all five
  original showcase pages (T-95).** They combined two layout primitives on one
  element (`class="center stack"`, `class="cover center"`); every primitive
  owns `display`, so the later-loaded one wins and the other vanishes — content
  ran full-bleed with headings at the viewport edge. All 19 occurrences are now
  the nested form (`.center > .stack`; heroes: `.cover > .center`), restoring
  the intended capped, centred columns. Doctrine added to
  [docs/06](docs/06-layout-system.md) ("compose by nesting — never two
  primitives on one element") and a new lint (`build/check-primitive-combos.mjs`,
  in `npm run lint`) keeps combos out of `examples/` for good.

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

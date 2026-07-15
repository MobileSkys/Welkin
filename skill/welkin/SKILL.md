---
name: welkin
description: >
  Build and style web UIs with Welkin (welkincss) — the CSS-first, zero-build
  toolkit built on cascade layers, design tokens, light-dark() colour schemes,
  and container queries. Use whenever a project uses welkincss (package.json
  dependency, CDN link, or dist/welkin*.css files), or the user asks to add or
  install Welkin, build or style pages with it, theme it, or mentions "welkin",
  "welkincss", --wel- tokens, or wel- custom elements. Covers install
  (npm/CDN/à-la-carte), layout primitives, the component catalogue,
  token-based theming, and image effect utilities (duotone, edge-fade,
  scroll reveal, dark-mode dimming, view-transition morphs, frosted
  captions, hover colour reveal, organic/squircle frames, adaptive
  crops, ambient glow, parallax drift, Ken Burns pan/zoom, view-box
  art-direction crops, 3D hover tilt, halftone/grain textures).
---

# Welkin — the CSS-first toolkit

Welkin treats modern CSS as a complete platform: plain, readable CSS with
**zero required build step**. One semantic class per component, variants as
data-attributes, layout from 8 container-query-first primitives, theming purely
through `--wel-` design tokens. Stable 1.0, semver-governed.

Working in the Welkin **source repo itself** (building the toolkit)? This skill
is for *consuming* Welkin in projects — defer to the repo's own docs/board.

## Golden rules

1. **One semantic class per component** (`.button`, `.card`, `.navbar`);
   variants are data-attributes: `data-variant`, `data-size`, `data-tone`.
   Never invent classes or variants — the catalogue
   ([references/components.md](references/components.md)) is the contract.
2. **Layout only via the 8 primitives** (table below). Their knobs are
   `--wel-*` custom properties set inline or on a wrapper — don't write new
   layout CSS for what a primitive already does.
3. **Container-query-first: no viewport media queries** on components.
   Viewport MQs are legitimate only for the top-level page shell and
   `prefers-*` user preferences.
4. **A theme is a token file — nothing else.** Retheme via semantic tokens on
   `:root` (Level 1), scope with `[data-theme]` (Level 2), one-off via a
   component's published token knobs (Level 3). **Never write selectors into
   component internals.** See [references/theming.md](references/theming.md).
5. **Component-to-component styling is forbidden.** A `.card` never selects
   `.button`; it sets `--wel-button-*` tokens for its subtree instead.
6. **No `!important`, no IDs, no wrapping Welkin in your own `@layer`.**
   Ordering is the layer system's job — and your unlayered CSS already beats
   every Welkin layer by design, at any specificity.
7. **Semantic HTML first; JS is optional.** JS-enhanced components load one
   plain ES module each (`dist/js/wel-*.js`, `<script type="module">`). Use
   only the shipped modules — components work without them (no-JS baseline).
8. **No build step. Ever.** No Sass, no PostCSS pipeline, no bundler required.

Dark mode is automatic: tokens use `light-dark()`, following the user's OS
scheme. Pin a subtree with `data-theme="dark"` / `"light"`.

## Install — decision tree

Any subset of dist files works **in any order** (cascade layers fix rule order
up front), so choose by project shape:

- **npm project** → `npm install welkincss`. With a bundler,
  `@import "welkincss";` resolves the package. Without one (no build step),
  link the file at whatever URL you serve it from — serve `node_modules`
  statically or copy `dist/` into your public folder:
  ```html
  <link rel="stylesheet" href="/node_modules/welkincss/dist/welkin.min.css">
  ```
  JS modules live alongside: `/node_modules/welkincss/dist/js/wel-tabs.js`.
- **No package manager / static site** → CDN link, no install:
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/welkincss@1/dist/welkin.min.css">
  ```
  (unpkg.com works identically.)
- **Size-sensitive / few components** → à la carte: core + exactly what you use:
  ```html
  <link rel="stylesheet" href=".../welkincss@1/dist/welkin-core.min.css">
  <link rel="stylesheet" href=".../welkincss@1/dist/components/button.min.css">
  <link rel="stylesheet" href=".../welkincss@1/dist/components/card.min.css">
  ```
- **JS-enhanced component in use** → also load its module:
  ```html
  <script type="module" src=".../welkincss@1/dist/js/wel-tabs.js"></script>
  ```

Bundles: `welkin.min.css` everything ~11 KB gz · `welkin-core.min.css`
(reset+tokens+base+layout) ~3.5 KB gz · `components/*.min.css` ≤3 KB each ·
`js/*.js` ≤2 KB each.

One file is **opt-in only and never bundled** (post-1.0.1):
`components/view-transitions.min.css` — cross-document page morphs for MPA
sites (`--wel-vt` names shared elements; link it on *every* page). Read the
module section of [references/gotchas.md](references/gotchas.md) before using:
it has hard traps (`file://` can't morph, `defer` scripts kill it).

Opening pages via `file://`? ES modules and `@import` are CORS-blocked — serve
locally instead (see [references/gotchas.md](references/gotchas.md)).

## Layout primitives (full detail: references/layout.md)

Each is one class, configured by custom-property knobs; each establishes a
container so children can query their space.

| Class | Use for | Main knobs |
|-------|---------|-----------|
| `.stack` | Vertical rhythm (owns the margins the reset removed) | `--wel-stack-gap` |
| `.cluster` | Wrapping horizontal groups (tags, button rows) | `--wel-cluster-gap`, `-align`, `-justify` |
| `.sidebar-layout` | Sidebar + content, auto-stacks when narrow | `--wel-sidebar-width`, `-content-min`, `data-side` |
| `.switcher` | Row of equals → column below threshold | `--wel-switcher-threshold`, `data-limit` |
| `.grid` | Auto-fit card grid, as many min-width cols as fit | `--wel-grid-min`, `--wel-grid-gap` |
| `.center` | Measure-capped centred content column | `--wel-center-max`, `--wel-center-gutter` |
| `.cover` | Full-height hero with centred principal element | `--wel-cover-min-height` |
| `.frame` | Aspect-ratio media crop | `--wel-frame-ratio` |

Aligned card grids: `.grid[data-align="rows"]` makes card headers/bodies/
footers align across the row via subgrid.

**Composition rule:** a primitive placed in a content-sized box (auto flex
basis, `auto` grid track, float, `inline-block`, abs-pos) collapses to zero
width — give it `flex-grow`/explicit basis or a sized track. Nesting
primitives inside primitives is safe.

## Image effects (full detail: references/image-fx.md)

Utilities-layer image treatments, post-1.0.1. Token-driven, zero JS, and safe
by default (no feature → plain image; motion gates off under reduced motion):

| Class / attribute | Effect | Main knobs |
|-------------------|--------|-----------|
| `.dim` (on media) | Dark-scheme dimming, pin-faithful | `--wel-img-dim-amount` |
| `.duotone` (wrapper) | Grayscale + accent-derived two-tone remap | `--wel-color-accent`, `--wel-duotone-shadow`/`-highlight` |
| `.edge-fade` (on media) | Gradient mask melt into the backdrop | `data-edges`, `--wel-edge-fade` |
| `.reveal` (on media) | Scroll-driven fade/scale entry, no JS | `--wel-reveal-scale`, `--wel-reveal-distance` |
| `data-vt-image` (VT module) | Thumb→detail morph: cover-fit, no cross-fade flash | pairs with `--wel-vt` |
| `.frosted-caption` (wrapper) | Glass caption bar pinned to the media's bottom — THE text-on-imagery pattern | `--wel-frosted-bg`/`-blur`/`-saturate` |
| `.color-reveal` (on media) | Grayscale until hover/focus; hover devices only | `--wel-color-reveal-rest` |
| `.organic-frame` (on media) | blob / arch / scallop `shape()` crops, radius fallback | `data-shape` |
| `.adaptive-crop` (on media) | Square in narrow layout containers, 21:9 band at ≥30rem | `--wel-crop-narrow`/`-wide` |
| `.glow` (wrapper) | Accent halo; `data-glow="ambient"` = ambilight from the image itself | `--wel-glow-color`/`-size`/`-image` |
| `.squircle` (on media) | Superellipse corners, round fallback built in | `--wel-squircle-radius` |
| `.parallax` (wrapper) | Scroll-linked block-axis drift, clipped headroom, no JS | `--wel-parallax-depth`/`-scale` |
| `.ken-burns` (wrapper) | Slow hover pan/zoom (12s), quick return; hover devices only | `--wel-kenburns-zoom`/`-pan`/`-duration` |
| `.view-crop` (on media) | `object-view-box` in-source art direction; full image where unsupported | `data-crop`, `--wel-view-box` |
| `.tilt` (on media or card) | Fixed 3D pose on hover/focus, spring settle | `--wel-tilt-x`/`-y`/`-perspective`/`-lift` |
| `.textured` (on media) | Halftone/grain SVG-mask print with ghost floor | `data-texture`, `--wel-texture-size`/`-base` |

Combination rules matter (wrapper vs media) — copy from the reference, don't
guess.

## Component catalogue (markup patterns: references/components.md)

- **Pure CSS:** button, card, badge/tag, alert/callout, breadcrumb, table,
  prose, progress/spinner/skeleton, navbar, pagination.
- **Platform-primitive** (browser supplies behaviour): dialog (`<dialog>`),
  popover/menu (Popover API), accordion (`<details name>`), select, form
  controls & validation, tooltip, carousel (scroll-snap).
- **JS-enhanced** (optional module): tabs (`wel-tabs.js`), combobox
  (`wel-combobox.js`), toast (`wel-toast-region.js`), table sorting
  (`table-sort.js`), carousel buttons (`carousel-buttons.js`), dialog helpers
  (`wel-dialog.js`), tooltip enhancement (`wel-tooltip.js`), anchored
  positioning fallback (`wel-anchor.js`).

Copy markup from the catalogue — don't guess structure or attribute names.

## Theming quick reference (full detail: references/theming.md)

The 80% case — a brand retint is ~10 lines on `:root, [data-theme]`
(both, always: Welkin ≥1.0.1 re-declares its palette on every
`[data-theme]` subtree root, so a `:root`-only theme is shadowed inside
pinned/named sections):

```css
:root, [data-theme] {
  --wel-color-accent: oklch(60% 0.19 145);   /* re-derives hover/active/focus/tints */
  --wel-text-font-body: "Inter", system-ui, sans-serif;
  --wel-radius-control: 0.25rem;             /* buttons/inputs */
  --wel-radius-surface: 1rem;                /* cards/dialogs */
}
```

Escape hatches when tokens genuinely aren't enough, in order:
`@layer overrides { … }`, then plain unlayered CSS (beats all Welkin layers).

## References

- [references/layout.md](references/layout.md) — primitives in depth, page
  scaffolding (`.page` shell, breakout column, sticky header), composition rules.
- [references/components.md](references/components.md) — canonical markup for
  all 20 components + JS module hookup.
- [references/theming.md](references/theming.md) — token tiers, theming levels
  1–3, `light-dark()`, contrast-safe pairings, escape hatches.
- [references/image-fx.md](references/image-fx.md) — image effect utilities
  (.dim, .duotone, .edge-fade, .reveal, data-vt-image, .frosted-caption,
  .color-reveal, .organic-frame, .adaptive-crop, .glow, .squircle,
  .parallax, .ken-burns, .view-crop, .tilt, .textured) + combination rules.
- [references/gotchas.md](references/gotchas.md) — file:// CORS, layer facts,
  anti-patterns with fixes.
- [references/recipes.md](references/recipes.md) — page scaffolds: app shell,
  form page, dashboard, marketing page.

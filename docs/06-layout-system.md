---
status: Draft
depends-on: [03-browser-support-policy.md, 04-css-architecture.md, 05-design-tokens.md]
---

# 06 — Layout System

The flagship differentiator versus Bootstrap. There is no 12-column grid and no
`col-md-6`. Layout is **container-query-first and intrinsic**: primitives create layouts
from content size and container size, and components adapt to the space they're actually
given.

## The doctrine

Per [ADR-0006](decisions/ADR-0006-container-query-first-responsiveness.md):

1. **Components respond to their container, never the viewport.** A card in a 300px
   sidebar and the same card in a 900px main column each lay themselves out correctly,
   with zero author bookkeeping.
2. **Viewport media queries are permitted only for page-level scaffolding** (the
   top-level page shell) **and user-preference queries** (`prefers-*`).
3. **Every layout primitive establishes a container** (`container-type: inline-size`), so
   anything placed inside one can query its space.
4. **Named containers convention:** primitives set `container-name: layout`; the page
   shell sets `container-name: page`. Components query the nearest `layout` container by
   default; specs may define additional names.

## Why no 12-column grid

Stated once, here, so it never needs re-arguing:

- A column count is a **viewport-era abstraction**: `col-md-6` encodes "half-width when
  the *screen* is medium", which is simply wrong information when the component sits in a
  sidebar, a modal, or a dashboard cell.
- Modern grid (`repeat(auto-fit, minmax(min(100%, 20rem), 1fr))`) expresses the actual
  intent — "as many 20rem+ columns as fit" — with no breakpoints and no HTML class
  bookkeeping at all.
- 12-column class grids put layout decisions in markup, which is exactly where designers
  can't theme them. Our layout knobs are tokens.
- What people actually use `col-*` for decomposes into a handful of intrinsic patterns —
  which are the primitives below.

## Layout primitives

CQ-native, in the lineage of Every Layout's intrinsic patterns. Each is one class in the
`layout` layer, configured by custom-property knobs (settable inline, in a theme, or per
container), each establishing `container-type: inline-size; container-name: layout`.

| Primitive | Purpose | Knobs (defaults from [05-design-tokens.md](05-design-tokens.md)) |
|-----------|---------|------------------------------------------------------------------|
| `.stack` | Vertical flow with consistent rhythm (owns the margins the reset removed) | `--wel-stack-gap` |
| `.cluster` | Horizontal grouping that wraps (tag lists, button rows, nav items) | `--wel-cluster-gap`, `--wel-cluster-align`, `--wel-cluster-justify` |
| `.sidebar-layout` | Sidebar + content; wraps to stacked when the sidebar's share gets too small | `--wel-sidebar-width`, `--wel-sidebar-content-min`, `--wel-sidebar-gap`, `data-side="start|end"` |
| `.switcher` | Row of equals that switches to a column below a width threshold | `--wel-switcher-threshold`, `--wel-switcher-gap`, `--wel-switcher-limit` |
| `.grid` | Auto-fit card grid: as many `min`-wide columns as fit | `--wel-grid-min`, `--wel-grid-gap` |
| `.center` | Horizontally centred, measure-capped column (page content) | `--wel-center-max` (defaults to `--wel-text-measure`), `--wel-center-gutter` |
| `.cover` | Full-height cover with vertically centred principal element (heroes) | `--wel-cover-min-height`, `--wel-cover-padding` |
| `.frame` | Aspect-ratio media frame with object-fit cropping | `--wel-frame-ratio` |

Primitives compose freely and are the **only** sanctioned way components arrange
siblings — component CSS never reimplements these patterns internally when a primitive
serves.

## Subgrid: the aligned-card-grid demo

The showcase "visibly better than Bootstrap" pattern. In a `.grid` of cards, every card
spans its row's implicit tracks with `grid-template-rows: subgrid`, so **headers, bodies,
and footers align across cards** regardless of content length — the classic ragged-card
problem Bootstrap answers with equal-height hacks and truncation:

```css
@layer layout {
  .grid[data-align="rows"] > * {
    grid-row: span 3;
    display: grid;
    grid-template-rows: subgrid;
  }
}
```

This is the **named exception** to "components never depend on parent layout"
([04-css-architecture.md](04-css-architecture.md)): subgrid participation is opt-in via
`data-align="rows"` on the primitive and documented in the card spec's Container
behaviour section.

## Page scaffolding

The one place viewport queries are legitimate:

- **`.page` shell**: header / main / footer rows via grid;
  `min-block-size: 100dvb` so short pages still pin footers.
- **Content column with breakout**: `.center` implements the measure-capped column;
  a `data-breakout` child (full-bleed figures, edge-to-edge sections) escapes to the
  padded or full viewport width via named grid lines.
- **Sticky chrome**: sticky header pattern including the `scroll-padding-block-start`
  companion rule (focus-not-obscured, [09-accessibility.md](09-accessibility.md)).

## Style queries (Enhanced tier)

Where supported (`@container style(…)`), components may read **custom-property flags from
their container** for context-aware styling — e.g. a container sets `--wel-context: dark`
(a hero with a photo background) and buttons/links inside adjust contrast treatment
automatically. Degradation contract per
[03-browser-support-policy.md](03-browser-support-policy.md): without support, components
keep their explicit variant — authors who need the effect everywhere set `data-variant`
explicitly.

## Container behaviour in component specs

Every component spec has a "Container behaviour" section stating: the container widths at
which it changes arrangement (its `@container` breakpoints, chosen per component in
`rem`), its sensible minimum width, and whether it participates in subgrid alignment.

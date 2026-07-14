# Welkin layout — primitives, composition, page scaffolding

> Source: docs 06 (layout system), ADR-0006 (container-query-first),
> ADR-0013 (containment composition), src/layout/*.css, examples/layout.html.

## Doctrine

No 12-column grid, no `col-md-6`, no viewport breakpoints. Layout is
**container-query-first and intrinsic**:

1. Components respond to **their container**, never the viewport.
2. Viewport media queries are permitted only for top-level page scaffolding
   and `prefers-*` user preferences.
3. Every primitive establishes a container (`container-type: inline-size;
   container-name: layout`), so anything inside can query its space.
4. Named containers: primitives = `layout`; the page shell = `page`
   (author-established — see below).

What Bootstrap does with column classes, Welkin does with primitives +
`repeat(auto-fit, minmax(min(100%, 20rem), 1fr))`-style intrinsic grid. Layout
knobs are custom properties (set inline, in a theme, or per container), never
markup class permutations.

## The 8 primitives

One class each, in the `layout` layer. Knob defaults from source:

| Class | Purpose | Knobs (defaults) | Data attrs |
|-------|---------|------------------|-----------|
| `.stack` | Vertical rhythm — owns inter-sibling spacing (the reset removed element margins) | `--wel-stack-gap` (`--wel-space-4`) | |
| `.cluster` | Horizontal grouping that wraps: tag lists, button rows, nav items | `--wel-cluster-gap` (`--wel-space-3`), `--wel-cluster-align` (`center`), `--wel-cluster-justify` (`flex-start`) | |
| `.sidebar-layout` | Sidebar + content; stacks when sidebar's share gets too small. **First child = sidebar** | `--wel-sidebar-width` (`20rem`), `--wel-sidebar-content-min` (`50%`), `--wel-sidebar-gap` (`--wel-space-5`) | `data-side="end"` = sidebar last-child instead |
| `.switcher` | Row of equals → column below width threshold | `--wel-switcher-threshold` (`30rem`), `--wel-switcher-gap` (`--wel-space-4`) | `data-limit="2\|3\|4"` — more items than limit → all full-width (cap must be markup; selectors can't read custom props) |
| `.grid` | Auto-fit card grid: as many `min`-wide columns as fit | `--wel-grid-min` (`20rem`), `--wel-grid-gap` (`--wel-space-4`) | `data-align="rows"` — subgrid row alignment (below) |
| `.center` | Measure-capped centred column | `--wel-center-max` (`--wel-text-measure` = 65ch), `--wel-center-gutter` (`--wel-space-gutter`) | child `data-breakout` = full-bleed escape |
| `.cover` | Full-height cover, vertically centred principal element (heroes) | `--wel-cover-min-height` (`100dvb`), `--wel-cover-padding` (`--wel-space-5`) | `data-principal` on the child to centre — others keep to the edges |
| `.frame` | Aspect-ratio media frame, object-fit crop | `--wel-frame-ratio` (`16 / 9`) | |

Setting a knob:

```html
<div class="stack" style="--wel-stack-gap: var(--wel-space-6)">…</div>
<div class="grid" style="--wel-grid-min: 15rem">…</div>
```

Prefer the `--wel-space-*` scale over raw lengths so density theming still
works. Inline knob/token styles like these are sanctioned — knobs exist to be
set at the use site. Likewise, ad-hoc **page-shell CSS is author territory**:
section `padding-block`, shell grids, sticky headers are yours to write —
"don't write new layout CSS" means don't reimplement what a primitive does.

`.cover` centres only the child marked `data-principal` (auto block margins);
header/footer children keep to the edges:

```html
<section class="cover">
  <header>…top edge…</header>
  <div data-principal class="stack">…vertically centred hero content…</div>
  <footer>…bottom edge…</footer>
</section>
```

Primitives are the **only** sanctioned way to arrange siblings — don't write
flex/grid CSS for patterns a primitive covers, and vary rhythm by nesting
stacks, not per-element margins.

## Aligned card grids (subgrid)

In a `.grid[data-align="rows"]`, every card spans its row's implicit tracks
with `grid-template-rows: subgrid` — headers, bodies, and footers align across
cards regardless of content length:

```html
<div class="grid" data-align="rows">
  <article class="card">…</article>
  <article class="card">…</article>
</div>
```

This is the one named exception to "components never depend on parent layout";
it's opt-in via the attribute.

## Composition rules (containment physics)

Every primitive has `container-type: inline-size`, so **its contents
contribute nothing to its intrinsic inline size**. In any content-sized box a
primitive resolves to zero width and its contents overflow. Rules:

- Primitive as flex item → give it `flex-grow` or an explicit `flex-basis`,
  never content-based sizing. (`.cluster` guards its direct primitive children
  with a zero-specificity `flex-grow: 1` already.)
- Primitive as grid item → place in a **sized** track (`fr`, `minmax()`), not
  an `auto` track.
- Never a primitive as a float, `inline-block`, or absolutely-positioned box
  without explicit `inline-size`.
- Nesting primitives **inside** primitives is safe by construction.

Symptom to recognise: a stack/cluster/grid rendering at zero width or its
content spilling out → its parent is content-sizing it.

## Page scaffolding

The page shell is **authored, not shipped** — the one place viewport MQs are
legitimate. Two things it must do:

1. **Establish the `page` named container** — the navbar's collapse breakpoint
   (`@container page (inline-size >= 48rem)`) queries it; without it the
   navbar never switches between mobile/desktop arrangements:

```html
<body>
  <div style="container-name: page; container-type: inline-size">
    <header>…navbar…</header>
    <main class="center">…</main>
    <footer>…</footer>
  </div>
</body>
```

2. **Pin the footer** on short pages: grid rows + `min-block-size: 100dvb` on
   the shell wrapper, e.g.

```css
/* author CSS — page shell is yours */
.shell {
  container-name: page; container-type: inline-size;
  display: grid; grid-template-rows: auto 1fr auto;
  min-block-size: 100dvb;
}
```

- Content column: `.center` (cap = `--wel-center-max`); a `data-breakout`
  child (full-bleed figure, edge-to-edge band) escapes to full width via the
  named grid lines.
- Sticky header: `position: sticky` on the header is author CSS; the reset
  already wires `scroll-padding-block-start` to `--wel-navbar-block-size` so
  anchored targets aren't hidden under it — set that token if your header
  height differs.

## Style queries (Enhanced tier — progressive)

Where `@container style(…)` is supported, components can read custom-property
flags from a container, e.g. a photo hero sets `--wel-context: dark` and
buttons/links inside adjust contrast automatically. Without support components
keep their explicit variant — set `data-variant` explicitly if the effect is
needed everywhere.

## Container behaviour of components

Every component spec declares the container widths at which it rearranges
(its `@container` breakpoints, in rem), its sensible minimum width, and
whether it participates in subgrid alignment — check the spec before forcing
a component into a very narrow slot.

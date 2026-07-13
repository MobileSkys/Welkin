# Component: Card

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

A bounded content surface grouping related content — media, heading, body copy, actions —
into one visual unit. Use for previews and summaries that lead somewhere (article teasers,
product tiles, dashboard panels). Do NOT use for messages to the user (that is
[alert-callout.md](alert-callout.md)), for modal content (that is `dialog.md`), or as a
general-purpose box when a layout primitive plus a border would do. Grids of cards are
arranged by the `.grid` primitive, never by this component.

## Anatomy

```
┌─ root (.card) ───────────────────┐
│ ┌─ media (.card-media)? ───────┐ │
│ └──────────────────────────────┘ │
│ ┌─ header (.card-header)? ─────┐ │
│ │  heading  [.card-link?]      │ │
│ └──────────────────────────────┘ │
│ ┌─ body (.card-body) ──────────┐ │
│ └──────────────────────────────┘ │
│ ┌─ footer (.card-footer)? ─────┐ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Parts: root; optional media (image/`.frame`, bleeds to the card edge); optional header
(heading, optionally containing the primary link); body (the only required part); optional
footer (metadata, actions). Part order in markup is the render order.

## HTML structure

```html
<article class="card" data-variant="raised">
  <figure class="card-media">
    <img src="…" alt="…">
  </figure>
  <header class="card-header">
    <h3><a class="card-link" href="/articles/42">Intrinsic layout in practice</a></h3>
  </header>
  <div class="card-body">
    <p>Cards adapt to the container they are given…</p>
  </div>
  <footer class="card-footer">
    <span class="badge" data-tone="info">New</span>
  </footer>
</article>
```

Rationale: `<article>` when the card is self-contained, syndication-worthy content; a
plain `<div>` is fine for purely presentational grouping (dashboard tiles). Headings live
in the header part at whatever level the surrounding outline requires — the card does not
dictate heading level.

**Clickable card:** never wrap the card in an `<a>` (block links produce long, garbled
screen-reader announcements and swallow nested interactive elements). Instead the primary
link — `.card-link`, normally on the heading — is stretched over the card with a
positioned `::after` pseudo-element (`.card` provides `position: relative`). The
accessible name stays the heading text; text inside the card remains selectable only
outside the stretched area (documented trade-off); secondary interactive elements
(buttons, footer links) sit above the stretch via `position: relative`. At most one
`.card-link` per card.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-variant` | *(absent)* = `raised`, `outlined`, `plain` | `raised`: elevated surface (`--wel-shadow-1`), no border. `outlined`: border, no shadow. `plain`: neither — grouping by spacing alone |

One axis. No `data-size` (a card is sized by its container) and no `data-tone` (cards are
neutral surfaces; tone belongs to badges/alerts inside them).

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover (clickable only) | `.card:has(.card-link):hover` (`@media (hover: hover)`) | Shadow steps up one level (`raised`); border strengthens (`outlined`) | — |
| Focus (clickable only) | `.card:has(.card-link:focus-visible)` | Global focus ring drawn at the card boundary via the focus-ring tokens | Link receives focus; name is the heading text |

Non-clickable cards have no interactive states. `:has()` is Core tier
([03](../03-browser-support-policy.md)).

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-card-bg` | `var(--wel-color-surface-raised)` | — | `plain` inherits the surrounding surface |
| `--wel-card-ink` | `var(--wel-color-ink)` | — | |
| `--wel-card-radius` | `var(--wel-radius-surface)` | — | Media part inherits the radius on its outer corners |
| `--wel-card-padding` | `var(--wel-space-5)` | — | Applied per part, so media can bleed to the edge |
| `--wel-card-gap` | `var(--wel-space-3)` | — | Rhythm between parts |
| `--wel-card-border` | `var(--wel-color-border)` | — | Painted by `outlined`; `transparent` otherwise |
| `--wel-card-shadow` | `var(--wel-shadow-1)` | — | Painted by `raised`; hover derives the next shadow step |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything. Variants, the stretched-link pattern, `:has()` hover/focus treatments, and
subgrid row alignment are all Core-tier CSS.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| None | — | — | — |

### JS enhancement

None.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** none required — semantics come from the elements chosen (`<article>`,
  headings, the link). The stretched link's accessible name is its text content (the
  heading), never the whole card's text.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Moves through the card's links/buttons in DOM order (native) |
| Enter | Activates the focused link (native) |

- **Focus behaviour:** normal tab order; the stretch does not alter it. No trap
  participation.
- **Forced colors:** surface/shadow distinctions collapse; all variants render a border
  (`CanvasText`) under `forced-colors: active` so the card boundary survives. Links map
  to `LinkText`.
- **Reduced motion:** hover shadow/border changes transition through the `--wel-motion`
  multiplier; at `0` they are instant.
- **Increased contrast (`prefers-contrast: more`):** token-layer handled ([09](../09-accessibility.md)) — the `outlined` border strengthens via the border tokens; no component-specific treatment.
- **Reduced transparency (`prefers-reduced-transparency: reduce`):** None — elevation uses shadows, not translucent surfaces.
- **Contrast:** `--wel-card-bg`/`--wel-card-ink` is a guaranteed 4.5:1 pairing from the
  [05](../05-design-tokens.md) table; `outlined` border meets 3:1 against both card and
  page surface.
- **WCAG 2.2 implicated:** 2.4.4 Link Purpose — the stretched link's name is the heading;
  2.5.8 Target Size — trivially met by the stretched area.

## Container behaviour

The card queries the nearest `layout` container. Below **20rem** it is single-column
(media stacked above text) — this is also the sensible minimum (~14rem absolute floor).
At **≥ 30rem** the card may switch media inline beside text (documented pattern using the
same class; no attribute needed — it is container-driven).

**Subgrid participation: yes, opt-in via the parent primitive.** When placed in
`.grid[data-align="rows"]` ([06](../06-layout-system.md)), the primitive makes each card
`display: grid; grid-template-rows: subgrid; grid-row: span 3`, so header, body, and
footer tracks align across every card in a row regardless of content length. The card's
contribution: its parts are direct children (no extra wrappers), and the card keeps
working when it *isn't* in an aligned grid — its default layout is a plain flow of the
same children. Aligned grids assume uniform anatomy across cards in the grid; cards with
media in an aligned grid should place the media inside the header part (see Open
questions). This is the named exception to "components never depend on parent layout"
([07](../07-component-model.md)).

## Composition

May contain: text content, media (`.frame`), badges, buttons (arranged by `.cluster` in
the footer), links. Internal part rhythm is the card's own (`--wel-card-gap`); content
inside the body uses `.stack`. May be contained by: `.grid` (the primary habitat),
`.sidebar-layout`, `.switcher`, any flow context. Cross-component influence via tokens
only — a card may set `--wel-button-bg` for its subtree, never select `.button`. Forbidden:
`.card` inside `.card`; more than one `.card-link`; interactive elements relying on being
reachable *under* the stretched link area without `position: relative`.

## Open questions

- Aligned grids and media: the `.grid[data-align="rows"]` rule spans a fixed 3 tracks.
  Should a fourth (media) track variant exist on the primitive (`data-align="rows-media"`
  or a `--wel-grid-rows` knob), or is "media lives in the header part" an acceptable
  constraint for v1?
- Horizontal card at ≥ 30rem: automatic (container-driven) or opt-in via a
  `data-layout="inline"` axis? Automatic is the CQ-first doctrine, but authors may want
  tall cards in wide containers.

## References

Bootstrap `.card` — `.card-img-top`, `.card-body`, `.card-title` class-per-element,
equal-height rows via flex utilities or truncation, clickable cards via the
`.stretched-link` utility. We differ: subgrid row alignment solves the ragged-card
problem structurally (headers/footers align across a row, no truncation), variants are
one attribute axis ([ADR-0001](../decisions/ADR-0001-variant-syntax.md)) themed by
tokens, and the stretched link is a specified card part with documented trade-offs rather
than a bolt-on utility.

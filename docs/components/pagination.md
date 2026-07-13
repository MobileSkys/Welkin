# Component: Pagination

| | |
|---|---|
| **Status** | Draft |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

Navigation between pages of a paginated collection — search results, article archives,
long tables. Every page is a URL; pagination is **navigation, not action**, so it is
links in a `<nav>`, never buttons. Do NOT use for wizard/step progress (a stepper is a
different pattern), for infinite scroll (a JS application concern outside the toolkit),
or for tab-like content switching (tabs component).

## Anatomy

```
┌─ root (nav.pagination) ────────────────────────────────────┐
│  ol:                                                       │
│  [‹ Previous] [1] […] [4] [5*] [6] […] [12] [Next ›]       │
│                        * = aria-current="page"             │
└─────────────────────────────────────────────────────────────┘
```

Parts: root (`<nav>`); list (`<ol>` — page order is meaningful); page link; current page
link (`aria-current="page"`); prev/next links; truncation ellipsis item (presentational).

## HTML structure

```html
<nav class="pagination" aria-label="Pagination">
  <ol>
    <li><a href="/news?page=4" rel="prev">‹ Previous</a></li>
    <li><a href="/news?page=1">1</a></li>
    <li aria-hidden="true">…</li>
    <li><a href="/news?page=4">4</a></li>
    <li><a href="/news?page=5" aria-current="page">5</a></li>
    <li><a href="/news?page=6">6</a></li>
    <li aria-hidden="true">…</li>
    <li><a href="/news?page=12">12</a></li>
    <li><a href="/news?page=6" rel="next">Next ›</a></li>
  </ol>
</nav>
```

Rationale: `<nav aria-label="Pagination">` is a named landmark ("navigation" comes from
the role — don't write "Pagination navigation"). `<ol>` because sequence is the content.
The current page stays a **link** with `aria-current="page"` — consistent target
rhythm, and AT announces "current page". The ellipsis is purely presentational — it
answers nothing a link answers — so its `<li>` is `aria-hidden="true"`; removing it from
the list count is the intent, not a side effect. Prev/next carry `rel="prev|next"` and
visible text (arrows alone fail on clarity; icon-only needs `aria-label`). **No dead
links:** on page 1 the Previous item is simply omitted (preferred) or rendered as
inert `<span>` text — never an `<a>` without `href` styled to look disabled.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-variant` | *(none in v1)* | One visual style; theme via tokens |
| `data-size` | *(absent)* = `md`, `sm` | Item padding/font step; `sm` still meets 24 px target size |

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover | `:hover` (`@media (hover: hover)`) | Item bg → `--wel-color-accent-tint` | — |
| Focus | `:focus-visible` | Global focus ring | — |
| Active | `:active` | `--wel-color-accent-active`-derived bg | — |
| Current page | `[aria-current="page"]` | `--wel-pagination-current-bg` fill + `-current-ink` | `aria-current="page"` |

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-pagination-gap` | `var(--wel-space-1)` | — | Between items |
| `--wel-pagination-item-ink` | `var(--wel-color-ink-muted)` | — | Page links at rest |
| `--wel-pagination-current-bg` | `var(--wel-color-accent)` | — | |
| `--wel-pagination-current-ink` | `var(--wel-color-accent-contrast)` | — | Pairing partner of `-current-bg` ([05](../05-design-tokens.md) pairing table) |
| `--wel-pagination-radius` | `var(--wel-radius-control)` | — | |
| `--wel-pagination-item-size` | `2.5rem` | — | Min inline/block size of items; floor is 24 px even at `sm` |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything. Links, states, container-driven compaction — fully realised in Core CSS.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| None | — | — | — |

### JS enhancement

None.

## Accessibility

- **Roles/ARIA:** `<nav>` landmark with `aria-label="Pagination"` (unique per page — if
  two paginated regions exist, label them distinctly). `aria-current="page"` on exactly
  one link. Ellipsis items `aria-hidden="true"`. `rel="prev"`/`rel="next"` on the
  stepping links.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Move through page links (native) |
| Enter | Follow link (native) |

- **Focus behaviour:** normal tab order; no trap participation. Focus lands on the new
  document after navigation — no client-side focus management exists or is needed.
- **Forced colors:** the current page is a background-only state in normal rendering, so
  per the rule in [09](../09-accessibility.md) it gains a forced-colors-visible
  treatment: under `@media (forced-colors: active)` the current link gets a
  `--wel-border-width-strong` solid border (and underline retained), links map to
  `LinkText`, current-page border to `CanvasText`. No `forced-color-adjust` overrides.
- **Reduced motion:** no motion in this component; hover/active transitions route
  through `--wel-motion` and collapse to instant at `0`.
- **Contrast:** `-current-bg`/`-current-ink` is a guaranteed 4.5:1 pairing; rest-state
  link ink on surface ≥ 4.5:1; hover tint stays within the pairing table's worst-case
  bounds.
- **WCAG 2.2 criteria specifically implicated:** 2.5.8 Target Size (Minimum) — every
  item ≥ 24×24 CSS px including `data-size="sm"`; default `--wel-pagination-item-size`
  is 2.5rem (40 px) with `--wel-pagination-gap` spacing, comfortably clearing the
  criterion without relying on the spacing exception. 2.4.8 Location (AAA, noted) —
  `aria-current` provides it for free.

## Container behaviour

Queries the nearest `layout` container ([06](../06-layout-system.md)). Below **26rem**
the numbered links (and ellipses) are hidden, leaving Previous / current page / Next — a
fully usable stepper. Hiding uses `display: none`, so AT and keyboard see exactly what
sighted users see; the current-page link remains as the "you are here" anchor. The list
also wraps (`flex-wrap`) as a safety net between full and compact arrangements.
Sensible minimum: ~14rem (prev + current + next at `md`). No subgrid participation.

## Composition

May contain: only its own list and links (plain text labels; optional inline SVG arrows
in prev/next). May be contained by: `.center`, `.stack`, card footers, below `.table`
scrollers. Forbidden: buttons instead of links; nesting pagination inside another
`<nav>`; more than one `aria-current="page"`.

## Open questions

- Compact arrangement: should it swap in a static "Page 5 of 12" text node (requires
  server markup for both arrangements, CSS shows one) — worth the duplication?
- Is the 26rem compaction breakpoint right, or should it scale with `data-size`?
- Ellipsis glyph: `…` text vs generated content — text keeps it copy-paste visible;
  generated content would remove it from the accessibility tree without `aria-hidden`.
  Currently: real text + `aria-hidden` on the `<li>`.

## References

Bootstrap: `.pagination > .page-item > .page-link`, with `.active` and `.disabled`
classes — disabled *links* styled as inert but still focusable unless authors also add
`tabindex="-1"` and `aria-disabled` by hand, and `.active` conveys current page by class
+ background colour only. We differ: no wrapper classes (bare `<ol>`+links styled by the
one `.pagination` class), state expressed in platform vocabulary (`aria-current="page"`,
[07](../07-component-model.md) state rules), no disabled-link pretence (omit the item
instead), an explicit forced-colors treatment for the current page (border, per
[09](../09-accessibility.md)), guaranteed 2.5.8 target sizes via a token floor, and
container-query compaction instead of Bootstrap's fixed single arrangement.

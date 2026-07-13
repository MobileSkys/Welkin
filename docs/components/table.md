# Component: Table

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Pure CSS / JS-enhanced hybrid |
| **Stability** | Experimental |
| **Version target** | v1 |

The tier is a hybrid by design: the table itself — styling, density, variants, the
responsive scroll strategy, sticky column/header — is **Pure CSS** and complete without
JavaScript. Sortable headers are a strictly optional **JS-enhanced add-on**
(data-attribute upgrader per [ADR-0011](../decisions/ADR-0011-js-delivery-mechanism.md))
with its own ladder justification below. A project that never loads the sort module has a
finished component, not a degraded one.

## Purpose

Presentation of genuinely tabular data — records with shared attributes where row/column
lookup matters (invoices, results, comparisons). Do NOT use for layout (that era is
over), for key–value pairs of a single record (use a description list styled by `.prose`
or a definition pattern), or for card-shaped collections (use `.grid` of cards). If the
data reads naturally as sentences or cards, it is not a table.

## Anatomy

```
┌─ scroller (.table-scroller) ──────────────────────────────┐
│ ┌─ root (.table) ───────────────────────────────────────┐ │
│ │  caption                                              │ │
│ │  ┌─ header row (thead) ────────────────────────────┐  │ │
│ │  │ th [sort button when enhanced]  th  th          │  │ │
│ │  └─────────────────────────────────────────────────┘  │ │
│ │  body rows (tbody > tr > td)                          │ │
│ │  [footer row (tfoot)?]                                │ │
│ └───────────────────────────────────────────────────────┘ │
└──────────────────────────── ← horizontal scroll if needed ┘
```

Parts: scroller (overflow wrapper, required); root `<table>`; caption (required — it
labels both the table and the scroll region); header cells; body rows; optional footer;
sort button (exists only after JS upgrade).

## HTML structure

```html
<div class="table-scroller" tabindex="0" role="region" aria-labelledby="inv-caption">
  <table class="table" data-variant="striped" data-size="sm">
    <caption id="inv-caption">Q3 invoices</caption>
    <thead>
      <tr>
        <th scope="col">Invoice</th>
        <th scope="col">Client</th>
        <th scope="col">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">#1042</th>
        <td>Acme</td>
        <td>€1,200</td>
      </tr>
    </tbody>
  </table>
</div>
```

Rationale: a real `<table>` with `<caption>`, `scope`-ed `<th>` gives assistive
technology the row/column association model for free — the entire point of the element.
The scroller is part of the component contract: `tabindex="0"` makes the overflow
keyboard-scrollable, and `role="region"` + `aria-labelledby` (pointing at the caption)
names it, so keyboard users aren't handed an anonymous focus stop. Documented trade-off:
the scroller is focusable even when nothing overflows; acceptable, and removable by
authors who know a table never overflows.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-variant` | *(absent)* = `default`, `striped`, `ruled` | `default`: horizontal row rules only. `striped`: alternate-row tint (rules retained faintly). `ruled`: full row+column grid lines |
| `data-size` | *(absent)* = `md`, `sm`, `lg` | Cell padding density step; `sm` for data-dense screens |
| `data-sticky` | `first-column`, `header`, `both` | Pins the row-header column and/or `<thead>` while the scroller scrolls |
| `data-hover` | *(boolean, present/absent)* | Row hover highlight; only for tables whose rows are interactive targets |
| `data-sortable` | *(boolean, present/absent)* | Opt-in marker for the sorting upgrader (see JS enhancement) |

Axes compose freely. `data-sticky="first-column"` presumes the first cell of each row is
the `scope="row"` header — sticking an arbitrary data column is unsupported.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover (row) | `[data-hover] tbody tr:hover` (`@media (hover: hover)`) | Row bg shifts to `--wel-table-hover-bg` | — |
| Focus | `:focus-visible` (scroller, sort buttons) | Global focus ring | — |
| Current row | `tr[aria-current="true"]` | Accent-tint bg + `--wel-border-width-strong` inline-start bar (not bg-only) | `aria-current` |
| Sorted | `th[aria-sort="ascending"]`, `th[aria-sort="descending"]` | Direction arrow (generated content, `currentColor`); header ink strengthens | `aria-sort` |
| Busy | `.table[aria-busy="true"]` | `tbody` at reduced opacity; pointer-events off | `aria-busy` |

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-table-border` | `var(--wel-color-border)` | — | Rules/grid lines; `ruled` uses it for both axes |
| `--wel-table-bg` | `var(--wel-color-surface)` | — | Also backs sticky cells (must be opaque so content scrolls *under*) |
| `--wel-table-stripe-bg` | `var(--wel-color-surface-sunken)` | — | `striped` alternate rows |
| `--wel-table-hover-bg` | `var(--wel-color-accent-tint)` | — | `data-hover` rows |
| `--wel-table-head-ink` | `var(--wel-color-ink-muted)` | — | Header cells; strengthens to `--wel-color-ink` when sorted |
| `--wel-table-cell-padding-block` / `-inline` | `var(--wel-space-2)` / `var(--wel-space-3)` | — | Scaled by `data-size` |
| `--wel-table-sticky-shadow` | `var(--wel-shadow-1)` | — | Edge shadow on stuck column/header (scroll affordance) |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything visual and the whole responsive strategy. The scroller
(`overflow-x: auto` — physical form as a permitted
[ADR-0009](../decisions/ADR-0009-logical-properties-rtl.md) exception until logical
`overflow-inline` graduates) preserves the table's two-dimensional grid at any container
width; `position: sticky` (long-established) implements `data-sticky` inside it.

**Explicitly rejected:** the "responsive table" pattern that sets `display: block` on
rows/cells to stack them at narrow widths. Overriding table display types strips the
table's implicit ARIA roles in most engines, destroying the row/column-header
associations that make the element worth using — the cure kills the patient. If a dataset
reads better stacked, that is a different component (a list of cards), not a table in a
costume. This is the container-query doctrine applied honestly: the correct response to a
narrow container is scrolling that preserves meaning, not re-rendering that destroys it.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| Scroll-driven animations | `@supports (animation-timeline: scroll())` | `--wel-table-sticky-shadow` fades in only once the scroller has actually scrolled (true scroll affordance) | Shadow permanently visible on stuck cells; per the scroll-driven row in [03](../03-browser-support-policy.md) — effect absent, content unaffected |

### JS enhancement

- **Ladder justification:** client-side sorting is **data manipulation** — reading cell
  values, comparing them, and reordering DOM rows. Rung 1 is unreachable: CSS cannot read
  or compare content, and visual-only reordering (`order`) would desynchronise visual and
  AT/source order, which is banned. Rung 2 offers no platform primitive for sortable
  tables. Rung 3 by necessity, not convenience.
- **Element/module:** `[data-sortable]` data-attribute upgrader per
  [ADR-0011](../decisions/ADR-0011-js-delivery-mechanism.md); module
  `welkincss/table-sort.js`, ≤ 2 KB min+gzip. For each `<th>` opting in via `data-sort`, the
  module wraps the header content in a real `<button>` (keyboard + AT for free). If the
  header already contains a server-side sort link, the module enhances that link in place
  (intercepts activation) so the URL remains the fallback.
- **Attributes (config in):**

| Attribute | On | Values | Meaning |
|-----------|----|--------|---------|
| `data-sortable` | `table.table` | boolean | Enables the upgrader |
| `data-sort` | `th[scope="col"]` | `text`, `number`, `date` | Column is sortable; comparator type |
| `data-sort-value` | `td` | any | Machine-readable value overriding cell text (e.g. ISO date) |
| `aria-sort` | `th` | `ascending`, `descending` | Pre-set by the server to declare initial sort; the module respects it |

- **Events (state out):**

| Event | Bubbles | Cancelable | `detail` |
|-------|---------|------------|----------|
| `wel-sort` | yes | yes | `{ columnIndex, direction }` — fired before reordering; `preventDefault()` suppresses client-side reorder so the app can sort server-side instead |

- Cycling: activating a header applies `aria-sort="ascending"`; activating again flips to
  `descending`, and so on (asc ⇄ desc after first sort). Exactly one `<th>` carries
  `aria-sort` at a time; the module removes it from the previous column. All sort state
  lives in `aria-sort` — CSS styles it, no injected classes.
- **No-JS baseline:** a plain, complete, readable table. Where the server renders sort
  links in headers, those links keep working unchanged — server-side sorting *is* the
  baseline for apps that need sorting without JS.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** native table semantics; `<caption>` required; `scope="col"`/`scope="row"`
  on all `<th>`. Scroller: `role="region"` + `aria-labelledby` → caption. Sort headers:
  real `<button>` inside `<th>`, `aria-sort` on the `<th>` (never on the button).
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Reaches the scroller, then any sort buttons / links in cells |
| Arrow keys (scroller focused) | Scroll the overflow container (native) |
| Enter / Space (sort button) | Cycle sort direction (native button activation) |

- **Focus behaviour:** normal tab order; no trap participation. After a client-side
  re-sort, focus stays on the activated sort button (rows move, focus doesn't).
- **Forced colors:** stripe and hover backgrounds are stripped — under
  `forced-colors: active` all variants gain full row rules (`CanvasText`-mapped borders)
  so row separation never depends on background. Sticky-edge shadow is replaced by a
  solid border. Sort arrows use generated-content glyphs in `currentColor`, so they
  survive. Current-row state already carries a border bar (bg-only state forbidden per
  [09](../09-accessibility.md)).
- **Reduced motion:** no motion in Core. The Enhanced scroll-shadow fade routes through
  `--wel-motion`; at `0` the shadow state is instant.
- **Increased contrast (`prefers-contrast: more`):** token-layer handled ([09](../09-accessibility.md)) — row rules and grid lines strengthen via the border tokens; no component-specific treatment.
- **Reduced transparency (`prefers-reduced-transparency: reduce`):** None — sticky cells are already required to be opaque.
- **Contrast:** cell ink on `--wel-table-bg` and on `--wel-table-stripe-bg` are both
  guaranteed 4.5:1 pairings from the [05](../05-design-tokens.md) table — the stripe
  token is chosen from the pairing table, not eyeballed.
- **WCAG 2.2 criteria specifically implicated:** 1.3.1 Info and Relationships (the whole
  point of the element; the anti-stacking rule defends it), 1.4.10 Reflow (2-D data
  tables are the named exception — horizontal scroll is conformant), 2.1.1 Keyboard
  (focusable scroller), 2.5.8 Target Size (sort buttons ≥ 24 px block-size at every
  `data-size`).

## Container behaviour

None in the rearrangement sense, deliberately: the table never changes shape with
container width — the scroller absorbs all widths, per the doctrine discussion above.
Sensible minimum: the scroller works at any width; the table's own minimum is its
intrinsic column content. No subgrid participation (a table is its own grid model).

## Composition

May contain: text, links, badges, small buttons in cells (targets ≥ 24 px). May be
contained by: `.center`, `.stack`, cards (card must not constrain the scroller's
overflow). Forbidden: tables inside tables; layout primitives inside cells to fake
column structure; `.table` without its scroller wrapper in any context where overflow is
possible.

## Open questions

- Does the sort cycle ever return to "unsorted" (third activation restores source
  order)? Leaning no — asc ⇄ desc is APG-consistent and cheaper than caching source
  order inside 2 KB.
- Numeric-column alignment (`text-align: end` + `font-variant-numeric: tabular-nums`):
  automatic via `data-sort="number"`, or a separate per-column author concern?
- Should the scroller grow a dev-mode warning when `tabindex`/labelling is missing?

## References

Bootstrap: `.table .table-striped .table-hover .table-sm` modifier classes plus a bare
`.table-responsive` div — no focusable/labelled scroll region, no sticky column, and no
sorting at all (delegated to third-party plugins). Many "responsive table" tutorials use
`display: block` cell-stacking, which breaks table semantics. We differ: attribute axes
([ADR-0001](../decisions/ADR-0001-variant-syntax.md)), an accessible scroll region as
part of the component contract, sticky column/header in pure CSS, a documented refusal
to stack cells, and a ≤ 2 KB sort upgrader with `aria-sort` as its single source of
truth and a server-side-sort escape hatch (`wel-sort` is cancelable).

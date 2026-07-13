# ADR-0013 — Containment collapse: cluster guardrail and composition rules

**Status:** Accepted

## Context

Every layout primitive establishes `container-type: inline-size`
([ADR-0006](ADR-0006-container-query-first-responsiveness.md)). Inline-size containment
means the element's contents contribute **nothing** to its intrinsic inline size:
`min-content`, `max-content`, and therefore `flex-basis: auto` and `auto` grid tracks all
resolve to **zero**. A primitive placed in any shrink-to-fit or content-sized context
collapses to zero width while its contents overflow.

First production hit: T-38's navbar demo composed `.navbar-actions` with `.cluster`; the
cluster collapsed and the sign-up button painted past the bar edge (fixed in `de25153`).
T-62 audited the whole system:

| Primitive as parent | Child sizing | Nested primitive safe? |
|---------------------|--------------|------------------------|
| `.stack`, `.cover` | column flex, cross-axis stretch | yes |
| `.switcher` | `flex-grow: 1` + calc basis on every child | yes |
| `.sidebar-layout` | explicit `flex-basis` on both children | yes |
| `.grid` | `minmax(min(100%, min), 1fr)` tracks | yes |
| `.center` | explicit content-column track | yes |
| `.frame` | media children sized `100%` | yes |
| `.cluster` | **`flex-basis: auto` (content-sized)** | **no — collapses to 0** |

No component establishes containment, and component parts that use content-sized tracks
(e.g. alert's `auto 1fr` icon column) hold leaf content only. Within the system, the
collapse is reachable **only** through `.cluster`; outside it, any author-authored flex
row, `auto` grid track, float, `inline-block`, absolutely-positioned box, or table cell
reproduces it.

## Decision

1. **Cluster guardrail:** `.cluster` gives direct primitive children `flex-grow: 1`
   (zero-specificity `:where()`, `layout` layer). Growing is the only
   content-independent size a wrapping row can give a contained box; since the collapsed
   render is never intent, the rule can only replace a broken outcome. `flex-basis`
   stays `auto`, so an explicit `inline-size` on the item is still honoured as its
   basis, and any author rule overrides the guardrail.
2. **Composition rules** (documented in [06-layout-system.md](../06-layout-system.md)):
   in author-controlled contexts a primitive must receive a content-independent inline
   size — `flex-grow`/explicit `flex-basis` as a flex item, a sized (`fr`/`minmax`)
   track as a grid item — and must not be placed in shrink-to-fit contexts (float,
   `inline-block`, absolute positioning, table cell) without an explicit `inline-size`.
3. **Component parts lay out their own leaf children** (navbar-actions pattern) rather
   than delegating to a nested primitive where the part is itself an auto-sized flex
   item; specs note this in Composition sections where relevant.

## Consequences

- Primitive-in-cluster renders usefully by default; multiple primitive siblings share
  the line equally (each `flex-grow: 1`).
- A cluster inside an **author** flex row still needs author sizing — the guardrail
  cannot see arbitrary parents; the doc rule covers it.
- The guardrail is a behavioural change to shipped CSS, but only in the always-broken
  case, so no working layout can regress.
- Doc 06 gains the safe-by-construction matrix above so authors can compose without
  re-deriving containment behaviour.

## Alternatives considered

- **Drop containment from some primitives** — rejected: breaks doctrine #3 (every
  primitive is queryable); which primitives are "safe" to strip is content-dependent.
- **Documentation only** — rejected: the footgun stays live in the one sanctioned
  composition context (`.cluster` is *the* horizontal grouping tool); T-38 shows real
  markup hits it.
- **`min-inline-size` floor on primitives** — rejected: any fixed floor is arbitrary,
  breaks narrow-container correctness (the flagship claim), and `100%` forces full-line
  wrap where growing into the remaining line space is the common intent.
- **`flex: 1 1 0` guardrail** — rejected: basis `0` would discard an author's explicit
  `inline-size` (with containment the automatic minimum is `0`, so nothing clamps it
  back); `flex-grow` alone preserves it.

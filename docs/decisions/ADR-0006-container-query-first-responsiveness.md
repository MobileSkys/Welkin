# ADR-0006 — Container-query-first responsiveness

**Status:** Accepted

## Context

Bootstrap's responsive model — viewport breakpoints + a 12-column class grid — encodes
layout decisions against the *screen*, so a component correct in the main column is wrong
in a sidebar, modal, or dashboard cell, and markup fills with `col-md-6 col-lg-4`
bookkeeping. Container queries are Baseline Widely Available and remove the root cause:
components can respond to the space they actually occupy.

## Decision

1. **Components respond exclusively to their container.** All component responsiveness is
   `@container` queries (breakpoints chosen per component, in `rem`, documented in its
   spec).
2. **Viewport media queries are restricted** to page-level scaffolding (the `.page`
   shell) and user-preference queries (`prefers-*`, `forced-colors`).
3. **Layout primitives are the containment providers**: every primitive sets
   `container-type: inline-size; container-name: layout`. Components query the nearest
   `layout` container. The page shell provides `container-name: page` for the rare
   page-scale query.
4. Additional named containers may be declared by component specs where a component must
   query a specific ancestor (e.g. a navbar querying `page`, not its immediate wrapper).

## Consequences

- **Correct-by-placement components** — the flagship differentiator: drop a card grid in
  a 300px sidebar and it single-columns itself; no author intervention, no breakpoint
  audit when a layout changes.
- `container-type: inline-size` applies inline-size containment: the element's inline
  size can no longer be determined by its contents. This is why **primitives** establish
  containers (their widths come from their parent context by design) rather than
  arbitrary elements — the rule that prevents containment surprises. Documented
  prominently in [06-layout-system.md](../06-layout-system.md).
- Components tested in isolation behave identically in situ — testing story improves.
- Zoom reflow (WCAG 1.4.10) inherits the same correctness: shrinking effective container
  widths triggers the same adaptations ([09-accessibility.md](../09-accessibility.md)).

## Alternatives considered

- **Viewport breakpoints + column grid (Bootstrap model)** — the named anti-goal; wrong
  abstraction, markup bookkeeping, visual monoculture.
- **Hybrid (viewport grid + optional CQs)** — rejected: two responsive models doubles the
  mental load and lets the old habit crowd out the better one.
- **Element/resize-observer JS responsiveness** — rejected on the JS ladder
  ([08-javascript-policy.md](../08-javascript-policy.md)): the platform does this in CSS
  now.

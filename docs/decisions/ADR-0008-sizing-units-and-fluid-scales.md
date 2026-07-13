# ADR-0008 — Sizing: rem-based, fluid clamp() scales; px for hairlines only

**Status:** Accepted

## Context

Bootstrap mixes px and rem; many toolkits pin font sizes in px, which silently overrides
users' browser font-size preferences — an accessibility failure. Welkin also wants density
and typography to be theme-shiftable from a small number of anchor values.

## Decision

1. **rem everywhere** for font sizes, spacing, radii, and component dimensions. The user's
   browser font-size preference scales the entire system. `:root` font-size is never set
   in px (and generally never set at all).
2. **Fluid scales via `clamp()`.** The type scale and space scale are modular scales whose
   steps are `clamp(min, preferred, max)` expressions interpolating between two anchor
   sizes (small-context and large-context). Adjusting the two anchor tokens re-densifies
   the whole system — this is how themes change density without touching components.
3. **px only for hairlines** — 1px borders, dividers, and outline widths where physical
   crispness matters and scaling is undesirable.
4. Scale definitions and the exact step values live in
   [05-design-tokens.md](../05-design-tokens.md).

## Consequences

- Zooming text-only or setting a larger default font size works flawlessly — WCAG 1.4.4
  satisfied structurally rather than by exception ([09-accessibility.md](../09-accessibility.md)).
- Fluidity removes most needs for typographic breakpoints.
- Contributors must resist px muscle-memory; enforced by lint rule
  ([04-css-architecture.md](../04-css-architecture.md)).

## Alternatives considered

- **px-based with zoom reliance** — rejected: ignores font-size preference (a11y).
- **Viewport-unit-only fluid type (`vw` without clamp)** — rejected: breaks zoom (WCAG
  1.4.4 failure) unless mixed with rem inside `clamp()`, which is exactly what we do.
- **Fixed step scale with breakpoint jumps** — rejected: breakpoint bookkeeping is the
  thing we are eliminating ([ADR-0006](ADR-0006-container-query-first-responsiveness.md)).

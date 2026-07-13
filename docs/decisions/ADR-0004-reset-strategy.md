# ADR-0004 — Reset: own minimal reset in `@layer reset`, zero specificity

**Status:** Accepted

## Context

Every toolkit needs a baseline normalisation. Options range from adopting normalize.css /
modern-normalize as a dependency to shipping our own. Welkin additionally requires that all
its styles live in cascade layers and be trivially overridable.

## Decision

Welkin ships its **own minimal reset (~40 lines)** in `@layer reset`, with every selector
wrapped in `:where()` so the entire layer has **zero specificity**. It is documented
line-by-line in [04-css-architecture.md](../04-css-architecture.md).

Scope (in the spirit of modern resets — Bell/Comeau lineage, written fresh for our
baseline):

- `box-sizing: border-box` everywhere
- Margin trimming (no default margins fighting the `.stack` primitive)
- Media defaults (`img, video { max-inline-size: 100%; block-size: auto; display: block }`)
- Form elements inherit typography (`font: inherit`)
- `text-wrap: balance` on headings; `text-wrap: pretty` on paragraphs (Core-tier candy)
- Sensible line-height and text-rendering defaults on `:root`
- `scroll-behavior: smooth` routed through the motion multiplier token
  ([05-design-tokens.md](../05-design-tokens.md))

Explicitly **not** normalize.css: normalize targets legacy browser inconsistencies that do
not exist above our Core baseline ([03-browser-support-policy.md](../03-browser-support-policy.md)).
No external dependency.

## Consequences

- The reset is small enough to audit at a glance and cheap to maintain.
- Zero specificity + lowest layer means nothing a user writes can lose to the reset.
- We own the maintenance (trivial at this size).

## Alternatives considered

- **normalize.css / modern-normalize dependency** — rejected: targets obsolete browsers,
  adds a dependency, not layered/`:where()`-wrapped.
- **Heavy opinionated reset (e.g. full Tailwind preflight-style)** — rejected: opinions
  belong in `base` where they are visible and tokenised, not hidden in the reset.

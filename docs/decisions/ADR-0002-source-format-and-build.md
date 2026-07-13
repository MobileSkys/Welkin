# ADR-0002 — Source format: plain modern CSS, no Sass

**Status:** Accepted

## Context

Bootstrap-era toolkits are authored in Sass because 2012 CSS lacked variables, nesting,
colour functions, and modularity. Modern CSS has native nesting, custom properties,
`@layer`, `color-mix()`, `oklch()`, and `@property`. Welkin's vision is CSS-first and
"no build step required" ([01-vision-and-principles.md](../01-vision-and-principles.md)).

## Decision

Welkin is authored in **plain modern CSS**. There is no preprocessor and no CSS-generating
language. Build tooling — **Lightning CSS** — is used *only* for:

1. Concatenation of source files into the distributed bundles
   ([ADR-0003](ADR-0003-distribution-and-imports.md));
2. Minification of the `.min.css` variants;
3. Safety checks (syntax validation, browser-target lint against the Core baseline).

The build never provides language features. **Source = shippable:** any individual source
file is valid CSS that a browser can load directly.

Where a finite scale needs generating (colour ramps, type scales), the values are written
out in full in the source. If generation ever becomes worthwhile, a small script may
*write the checked-in CSS file* (a docs-phase code generator), never act as a runtime or
build-time language.

## Consequences

- Users can read, learn from, and hand-patch the exact CSS they ship — dogfoods the
  CSS-first philosophy and serves the educator audience.
- Contributors need zero toolchain to edit styles.
- No Sass loops/mixins: repetitive patterns must be designed away (tokens + `color-mix()`
  derivation replaces generated variant classes) rather than generated.
- We accept slightly more verbose source in exchange for zero indirection.

## Alternatives considered

- **Sass** — familiar to Bootstrap migrants; rejected: contradicts the philosophy, hides
  the real CSS, adds a compile barrier, and its two killer features (variables, nesting)
  are now native.
- **PostCSS with future-syntax plugins** — rejected for language features (same
  indirection problem); Lightning CSS covers the legitimate concat/minify/lint needs.

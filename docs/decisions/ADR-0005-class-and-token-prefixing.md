# ADR-0005 — Prefixing: unprefixed semantic classes; prefixed tokens and elements

**Status:** Accepted (prefix string itself pending [02-naming.md](../02-naming.md))

## Context

Toolkits usually prefix classes (`.wel-button`) to avoid colliding with user CSS. But
unprefixed, design-vocabulary class names (`.button`, `.card`) are a headline
designer-friendliness claim ([01-vision-and-principles.md](../01-vision-and-principles.md)).
The collision risk that motivated prefixing is largely neutralised by cascade layers.

## Decision

- **Classes: unprefixed semantic names.** `.button`, `.card`, `.navbar`, `.stack`.
- **Custom properties: prefixed.** `--wel-color-accent`, `--wel-button-bg`. Custom
  properties inherit globally and leak across boundaries; collisions there are silent and
  nasty, so the prefix stays.
- **Custom elements: prefixed.** `<wel-tabs>` — required by the custom-element spec anyway
  (hyphen) and claims a clean namespace.
- **Data attributes: unprefixed standard axes** (`data-variant`, `data-size`,
  `data-tone`) — they are scoped to elements that carry our classes, so collision risk is
  local and visible.

The `wel-`/`--wel-` strings are fixed by the closed naming decision
([02-naming.md](../02-naming.md)): the toolkit is **Welkin**.

## Rationale

Collision safety for classes comes from architecture, not naming: all Welkin rules live in
layers, so a user's existing `.button` rule (unlayered) **always wins** over ours. The
worst case is a user page that already styles `.card` and gets our styles beneath theirs —
visible, debuggable in the Layers panel, and fixable by either side. For an opt-in toolkit
this is acceptable cost for a large legibility win.

## Consequences

- Welkin cannot be safely "sprinkled" onto a large legacy codebase with clashing class
  names. Documented honestly: Welkin is for sites built with it, not retrofitted piecemeal.
- A build-time class-prefixing option for cautious adopters is noted as a **post-v1**
  possibility, out of scope for v1.

## Alternatives considered

- **Prefixed classes** (`.wel-button`) — safer, but sacrifices the core aesthetic; the
  safety it buys is mostly obsolete under `@layer`.
- **Configurable prefix via Sass-style build** — contradicts
  [ADR-0002](ADR-0002-source-format-and-build.md).

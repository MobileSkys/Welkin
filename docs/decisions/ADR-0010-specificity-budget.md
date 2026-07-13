# ADR-0010 — Specificity budget

**Status:** Accepted

## Context

Cascade layers carry all ordering intent in Welkin ([04-css-architecture.md](../04-css-architecture.md)),
which only stays true if specificity inside layers remains flat and predictable. Bootstrap-era
toolkits accumulated selectors like `.navbar-dark .navbar-nav .nav-link.active` that made
overriding a guessing game.

## Decision

| Layer | Max specificity | Notes |
|-------|-----------------|-------|
| `reset`, `base` | 0-0-0 / 0-0-1 | `:where()` wraps anything heavier |
| `layout` | 0-1-0 | Primitive class only |
| `components` | 0-1-0 | Component class + `:where()`-wrapped internals |
| `variants` | 0-2-0 | class + one attribute selector |
| `states` | 0-2-0 | class + pseudo-class/attribute |
| `utilities` | 0-1-0 + `!important` | The only `!important` in the codebase |

Global rules: **no ID selectors anywhere; no `!important` outside `utilities`; no inline
styles in documented markup.** Nested internal selectors use `:where()` on the ancestor
path so depth never adds weight: `.card :where(.card-header) h2` stays 0-1-1.

## The override guarantee

The budget exists to make this provable claim, which the theming doc
([10-theming-and-customisation.md](../10-theming-and-customisation.md)) demonstrates:

> **Any Welkin style can be overridden by a single unlayered class selector.**

Proof sketch: user CSS is unlayered; unlayered beats all layers regardless of specificity;
therefore `.my-button { … }` beats `.button[data-variant="primary"]:hover` in `states`.
Even *within* the layer system, `overrides` outranks every Welkin layer at any specificity.

## Consequences

- Lint-enforceable (stylelint specificity limits per file/layer).
- Some selectors get slightly longer (`:where()` wrappers) in exchange for permanent
  predictability.
- Contributors must express priority by choosing the right layer, never by strengthening
  selectors — this is the intended discipline.

## Alternatives considered

- **No budget, rely on layers alone** — rejected: intra-layer specificity creep still
  produces surprises between a component's own rules.
- **All-zero specificity everywhere (`:where()` everything)** — rejected: needless
  ceremony in `variants`/`states` where flat class+attribute is already predictable.

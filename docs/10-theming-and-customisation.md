---
status: Draft
depends-on: [04-css-architecture.md, 05-design-tokens.md]
---

# 10 — Theming & Customisation

The designer-facing payoff. Everything in 04 and 05 exists so this document can be short.

## Philosophy

> **A theme is a token file. Nothing else.**

A Welkin theme is a stylesheet containing only custom-property declarations (semantic and,
optionally, primitive tokens). No selectors targeting components, no specificity, no
`!important`. If a "theme" contains a component selector, it isn't a theme — it's an
override, and it belongs at level 3 or in the escape hatches below.

## The three customisation levels

### Level 1 — Retheme the system (semantic tokens on `:root`)

The 80% case. Set brand colour, type, shape, density:

```css
/* my-brand.css — a complete Welkin theme */
:root {
  --wel-color-accent: oklch(60% 0.19 145);        /* brand green */
  --wel-text-font-body: "Inter", system-ui, sans-serif;
  --wel-text-font-display: "Fraunces", serif;
  --wel-radius-control: 0.25rem;                  /* squarer buttons/inputs */
  --wel-radius-surface: 1rem;                     /* rounder cards */
  --wel-space-anchor-min: 0.85rem;                /* denser layouts */
}
```

**The 10-line brand retint, demonstrated:** setting `--wel-color-accent` alone re-derives
hover and active shades, focus ring, tinted backgrounds, and selection colours via the
`color-mix()`/relative-colour formulas in [05-design-tokens.md](05-design-tokens.md).
Bootstrap's equivalent is recompiling Sass or overriding dozens of enumerated hover/active
values.

Dark mode needs no separate theme: brand tokens are defined with `light-dark()`, so a
theme sets both halves at the definition site
([ADR-0007](decisions/ADR-0007-dark-mode-mechanism.md)).

### Level 2 — Scoped themes (`[data-theme]` subtrees)

Any token block can scope to a subtree. Two orthogonal uses:

- **Scheme pinning:** `[data-theme="dark"]` pins `color-scheme: dark` for a subtree
  (dark hero on a light page) — mechanism in ADR-0007.
- **Named sub-brands:** `[data-theme="campaign"] { --wel-color-accent: … }` restyles a
  section without touching the page theme. Inheritance does the rest.

### Level 3 — Component-token surgery (one-offs)

Component tokens ([05-design-tokens.md](05-design-tokens.md) tier 3) are the sanctioned
one-off hook — scoped, inline if need be, still no selectors into component internals:

```css
.pricing .button { --wel-button-radius: 999px; }  /* pill buttons here only */
```

You are setting the component's published knobs (its spec's "Tokens consumed" table is
the contract), not fighting its CSS.

## Escape hatches (when tokens aren't enough)

Both exist by design; use in this order:

1. **The `overrides` layer.** `@layer overrides { … }` outranks every Welkin layer while
   keeping your code inside the layer system.
2. **Unlayered CSS.** Any plain rule you write beats all Welkin layers at any specificity
   ([ADR-0010](decisions/ADR-0010-specificity-budget.md) proves the guarantee: one class
   selector overrides anything). This is a feature — document, don't apologise.

## What we promise not to break

Semver-governed API surface ([11-docs-site-and-dx.md](11-docs-site-and-dx.md)):

- Token names and their tier placement
- The `@layer` order string
- Component class names, part names, and variant/axis attribute values
- Custom-element tag names, attributes, events

A theme written against 1.x keeps working across all 1.x releases.

## Re-verifying contrast after theming

Welkin's shipped pairings guarantee WCAG contrast
([09-accessibility.md](09-accessibility.md)); changing tokens transfers that duty to the
theme author. The token doc's pairing table lists which tokens participate in guaranteed
pairings; the docs-site theme playground ([11-docs-site-and-dx.md](11-docs-site-and-dx.md))
recomputes pairing ratios live as you edit — re-check any pairing whose member you changed.
Rule of thumb: keep accent lightness within the band noted in the pairing table and the
derived shades stay safe.

## Anti-pattern gallery

| Anti-pattern | Why it bites | Instead |
|--------------|--------------|---------|
| `.button[data-variant="primary"]:hover { background: … !important }` | Fights the derivation system; breaks on refactor | Set `--wel-color-accent` (L1) or `--wel-button-bg` (L3) |
| Overriding primitives to retheme (`--wel-blue-500: green`) | Primitives are palette, not intent; semantic mappings may bypass the hue you renamed | Override semantic tokens |
| Copying a component's CSS into your sheet and editing | Forks the component; misses fixes | Tokens, then escape hatches |
| Selector-into-internals (`.card > div:nth-child(2)`) | Internals are not API; part structure may change | Part tokens / part classes from the spec |
| Theme stylesheets containing component selectors | It's not portable, not auditable, not a theme | Keep themes to token declarations |

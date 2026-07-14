# ADR-0007 — Dark mode: `color-scheme` + `light-dark()` on semantic tokens

**Status:** Accepted (amended 1.0.1 — see "Amendment: pinning requires re-declaration")

## Context

Toolkits traditionally implement dark mode as a duplicated token block under
`@media (prefers-color-scheme: dark)` plus a `[data-bs-theme="dark"]`-style attribute
override — two parallel definitions per token, drift guaranteed. CSS now offers
`color-scheme` and the `light-dark()` function (Baseline Newly Available since 2024).

## Decision

1. `:root { color-scheme: light dark }` — declares both schemes supported; the UA picks
   per user preference and renders form controls, scrollbars, and system colours
   accordingly for free.
2. **Every semantic colour token is defined once** with both values:
   `--wel-color-surface: light-dark(<light>, <dark>)`.
3. **Manual override** = pinning the scheme on any subtree:
   `[data-theme="dark"] { color-scheme: dark }` (and `light` likewise). Every
   `light-dark()` token below that node follows automatically. This gives page-level
   toggles *and* scoped mixed-mode regions (a dark hero on a light page) with one
   mechanism.
4. A JS toggle merely sets `data-theme` and persists it; no class flipping, no token
   swapping.

## Fallback stance

`light-dark()` is Newly-Available-adjacent (Baseline mid-2024). It is treated as
**core-eligible pending the Phase 1 graduation audit**
([ADR-0012](ADR-0012-feature-graduation-criteria.md)). If the audit fails, the documented
fallback is: unsupporting browsers resolve to the *light* palette (achieved by
falling-back token definitions preceding the `light-dark()` redefinition), i.e. static
light — functional, never broken. This fallback text lives in the Enhanced table of
[03-browser-support-policy.md](../03-browser-support-policy.md) until graduation.

## Consequences

- Zero duplicated token blocks; dark values sit beside light values at the definition
  site — drift is structurally impossible.
- Non-colour dark adjustments (softer shadows) hang off tokens that are themselves
  `light-dark()`-valued (`--wel-shadow-color`), keeping the single-definition property.
- Contrast pairings ([05-design-tokens.md](../05-design-tokens.md)) must be verified in
  both schemes — the pairing table carries both ratios.

## Alternatives considered

- **Duplicated blocks (`@media` + attribute override)** — rejected: two sources of truth
  per token; the `light-dark()` mechanism exists precisely to kill this.
- **Dark as a separate theme file** — rejected: makes dark mode an install decision
  instead of a user preference; violates "a theme is a token file" only in the breach —
  dark/light are *modes* of every theme, not themes.
- **CSS variables swapped by JS** — rejected: requires JS for a preference the platform
  handles declaratively (anti-goal).

## Amendment: pinning requires re-declaration (1.0.1, T-84)

As shipped in 1.0.0, point 3 was inert for Welkin's own tokens: the semantic colour
tokens are typed (`@property "<color>"` — the Fallback stance above), and a typed custom
property resolves `light-dark()` (and the accent derivations) at computed-value time **on
the element that declares it**. Descendants inherit the already-resolved colour, so a
subtree that only pinned `color-scheme` re-rendered native widgets but kept the outer
scheme's token values. The docs-site playground's per-scheme contrast probes were bitten
by the same mechanism (both columns silently computed the same scheme).

Fix: the token blocks in `tokens/color.css` and `tokens/radius-border-shadow.css` declare
on `:root, [data-theme]`, so every `[data-theme]` subtree root re-declares — and therefore
re-resolves — the full palette against its own `color-scheme` and locally cascaded accent.
The scheme-pin rules moved after the token block (equal specificity; source order lets
`color-scheme: dark` beat the block's `color-scheme: light dark`).

Consequence for themes: declare on `:root, [data-theme]`, not `:root` alone, or the theme
is shadowed inside pinned/named subtrees ([10-theming-and-customisation.md](../10-theming-and-customisation.md), Level 1).

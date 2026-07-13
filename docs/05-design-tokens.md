---
status: Draft
depends-on: [02-naming.md, 03-browser-support-policy.md, 04-css-architecture.md]
---

# 05 — Design Tokens

Tokens are the theming API and the single largest surface of the toolkit. **Token names
are semver-governed API**: renaming or removing a token is a breaking change.

All tokens live in the `tokens` cascade layer. The `--wel-` prefix is fixed by the
closed naming decision ([02-naming.md](02-naming.md)).

## Naming grammar

```
--wel-{category}-{concept}[-{variant}][-{state}]
```

Examples: `--wel-color-surface`, `--wel-color-accent-hover`, `--wel-space-4`,
`--wel-text-size-2`, `--wel-button-bg-primary`.

Categories: `color`, `text` (typography), `space`, `radius`, `border`, `shadow`,
`motion`, `focus-ring`, plus one namespace per component (`button`, `card`, …).

## The three-tier model

| Tier | Examples | Who touches it |
|------|----------|----------------|
| **Primitive** | `--wel-blue-500`, `--wel-space-4`, `--wel-scale-2` | Theme authors (rarely); never components |
| **Semantic** | `--wel-color-surface`, `--wel-color-accent`, `--wel-text-body` | Theme authors (primarily); components may consume |
| **Component** | `--wel-button-bg`, `--wel-card-padding` | Components define & consume; users override for one-off surgery |

**The two boundary rules** (lint-checkable, non-negotiable):

1. **Components consume only component and semantic tokens** — never primitives. A
   component that reads `--wel-blue-500` has a bug: it bypasses the theming layer.
2. **Themes override only semantic and primitive tokens.** Component tokens exist as an
   escape hatch for one-off customisation
   ([10-theming-and-customisation.md](10-theming-and-customisation.md)), not as theming
   surface.

Every component token defaults to a semantic token:
`--wel-button-bg: var(--wel-color-accent);` — so a theme that only sets semantics restyles
every component coherently.

## Typed tokens (`@property`)

Tokens that animate or must never be invalid are registered with `@property` for type
checking, guaranteed initial values, and smooth interpolation:

```css
@property --wel-color-accent {
  syntax: "<color>";
  inherits: true;
  initial-value: oklch(55% 0.16 250);
}
```

Registration policy: **typed** — all semantic colour tokens, motion multiplier, space
anchors (`<length>`), radius tokens; **untyped** — component tokens (they alias semantic
tokens; typing them would break `var()` fallback chains) and composite values (shadows).

## Colour system

### Primitives: oklch

All primitive colours are `oklch()` — perceptually uniform lightness means a ramp with
fixed L-steps looks evenly spaced in every hue, which is impossible to guarantee in
hex/HSL. Each hue ships a 12-step ramp (`--wel-{hue}-50 … --wel-{hue}-950`) with fixed
lightness/chroma targets per step, written out in full per
[ADR-0002](decisions/ADR-0002-source-format-and-build.md).

### The derivation trick: one accent retints the system

Interaction shades are **computed, not enumerated**:

```css
:root {
  --wel-color-accent: oklch(55% 0.16 250);
  --wel-color-accent-hover:  oklch(from var(--wel-color-accent) calc(l - 0.06) c h);
  --wel-color-accent-active: oklch(from var(--wel-color-accent) calc(l - 0.10) c h);
  --wel-color-accent-tint:   color-mix(in oklch, var(--wel-color-accent) 12%, var(--wel-color-surface));
  --wel-color-accent-contrast: /* text-on-accent; see pairing table */;
}
```

A theme sets **one** `--wel-color-accent` and hover states, pressed states, focus tints,
and subtle backgrounds all follow — the "brand retint in 10 lines" demo in the theming
doc. (Relative color syntax `oklch(from …)` support is audited at Phase 1 against
[ADR-0012](decisions/ADR-0012-feature-graduation-criteria.md); `color-mix()` with
black/white mix stands as the Core-tier formulation if needed.)

### Semantic colour roles (initial set)

| Token | Role |
|-------|------|
| `--wel-color-surface` / `-surface-raised` / `-surface-sunken` | Page and layered backgrounds |
| `--wel-color-ink` / `-ink-muted` / `-ink-faint` | Text hierarchy |
| `--wel-color-accent` (+ derived `-hover/-active/-tint/-contrast`) | Brand/interactive |
| `--wel-color-border` / `-border-strong` | Dividers, control borders |
| Tones: `--wel-color-info/-success/-warning/-danger` (+ derived sets) | `data-tone` axes |

### Contrast pairings

The unit of contrast guarantee ([09-accessibility.md](09-accessibility.md)) is the
**pairing**. The pairing table (appendix) lists every foreground/background combination
components are allowed to use and its worst-case ratio; components consume pairings.

## Dark mode

Per [ADR-0007](decisions/ADR-0007-dark-mode-mechanism.md): `color-scheme: light dark` on
`:root`, every semantic colour token defined **once** with `light-dark()`:

```css
:root { color-scheme: light dark; }
:root {
  --wel-color-surface: light-dark(oklch(98% 0.005 250), oklch(18% 0.01 250));
  --wel-color-ink:     light-dark(oklch(22% 0.02 250), oklch(92% 0.01 250));
}
[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }
```

Manual override is `data-theme` on any subtree — it just pins `color-scheme`, and every
`light-dark()` token in that subtree follows. No duplicated token blocks, and the UA
renders form controls, scrollbars, and system colours correctly for free.

## Typography

- Font stacks: `--wel-text-font-body` (system stack default), `--wel-text-font-display`,
  `--wel-text-font-mono`. No bundled webfonts.
- **Fluid modular type scale** ([ADR-0008](decisions/ADR-0008-sizing-units-and-fluid-scales.md)):
  steps `--wel-text-size--1 … --wel-text-size-6`, each a `clamp()` interpolating between a
  small-context and large-context size derived from two anchors:
  `--wel-text-anchor-min` / `--wel-text-anchor-max` and ratio tokens
  `--wel-text-ratio-min` / `--wel-text-ratio-max`. Values written out (no preprocessor);
  the formula documented in a comment above each step.
- Companion tokens: `--wel-text-leading-tight/-normal/-loose`,
  `--wel-text-tracking-tight/-normal/-wide`, `--wel-text-measure` (max line length,
  `ch`-based) used by `.prose`.

## Space

Same fluid mechanism as type: a paired-step scale `--wel-space-1 … --wel-space-9`, each
step a `clamp()` between compact and generous anchors (`--wel-space-anchor-*`). Adjacent
steps maintain ratio, so layouts breathe proportionally at every size. One extra:
`--wel-space-gutter` (semantic alias for default container padding).

## Radius, border, shadow

- `--wel-radius-sm/-md/-lg/-full`, plus semantic `--wel-radius-control` (buttons/inputs)
  and `--wel-radius-surface` (cards/dialogs) — themes change product personality here.
- `--wel-border-width` (hairline, px per [ADR-0008](decisions/ADR-0008-sizing-units-and-fluid-scales.md)),
  `--wel-border-width-strong`.
- Elevation: `--wel-shadow-1 … --wel-shadow-4`, composite values built from a
  `--wel-shadow-color` token so dark mode softens/deepens shadows by one token.

## Motion

- Durations: `--wel-motion-duration-1` (~100ms) … `--wel-motion-duration-4` (~500ms).
- Easings: `--wel-motion-ease` / `-ease-in` / `-ease-out` / `-ease-spring`.
- **The multiplier rule:** every duration in the codebase is written
  `calc(var(--wel-motion-duration-2) * var(--wel-motion))`, and:

```css
:root { --wel-motion: 1; }
@media (prefers-reduced-motion: reduce) { :root { --wel-motion: 0; } }
```

  Zero-duration transitions still fire `transitionend`, so JS never needs a
  reduced-motion branch. No component may write a raw duration — lint-checked.

## Focus ring

`--wel-focus-ring-color` (defaults to accent), `--wel-focus-ring-width`,
`--wel-focus-ring-offset` — consumed by the single global `:focus-visible` rule and
nothing else ([09-accessibility.md](09-accessibility.md)).

## Appendix — initial token inventory

The complete enumerated inventory (every token, tier, type registration, initial value,
and pairing table) is produced during Phase 1 and maintained here as the canonical list.
Structure agreed now:

| Column | Meaning |
|--------|---------|
| Token | Full name |
| Tier | primitive / semantic / component |
| `@property` | syntax string, or — |
| Initial value | light / dark where `light-dark()` |
| Pairings | valid partners + worst-case contrast ratio |

---
status: Review
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

The implementation lives in [`src/tokens/`](../src/tokens/) (source = shippable,
ADR-0002); the enumerated inventory table and the pairing table below are **generated**
from it and from the contrast checker's pairing contract by
[`build/gen-token-appendix.mjs`](../build/gen-token-appendix.mjs), and maintained here
as the canonical list. `npm run lint` (and CI) fails when this appendix drifts from the
source — regenerate with `node build/gen-token-appendix.mjs`. Structure:

| Column | Meaning |
|--------|---------|
| Token | Full name |
| Tier | primitive / semantic / component |
| `@property` | syntax string, or — |
| Initial value | light / dark where `light-dark()` |
| Pairings | valid partners + worst-case contrast ratio |

<!-- WELKIN:TOKEN-APPENDIX:BEGIN — generated by build/gen-token-appendix.mjs; do not edit by hand -->

### Inventory

#### Colour (`src/tokens/color.css`)

| Token | Tier | `@property` | Initial value | Pairings |
|-------|------|-------------|---------------|----------|
| `--wel-grey-50` | primitive | — | `oklch(97% 0.002 250)` | — |
| `--wel-grey-100` | primitive | — | `oklch(94% 0.003 250)` | — |
| `--wel-grey-200` | primitive | — | `oklch(88% 0.005 250)` | — |
| `--wel-grey-300` | primitive | — | `oklch(80% 0.007 250)` | — |
| `--wel-grey-400` | primitive | — | `oklch(71% 0.009 250)` | — |
| `--wel-grey-500` | primitive | — | `oklch(62% 0.01 250)` | — |
| `--wel-grey-600` | primitive | — | `oklch(54% 0.01 250)` | — |
| `--wel-grey-700` | primitive | — | `oklch(46% 0.009 250)` | — |
| `--wel-grey-800` | primitive | — | `oklch(38% 0.008 250)` | — |
| `--wel-grey-900` | primitive | — | `oklch(30% 0.006 250)` | — |
| `--wel-grey-950` | primitive | — | `oklch(23% 0.004 250)` | — |
| `--wel-grey-975` | primitive | — | `oklch(17% 0.003 250)` | — |
| `--wel-blue-50` | primitive | — | `oklch(97% 0.024 255)` | — |
| `--wel-blue-100` | primitive | — | `oklch(94% 0.04 255)` | — |
| `--wel-blue-200` | primitive | — | `oklch(88% 0.072 255)` | — |
| `--wel-blue-300` | primitive | — | `oklch(80% 0.104 255)` | — |
| `--wel-blue-400` | primitive | — | `oklch(71% 0.136 255)` | — |
| `--wel-blue-500` | primitive | — | `oklch(62% 0.16 255)` | — |
| `--wel-blue-600` | primitive | — | `oklch(54% 0.16 255)` | — |
| `--wel-blue-700` | primitive | — | `oklch(46% 0.144 255)` | — |
| `--wel-blue-800` | primitive | — | `oklch(38% 0.12 255)` | — |
| `--wel-blue-900` | primitive | — | `oklch(30% 0.088 255)` | — |
| `--wel-blue-950` | primitive | — | `oklch(23% 0.064 255)` | — |
| `--wel-blue-975` | primitive | — | `oklch(17% 0.048 255)` | — |
| `--wel-green-50` | primitive | — | `oklch(97% 0.023 150)` | — |
| `--wel-green-100` | primitive | — | `oklch(94% 0.038 150)` | — |
| `--wel-green-200` | primitive | — | `oklch(88% 0.068 150)` | — |
| `--wel-green-300` | primitive | — | `oklch(80% 0.098 150)` | — |
| `--wel-green-400` | primitive | — | `oklch(71% 0.128 150)` | — |
| `--wel-green-500` | primitive | — | `oklch(62% 0.15 150)` | — |
| `--wel-green-600` | primitive | — | `oklch(54% 0.15 150)` | — |
| `--wel-green-700` | primitive | — | `oklch(46% 0.135 150)` | — |
| `--wel-green-800` | primitive | — | `oklch(38% 0.113 150)` | — |
| `--wel-green-900` | primitive | — | `oklch(30% 0.083 150)` | — |
| `--wel-green-950` | primitive | — | `oklch(23% 0.06 150)` | — |
| `--wel-green-975` | primitive | — | `oklch(17% 0.045 150)` | — |
| `--wel-amber-50` | primitive | — | `oklch(97% 0.02 80)` | — |
| `--wel-amber-100` | primitive | — | `oklch(94% 0.033 80)` | — |
| `--wel-amber-200` | primitive | — | `oklch(88% 0.059 80)` | — |
| `--wel-amber-300` | primitive | — | `oklch(80% 0.085 80)` | — |
| `--wel-amber-400` | primitive | — | `oklch(71% 0.111 80)` | — |
| `--wel-amber-500` | primitive | — | `oklch(62% 0.13 80)` | — |
| `--wel-amber-600` | primitive | — | `oklch(54% 0.13 80)` | — |
| `--wel-amber-700` | primitive | — | `oklch(46% 0.117 80)` | — |
| `--wel-amber-800` | primitive | — | `oklch(38% 0.098 80)` | — |
| `--wel-amber-900` | primitive | — | `oklch(30% 0.072 80)` | — |
| `--wel-amber-950` | primitive | — | `oklch(23% 0.052 80)` | — |
| `--wel-amber-975` | primitive | — | `oklch(17% 0.039 80)` | — |
| `--wel-red-50` | primitive | — | `oklch(97% 0.026 25)` | — |
| `--wel-red-100` | primitive | — | `oklch(94% 0.043 25)` | — |
| `--wel-red-200` | primitive | — | `oklch(88% 0.077 25)` | — |
| `--wel-red-300` | primitive | — | `oklch(80% 0.111 25)` | — |
| `--wel-red-400` | primitive | — | `oklch(71% 0.145 25)` | — |
| `--wel-red-500` | primitive | — | `oklch(62% 0.17 25)` | — |
| `--wel-red-600` | primitive | — | `oklch(54% 0.17 25)` | — |
| `--wel-red-700` | primitive | — | `oklch(46% 0.153 25)` | — |
| `--wel-red-800` | primitive | — | `oklch(38% 0.128 25)` | — |
| `--wel-red-900` | primitive | — | `oklch(30% 0.094 25)` | — |
| `--wel-red-950` | primitive | — | `oklch(23% 0.068 25)` | — |
| `--wel-red-975` | primitive | — | `oklch(17% 0.051 25)` | — |
| `--wel-color-surface` | semantic | `<color>` | light `var(--wel-grey-50)` / dark `var(--wel-grey-975)` | under `ink` 15.5; under `ink-muted` 6.5; under `ink-faint` 3.3; under `accent` 4.7; under `accent-hover` 5.9; under `accent-active` 5.0; under `border-strong` 3.3; under `info` 6.6; under `success` 6.1; under `warning` 6.6; under `danger` 7.1 |
| `--wel-color-surface-raised` | semantic | `<color>` | light `oklch(99.5% 0.001 250)` / dark `var(--wel-grey-950)` | under `ink` 14.2; under `ink-muted` 6.6; under `border-strong` 3.6 |
| `--wel-color-surface-sunken` | semantic | `<color>` | light `var(--wel-grey-100)` / dark `oklch(13% 0.003 250)` | under `ink` 14.2 |
| `--wel-color-ink` | semantic | `<color>` | light `var(--wel-grey-950)` / dark `var(--wel-grey-100)` | on `surface` 15.5; on `surface-raised` 14.2; on `surface-sunken` 14.2; on `info-tint` 12.9; on `danger-tint` 12.9; on `accent-tint` 13.3 |
| `--wel-color-ink-muted` | semantic | `<color>` | light `var(--wel-grey-700)` / dark `var(--wel-grey-400)` | on `surface` 6.5; on `surface-raised` 6.6 |
| `--wel-color-ink-faint` | semantic | `<color>` | light `var(--wel-grey-500)` / dark `var(--wel-grey-600)` | on `surface` 3.3 |
| `--wel-color-border` | semantic | `<color>` | light `var(--wel-grey-200)` / dark `var(--wel-grey-800)` | — |
| `--wel-color-border-strong` | semantic | `<color>` | light `var(--wel-grey-500)` / dark `var(--wel-grey-500)` | on `surface` 3.3; on `surface-raised` 3.6 |
| `--wel-color-accent` | semantic | `<color>` | light `var(--wel-blue-600)` / dark `var(--wel-blue-400)` | on `surface` 4.7; under `accent-contrast` 4.7 |
| `--wel-color-accent-hover` | semantic | `<color>` | `oklch(from var(--wel-color-accent) calc(l - 0.06) c h)` | on `surface` 5.9; on `accent-tint` 5.1 |
| `--wel-color-accent-active` | semantic | `<color>` | `oklch(from var(--wel-color-accent) calc(l - 0.10) c h)` | on `surface` 5.0 |
| `--wel-color-accent-tint` | semantic | `<color>` | `color-mix(in oklch, var(--wel-color-accent) 12%, var(--wel-color-surface))` | under `ink` 13.3; under `accent-hover` 5.1 |
| `--wel-color-accent-contrast` | semantic | `<color>` | light `var(--wel-grey-50)` / dark `var(--wel-grey-975)` | on `accent` 4.7 |
| `--wel-color-info` | semantic | `<color>` | light `var(--wel-blue-700)` / dark `var(--wel-blue-300)` | on `surface` 6.6; on `info-tint` 5.5 |
| `--wel-color-success` | semantic | `<color>` | light `var(--wel-green-700)` / dark `var(--wel-green-300)` | on `surface` 6.1; on `success-tint` 5.1 |
| `--wel-color-warning` | semantic | `<color>` | light `var(--wel-amber-700)` / dark `var(--wel-amber-300)` | on `surface` 6.6; on `warning-tint` 5.5 |
| `--wel-color-danger` | semantic | `<color>` | light `var(--wel-red-700)` / dark `var(--wel-red-300)` | on `surface` 7.1; on `danger-tint` 5.9 |
| `--wel-color-info-tint` | semantic | `<color>` | `color-mix(in oklch, var(--wel-color-info) 12%, var(--wel-color-surface))` | under `info` 5.5; under `ink` 12.9 |
| `--wel-color-success-tint` | semantic | `<color>` | `color-mix(in oklch, var(--wel-color-success) 12%, var(--wel-color-surface))` | under `success` 5.1 |
| `--wel-color-warning-tint` | semantic | `<color>` | `color-mix(in oklch, var(--wel-color-warning) 12%, var(--wel-color-surface))` | under `warning` 5.5 |
| `--wel-color-danger-tint` | semantic | `<color>` | `color-mix(in oklch, var(--wel-color-danger) 12%, var(--wel-color-surface))` | under `danger` 5.9; under `ink` 12.9 |

#### Focus ring (`src/tokens/focus-ring.css`)

| Token | Tier | `@property` | Initial value | Pairings |
|-------|------|-------------|---------------|----------|
| `--wel-focus-ring-color` | semantic | — | `var(--wel-color-accent)` | — |
| `--wel-focus-ring-width` | semantic | — | `2px` | — |
| `--wel-focus-ring-offset` | semantic | — | `2px` | — |

#### Motion (`src/tokens/motion.css`)

| Token | Tier | `@property` | Initial value | Pairings |
|-------|------|-------------|---------------|----------|
| `--wel-motion` | semantic | `<number>` | `1` | — |
| `--wel-motion-duration-1` | semantic | — | `100ms` | — |
| `--wel-motion-duration-2` | semantic | — | `200ms` | — |
| `--wel-motion-duration-3` | semantic | — | `300ms` | — |
| `--wel-motion-duration-4` | semantic | — | `500ms` | — |
| `--wel-motion-ease` | semantic | — | `cubic-bezier(0.2, 0, 0.2, 1)` | — |
| `--wel-motion-ease-in` | semantic | — | `cubic-bezier(0.4, 0, 1, 1)` | — |
| `--wel-motion-ease-out` | semantic | — | `cubic-bezier(0, 0, 0.2, 1)` | — |
| `--wel-motion-ease-spring` | semantic | — | `cubic-bezier(0.34, 1.56, 0.64, 1)` | — |

#### Radius, border, shadow (`src/tokens/radius-border-shadow.css`)

| Token | Tier | `@property` | Initial value | Pairings |
|-------|------|-------------|---------------|----------|
| `--wel-radius-sm` | semantic | `<length>` | `0.25rem` | — |
| `--wel-radius-md` | semantic | `<length>` | `0.5rem` | — |
| `--wel-radius-lg` | semantic | `<length>` | `1rem` | — |
| `--wel-radius-full` | semantic | `<length>` | `999rem` | — |
| `--wel-radius-control` | semantic | `<length>` | `0.375rem` | — |
| `--wel-radius-surface` | semantic | `<length>` | `0.75rem` | — |
| `--wel-border-width` | semantic | — | `1px` | — |
| `--wel-border-width-strong` | semantic | — | `2px` | — |
| `--wel-shadow-color` | semantic | `<color>` | light `oklch(25% 0.01 250 / 0.15)` / dark `oklch(5% 0.01 250 / 0.55)` | — |
| `--wel-shadow-1` | semantic | — | `0 1px 2px var(--wel-shadow-color)` | — |
| `--wel-shadow-2` | semantic | — | `0 2px 6px var(--wel-shadow-color)` | — |
| `--wel-shadow-3` | semantic | — | `0 6px 16px var(--wel-shadow-color)` | — |
| `--wel-shadow-4` | semantic | — | `0 12px 32px var(--wel-shadow-color)` | — |

#### Space (`src/tokens/space.css`)

| Token | Tier | `@property` | Initial value | Pairings |
|-------|------|-------------|---------------|----------|
| `--wel-space-anchor-min` | semantic | `<length>` | `0.25rem` | — |
| `--wel-space-anchor-max` | semantic | `<length>` | `0.3125rem` | — |
| `--wel-space-1` | semantic | — | `clamp(var(--wel-space-anchor-min), 0.2292rem + 0.1042vi, var(--wel-space-anchor-max))` | — |
| `--wel-space-2` | semantic | — | `clamp(calc(var(--wel-space-anchor-min) * 2), 0.4583rem + 0.2083vi, calc(var(--wel-space-anchor-max) * 2))` | — |
| `--wel-space-3` | semantic | — | `clamp(calc(var(--wel-space-anchor-min) * 3), 0.6875rem + 0.3125vi, calc(var(--wel-space-anchor-max) * 3))` | — |
| `--wel-space-4` | semantic | — | `clamp(calc(var(--wel-space-anchor-min) * 4), 0.9167rem + 0.4167vi, calc(var(--wel-space-anchor-max) * 4))` | — |
| `--wel-space-5` | semantic | — | `clamp(calc(var(--wel-space-anchor-min) * 6), 1.375rem + 0.625vi, calc(var(--wel-space-anchor-max) * 6))` | — |
| `--wel-space-6` | semantic | — | `clamp(calc(var(--wel-space-anchor-min) * 8), 1.8333rem + 0.8333vi, calc(var(--wel-space-anchor-max) * 8))` | — |
| `--wel-space-7` | semantic | — | `clamp(calc(var(--wel-space-anchor-min) * 12), 2.75rem + 1.25vi, calc(var(--wel-space-anchor-max) * 12))` | — |
| `--wel-space-8` | semantic | — | `clamp(calc(var(--wel-space-anchor-min) * 16), 3.6667rem + 1.6667vi, calc(var(--wel-space-anchor-max) * 16))` | — |
| `--wel-space-9` | semantic | — | `clamp(calc(var(--wel-space-anchor-min) * 24), 5.5rem + 2.5vi, calc(var(--wel-space-anchor-max) * 24))` | — |
| `--wel-space-gutter` | semantic | — | `var(--wel-space-5)` | — |

#### Type (`src/tokens/type.css`)

| Token | Tier | `@property` | Initial value | Pairings |
|-------|------|-------------|---------------|----------|
| `--wel-text-anchor-min` | semantic | `<length>` | `1rem` | — |
| `--wel-text-anchor-max` | semantic | `<length>` | `1.125rem` | — |
| `--wel-text-ratio-min` | semantic | — | `1.2` | — |
| `--wel-text-ratio-max` | semantic | — | `1.25` | — |
| `--wel-text-size--1` | semantic | — | `clamp(calc(var(--wel-text-anchor-min) * 0.8333), 0.8111rem + 0.1111vi, calc(var(--wel-text-anchor-max) * 0.8))` | — |
| `--wel-text-size-0` | semantic | — | `clamp(var(--wel-text-anchor-min), 0.9583rem + 0.2083vi, var(--wel-text-anchor-max))` | — |
| `--wel-text-size-1` | semantic | — | `clamp(calc(var(--wel-text-anchor-min) * 1.2), 1.1313rem + 0.3438vi, calc(var(--wel-text-anchor-max) * 1.25))` | — |
| `--wel-text-size-2` | semantic | — | `clamp(calc(var(--wel-text-anchor-min) * 1.44), 1.3341rem + 0.5297vi, calc(var(--wel-text-anchor-max) * 1.5625))` | — |
| `--wel-text-size-3` | semantic | — | `clamp(calc(var(--wel-text-anchor-min) * 1.728), 1.5716rem + 0.7822vi, calc(var(--wel-text-anchor-max) * 1.9531))` | — |
| `--wel-text-size-4` | semantic | — | `clamp(calc(var(--wel-text-anchor-min) * 2.0736), 1.8493rem + 1.1217vi, calc(var(--wel-text-anchor-max) * 2.4414))` | — |
| `--wel-text-size-5` | semantic | — | `clamp(calc(var(--wel-text-anchor-min) * 2.4883), 2.1733rem + 1.5748vi, calc(var(--wel-text-anchor-max) * 3.0518))` | — |
| `--wel-text-size-6` | semantic | — | `clamp(calc(var(--wel-text-anchor-min) * 2.986), 2.5508rem + 2.1758vi, calc(var(--wel-text-anchor-max) * 3.8147))` | — |
| `--wel-text-font-body` | semantic | — | `system-ui, sans-serif` | — |
| `--wel-text-font-display` | semantic | — | `var(--wel-text-font-body)` | — |
| `--wel-text-font-mono` | semantic | — | `ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace` | — |
| `--wel-text-leading-tight` | semantic | — | `1.25` | — |
| `--wel-text-leading-normal` | semantic | — | `1.5` | — |
| `--wel-text-leading-loose` | semantic | — | `1.75` | — |
| `--wel-text-tracking-tight` | semantic | — | `-0.01em` | — |
| `--wel-text-tracking-normal` | semantic | — | `0` | — |
| `--wel-text-tracking-wide` | semantic | — | `0.04em` | — |
| `--wel-text-measure` | semantic | — | `65ch` | — |

No component-tier tokens exist yet; they are defined in each component's file and join this inventory as components land.

### Pairing table

Every foreground/background combination components are allowed to use. Ratios are computed from the token source in both schemes by the same evaluator that gates CI (`build/check-contrast.mjs`); **worst** is the lower of the two and must meet **min**.

| Foreground | Background | Min | Light | Dark | Worst | Use |
|------------|------------|-----|-------|------|-------|-----|
| `ink` | `surface` | 4.5:1 | 15.48:1 | 16.04:1 | 15.48:1 | body text |
| `ink` | `surface-raised` | 4.5:1 | 16.65:1 | 14.16:1 | 14.16:1 | text on cards |
| `ink` | `surface-sunken` | 4.5:1 | 14.16:1 | 16.87:1 | 14.16:1 | text on sunken (code blocks) |
| `ink-muted` | `surface` | 4.5:1 | 6.53:1 | 7.43:1 | 6.53:1 | secondary text |
| `ink-muted` | `surface-raised` | 4.5:1 | 7.02:1 | 6.57:1 | 6.57:1 | secondary text on cards |
| `ink-faint` | `surface` | 3:1 | 3.34:1 | 3.78:1 | 3.34:1 | placeholders/decorative (non-text floor) |
| `accent` | `surface` | 4.5:1 | 4.69:1 | 7.42:1 | 4.69:1 | links / accent text |
| `accent-hover` | `surface` | 4.5:1 | 6.08:1 | 5.90:1 | 5.90:1 | hovered links |
| `accent-active` | `surface` | 4.5:1 | 7.18:1 | 5.03:1 | 5.03:1 | active links |
| `accent-contrast` | `accent` | 4.5:1 | 4.69:1 | 7.42:1 | 4.69:1 | text on accent (primary button) |
| `border-strong` | `surface` | 3:1 | 3.34:1 | 5.26:1 | 3.34:1 | control borders (1.4.11) |
| `info` | `surface` | 4.5:1 | 6.61:1 | 10.24:1 | 6.61:1 | info text |
| `success` | `surface` | 4.5:1 | 6.09:1 | 10.62:1 | 6.09:1 | success text |
| `warning` | `surface` | 4.5:1 | 6.61:1 | 10.17:1 | 6.61:1 | warning text |
| `danger` | `surface` | 4.5:1 | 7.08:1 | 9.80:1 | 7.08:1 | danger text (form errors) |
| `info` | `info-tint` | 4.5:1 | 5.51:1 | 8.67:1 | 5.51:1 | info alert title on tint |
| `success` | `success-tint` | 4.5:1 | 5.08:1 | 8.98:1 | 5.08:1 | success alert title on tint |
| `warning` | `warning-tint` | 4.5:1 | 5.51:1 | 8.60:1 | 5.51:1 | warning alert title on tint |
| `danger` | `danger-tint` | 4.5:1 | 5.88:1 | 8.31:1 | 5.88:1 | danger alert title on tint |
| `ink` | `info-tint` | 4.5:1 | 12.90:1 | 13.58:1 | 12.90:1 | alert body on tint |
| `ink` | `danger-tint` | 4.5:1 | 12.87:1 | 13.60:1 | 12.87:1 | alert body on tint |
| `ink` | `accent-tint` | 4.5:1 | 13.28:1 | 13.98:1 | 13.28:1 | text on hover tint (pagination/table rows) |
| `accent-hover` | `accent-tint` | 4.5:1 | 5.22:1 | 5.14:1 | 5.14:1 | ghost/secondary button text on hover tint |
| `border-strong` | `surface-raised` | 3:1 | 3.59:1 | 4.64:1 | 3.59:1 | outlined card border on card bg (1.4.11) |

Totals: 140 tokens, 24 pairings × 2 schemes.

<!-- WELKIN:TOKEN-APPENDIX:END -->

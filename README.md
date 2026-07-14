# Welkin

**The CSS-first toolkit.** Welkin treats modern CSS as a complete platform, not a
compile target: cascade layers, design tokens, `light-dark()` colour schemes,
container queries — plain, readable CSS with **zero required build step**.

> **Status: preview (0.2.x).** Tokens, reset, base, the layout primitives, and the
> full component set (pure-CSS, platform-primitive, and JS-enhanced) are in.
> Token names may still change before 1.0; the docs site and v1 audit remain.

## Install

```sh
npm install welkincss
```

```css
@import "welkincss"; /* dist/welkin.css */
```

Or link a stylesheet directly — every dist file is valid standalone CSS:

```html
<link rel="stylesheet" href="node_modules/welkincss/dist/welkin.min.css">
```

### CDN — no install at all

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/welkincss@0.2/dist/welkin.min.css">
<!-- or -->
<link rel="stylesheet" href="https://unpkg.com/welkincss@0.2/dist/welkin.min.css">
```

JS-enhanced components are plain ES modules, one per component, loaded the same way:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/welkincss@0.2/dist/js/wel-tabs.js"></script>
```

### À la carte

Cascade layers fix rule order up front, so **any subset of files works in any
order** (ADR-0003): link core plus exactly the components you use.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/welkincss@0.2/dist/welkin-core.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/welkincss@0.2/dist/components/button.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/welkincss@0.2/dist/components/card.min.css">
```

Bundles:

| File | Contents | min+gzip |
|------|----------|----------|
| `welkin.css` / `.min.css` | Everything: reset, tokens, base, layout, components, utilities | ~11 KB |
| `welkin-core.css` / `.min.css` | Foundation only: reset, tokens, base, layout | ~3.5 KB |
| `components/*.min.css` | One file per component, on top of core | ≤ 3 KB each |
| `js/*.js` | Optional ES modules for JS-enhanced components | ≤ 2 KB each |

All budgets are CI-enforced.

## What you get in the preview

- **Design tokens** (`--wel-*`): a three-tier system (primitive → semantic →
  component) in `oklch()`, typed with `@property`. Colour, fluid type and space
  scales, radius, border, shadow, motion, focus ring.
- **Dark mode built in**: every semantic colour is defined once with
  `light-dark()`; the UA follows the user's scheme automatically, and
  `data-theme="light|dark"` on any subtree pins it — no duplicated token blocks.
- **A modern reset** and **classless-ish base styles**: semantic HTML looks right
  with no classes at all.
- **Contrast, guaranteed**: every foreground/background pairing components may use
  is checked programmatically in CI against WCAG ratios, in both schemes.

Theming is token overrides — set one `--wel-color-accent` and hover, active,
tint, and contrast shades are derived by the browser:

```css
:root { --wel-color-accent: oklch(54% 0.16 305); } /* brand retint, one line */
```

## Browser support

Last two stable versions of Chrome, Edge, Firefox, and Safari (including iOS).
The load-bearing features — `light-dark()`, `@property`, relative color syntax —
are Baseline Newly Available in every browser of that matrix. Older engines
degrade to the static light palette via `@property` initial values: functional,
never broken.

## Philosophy

- HTML reads like the design vocabulary: `class="card"`, not `card card-outline-lg`.
- One semantic class per component; variants via `data-*` attributes.
- JavaScript only where the platform genuinely cannot do the job.
- Source is plain modern CSS you can read and learn from — no preprocessor.

Welkin is **docs-first**: the design documentation in `docs/` governs everything
that gets built, and accessibility criteria (WCAG 2.2 AA) block acceptance.

## License

MIT

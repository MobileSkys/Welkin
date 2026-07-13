# Welkin

**The CSS-first toolkit.** Welkin treats modern CSS as a complete platform, not a
compile target: cascade layers, design tokens, `light-dark()` colour schemes,
container queries — plain, readable CSS with **zero required build step**.

> **Status: preview (0.1.x).** This release ships the foundation — design tokens,
> reset, and base element styles — for early feedback. Layout primitives and
> components follow; token names may still change before 1.0.

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

Bundles:

| File | Contents |
|------|----------|
| `welkin.css` / `.min.css` | Everything: reset, tokens, base, layout, components, utilities |
| `welkin-core.css` / `.min.css` | Foundation only: reset, tokens, base, layout |

Current preview weighs ~2.8 KB min+gzip (CI-enforced budget).

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

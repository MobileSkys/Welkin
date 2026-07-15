# Image effects (utilities) — post-1.0.1 (waves 1–2)

Token-driven image treatments from the utilities layer. Zero JS, all safe by
default: engines without a feature show the plain image; motion effects gate
off under `prefers-reduced-motion`. Live demos with copyable markup:
`examples/image-fx.html` on the docs site.

## `.dim` — dark-mode dimming

Photos glare on dark surfaces. Put `.dim` on the media element:

```html
<img class="dim" src="harbour.jpg" alt="…">
```

- Identity filter in light scheme; `--wel-img-dim-amount`
  (default `brightness(0.85) contrast(1.05)`) in dark. Retune the amount once
  on `:root`.
- Follows `data-theme` pins exactly like the colour palette — a light-pinned
  panel inside a dark page does not dim. Resets under forced colors.
- Don't reimplement with your own `prefers-color-scheme` media query — that
  ignores `data-theme` pins; the token already handles both.

## `.duotone` — token-driven two-tone

Wrapper class (NOT on the img — the overlays are its pseudo-elements):

```html
<figure class="duotone">
  <img src="valley.jpg" alt="…">
</figure>
```

- Media is desaturated; blacks map to `--wel-duotone-shadow`, whites to
  `--wel-duotone-highlight`. Both derive from the cascaded
  `--wel-color-accent` — one accent override retints the effect:
  `.duotone.alt { --wel-color-accent: var(--wel-green-600) }`, or set the two
  endpoint tokens directly for a custom (e.g. sepia) mapping.
- The media is forced to `display: block; inline-size: 100%` — size the
  wrapper, not the image.
- Forced colors shows the original image (overlays drop). Engines without
  relative colour syntax render desaturated-only. Don't duotone images whose
  colours carry meaning (charts).

## `.edge-fade` — gradient mask bleeds

On the media element (or any element). Default fades all four edges into
whatever is behind:

```html
<img class="edge-fade" data-edges="block-end" src="dunes.jpg" alt="…"
     style="--wel-edge-fade: 6rem">
```

- `data-edges`: `block` | `inline` | `block-start` | `block-end` |
  `inline-start` | `inline-end` | `radial` (vignette); omit for all four.
  The asymmetric `inline-*` values flip under `:dir(rtl)`.
- `--wel-edge-fade` is the fade-band depth (default `--wel-space-8`).
- No mask support → unfaded image; nothing to gate.
- Don't set text over a faded region — the backdrop is unknown; use
  `.frosted-caption` instead.

## `.reveal` — scroll-driven entry

```html
<img class="reveal" src="peak.jpg" alt="…">
```

- Fade/scale-in driven by the element's own viewport entry
  (`animation-timeline: view()`) — no IntersectionObserver, no JS.
- Knobs: `--wel-reveal-scale` (start scale, default 0.96),
  `--wel-reveal-distance` (start block-axis offset, default 0 — set e.g.
  `1rem` for a rise).
- Firefox stable and reduced-motion users simply see the element — the hidden
  start state only exists inside the feature/motion gates. Never add your own
  `opacity: 0` base state; that recreates the stuck-invisible bug the gate
  prevents.
- Don't put `.reveal` inside fixed/non-scrolling chrome — its view timeline
  never advances there.

## `data-vt-image` — view-transition image morph

Part of the **opt-in view-transitions module** (see gotchas.md for the module's
traps). Tag a `--wel-vt`-named image on both sides of a transition:

```html
<img data-vt-image style="--wel-vt: hero" src="thumb.jpg" alt="…">
```

- Snapshots cover-fit the morphing box (no stretch between aspect ratios) and
  swap opaquely (no cross-fade double-exposure on photos).
- Works for the module's cross-document morphs AND your own same-document
  `document.startViewTransition` (lightbox/gallery) while the module is
  linked. For same-document, name the pair only while the swap is in flight
  (set `--wel-vt` on the thumb, move it to the stage inside the update
  callback, remove on `finished`) — a name used twice at once aborts the
  transition.
- Engines without `view-transition-class` keep the default morph — additive.

## `.frosted-caption` — glass caption bar (THE text-on-imagery pattern)

Wrapper class, canonically `<figure>` + `<figcaption>`:

```html
<figure class="frosted-caption">
  <img src="harbour.jpg" alt="…">
  <figcaption>Harbour at dusk</figcaption>
</figure>
```

- Caption pins to the media's bottom edge: `backdrop-filter` glass over a 68%
  surface scrim where supported, near-solid scrim otherwise — text always
  readable. Goes fully opaque under `prefers-reduced-transparency`.
- Knobs: `--wel-frosted-bg` (whole scrim colour), `--wel-frosted-blur`
  (16px), `--wel-frosted-saturate` (1.8). Don't lower the bg opacity below
  the default — the ink/surface contrast pairing depends on it.
- `overflow: clip` on the wrapper: put `border-radius` on the **wrapper** and
  media + bar crop together. Never put text directly over imagery elsewhere —
  this utility is the sanctioned pattern.

## `.color-reveal` — grayscale until hover

On the media element; wrap in a link/button for keyboard parity:

```html
<a href="/work/harbour">
  <img class="color-reveal" src="harbour.jpg" alt="Harbour case study">
</a>
```

- Rests at `grayscale(var(--wel-color-reveal-rest))` (default 1; lower =
  softer). Saturates on hover or `:focus-visible` (own, or a wrapping
  a/button/summary).
- Entire effect sits inside `@media (hover: hover)` — touch users get the
  plain colour image. Don't re-add grayscale outside that gate.
- Transition rides `--wel-motion` (instant under reduced motion).
- Meaningless inside `.duotone` (already grayscale) — forbidden.

## `.organic-frame` — blob / arch / scallop crops

On the media element:

```html
<img class="organic-frame" src="portrait.jpg" alt="…">              <!-- blob -->
<img class="organic-frame" data-shape="arch" src="door.jpg" alt="…">
<img class="organic-frame" data-shape="scallop" src="stamp.jpg" alt="…">
```

- `clip-path: shape()` in pure percentages — tracks any box/aspect ratio.
- No `shape()` support → border-radius approximations (blob/arch analogues,
  plain rounded for scallop). Don't add your own `border-radius` on top —
  the utility owns the corner geometry in both branches.
- On the **media**, not a wrapper (clipping a wrapper crops captions/halos).

## `.adaptive-crop` — container-driven art direction

```html
<img class="adaptive-crop" src="valley.jpg" alt="…">
```

- Square (`--wel-crop-narrow: 1`) in layout containers under 30rem; 21:9
  band (`--wel-crop-wide`) at ≥30rem; `object-fit: cover` both ways.
- Queries the nearest **layout primitive** (`container-name: layout`) — it
  needs one as ancestor; without it the media keeps natural aspect (that's
  the designed fallback, not a bug).
- The 30rem switch is a literal (container queries can't read custom
  properties); retune the *ratios* per place, not the breakpoint.

## `.glow` — ambient halo

Wrapper class:

```html
<figure class="glow">                 <!-- accent-derived drop-shadow halo -->
  <img src="poster.jpg" alt="…">
</figure>

<figure class="glow" data-glow="ambient" style="--wel-glow-image: url(poster.jpg)">
  <img src="poster.jpg" alt="…">      <!-- ambilight: halo = the image itself -->
</figure>
```

- Default halo derives from the cascaded accent (`--wel-glow-color`, 55%
  alpha); one accent override retints. `--wel-glow-size` = spread/blur.
- Ambient variant NEEDS `--wel-glow-image` on the wrapper (same URL as the
  img) — without it nothing paints. The pseudo sits behind the media.
- **URL trap:** give `--wel-glow-image` an ABSOLUTE or root-relative URL. A
  relative `url(img/…)` resolves against `welkin.css` (the stylesheet that
  substitutes the var), not your page, in Chromium — silent 404, no glow.
  From a relative-path page, skip the property and feed the pseudo in your
  own CSS: `.hero-glow::before { background-image: url(img/poster.jpg) }`
  (unlayered author CSS beats the utilities layer).
- The halo follows the composite silhouette — `.glow` around an
  `.organic-frame`/`.squircle` media glows in the clipped shape (flagship
  combo). Halos read best on dark surfaces.
- Forced colors drops the halo. Filter lives on the wrapper, so it never
  fights `.dim`/`.color-reveal` on the media.

## `.squircle` — superellipse corners

```html
<img class="squircle" src="avatar.jpg" alt="…">
```

- `corner-shape: squircle` over `--wel-squircle-radius` (default 25%).
  Fallback is automatic: no support → plain round corners at the same
  radius. Never gate it yourself.
- Don't combine with `.organic-frame` (two corner geometries, one wins
  silently).

## Combining effects — which class goes where

| Combination | How |
|-------------|-----|
| `.duotone` + `.dim` | `.dim` on the **media element** inside the wrapper (explicit combo rule dims the base before remapping) |
| `.duotone` + `.edge-fade` or `.reveal` | On the **wrapper** — on the inner img they'd fade the photo out from under the overlays |
| `.dim` + `.edge-fade` | Freely combined on the media (different properties) |
| `.color-reveal` + `.dim` | Both on the media — explicit combo rule keeps the dim prefix while grayscale transitions |
| `.frosted-caption` + `.duotone` | Same wrapper — caption paints above the overlays by design |
| `.glow` + `.organic-frame`/`.squircle` | `.glow` wrapper, crop on the media — halo follows the clipped shape |
| crops (`.organic-frame`/`.squircle`/`.adaptive-crop`) + media filters (`.dim`/`.color-reveal`) | Freely combined on the media (crop vs filter) |
| `.duotone` in `.duotone` | Never — remapping a remap is mud |
| `.color-reveal` in `.duotone` | Never — no colour to reveal |
| `.organic-frame` + `.squircle` | Never — two corner geometries, one wins silently |
| `.glow` halo + `.edge-fade` on the same media | Avoid — the shadow re-outlines the edge the mask melts |

`.duotone` output is scheme-stable (accent-derived endpoints), so it doesn't
need `.dim`.

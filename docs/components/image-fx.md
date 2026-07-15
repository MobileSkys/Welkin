# Component: Image effects (utilities)

| | |
|---|---|
| **Status** | Review |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | post-v1 |

## Purpose

Token-driven image treatments from the **utilities layer** — not a widget but a
family of single-purpose classes that make photography sit well in a themed,
dual-scheme page. Wave 1: dark-mode dimming, duotone brand tinting, edge-fade
bleeds, scroll-driven entry, and (via the view-transitions module)
thumb-to-detail morphs. Wave 2: frosted caption bars, grayscale-to-colour
hover reveals, organic `shape()` frames, container-driven adaptive crops,
ambient glow halos, and squircle corners. All zero-JS. Live demos with
copyable markup: `examples/image-fx.html`.

Shared doctrine, binding for every current and future effect in the family:

- **Never a broken image.** An engine missing a feature must render the plain,
  fully-readable image (unwrapped default or additive-only rules; see each
  fallback below).
- **Motion gates off** under `prefers-reduced-motion` (docs/09 preference
  matrix) — scroll-driven and view-transition effects cannot ride the
  `--wel-motion` multiplier, so the media preference disables them wholesale.
- **Token-driven** — endpoints and amounts are `--wel-` custom properties, so
  themes retune the effects without new CSS.

## Anatomy

```
.dim                     on the media element itself
.duotone                 wrapper (owns two blend overlays)
└─ img | video           desaturated; forced to fill the wrapper's inline size
.edge-fade               on the media element itself (or any element)
.reveal                  on the media element itself (or any element)
[data-vt-image]          on a --wel-vt-named image, both sides of a morph
.frosted-caption         wrapper (canonically <figure>)
├─ img | video           forced to fill the wrapper's inline size
└─ figcaption            pinned block-end, glass scrim bar
.color-reveal            on the media element (or on it inside a link/button)
.organic-frame           on the media element itself
.adaptive-crop           on the media element itself (needs a layout ancestor)
.glow                    wrapper (owns the halo / ambient pseudo)
.squircle                on the media element itself
```

## HTML structure

```html
<!-- dark-mode dimming: identity in light, gentle pull-down in dark -->
<img class="dim" src="harbour.jpg" alt="…">

<!-- duotone: wrapper class; one accent override retints both endpoints -->
<figure class="duotone">
  <img src="valley.jpg" alt="…">
</figure>

<!-- edge-fade: default fades all four edges; data-edges narrows it -->
<img class="edge-fade" data-edges="block-end" src="dunes.jpg" alt="…">

<!-- scroll-driven reveal -->
<img class="reveal" src="peak.jpg" alt="…">

<!-- view-transition image morph (requires the opt-in VT module) -->
<img data-vt-image style="--wel-vt: hero" src="thumb.jpg" alt="…">

<!-- frosted caption: the sanctioned text-on-imagery pattern -->
<figure class="frosted-caption">
  <img src="harbour.jpg" alt="…">
  <figcaption>Harbour at dusk</figcaption>
</figure>

<!-- grayscale-to-colour hover reveal (hover devices only) -->
<a href="/work/harbour">
  <img class="color-reveal" src="harbour.jpg" alt="Harbour case study">
</a>

<!-- organic frames: blob default; arch and scallop via data-shape -->
<img class="organic-frame" src="portrait.jpg" alt="…">
<img class="organic-frame" data-shape="arch" src="door.jpg" alt="…">

<!-- adaptive crop: square in narrow layout containers, 21:9 band in wide -->
<img class="adaptive-crop" src="valley.jpg" alt="…">

<!-- ambient glow: accent halo; ambilight variant feeds the image back in -->
<figure class="glow">
  <img src="poster.jpg" alt="…">
</figure>
<figure class="glow" data-glow="ambient" style="--wel-glow-image: url(poster.jpg)">
  <img src="poster.jpg" alt="…">
</figure>

<!-- squircle corners -->
<img class="squircle" src="avatar.jpg" alt="…">
```

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-edges` (on `.edge-fade`) | `block`, `inline`, `block-start`, `block-end`, `inline-start`, `inline-end`, `radial` | Narrows the fade to one axis/edge, or an elliptical vignette. Omit for all four edges. The asymmetric `inline-*` values flip under `:dir(rtl)`. |
| `data-vt-image` | boolean | Image morph treatment — see the [view-transitions spec](view-transitions.md), which owns this attribute. |
| `data-shape` (on `.organic-frame`) | `arch`, `scallop` | Swaps the default blob crop for an elliptical arch over straight jambs, or a stamp-like scallop loop. |
| `data-glow` (on `.glow`) | `ambient` | Replaces the accent drop-shadow halo with a blurred cover-fit pseudo painting the image's own colours; feed it the source via `--wel-glow-image: url(…)` on the wrapper (without it, nothing paints). |

Composability rules (the family is designed to stack — but on the right node):

- `.duotone` + `.dim`: supported by an explicit combo rule — put `.dim` on the
  **media element** inside the wrapper; the grayscale base dims before the
  overlays remap it.
- `.duotone` + `.edge-fade` / `.reveal`: put them on the **wrapper**, not the
  media — the mask/animation then treats the whole composite (overlays
  included). On the inner media they would fade the photo out from under the
  overlays.
- `.dim` + `.edge-fade`: freely combined on the media (different properties).
- `.duotone` media is scheme-stable by construction (accent-derived endpoints
  at fixed lightnesses), so it does not need `.dim`.
- `.color-reveal` + `.dim`: explicit combo rule (both write the media
  `filter`); the dim prefix holds while the grayscale argument transitions.
- `.color-reveal` inside `.duotone`: **forbidden** — duotone media is
  grayscale by construction, so there is no colour to reveal.
- `.frosted-caption` + `.duotone` on the same wrapper: supported — the caption
  carries `z-index: 2` and paints above the blend overlays (D-12 rule).
- `.organic-frame` / `.squircle` / `.adaptive-crop` go on the **media**, and
  compose freely with the media-level filters (`.dim`, `.color-reveal`) —
  crop and filter are different properties. `.organic-frame` + `.squircle`
  on one element is meaningless (both draw the corner geometry; shape() wins
  where supported).
- `.glow` around an `.organic-frame`/`.squircle` media: the halo follows the
  clipped silhouette — the flagship combo. Don't put `.glow`'s halo on an
  `.edge-fade`d media (the shadow re-outlines the very edge the mask melts).

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Entering viewport | `.reveal` via `animation-range: entry` | Fade/scale from the token start-state to normal | Not announced — decorative motion only; content identical at rest |
| Hover / keyboard focus | `.color-reveal:is(:hover, :focus-visible)`, or `:is(a, button, summary):is(:hover, :focus-visible) .color-reveal` | Grayscale rest state saturates to full colour (`--wel-motion`-ridden transition) | Not announced — decorative; the image content is identical in both states |

## Tokens consumed

**This table is the component's theming contract.**

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-img-dim` | identity / `--wel-img-dim-amount` per scheme | — | **Tokens layer**, scheme-coupled: identity filter in light, the amount in dark. Follows `[data-theme]` pins exactly like the palette; reset to identity under forced colors. Always a valid filter list (identity, never `none`) so consumers can compose it. |
| `--wel-img-dim-amount` | `brightness(0.85) contrast(1.05)` | — | The dark-scheme amount — retune in one place. |
| `--wel-duotone-shadow` | `oklch(from --wel-color-accent 0.28 c h)` | — | Colour the darks map to. Both endpoints re-derive from the *cascaded* accent (docs/05 derivation pattern). |
| `--wel-duotone-highlight` | `oklch(from --wel-color-accent 0.95 calc(c / 3) h)` | — | Colour the lights map to. |
| `--wel-edge-fade` | `--wel-space-8` | — | Depth of the fade band. |
| `--wel-reveal-scale` | `0.96` | — | `.reveal` start scale. |
| `--wel-reveal-distance` | `0px` | — | `.reveal` start block-axis offset; positive rises into place. |
| `--wel-frosted-bg` | `color-mix(in oklch, --wel-color-surface 68%, transparent)` | — | Caption bar scrim when `backdrop-filter` is available. The no-blur fallback scrim (92% surface) is internal — near-solid so text stays readable without the glass. |
| `--wel-frosted-blur` | `16px` | — | Backdrop blur radius. |
| `--wel-frosted-saturate` | `1.8` | — | Backdrop saturation boost (the "glass" pop). |
| `--wel-color-reveal-rest` | `1` | — | `.color-reveal` rest grayscale amount; lower for a softer rest state. |
| `--wel-crop-narrow` | `1` | — | `.adaptive-crop` aspect ratio in layout containers `< 30rem`. |
| `--wel-crop-wide` | `21 / 9` | — | `.adaptive-crop` aspect ratio at `>= 30rem`. The query widths themselves are literals — container query conditions cannot read custom properties. |
| `--wel-glow-color` | `oklch(from --wel-color-accent l c h / 55%)` | — | Halo colour; re-derives from the cascaded accent (docs/05 derivation pattern). |
| `--wel-glow-size` | `1.5rem` | — | Halo spread; also the ambient variant's blur radius and pseudo outset. |
| `--wel-glow-image` | *unset* | — | Ambient variant's image source (`url(…)`), set inline on the wrapper. Unset → the pseudo paints nothing. **Absolute or root-relative URLs only**: engines disagree on the base for a relative `url()` inside a custom property (Chromium resolves it against the stylesheet that substitutes it — i.e. `welkin.css` — and silently 404s). From a relative-path page, feed the pseudo directly in author CSS instead: `.hero-glow::before { background-image: url(img/poster.jpg) }`. |
| `--wel-squircle-radius` | `25%` | — | Corner radius the squircle (or the round fallback) is drawn at. |

## Behaviour tiers

### Core (Baseline Widely Available)

`.dim` and `.duotone`'s blend/filter mechanics (`filter`, `mix-blend-mode`,
`isolation`) are long-Baseline and ship ungated. The `prefers-color-scheme`
wiring behind `--wel-img-dim` is Core. So are wave 2's foundations:
`.color-reveal`'s filter transition (`@media (hover: hover)` is a capability
gate, not a support gate), `.adaptive-crop`'s container queries (the
architecture spine), `.glow`'s `drop-shadow`, and `.frosted-caption`'s
near-solid `color-mix` fallback scrim.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| Relative colour syntax (`oklch(from …)`) | None — the failure mode is already additive | `.duotone` endpoints derive from the cascaded accent | Engines without it invalidate the overlay `background-color` at computed-value time: overlays render transparent and the image shows **desaturated only** — readable, on-doctrine (docs/03 row) |
| `mask-image` / `mask-composite` | None — additive by nature | `.edge-fade` gradient melts | Unfaded image (docs/03 row) |
| Scroll-driven animations (`animation-timeline: view()`) | `@supports (animation-timeline: view())` **around the hidden start state** | `.reveal` entry animation | The gate is load-bearing: outside it no `opacity: 0` exists, so no-support engines (and reduced-motion users, whose gate nests inside) always see the image — never a stuck blank (docs/03 row) |
| `view-transition-class` (Level 2) | None — unknown selector/property drop additively | `data-vt-image` morph treatment | Default VT morph (stretch + cross-fade); owned by the [view-transitions spec](view-transitions.md) |
| `backdrop-filter` | `@supports (backdrop-filter: blur(1px))` around the glass branch | `.frosted-caption` blur+saturate glass over a 68% scrim | Ungated near-solid (92% surface) scrim — caption text readable over any image, just no glass (docs/03 row) |
| `clip-path: shape()` | `@supports (clip-path: shape(…))` | `.organic-frame` blob/arch/scallop crops | Ungated `border-radius` analogues: blob and arch keep honest approximations, scallop falls back to a plain rounded crop; the fallback radius is zeroed inside the gate so the clips never intersect (docs/03 row) |
| `corner-shape: squircle` | None — `corner-shape` only reshapes how `border-radius` corners draw, so its absence is inherently additive | `.squircle` superellipse corners | Plain round corners at the same `--wel-squircle-radius` (docs/03 row) |

### JS enhancement

None. The gallery wiring on the demo page is page-side example code, not
shipped JS.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** none — purely presentational treatments; `alt` text is
  unaffected and required as usual. Duotone/dim change tone, not content;
  meaningful-colour images (charts, diagrams) should not be duotoned.
- **Keyboard interaction:** none.

| Key | Action |
|-----|--------|
| — | No interaction surface |

- **Focus behaviour:** unaffected. `.duotone` overlays and the `.glow` ambient
  pseudo are `pointer-events: none` and cannot intercept interaction.
  `.color-reveal` reveals on `:focus-visible` (own or a wrapping
  link/button/summary), so keyboard users get exactly what hover users get.
- **Hover capability:** `.color-reveal` lives entirely inside
  `@media (hover: hover)` — touch/stylus users see the plain colour image,
  never one stuck grayscale with no way to reveal it.
- **Forced colors:** `.duotone` drops its overlays and desaturation and shows
  the original image (forced backgrounds would otherwise paint opaque slabs
  over it); `--wel-img-dim` resets to identity. `.edge-fade` keeps its mask
  (geometry, not colour); `.reveal` is motion-only. `.glow` drops both halo
  forms (a decorative coloured halo has no forced-colors story). The
  `.frosted-caption` bar needs no rule — its background is forced to an
  opaque system colour, which is the readable outcome. Crops
  (`.organic-frame`, `.squircle`, `.adaptive-crop`) are geometry and keep.
- **Reduced motion:** `.reveal` sits inside
  `@media (prefers-reduced-motion: no-preference)` — gated **off**, per the
  docs/09 matrix (a timeline animation has no duration for `--wel-motion` to
  zero). `data-vt-image` inherits the view-transitions module's identical
  gate. `.color-reveal`'s transition rides the `--wel-motion` multiplier —
  reduced-motion users get an instant swap, and the state change itself is
  non-vestibular (opacity/filter only). Everything else is static.
- **Reduced transparency:** the `.frosted-caption` bar falls back to a fully
  opaque `--wel-color-surface` scrim (no blur) under
  `prefers-reduced-transparency: reduce`, per the docs/09 matrix.
- **Contrast:** decorative image treatments carry no text-contrast pairings.
  Do not set text over an `.edge-fade`d region that fades into an unknown
  backdrop; `.frosted-caption` is the family's sanctioned text-on-imagery
  pattern — its bar is the ink/surface pairing over a surface-colour scrim,
  near-solid whenever blur can't guarantee separation. Keep
  `--wel-frosted-bg` at or above its default opacity if you override it.
- **WCAG 2.2 criteria specifically implicated:** 2.3.3 Animation from
  Interactions (AAA) — satisfied by the reduced-motion gates; 1.4.13 — not
  triggered (`.color-reveal` reveals no *content* on hover, the image is
  identical); 1.4.11 — not implicated (no UI components rendered).

## Container behaviour

`.adaptive-crop` is the family's container-responsive member: it queries the
nearest layout primitive (`container-name: layout`, like every
container-aware component) and switches crop at the card spec's established
30rem width. With no layout ancestor neither branch matches and the media
keeps its natural aspect. Everything else is geometry-relative (`%`-based
masks and `shape()` paths, own-element view timelines) and holds at any
container width.

## Composition

- `.duotone`, `.frosted-caption`, and `.glow` force their media to
  `display: block; inline-size: 100%` — overlays/captions/halos cover the
  wrapper, and any uncovered backdrop breaks the effect. Size the wrapper,
  not the image.
- The media `filter` is the contended property: `.duotone` (grayscale),
  `.dim`, and `.color-reveal` all write it, resolved by the explicit combo
  rules (see Variants). A future filter-based effect must join those rules
  rather than add another competing declaration. `.glow` deliberately puts
  its filter on the **wrapper** to stay out of this contention.
- `.frosted-caption` uses `overflow: clip`, so a `border-radius` on the
  wrapper crops media and caption together — round the wrapper, not the
  media.
- Overlay stacking (probe D-12): a `filter`ed image is a stacking context
  painted at the z-0 level in tree order — pseudo-element overlays over
  filtered media need `z-index: 1` or they silently paint underneath. This
  bites any wave-2/3 effect combining filters with overlays.
- `.reveal` + sticky/fixed ancestors: `view()` tracks the nearest scroll
  container; inside a non-scrolling fixed panel the timeline never advances —
  don't put `.reveal` in fixed chrome.

Forbidden nestings: `.duotone` inside `.duotone` (the outer overlays remap the
inner's already-mapped output; the result is mud, not an error);
`.color-reveal` inside `.duotone` (no colour to reveal); `.organic-frame` +
`.squircle` on one element (two corner geometries, one wins silently).

## References

Prior art: duotone.shapefactory.co (canvas-based duotones — we ship the
two-blend-overlay CSS recipe instead); Chrome's scroll-driven animations and
view-transitions guidance; the `object-fit` snapshot recipe for image morphs.
What we do differently: every effect is a token hook off the existing accent /
space / motion systems, so a Level-1 theme restyles imagery for free.

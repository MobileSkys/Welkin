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
dual-scheme page: dark-mode dimming, duotone brand tinting, edge-fade bleeds,
scroll-driven entry, and (via the view-transitions module) thumb-to-detail
morphs. All zero-JS. Wave 1 of the image-FX plan; live demos with copyable
markup: `examples/image-fx.html`.

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
```

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-edges` (on `.edge-fade`) | `block`, `inline`, `block-start`, `block-end`, `inline-start`, `inline-end`, `radial` | Narrows the fade to one axis/edge, or an elliptical vignette. Omit for all four edges. The asymmetric `inline-*` values flip under `:dir(rtl)`. |
| `data-vt-image` | boolean | Image morph treatment — see the [view-transitions spec](view-transitions.md), which owns this attribute. |

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

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Entering viewport | `.reveal` via `animation-range: entry` | Fade/scale from the token start-state to normal | Not announced — decorative motion only; content identical at rest |

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

## Behaviour tiers

### Core (Baseline Widely Available)

`.dim` and `.duotone`'s blend/filter mechanics (`filter`, `mix-blend-mode`,
`isolation`) are long-Baseline and ship ungated. The `prefers-color-scheme`
wiring behind `--wel-img-dim` is Core.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| Relative colour syntax (`oklch(from …)`) | None — the failure mode is already additive | `.duotone` endpoints derive from the cascaded accent | Engines without it invalidate the overlay `background-color` at computed-value time: overlays render transparent and the image shows **desaturated only** — readable, on-doctrine (docs/03 row) |
| `mask-image` / `mask-composite` | None — additive by nature | `.edge-fade` gradient melts | Unfaded image (docs/03 row) |
| Scroll-driven animations (`animation-timeline: view()`) | `@supports (animation-timeline: view())` **around the hidden start state** | `.reveal` entry animation | The gate is load-bearing: outside it no `opacity: 0` exists, so no-support engines (and reduced-motion users, whose gate nests inside) always see the image — never a stuck blank (docs/03 row) |
| `view-transition-class` (Level 2) | None — unknown selector/property drop additively | `data-vt-image` morph treatment | Default VT morph (stretch + cross-fade); owned by the [view-transitions spec](view-transitions.md) |

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

- **Focus behaviour:** unaffected. `.duotone` overlays are
  `pointer-events: none` and cannot intercept interaction.
- **Forced colors:** `.duotone` drops its overlays and desaturation and shows
  the original image (forced backgrounds would otherwise paint opaque slabs
  over it); `--wel-img-dim` resets to identity. `.edge-fade` keeps its mask
  (geometry, not colour); `.reveal` is motion-only.
- **Reduced motion:** `.reveal` sits inside
  `@media (prefers-reduced-motion: no-preference)` — gated **off**, per the
  docs/09 matrix (a timeline animation has no duration for `--wel-motion` to
  zero). `data-vt-image` inherits the view-transitions module's identical
  gate. `.dim`, `.duotone`, `.edge-fade` are static.
- **Contrast:** decorative image treatments carry no text-contrast pairings.
  Do not set text over an `.edge-fade`d region that fades into an
  unknown backdrop; use the frosted caption pattern (wave 2) for text on
  imagery.
- **WCAG 2.2 criteria specifically implicated:** 2.3.3 Animation from
  Interactions (AAA) — satisfied by the reduced-motion gates; 1.4.11 —
  not implicated (no UI components rendered).

## Container behaviour

Not container-responsive in wave 1 (container-query treatments are a wave-2
item). All effects are geometry-relative (`%`-based masks, own-element view
timelines) so they hold at any container width.

## Composition

- `.duotone` forces its media to `display: block; inline-size: 100%` — the
  overlays cover the wrapper, and any uncovered backdrop would blend into a
  solid colour slab. Size the wrapper, not the image.
- The media `filter` is the contended property: `.duotone` (grayscale) and
  `.dim` both write it, resolved by the explicit combo rule (see Variants).
  A future filter-based effect must join that rule rather than add a third
  competing declaration.
- Overlay stacking (probe D-12): a `filter`ed image is a stacking context
  painted at the z-0 level in tree order — pseudo-element overlays over
  filtered media need `z-index: 1` or they silently paint underneath. This
  bites any wave-2/3 effect combining filters with overlays.
- `.reveal` + sticky/fixed ancestors: `view()` tracks the nearest scroll
  container; inside a non-scrolling fixed panel the timeline never advances —
  don't put `.reveal` in fixed chrome.

Forbidden nestings: `.duotone` inside `.duotone` (the outer overlays remap the
inner's already-mapped output; the result is mud, not an error).

## References

Prior art: duotone.shapefactory.co (canvas-based duotones — we ship the
two-blend-overlay CSS recipe instead); Chrome's scroll-driven animations and
view-transitions guidance; the `object-fit` snapshot recipe for image morphs.
What we do differently: every effect is a token hook off the existing accent /
space / motion systems, so a Level-1 theme restyles imagery for free.

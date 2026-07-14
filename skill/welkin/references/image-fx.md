# Image effects (utilities) — post-1.0.1

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
- Don't set text over a faded region — the backdrop is unknown; use a frosted
  caption instead (future wave).

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

## Combining effects — which class goes where

| Combination | How |
|-------------|-----|
| `.duotone` + `.dim` | `.dim` on the **media element** inside the wrapper (explicit combo rule dims the base before remapping) |
| `.duotone` + `.edge-fade` or `.reveal` | On the **wrapper** — on the inner img they'd fade the photo out from under the overlays |
| `.dim` + `.edge-fade` | Freely combined on the media (different properties) |
| `.duotone` in `.duotone` | Never — remapping a remap is mud |

`.duotone` output is scheme-stable (accent-derived endpoints), so it doesn't
need `.dim`.

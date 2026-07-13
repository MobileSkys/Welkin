# Component: Carousel

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Platform |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

A horizontally scrollable, snap-aligned series of slides for browsable sets — product
images, media galleries, card rails — where sequence matters and inline space doesn't
allow showing everything. Do NOT use for content every user must see (use `.grid` —
carousels hide content by design), for primary navigation, or for auto-rotating
"hero" banners: **there is no autoplay in v1** (see Accessibility — a scope decision,
not an omission). The platform primitive is scroll-snap: the browser supplies
scrolling, snapping, touch, and momentum; CSS supplies the rest.

## Anatomy

```
┌─ root (.carousel) ─────────────────────────────────┐
│ ┌─ scroller (ul) ─────────────────────────────────┐│
│ │ [ slide ] [ slide ] [ slide ] [ sli… →          ││
│ └─────────────────────────────────────────────────┘│
│  ◀ ▶  scroll buttons  (Enhanced, CSS-generated)     │
│  ● ○ ○ ○  markers     (Enhanced, CSS-generated)     │
└─────────────────────────────────────────────────────┘
```

Parts: root (`.carousel`, the labelled container); scroller (`.carousel-track`, the
scroll-snap container); slides (its direct children); markers and prev/next buttons
(`::scroll-marker` / `::scroll-button()` pseudo-elements — generated, never authored).

## HTML structure

```html
<section class="carousel" aria-roledescription="carousel" aria-label="Featured work">
  <div class="carousel-track" tabindex="0" role="group" aria-label="Slides">
    <div role="group" aria-roledescription="slide" aria-label="1 of 4">
      <figure class="frame">…</figure>
    </div>
    <div role="group" aria-roledescription="slide" aria-label="2 of 4">…</div>
    <div role="group" aria-roledescription="slide" aria-label="3 of 4">…</div>
    <div role="group" aria-roledescription="slide" aria-label="4 of 4">…</div>
  </div>
</section>
```

Rationale: a labelled `<section>` maps to a `region` landmark;
`aria-roledescription="carousel"` announces the widget type (APG carousel pattern).
`.carousel-track` is the scroll container — `tabindex="0"` makes keyboard scrolling
guaranteed in every engine (some browsers auto-focus scrollable regions, Firefox and
others do not; a focusable element needs a name, hence `role="group"` +
`aria-label="Slides"` — a bare `div` cannot carry a label). Each slide is
`role="group"` + `aria-roledescription="slide"` with an "N of M" label — authored by
the host since slide count is static content. Divs, not `ul`/`li`, deliberately:
`role="group"` on `<li>` strips its listitem role, leaving a list with no list items —
an ARIA validity error (axe `list`) the APG pattern avoids by not claiming list
semantics at all (found at implementation, T-46). Markers and buttons are
pseudo-elements on the scroller: zero extra markup, so the Core-tier document contains
nothing that could dangle unstyled.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-align` | *(absent)* = `start`, `center` | `scroll-snap-align` of slides: rail-style start snap, or one-centred-slide gallery snap |

Slide sizing is a token knob (`--wel-carousel-slide-size`), not an axis — it is a
length, not an enumerable option. Axes compose freely.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Focus | `:focus-visible` on scroller | Global focus ring | — |
| Current marker | `::scroll-marker` + `:target-current` *(Enhanced)* | Filled marker vs hollow ring | Browser exposes marker group as single tab stop with current state |
| Hover (buttons) | `::scroll-button(*):hover` *(Enhanced)* | Bg shifts to derived `-hover` shade | — |
| Disabled (buttons) | `::scroll-button(*):disabled` *(Enhanced)* | Reduced-contrast pair | Implicit — UA disables at scroll ends |

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-carousel-gap` | `var(--wel-space-4)` | — | Between slides |
| `--wel-carousel-slide-size` | `100%` | — | Inline size of a slide; set e.g. `min(100%, 18rem)` for a multi-up rail |
| `--wel-carousel-padding` | `var(--wel-space-gutter)` | — | Scroller inline padding; doubles as `scroll-padding` so snapped slides clear the edges |
| `--wel-carousel-marker` | `var(--wel-color-border-strong)` | — | ≥ 3:1 vs surface (1.4.11) |
| `--wel-carousel-marker-current` | `var(--wel-color-accent)` | — | Current also differs by fill vs ring, not colour alone |
| `--wel-carousel-button-bg` / `-ink` | `var(--wel-color-surface-raised)` / `var(--wel-color-ink)` | — | 05 pairing |

## Behaviour tiers

### Core (Baseline Widely Available)

**Fully functional with Core CSS alone.** The scroller is
`overflow-x: auto; scroll-snap-type: inline mandatory;` with
`overscroll-behavior-x: contain` (physical overflow properties — a permitted
[ADR-0009](../decisions/ADR-0009-logical-properties-rtl.md) exception until the logical
`overflow-inline` forms graduate per ADR-0012); slides snap per `data-align`. Every user can
operate it: touch swipe, trackpad/wheel, scrollbar, and keyboard (focus the scroller,
arrow keys) — the browser's scrolling machinery, not a reimplementation. This is the
tier contract: the Enhanced controls below are conveniences layered on a working
widget, not the widget.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| `::scroll-marker` / `scroll-marker-group` | `@supports selector(::scroll-marker)` | CSS-generated dot markers, one per slide; clickable, browser-managed as a single tab stop with arrow-key movement; `:target-current` styles the active dot | Markers absent; navigation by swipe/scrollbar/keyboard, or JS buttons ([03 contract row](../03-browser-support-policy.md)) |
| `::scroll-button(inline-start/end)` | `@supports selector(::scroll-button(*))` | CSS-generated prev/next buttons scrolling one snap stop; UA auto-disables at the ends | Buttons absent; same fallback as markers ([03](../03-browser-support-policy.md)) |
| Scroll-driven animations | `@supports (animation-timeline: scroll())` | Scroll-progress bar under the scroller, driven by scroll position | Progress bar absent; content static and fully readable ([03](../03-browser-support-policy.md)) |

Per the 03 `@supports` strategy these are additive-only: no Enhanced rule changes
reachability.

Implementation status (T-46): the scroll-progress bar shipped (scroll-driven
animations passed intake with the navbar/table sticky affordances). `::scroll-marker`
/ `::scroll-button()` remain Chromium-only at implementation — **design-approved,
implementation-blocked** per the [03 audit note](../03-browser-support-policy.md) /
[ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md); their rules enter
`carousel.css` at intake. Until then the 2.5.7 story for fallback browsers is the
`carousel-buttons.js` module below.

### JS enhancement

Not required for this tier — the component is complete without JS. One **optional**
micro-module exists for hosts that need visible prev/next buttons where the Enhanced
CSS is unsupported (see the 2.5.7 discussion below):

- **Ladder justification (for the optional module only):** generated, auto-disabling
  scroll buttons are rung 1 where `::scroll-button()` exists; where it doesn't, no
  rung-1/2 mechanism can create them, and 2.5.7 may require a pointer-clickable
  control.
- **Element/module:** data-attribute upgrader per
  [ADR-0011](../decisions/ADR-0011-js-delivery-mechanism.md): `js/carousel-buttons.js`
  scans `[data-carousel-buttons]` on `.carousel` and injects two real `<button
  class="button">` prev/next controls that `scrollBy` one snap stop. **Detect and
  yield** ([08](../08-javascript-policy.md)): the module no-ops entirely when
  `CSS.supports("selector(::scroll-button(*))")` — it is deleted when the feature
  graduates. ≤ 2 KB min+gzip.
- **Attributes (config in):** `data-carousel-buttons` (presence only).
- **Events (state out):** none — scrolling is observable platform state
  (`scroll`/`scrollend`).
- **No-JS baseline:** the Core scroller, unchanged.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** labelled `region` + `aria-roledescription="carousel"` on the root;
  scroller focusable with an accessible name; slides `role="group"` +
  `aria-roledescription="slide"` + `aria-label="N of M"` (host-authored). No
  `aria-live` — nothing changes without user action (no autoplay).
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Focus the scroller; then Enhanced marker group (one stop); then focusable slide content |
| ArrowRight / ArrowLeft | Scroll the focused scroller; snap settles on a slide (native) |
| Home / End | Scroll to first / last slide (native scroller behaviour where supported) |
| Arrow keys in marker group | Move between markers, scrolling the target slide into view (UA-provided, Enhanced) |

- **Focus behaviour:** nothing moves focus programmatically. Known limitation,
  stated honestly: focusable content in off-screen slides remains in tab order and
  the browser scrolls it into view on focus — acceptable (nothing is unreachable),
  but noisy for long carousels; see open questions re `inert`.
- **Dragging (2.5.7) — honest assessment:** swiping is a drag gesture, so a
  single-pointer non-drag alternative is required. Enhanced markers/buttons satisfy
  it where supported; the optional JS module satisfies it otherwise. **Where Enhanced
  CSS is unsupported AND the host omits the JS module**, what remains is keyboard
  scrolling plus the visible scrollbar (track-click pages without dragging) — thin.
  The docs therefore state: hosts targeting fallback browsers must either include
  `data-carousel-buttons` + the module, or accept documented marginal 2.5.7
  conformance there. We do not pretend the gap away.
- **No autoplay (2.2.2):** auto-advancing content demands pause/stop/hide controls;
  rather than ship a stop button for motion nobody asked for, v1 ships no autoplay at
  all — a scope decision recorded here and in open questions.
- **Forced colors:** markers get `CanvasText` ring / `Highlight` fill via a
  `forced-colors: active` block — current state survives because it is fill vs ring,
  not colour alone. Generated scroll buttons map to `ButtonFace`/`ButtonText`; the
  scroller's focus ring follows the global rule.
- **Reduced motion:** `scroll-behavior: smooth` (for marker/button-triggered scrolls)
  drops to `auto` under `prefers-reduced-motion`; the scroll-driven progress bar is
  gated off per the [09 preference matrix](../09-accessibility.md). User-initiated
  scrolling itself is never suppressed.
- **Contrast:** markers and button pairings ≥ 3:1 (1.4.11); slide content contrast is
  the content's own concern.
- **WCAG 2.2 criteria specifically implicated:** 2.5.7 Dragging Movements (the
  load-bearing one — see above); 2.2.2 Pause, Stop, Hide (avoided by the no-autoplay
  scope decision); 1.4.11 Non-text Contrast (markers/buttons); 2.1.1 Keyboard
  (focusable scroller); 2.4.7 Focus Visible.

## Container behaviour

Intrinsic — no `@container` breakpoints. The scroller fills its container at any
width; slide count in view falls out of `--wel-carousel-slide-size` vs container size
(authors use `min(100%, …)` so slides never overflow narrow containers). Sensible
minimum ~14rem. No subgrid participation (slides own their internals; aligned-content
rails should use `.grid` instead).

## Composition

Slides may contain: cards, `.frame` media, captions — any non-carousel content.
May be contained by: `.center` (including `data-breakout` full-bleed), page sections,
cards (rail-in-card). Forbidden: nested carousels; a carousel as the only path to
critical content (hiding-by-design); components arranging slides externally — the
scroller owns its children per the [07 composition rules](../07-component-model.md).

## Open questions

- Off-screen focusable content: should slides outside the snap viewport get `inert`
  (needs either scroll-state container queries or a JS observer — the latter breaks
  the Platform-tier promise)? Revisit when `@container scroll-state()` matures.
- Autoplay post-v1: if ever added, it is a JS-enhanced opt-in with visible
  pause/stop (2.2.2) and `aria-live="off"` while rotating — spec before building.
- Slide-count announcement: is host-authored "N of M" labelling too easy to get
  wrong? A lint rule vs generating labels (which would need JS) — leaning lint.
- `:target-current` naming/behaviour is still settling in the spec pipeline — track
  against [ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md) intake.

## References

Bootstrap carousel: transform-based JS slider — JS-required (no-JS shows one static
slide), autoplay by default (`data-bs-ride`), hand-authored indicator/control markup,
drag/swipe via pointer tracking, no scroll-snap. We differ: the browser's scroll
machinery is the widget (touch, momentum, RTL logical directions for free), no JS
required, controls are CSS-generated pseudo-elements instead of authored boilerplate,
no autoplay in v1, and the 2.5.7 story is stated honestly instead of assumed.

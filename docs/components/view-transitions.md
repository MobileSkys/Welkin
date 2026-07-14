# Component: View transitions (cross-document)

| | |
|---|---|
| **Status** | Review |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | post-v1 |

## Purpose

An **opt-in page module**, not a widget: linking
`dist/components/view-transitions.css` opts the page into cross-document view
transitions, so same-origin navigations in a multi-page site morph instead of
flashing — the default is a page cross-fade, and elements the author names via
`--wel-vt` (a hero image, a navbar, a card) travel between the two pages'
layouts. Use it on MPA sites where pages share persistent elements. Do NOT use
it for same-document state changes (tabs and toast already ship their own view
transitions), and it is deliberately **excluded from `welkin.css`** — a
stylesheet must never change the feel of every navigation as a side effect of
being bundled. Both the outgoing and incoming page must link the module; the
browser runs the transition only when the two documents agree.

## Anatomy

No DOM parts — the module styles the transition's pseudo-element tree on the
document root:

```
::view-transition
└─ ::view-transition-group(root | <--wel-vt name>)
   └─ ::view-transition-image-pair(…)
      ├─ ::view-transition-old(…)   snapshot of the outgoing page/element
      └─ ::view-transition-new(…)   live incoming page/element
```

## HTML structure

The API is one stylesheet link per page plus optional `--wel-vt` names. Names
are regular custom-ident values: the same name on one element of each page
makes the pair morph; a name used **twice on one page** aborts the whole
transition (the property is registered non-inheriting so container names
cannot leak into descendants).

```html
<!-- on EVERY page of the site (both sides of a navigation must opt in) -->
<link rel="stylesheet" href="/dist/welkin.min.css">
<link rel="stylesheet" href="/dist/components/view-transitions.min.css">

<!-- shared elements: same --wel-vt name on each page, once per page -->
<img class="hero" style="--wel-vt: hero" src="trail.avif" alt="…">
<!-- or in the site's own CSS: .hero { --wel-vt: hero } -->
```

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| — | — | No variant axes. Behaviour is tuned via tokens (below). |

Composability rules: composes with every component; the tabs/toast
same-document transitions keep their own named groups (their rules are more
specific than this module's universal defaults).

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Transition active | `:root:active-view-transition` | Scrolling is forced instant so fragment navigations land before the capture (see Accessibility → Reduced motion and the probe note below) | — |

## Tokens consumed

**This table is the component's theming contract.**

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-vt` | *(unset — guaranteed-invalid)* | `syntax: "*"`, `inherits: false` | Set per element to a custom-ident to name a shared-element group; on `:root` it renames the page group (default `root`) |
| `--wel-motion-duration-3` | `300ms` | — | Duration of every transition group (page fade and morphs) |
| `--wel-motion-ease` | — | — | Timing function of every group |
| `--wel-motion` | `1` | — | Multiplier; participates like all Welkin motion |

## Behaviour tiers

### Core (Baseline Widely Available)

Nothing — with Core-tier CSS only, navigations are ordinary instant
navigations. The module is 100% additive.

### Enhanced (Baseline Newly Available)

Cross-document view transitions are **below Newly Available** (Chrome 126+,
Safari 18.2+; Firefox has View Transitions Level 1 only, which is
same-document). The module ships anyway, under the docs/03 opt-in-module
carve-out: it is never bundled, and the degradation is additive by nature.

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| `@view-transition { navigation: auto }` | **None — no gate exists for an at-rule, and none is needed**: engines without it ignore the unknown rule wholesale | Same-origin navigations cross-fade; `--wel-vt`-named pairs morph | Instant navigation, fully functional (docs/03 row: cross-document view transitions) |
| `:active-view-transition` | None (unknown pseudo-class: the rule drops in engines without it, which are exactly the engines that never have an active transition) | Instant scrolling while a transition runs, so fragment navigations capture at the fragment | Rule inert |

### JS enhancement

None.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** none — no DOM is generated.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| — | No interaction surface |

- **Focus behaviour:** unaffected; view transitions do not move focus.
- **Forced colors:** snapshots render the page's forced-colors rendering;
  no module-specific treatment.
- **Reduced motion:** the **entire module** sits under
  `@media (prefers-reduced-motion: no-preference)` — the `--wel-motion`
  multiplier cannot zero a UA-driven navigation animation, so per docs/09 the
  preference gates the feature *off*: navigations are instant, exactly the
  non-module experience. Verified in the T-89 probe (`pagereveal.viewTransition`
  is `null` under emulated reduce).
- **Increased contrast (`prefers-contrast: more`):** token-layer handled; no
  component-specific treatment.
- **Reduced transparency (`prefers-reduced-transparency: reduce`):** None —
  the cross-fade is a UA animation between opaque snapshots.
- **Contrast:** no pairings consumed.
- **WCAG 2.2 criteria specifically implicated:** 2.3.3 Animation from
  Interactions (AAA) — satisfied by the reduced-motion gate.

## Container behaviour

Not container-responsive; the transition pseudo-tree belongs to the viewport.
No subgrid participation.

## Composition

May be combined with any component. Interactions verified in the T-89 probe
(Chromium 149, local HTTP — `file://` pages are mutually cross-origin, so
cross-document transitions can never run from disk):

- **Reset smooth scrolling (the v1.0.0 gotcha):** history back/forward scroll
  restoration is *immune* — it lands instantly before the new page is
  captured, smooth or not. Cross-document **fragment** navigations
  (`page.html#section`) are not: the capture happened at scroll 0 and the
  cross-fade played over a page still smooth-scrolling thousands of pixels.
  The module's `:root:active-view-transition { scroll-behavior: auto }` fixes
  this (verified: capture lands at the fragment).
- **Same-document transitions (tabs, toast):** unaffected; their named groups
  outrank the module's `*`-argument defaults.
- **Root name:** the module's universal `--wel-vt` hook would strip the UA's
  `:root { view-transition-name: root }` and with it the default page fade;
  the module restores it explicitly. Authors may rename the page group by
  setting `--wel-vt` on `:root`.
- **Destination-page scripts (the reliability gotcha):** Chrome activates the
  inbound transition only if the new page's `DOMContentLoaded` beats its first
  paint. **Deferred** scripts hold DCL back, so a slow `defer` fetch means the
  transition silently never fires (probed: `defer` + 600 ms latency → 0/6;
  flaky even on localhost). `async` scripts only delay the `load` event and
  are reliable (8/8 even at 4.5 s latency), as are parser-blocking `<head>`
  scripts. Rule: on pages that opt in, load heavy scripts `async` (gate wiring
  on the `load` event) — never `defer`. Navigations started while a transition
  is still running skip the new one (spec behaviour).

Forbidden nestings: none, but **one `--wel-vt` name must not appear twice on
one page** — the browser skips the entire transition.

## Open questions

- Should the showcase's per-page `view-transition-class` conventions (T-90)
  graduate into the module once Level 2 classes are Baseline?
- Harness note for future automated tests (T-94): Playwright's default
  Chromium switches disable `PaintHolding` (cross-document transitions are
  skipped wholesale, `pagereveal` never fires) and back/forward cache
  (back-navigation transitions skip). Tests must re-enable both.

## References

Prior art: Astro's `<ViewTransitions />` router (JS simulation of MPA
transitions — we ship the native CSS rule instead); Chrome's cross-document
view transitions guidance. What we do differently: no router, no JS, one
custom property (`--wel-vt`) as the whole naming API, and reduced motion
gates the feature off entirely rather than shortening it.

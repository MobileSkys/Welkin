---
status: Draft
depends-on: []
---

# 01 — Vision & Principles

## Elevator pitch

Welkin is a frontend toolkit for websites that treats modern CSS as a complete platform, not
a compile target. It gives designers and small teams beautiful, accessible components with
readable HTML, theming that takes minutes instead of days, and JavaScript only where the
platform genuinely cannot do the job. Where Bootstrap was built for a web where CSS was
weak and jQuery was necessary, Welkin is built for the web we have now: container queries,
cascade layers, `:has()`, native dialogs and popovers, and a colour system the browser
computes for you.

**Tagline candidates:** "The CSS-first toolkit." / "Style like it's 2026."

## Who it's for

- **Designers who know CSS** and want a system that respects that knowledge instead of
  hiding it behind a utility DSL or a Sass pipeline.
- **Small teams and solo developers** shipping content sites, marketing sites, docs,
  dashboards, and small products — people who want good defaults without adopting a
  framework.
- **Educators and learners**, because Welkin source is plain, readable, modern CSS — the
  toolkit doubles as a demonstration of how the platform works today.

**Not primarily for:** enterprise app-shell teams already committed to a component
framework's ecosystem (React/Vue wrappers are an explicit v1 non-goal).

## What "designer-friendly" concretely means

These are testable claims, not marketing:

1. **HTML reads like the design vocabulary.** A card is `class="card"`. A primary large
   button is `<button class="button" data-variant="primary" data-size="lg">` — words a
   designer would say out loud, not `btn btn-outline-secondary btn-lg`.
   (See [ADR-0001](decisions/ADR-0001-variant-syntax.md).)
2. **Theming is editing a small token file.** Changing the brand accent is one `oklch()`
   value; hover/active shades, focus rings, and tinted surfaces derive automatically via
   `color-mix()`. You never fight specificity to restyle a component.
   (See [05-design-tokens.md](05-design-tokens.md), [10-theming-and-customisation.md](10-theming-and-customisation.md).)
3. **No build step required.** Link one stylesheet and start. The distributed CSS is the
   source CSS — readable in devtools, patchable by hand.
   (See [ADR-0002](decisions/ADR-0002-source-format-and-build.md).)
4. **Your CSS always wins.** All Welkin styles live in cascade layers; any unlayered rule a
   user writes beats the toolkit by design, with no `!important` and no specificity war.
   (See [04-css-architecture.md](04-css-architecture.md).)
5. **Components look right anywhere.** Components respond to their *container*, so a card
   is correct in a sidebar, a modal, or a full-width grid without breakpoint bookkeeping.
   (See [ADR-0006](decisions/ADR-0006-container-query-first-responsiveness.md).)

## Design principles

1. **CSS-first.** If it can be done well in pure CSS, it must be. The burden of proof is on
   adding JavaScript, never on removing it. (Codified as a decision ladder in
   [08-javascript-policy.md](08-javascript-policy.md).)
2. **Platform-first.** Prefer HTML's built-in capabilities — `<dialog>`, the Popover API,
   `<details>`, native form validation — over reimplementations. The browser's version is
   more accessible, more robust, and free.
3. **Intrinsic, content-out layout.** Layouts derive from content size and container size,
   not from a global 12-column grid pinned to viewport breakpoints.
4. **Progressive enhancement, honestly stated.** Two support tiers with a written
   degradation contract per feature: functional everywhere, delightful where supported.
   (See [03-browser-support-policy.md](03-browser-support-policy.md).)
5. **Calm, distinctive defaults.** Unclassed HTML inside Welkin already looks composed and
   readable. Defaults are opinionated enough to be attractive and tokenised enough that no
   two Welkin sites need to look alike.
6. **Accessible by construction.** WCAG 2.2 AA is a blocking requirement in every component
   spec, not a post-hoc audit. (See [09-accessibility.md](09-accessibility.md).)

## Anti-goals — what we refuse to copy from Bootstrap

Stated explicitly so future decisions can be tested against them:

- **No utility-class soup as the primary API.** Utilities may exist as a small garnish
  layer; they are never how you build a component.
- **No JavaScript for things CSS can do.** Dropdowns, collapse/accordion, tooltips, modals,
  carousels: Bootstrap ships JS for all of these. We do not.
- **No jQuery-style imperative API.** No `$('.modal').modal('show')`, no global plugin
  registry, no `window.welkincss` namespace object.
- **No viewport-breakpoint-everything grid.** No `col-md-6 col-lg-4`. Container queries and
  intrinsic layout primitives replace the 12-column grid.
  (Rationale in [06-layout-system.md](06-layout-system.md).)
- **No Sass variable pipeline.** No 500-variable `_variables.scss`, no compile step to
  change a colour. Custom properties are the variable system, live in the browser.
- **No visual monoculture.** "Every Bootstrap site looks like Bootstrap" is a failure mode.
  The token system must make re-skinning so cheap that the default look is a starting
  point, not a fingerprint.

## Headline promise

> **Works without JavaScript.** Every component is usable with JS disabled. Components
> that accept JS enhancement must define a usable no-JS baseline in their spec — "usable",
> not merely "not broken".

## Success criteria for v1

- A designer can produce a branded site theme (colours, type, radius, density) in under an
  hour by editing tokens only.
- The complete toolkit CSS is smaller than Bootstrap's CSS alone, with zero required JS.
- Every component passes its spec's accessibility acceptance criteria.
- The docs site is built with Welkin itself and includes a no-JS demonstration mode.
- A reader can open any distributed CSS file and understand it without documentation.

## Non-goals for v1

- React/Vue/Svelte wrapper packages.
- An icon font or icon set.
- A date picker, rich data grid, or tour/onboarding component (deferred; see
  [07-component-model.md](07-component-model.md)).
- Supporting browsers below the Core tier baseline
  (see [03-browser-support-policy.md](03-browser-support-policy.md)).

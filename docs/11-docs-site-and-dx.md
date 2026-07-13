---
status: Review
depends-on: [01-vision-and-principles.md, 10-theming-and-customisation.md]
---

# 11 — Docs Site & Developer Experience

Roadmap-level requirements (Phase 6, [12-roadmap.md](12-roadmap.md)); detailed design
happens then. What is binding now:

## Docs site requirements

1. **Built with Welkin itself.** Dogfooding is the acceptance test: if the docs site needs
   CSS the toolkit doesn't provide (or contradicts its own patterns), that's a toolkit
   bug. The site's own theme is a published example theme.
2. **Live theme playground.** A panel of token editors (accent colour, fonts, radii,
   density anchors) applied to the whole site live — demonstrating Level 1 theming from
   [10-theming-and-customisation.md](10-theming-and-customisation.md) — with live contrast
   read-outs for the guaranteed pairings, and "copy theme CSS" export.
3. **Per-component pages generated from the specs.** The spec structure
   ([components/_TEMPLATE.md](components/_TEMPLATE.md)) is machine-readable enough that
   component pages render: anatomy, variants matrix (live examples per
   `data-variant`×`data-size`), states, token table, keyboard table.
4. **A no-JS mode toggle.** One switch disables the site's JS so every component's no-JS
   baseline is demonstrable — turning the headline promise into a showable feature.
5. **Tier visibility.** Enhanced-tier behaviours are labelled, with their degradation
   contract shown inline, so users see exactly what older browsers get.

## Developer experience

- **Consumption without tooling:** `<link>` from CDN, npm install, or plain download —
  all first-class ([ADR-0003](decisions/ADR-0003-distribution-and-imports.md)). Zero
  mandatory build.
- **Readable unminified build is the default artifact**; `.min.css` is the optimisation.
  Devtools friendliness is a design goal: cascade layers make the Layers panel a
  self-documenting map of the architecture, `@property` tokens show typed values, and
  source = shipped means no sourcemap indirection.
- **Starter templates:** a plain-HTML starter page and a kitchen-sink page ship in the
  repo.
- **Server-framework integration — CakePHP plugin (required):** the primary consumer
  develops in CakePHP, so a composer-installable plugin ships alongside the toolkit:
  FormHelper templates that emit Welkin form-control markup, and server-side validation
  errors mapped to the Welkin invalid state (`[aria-invalid="true"]` + error-message
  element per [form-controls.md](components/form-controls.md)). Custom elements are plain
  HTML to any server framework ([ADR-0011](decisions/ADR-0011-js-delivery-mechanism.md)),
  so no JS shim is needed; other framework wrappers remain post-v1.

## Versioning & changelog

- **Semver.** Breaking (major): the `@layer` order string; token names/tiers; component
  class, part, attribute-axis, or attribute-value changes; custom-element tags,
  attributes, events; dropping a component. Minor: new components/tokens/variants,
  feature graduations ([ADR-0012](decisions/ADR-0012-feature-graduation-criteria.md)).
  Patch: visual bug fixes within documented behaviour.
- **Changelog discipline:** human-written, grouped by component, every entry links the
  spec section it changes. Experimental-stability components
  ([07-component-model.md](07-component-model.md)) are exempt from major-version
  requirements and say so loudly.

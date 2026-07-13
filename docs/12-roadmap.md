---
status: Review
depends-on: [01-vision-and-principles.md]
---

# 12 — Roadmap

Phases are sequential; each has exit criteria that gate the next. Component work within a
phase parallelises freely.

**Spec acceptance runs ahead of implementation, in batches.** Batch A (button, card,
form-controls) gates Phase 0 exit; Batch B (remaining pure-CSS specs) reaches Accepted
before Phase 3 implementation starts; Batch C (platform-primitive and JS-enhanced specs)
before Phases 4–5; Batch D (the deferred combobox spec,
[07](07-component-model.md)) before its Phase 5 slot. No component is implemented
against a Draft spec.

## Phase 0 — Design documentation (this suite)

Everything in `docs/` authored; foundational ADRs Accepted; naming decision
([02-naming.md](02-naming.md)) closed or explicitly deferred with placeholder rule intact.

**Exit criteria:** docs 01–12 at Review or better; ADRs 0001–0012 Accepted; component spec
template frozen; Batch A component specs (button, card, form-controls) Accepted.

## Phase 1 — Tokens, reset, base

`reset.css`, the full token files, and `base` element styles. **Milestone: this alone is a
useful product** — a "classless-ish" stylesheet that makes plain HTML look composed, themed
by tokens. Ship it as a preview release for feedback.

Engineering infrastructure lands here too: repo scaffolding and build pipeline
([ADR-0002](decisions/ADR-0002-source-format-and-build.md),
[ADR-0003](decisions/ADR-0003-distribution-and-imports.md)) and CI — stylelint, build
check, CSS size-budget gate, a programmatic checker for the
[05](05-design-tokens.md) contrast pairings, and an automated a11y smoke (axe,
forced-colors, reduced-motion) over the kitchen-sink page. Later phases inherit these
gates rather than adding tooling ad hoc.

**Exit criteria:** token inventory implemented and typed (`@property`); dark mode working
via `light-dark()`; a plain-HTML kitchen-sink page looks good with zero classes; contrast
pairings verified programmatically in CI.

## Phase 2 — Layout primitives

`.stack`, `.cluster`, `.sidebar-layout`, `.switcher`, `.grid`, `.center`, `.cover`,
`.frame` per [06-layout-system.md](06-layout-system.md).

**Exit criteria:** each primitive demoed at three container widths; subgrid card-alignment
demo working; no viewport media queries outside page scaffolding.

## Phase 3 — Pure-CSS components

Button, card, badge/tag, alert/callout, breadcrumb, table, prose, progress, spinner,
skeleton, navbar, pagination.

**Exit criteria:** each matches its Accepted spec including the a11y section; forced-colors
pass; total CSS size tracked against budget.

## Phase 4 — Platform-primitive components

Dialog, popover/menu, accordion, select, form validation styling, tooltip, carousel.
The **CakePHP plugin** (required, [11-docs-site-and-dx.md](11-docs-site-and-dx.md)) is
built here against the form-controls work: FormHelper templates emitting Welkin field
markup, server-side validation errors mapped to `[aria-invalid="true"]` + the error
element per [form-controls.md](components/form-controls.md).

**Exit criteria:** each works with JS disabled; Enhanced-tier behaviour verified behind
`@supports`; degradation contracts from [03-browser-support-policy.md](03-browser-support-policy.md)
demonstrated; CakePHP plugin renders a validated form end-to-end.

## Phase 5 — JS-enhanced components

Tabs, combobox, toast manager, sortable table headers, per
[08-javascript-policy.md](08-javascript-policy.md).

**Exit criteria:** each ≤ 2 KB min+gzip; usable no-JS baseline demonstrated; zero
dependencies; declarative API only.

## Phase 6 — Docs site & v1.0

Docs site built with Welkin itself ([11-docs-site-and-dx.md](11-docs-site-and-dx.md)); token
playground; no-JS toggle; npm + CDN distribution.

**Exit criteria:** the success criteria in [01-vision-and-principles.md](01-vision-and-principles.md)
all pass; semver 1.0.0 published.

## v1 cut line

**In:** everything listed in phases 1–6, including the CakePHP plugin.
**Out (post-v1):** date picker, data grid, tour/onboarding, framework wrappers other than
the required CakePHP plugin ([11](11-docs-site-and-dx.md)), icon set, build-time
class-prefixing option.

## Risk register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Baseline feature slippage (an Enhanced feature regresses or stalls in one engine) | Enhanced tier shrinks | Degradation contracts mean core UX unaffected; review at each minor release per [ADR-0012](decisions/ADR-0012-feature-graduation-criteria.md) |
| ~~Naming decision drags~~ | — | **Closed 2026-07-13: the toolkit is Welkin** ([02-naming.md](02-naming.md)); residual risk is losing the npm/domain registrations before release |
| Solo-maintainer bus factor | Project stalls | Docs-first approach is itself the mitigation: the suite makes the design executable by others |
| Scope creep toward app-framework territory | Dilutes CSS-first identity | Anti-goals in 01 are the test; new component proposals must name their ladder rung (08) |

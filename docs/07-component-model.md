---
status: Draft
depends-on: [04-css-architecture.md, 05-design-tokens.md, 06-layout-system.md, 08-javascript-policy.md, 09-accessibility.md]
---

# 07 — Component Model

Governs every component spec in [components/](components/). The canonical spec template
is [components/_TEMPLATE.md](components/_TEMPLATE.md); a spec that deviates from the
template's section order has a bug.

## Component tier taxonomy

Every component declares its tier — its rung on the JS ladder
([08-javascript-policy.md](08-javascript-policy.md)) — in its spec header:

- **Pure CSS** — no behaviour beyond selectors and transitions.
- **Platform** — built on an HTML platform primitive (`<dialog>`, popover, `<details>`,
  native validation); the browser supplies the behaviour.
- **JS-enhanced** — ships an optional ESM module per
  [ADR-0011](decisions/ADR-0011-js-delivery-mechanism.md) with a written justification
  for why the higher rungs don't suffice, and a usable no-JS baseline.

## Initial catalogue (v1)

### Pure CSS

| Component | Spec | Notes |
|-----------|------|-------|
| Button | [button.md](components/button.md) | First spec written; template shakedown |
| Card | [card.md](components/card.md) | Subgrid alignment participation |
| Badge / Tag | [badge-tag.md](components/badge-tag.md) | |
| Alert / Callout | [alert-callout.md](components/alert-callout.md) | `data-tone` showcase |
| Breadcrumb | [breadcrumb.md](components/breadcrumb.md) | `<nav>` + `<ol>` |
| Table | [table.md](components/table.md) | Sortable headers are the JS-enhanced add-on |
| Prose | [prose.md](components/prose.md) | Long-form typography wrapper |
| Progress / Spinner / Skeleton | [progress-spinner-skeleton.md](components/progress-spinner-skeleton.md) | Native `<progress>` styled |
| Navbar | [navbar.md](components/navbar.md) | `:has()` state tricks; popover-based mobile menu |
| Pagination | [pagination.md](components/pagination.md) | |

### Platform primitives

| Component | Spec | Platform feature | Enhanced-tier upgrades |
|-----------|------|------------------|------------------------|
| Dialog / Modal | [dialog.md](components/dialog.md) | `<dialog>` | `@starting-style` entry/exit transitions |
| Popover / Dropdown menu | [popover-menu.md](components/popover-menu.md) | Popover API | Anchor positioning |
| Accordion | [accordion.md](components/accordion.md) | `<details name>` exclusive groups | `interpolate-size` / `::details-content` animation |
| Select | [select.md](components/select.md) | `<select>` | `appearance: base-select` full styling |
| Form controls & validation | [form-controls.md](components/form-controls.md) | Native validation, `:user-valid`/`:user-invalid` | `field-sizing: content` |
| Tooltip | [tooltip.md](components/tooltip.md) | Popover API (hint) | Anchor positioning; CSS-hover fallback documented as a11y-limited |
| Carousel | [carousel.md](components/carousel.md) | Scroll-snap | `::scroll-marker` / `::scroll-button` |

### JS-enhanced

Each requires justification + usable no-JS baseline (summarised; full detail in specs):

| Component | Spec | Why JS (justification summary) | No-JS baseline |
|-----------|------|-------------------------------|----------------|
| Tabs | [tabs.md](components/tabs.md) | `role="tablist"` semantics + roving-tabindex arrow keys are unreachable from CSS; the radio-hack is an a11y failure and is banned | Stacked, headed sections |
| Combobox | *(spec deferred — Batch D of Phase 0; no file yet by decision)* | Filtering + `aria-activedescendant` management | `<input>` + `<datalist>` |
| Toast manager | [toast.md](components/toast.md) | Queueing, timing, and `aria-live` politeness need state | Static alerts in flow |
| Sortable table headers | *(in table.md)* | Client-side sort is data manipulation | Plain table / server sort links |

### Deferred (post-v1)

Date picker, rich data grid, tour/onboarding. Listed so their absence is a decision, not
an oversight.

## State vocabulary

Specs use these names with these standard selectors — no invented state classes
(`.is-active` etc. are banned; state is expressed in platform vocabulary):

| State | Selector |
|-------|----------|
| Hover | `:hover` (guarded by `@media (hover: hover)` where sticky-hover harms touch) |
| Focus | `:focus-visible` (never bare `:focus` for rings) |
| Active/pressed | `:active`, `[aria-pressed="true"]` |
| Disabled | `:disabled`, `[aria-disabled="true"]` |
| Invalid | `:user-invalid` (never bare `:invalid`) |
| Busy/loading | `[aria-busy="true"]` |
| Selected/current | `[aria-selected="true"]`, `[aria-current]` |
| Expanded/open | `[open]`, `:popover-open`, `[aria-expanded="true"]` |

All state styling lives in the `states` layer
([04-css-architecture.md](04-css-architecture.md)).

## Composition rules

- Components arrange their own children; **siblings are arranged by layout primitives**,
  never by component CSS.
- Components never select other components. Cross-component influence flows through
  tokens: a `.card` may set `--wel-button-bg` for its subtree; it may not write
  `.card .button` rules.
- Named exception: subgrid alignment participation, opt-in via the `.grid` primitive
  ([06-layout-system.md](06-layout-system.md)).
- Each spec's Composition section states what it may contain / be contained by, and any
  forbidden nestings.

## Stability labels

Per component, in the spec header: `Experimental` (shipped, API may change in minors) →
`Stable` (API changes are breaking) → `Deprecated` (removal scheduled). New components
enter as Experimental for at least one minor release.

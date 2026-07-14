# Component: Tabs

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | JS-enhanced |
| **Stability** | Experimental |
| **Version target** | v1 |

*This spec is the exemplar for the JS ladder
([08-javascript-policy.md](../08-javascript-policy.md)): read the Behaviour tiers
section as the template for every future rung-3 justification.*

## Purpose

Layered panels of parallel content with a tab strip selecting one at a time. Use when a
user needs one of several peer views of the same subject (product details / specs /
reviews). Do NOT use for page navigation (that is a `<nav>` styled as needed — tabs that
change the URL are links), for sequential steps (wizard, out of scope v1), or for
independently collapsible sections ([accordion.md](accordion.md)).

## Anatomy

```
Post-upgrade:                              Pre-upgrade / no-JS:
┌─ root (<wel-tabs>) ────────────────┐      ┌─ root (<wel-tabs>) ──────┐
│ ┌─ tablist ─────────────────────┐ │      │  heading (h2–h4)        │
│ │ [tab][tab][tab]               │ │      │  section (content)      │
│ └───────────────────────────────┘ │      │  heading                │
│ ┌─ panel (selected one visible) ┐ │      │  section                │
│ └───────────────────────────────┘ │      │  …stacked, all visible  │
└───────────────────────────────────┘      └─────────────────────────┘
```

Parts: root (`<wel-tabs>`); tablist (generated on upgrade); tabs (the authored
headings, re-purposed); panels (the authored sections).

## HTML structure

```html
<wel-tabs activation="auto">
  <h3>Overview</h3>
  <section>…overview content…</section>

  <h3>Specifications</h3>
  <section>…spec content…</section>

  <h3>Reviews</h3>
  <section>…review content…</section>
</wel-tabs>
```

The authored markup is heading+section pairs — a complete, meaningful document
fragment. **This is the API and it is also the fallback**: per
[ADR-0011](../decisions/ADR-0011-js-delivery-mechanism.md), the light-DOM children
render as ordinary stacked, headed sections before upgrade or without JS, so all
content is reachable structurally, not by fallback engineering.

On upgrade the element: generates a `role="tablist"` wrapper and moves the headings
into it; assigns each heading `role="tab"`, an `id`, `aria-selected`,
`aria-controls`, and roving `tabindex`; assigns each section `role="tabpanel"`,
`aria-labelledby`, `tabindex="0"`, and `hidden` on non-selected panels.
`role="tab"` deliberately overrides the heading semantics post-upgrade (a tab is not a
heading); pre-upgrade the heading semantics are exactly what the no-JS document needs.
All ARIA is generated — it cannot be hand-authored wrong. The custom-element tag is the
style hook (no class needed); variant axes still ride on data-attributes per
[ADR-0001](../decisions/ADR-0001-variant-syntax.md).

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-variant` | *(absent)* = `underline`, `pills` | Selected-tab treatment: accent underline indicator, or filled pill tabs |

Behavioural configuration (`activation`, `selected-index`) is element API, not a styling
axis — see JS enhancement. Axes compose freely; no size axis in v1 (tab type rides the
fluid scale).

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover | `:hover` (`@media (hover: hover)`) on tab | Ink shifts toward `--wel-tab-ink-selected` | — |
| Focus | `:focus-visible` | Global focus ring on the tab | — |
| Selected | `[aria-selected="true"]` | Indicator (underline/pill fill) + full-strength ink | `aria-selected` |
| Pre-upgrade | `wel-tabs:not(:defined)` | Stacked headings/sections, `.stack` rhythm | Native heading/section semantics |

All JS state is reflected to attributes (`aria-selected`, `selected-index`) so every
state above is styleable without JS-injected classes
([08](../08-javascript-policy.md)). Disabled tabs are not supported in v1 (open
question).

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-tab-ink` | `var(--wel-color-ink-muted)` | — | Unselected tab text |
| `--wel-tab-ink-selected` | `var(--wel-color-ink)` | — | |
| `--wel-tab-indicator` | `var(--wel-color-accent)` | — | Underline / pill fill |
| `--wel-tabs-border` | `var(--wel-color-border)` | — | Tablist baseline rule |
| `--wel-tab-padding-block` / `-inline` | `var(--wel-space-2)` / `var(--wel-space-3)` | — | Tabs meet 24px target size |
| `--wel-tabs-gap` | `var(--wel-space-2)` | — | Between tabs |

## Behaviour tiers

### Core (Baseline Widely Available)

All visual styling is Core, keyed to the generated roles/attributes
(`[role="tab"]`, `[aria-selected="true"]`) — no Enhanced CSS is required for a fully
styled widget. `wel-tabs:not(:defined)` styling gives the pre-upgrade stacked state
deliberate rhythm (per [ADR-0011](../decisions/ADR-0011-js-delivery-mechanism.md)'s
FOUC consequence) and reserves no space for the tablist, so upgrade causes one
reflow, not a cascade of shifts.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| View transitions | runtime `document.startViewTransition` detect (the module drives the transition, so a CSS gate would be dead code) | Selected-tab indicator morphs between tabs on change | Indicator moves instantly ([03: view transitions → instant state change](../03-browser-support-policy.md)) |

*Implementation note (T-47):* `view-transition-name` must be unique document-wide, so
the stylesheet names the indicator through `var(--wel-tabs-vt, none)` and the module
sets that property on the one changing group only for the duration of the transition —
parallel tab groups never collide. Skipped outright under `prefers-reduced-motion`
(checked in the module), and the group's animation duration additionally rides
`--wel-motion`.

### JS enhancement

- **Ladder justification:** Rung 1 (pure CSS) cannot express `role="tablist"` /
  `role="tab"` / `role="tabpanel"` semantics, `aria-selected` state changes, roving
  `tabindex`, or arrow-key navigation — ARIA and focus order are simply outside CSS's
  reach. Rung 2 has no platform tabs primitive (`<details name>` gives exclusive
  disclosure, but accordion semantics, not tab semantics). **The radio-button hack is
  banned** ([08](../08-javascript-policy.md)): it renders something tab-*shaped* in
  pure CSS but announces as a radio group, offers no `tablist` semantics, no
  `aria-controls` relationships, and hijacks form controls for non-form state — a
  textbook a11y failure dressed as CSS purity. Tabs are rung 3 by justification.
- **Element/module:** `<wel-tabs>` light-DOM custom element; `js/wel-tabs.js`, plain
  ESM, zero dependencies, importable individually. **Budget: ≤ 2 KB min+gzip**
  (release gate per [08](../08-javascript-policy.md)).
- **Attributes (config in):**

| Attribute | Values | Meaning |
|-----------|--------|---------|
| `activation` | `auto` *(default)* \| `manual` | `auto`: arrow-key focus selects immediately (APG-recommended when panels render instantly — ours do). `manual`: arrows move focus only; Enter/Space selects |
| `selected-index` | integer, default `0` | Selected tab; **reflected** on change and settable at any time (script or server-rendered) |

- **Events (state out):**

| Event | Bubbles | `detail` | When |
|-------|---------|----------|------|
| `wel-tab-change` | yes | `{ index, previousIndex, tab, panel }` | After selection changes (user or programmatic). Not cancelable — attribute state is the source of truth |

- **No-JS baseline:** stacked, headed sections — every panel visible in source order
  under its heading, structurally guaranteed by the light DOM
  ([08 no-JS table](../08-javascript-policy.md)). Usable, not merely "not broken":
  it is the same content as a well-formed article.

## Accessibility

*Blocking acceptance criteria. Implements the APG Tabs pattern in full.*

- **Roles/ARIA:** `role="tablist"` on the generated strip (with `aria-label` copied
  from an `aria-label` on `<wel-tabs>` if present); `role="tab"`, `aria-selected`,
  `aria-controls` on each tab; `role="tabpanel"`, `aria-labelledby` on each panel.
  All generated at upgrade.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Into tablist: focus the selected tab (roving tabindex). Next Tab leaves the tablist into the visible panel |
| ArrowRight / ArrowLeft | Focus next / previous tab, wrapping at the ends; selects it when `activation="auto"` |
| Home / End | Focus first / last tab (selects in `auto` mode) |
| Enter / Space | Select the focused tab (`activation="manual"` mode; no-op redundancy in `auto`) |

- **Focus behaviour:** roving tabindex — selected tab `tabindex="0"`, all others
  `-1`, so the tablist is one tab stop. Panels carry `tabindex="0"` so panels whose
  first content is non-focusable are still keyboard-reachable and scrollable.
  Selection never moves focus off the tab strip. No trap participation.
- **Forced colors:** selection is conveyed by background/underline colour, so per
  [09](../09-accessibility.md) a `@media (forced-colors: active)` block gives the
  selected tab a `border-block-end: 3px solid Highlight` (underline variant) or a
  `Highlight` border ring (pills); ink maps to `CanvasText`/`ButtonText`.
- **Reduced motion:** the indicator transition and the view-transition morph run
  through `--wel-motion` and the view-transition rule is additionally gated off under
  `prefers-reduced-motion` ([09 preference matrix](../09-accessibility.md)); selection
  changes remain instant.
- **Contrast:** `--wel-tab-ink`(-muted)/surface and indicator/surface pairings from the
  05 table; indicator ≥ 3:1 vs surface (1.4.11).
- **WCAG 2.2 criteria specifically implicated:** 2.1.1 Keyboard (the reason this is
  rung 3); 4.1.2 Name, Role, Value (generated ARIA); 2.4.3 Focus Order (roving
  tabindex, panel follows strip); 2.5.8 Target Size (tab padding ≥ 24px block);
  1.4.11 Non-text Contrast (indicator).

## Container behaviour

Intrinsic, no `@container` breakpoints: when tabs exceed the container's inline size
the tablist becomes horizontally scrollable (`overflow-x: auto` — ADR-0009 physical
exception pending logical-form graduation — with
`scroll-snap` on tabs) rather than wrapping — wrapping tab rows misread as two
tablists. Sensible minimum ~16rem. No subgrid participation.

## Composition

May contain: heading+section pairs only (headings h2–h4; a lint-able constraint).
Panels may contain anything, including forms and layout primitives. May be contained
by: cards, dialogs, page sections. Forbidden: `<wel-tabs>` nested inside a tab panel
(disorienting; use accordion for the inner level); interactive content inside the
headings/tabs themselves.

## Open questions

- Vertical orientation (`aria-orientation="vertical"`, Up/Down arrows) — post-v1 axis?
- Disabled tabs: APG permits, but on heading-sourced tabs there is no `:disabled`;
  would need `aria-disabled` handling in the module. Worth the bytes?
- URL-hash deep-linking (`selected-index` from `location.hash`) — module scope creep
  vs. host-app concern?
- Lazy panels (defer heavy panel content until first selection) — likely host-app
  concern, document a pattern.

## References

Bootstrap tabs: `.nav-tabs` markup plus hand-authored `role`/`aria-*` on every
element, `data-bs-toggle="tab"` JS plugin; without JS the non-active panes are
`display:none` and unreachable — content loss, not a baseline. Radio-hack tab
tutorials: banned outright (see ladder justification). We differ: the author writes
plain headings and sections; ARIA, roving tabindex, and keyboard handling are
generated (cannot be authored wrong); the no-JS state is the source markup itself; the
whole behaviour costs one ≤2 KB dependency-free module instead of a plugin system.

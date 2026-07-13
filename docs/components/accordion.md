# Component: Accordion

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Platform |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

Vertically stacked expandable sections — FAQs, settings groups, progressive disclosure of
long content — built on `<details>`/`<summary>`, with exclusive (one-open) groups via
`<details name>`. The platform supplies disclosure semantics, keyboard toggling, and
expanded-state announcement for free; Welkin never ships a single line of accordion JS.
Do NOT use for peer views switched in place ([tabs.md](tabs.md)) or site navigation
([navbar.md](navbar.md)). Default to *independent* (multi-open) accordions; exclusivity
is opt-in and carries a documented keyboard caveat (see Accessibility).

## Anatomy

```
┌─ root (.accordion) ──────────────────────────┐
│ ┌─ item (<details>) ─────────────────────── ┐│
│ │ ┌─ header (<summary>): marker + label ───┐││
│ │ └────────────────────────────────────────┘││
│ │ ┌─ panel (::details-content / children) ─┐││
│ │ └────────────────────────────────────────┘││
│ └────────────────────────────────────────── ┘│
│  … more items                                │
└──────────────────────────────────────────────┘
```

Parts: root wrapper (`.accordion`); item (`<details>`); header (`<summary>`, containing
the marker and label); panel (the details content — addressed as `::details-content`
under Enhanced, as direct children otherwise).

## HTML structure

```html
<div class="accordion">
  <details name="faq">
    <summary>Can I self-host?</summary>
    <p>Yes — the toolkit is a static CSS file plus optional ESM modules…</p>
  </details>
  <details name="faq">
    <summary>Which browsers are supported?</summary>
    <p>See the browser support policy…</p>
  </details>
</div>
```

Rationale: `<details>`/`<summary>` is the platform's disclosure widget — focusable
summary, Enter/Space toggling, expanded state exposed to AT, all free. A shared `name`
makes the group exclusive (opening one closes the others), declaratively. Omit `name`
for independent multi-open items. The wrapper `.accordion` exists to style the items as
one composed list (borders, radius, dividers); bare `<details>` outside a wrapper is
styled by `base` but is not this component.

Honesty on `name`: exclusive grouping reached Baseline Newly Available in late 2024 and
is not yet Widely Available. It is an HTML attribute — no `@supports` gate is possible
and none is needed: where unsupported it is inert and the group degrades to independent
multi-open, which breaks no task (see Enhanced table).

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-variant` | *(absent)* = `default`, `separated`, `flush` | `default`: one bordered surface, hairline dividers. `separated`: items as detached rounded blocks with `--wel-space-2` gaps. `flush`: dividers only, no outer border/radius (for embedding in cards/sidebars) |

One axis; applied on the wrapper, inherited by items.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Open | `[open]` on the item | Marker rotates; summary ink → full `--wel-color-ink`; panel visible | Native expanded state on `<summary>` |
| Hover | `summary:hover` (`@media (hover: hover)`) | `--wel-color-accent-tint` summary background | — |
| Focus | `summary:focus-visible` | Global focus ring | — |
| Group has open item | `.accordion:has([open])` | Divider bookkeeping: the divider above an open `separated` item's neighbour is suppressed via `details:has(+ details[open])` | — |

`:has()` is Core ([03](../03-browser-support-policy.md)); wrapper-level open-state styling
uses it freely. No invented state classes per [07](../07-component-model.md).

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-accordion-bg` | `var(--wel-color-surface)` | — | |
| `--wel-accordion-ink` | `var(--wel-color-ink)` | — | Summary label; `-ink-muted` when closed |
| `--wel-accordion-border` | `var(--wel-color-border)` | — | Outer border + dividers |
| `--wel-accordion-radius` | `var(--wel-radius-surface)` | — | Outer (`default`) or per-item (`separated`) |
| `--wel-accordion-summary-padding-block` / `-inline` | `var(--wel-space-3)` / `var(--wel-space-4)` | — | Summary ≥ 24px block-size at all type sizes |
| `--wel-accordion-panel-padding` | `var(--wel-space-4)` | — | Panel interior |
| `--wel-accordion-marker-color` | `var(--wel-color-ink-muted)` | — | Custom marker (inline SVG mask, `currentColor`-driven) replaces the UA triangle via `summary::marker`/`::-webkit-details-marker` suppression |

## Behaviour tiers

### Core (Baseline Widely Available)

Fully functional, zero JS, no gaps: Enter/Space toggling, disclosure semantics, focus,
multi-open groups. Open/close is instant (03 contract). Exclusivity (`name`) behaves as
described in the Enhanced table. Find-in-page bonus (no action required by us): Chromium
and Gecko search the content of closed `<details>` and auto-expand on a match; WebKit
does not at time of writing — a pure engine bonus, not a contract.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| `interpolate-size: allow-keywords` | `@supports (interpolate-size: allow-keywords)` | Panel `block-size` animates `0 → auto` on open/close. **Honesty: Chromium-only at writing — pre-Baseline, so per [ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md) it ships only after the last engine ships; 03 already carries the contract row** | Instant open/close (03 row) |
| `::details-content` | `@supports selector(::details-content)` | The content box is styled/transitioned directly (overflow clip during the size transition; `content-visibility` transitioned with `allow-discrete` so close animates before hiding) | Instant; panel spacing falls back to padding on direct children |
| `hidden="until-found"` | — (inert HTML attribute) | Not used by this component — `<details>` already gets find-in-page auto-expand where engines support it (above). Documented for arbitrary-container use elsewhere; **not Baseline at writing (WebKit missing)** | Content in closed containers not find-in-page reachable |
| `<details name>` exclusivity | — (inert HTML attribute; no gate possible or needed) | One-open-at-a-time group. Baseline Newly Available, not yet Widely Available | Group degrades to independent multi-open items — fully functional, nothing breaks |

Both animation rows share one wrapped block in practice (the animation needs both);
durations route through `calc(var(--wel-motion-duration-2) * var(--wel-motion))`.

Implementation status (T-42, rechecked live): `::details-content` reached Baseline
Newly Available September 2025 and ships — used for an opacity fade on open.
`interpolate-size` remains Chromium-only, so the size animation stays blocked per
ADR-0012 and open/close height is instant everywhere; the transition joins the shipped
block at intake.

### JS enhancement

None.

## Accessibility

- **Roles/ARIA:** none added — `<summary>` exposes a disclosure control with expanded/
  collapsed state natively; adding `role`/`aria-expanded` on top is a violation of the
  first rule of ARIA and is forbidden here. Summary content is the accessible name; keep
  it text (see Composition).
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Move between summaries (and into open panel content) |
| Enter / Space | Toggle the focused item (native) |

  No arrow-key movement between headers: the APG accordion pattern lists it as optional,
  the platform does not provide it, and Tab is fully conformant — stated so nobody
  "fixes" it with JS.
- **Focus behaviour:** no trap; focus stays on the summary across toggling. **Exclusive-
  group caveat (the reason independent is the default):** when opening item B auto-closes
  item A while focus/reading position is inside A's panel, that content is yanked from
  under the user. Use `name` only where the design genuinely requires one-open, and keep
  panels short there.
- **Forced colors:** borders and dividers survive (border-based, mapping to
  `CanvasText`); the custom marker is `currentColor`-driven so it maps with text; open
  state is conveyed by marker rotation + visible panel, never colour alone. No
  `forced-color-adjust` overrides.
- **Reduced motion:** the size transition runs at 0ms via `--wel-motion` — instant
  open/close, identical to Core.
- **Contrast:** surface/ink and surface/ink-muted pairings from the 05 table; hover tint
  keeps summary ink ≥ 4.5:1 (pairing worst case).
- **WCAG 2.2 criteria specifically implicated:** 2.5.8 Target Size (summary ≥ 24px),
  4.1.2 Name/Role/Value (native), 2.4.7 Focus Visible (global ring on summary).

## Container behaviour

Minimal — the accordion is a full-width flow component and its spacing tokens are
already fluid (05). One breakpoint: below `20rem` container inline-size,
`--wel-accordion-summary-padding-inline` and `--wel-accordion-panel-padding` step down one
space token. Sensible minimum width ≈ `14rem`. No subgrid participation.

## Composition

May contain: only `<details>` items as direct children of `.accordion`; panels may
contain any flow content including forms, `.card`, and nested accordions (one level,
with a different or absent `name`). May be contained by: `.card`, sidebars, `.prose`
(flush variant), dialogs. Forbidden: interactive elements inside `<summary>` (links or
buttons in the header fight the disclosure activation — a platform footgun, banned);
headings wrapping `<summary>` are permitted (`<summary><h3>…</h3></summary>`) and
recommended for document outline in FAQ use.

## Open questions

- Should exclusive groups scroll the newly opened item into view (`scroll-margin` +
  anchor behaviour) when the closing item above shifts layout? Pure CSS `scroll-margin`
  helps only anchor/focus navigation — may need wording in docs rather than code.
- `interpolate-size` intake timing: revisit at each minor per ADR-0012; is a
  `calc-size()`-free grid-rows animation worth carrying as an interim? Leaning no
  (complexity vs. a cosmetic gain the contract already covers).
- ~~Marker asset: shared chevron with [select.md](select.md)'s caret?~~ **Resolved
  (T-42): yes** — the same gradient-drawn chevron technique (gradients resolve the
  marker token; no image asset), as a `summary::before` box so it rotates through
  `--wel-motion`.

## References

Bootstrap Accordion — built on the Collapse JS plugin: `data-bs-toggle` wiring, manual
`aria-expanded` management, JS-measured height animation, and it breaks without
JavaScript. We differ: `<details>`/`<summary>` gives semantics, keyboard, and state for
free; exclusivity is one HTML attribute (`name`) instead of a plugin option; the
open/close animation is CSS (`interpolate-size`/`::details-content`) gated per
[03](../03-browser-support-policy.md) with an instant fallback — total JS shipped: zero.

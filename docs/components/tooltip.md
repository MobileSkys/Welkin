# Component: Tooltip

| | |
|---|---|
| **Status** | Draft |
| **Tier** | Platform |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

A short, plain-text, supplementary label or description revealed near its trigger —
icon-button labels, input hints, abbreviation expansions — built on the Popover API.
**Tooltips are supplementary by contract: never the sole carrier of critical
information** (the accessible description exists whether or not the tooltip is ever
shown). Scope is deliberately tight: plain text only. Anything interactive, structured,
or long-form belongs in [popover-menu.md](popover-menu.md); form errors belong in
[form-controls.md](form-controls.md); prefer a visible label over a tooltip whenever
space allows.

## Anatomy

```
┌─ trigger (focusable control, [popovertarget]) ─┐
└────────────────────────────────────────────────┘
     │ (above by default; tethered under Enhanced)
┌─ root (.tooltip, [popover]) ─┐
│  plain text                  │
└──────────────────────────────┘
```

Parts: trigger (an inherently focusable control — usually `.button`; not part of this
component); root (`.tooltip[popover]`, text only).

## HTML structure

```html
<button class="button" data-variant="ghost" aria-label="Formatting help"
        popovertarget="fmt-tip" aria-describedby="fmt-tip">
  <svg aria-hidden="true">…</svg>
</button>
<div class="tooltip" id="fmt-tip" popover role="tooltip">Markdown is supported</div>
```

Rationale, piece by piece: `aria-describedby` makes the tooltip text the trigger's
accessible description — computed even while the popover is hidden, so AT users have the
information with zero interaction and zero JS. `popovertarget` provides a Core,
JS-free reveal path that works for keyboard and touch (click/Enter/Space toggles) — the
"toggletip" resting behaviour. `popover` (auto) supplies Esc, light dismiss, and top
layer. `role="tooltip"` is declared for completeness; the load-bearing wiring is the
description. The trigger must be inherently focusable (button, link, input) — never
bolt `tabindex` onto static text to hang a tooltip on it; if prose needs explanation,
write it in the prose.

**CSS-only hover tooltips (documented anti-pattern, not shipped):** the
`[data-tooltip]::after { content: attr(data-tooltip) }` trick is rejected — on a
non-focusable trigger it has no keyboard or touch path at all (title-attribute-style
failure), and even on a focusable one it fails WCAG 1.4.13: not dismissable (no Esc
without moving the pointer) and not reliably hoverable. This spec exists so nobody
reinvents it.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-placement` | *(absent)* = `block-start`, `block-end`, `inline-start`, `inline-end` | Preferred side of the trigger (tooltips default *above*), via `position-area`. **Enhanced-only effect**; Core placement is the centred fallback below |

One axis. No sizes — a tooltip that needs a size axis has outgrown being a tooltip.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Open | `:popover-open` | Visible; fade-in where Enhanced | Content already exposed as description via `aria-describedby`; no announcement on open needed |
| Closed | *(default)* | `display: none` (UA) | Description remains computed from hidden content |

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-tooltip-bg` | `var(--wel-color-ink)` | — | Inverted surface — the classic tooltip look |
| `--wel-tooltip-ink` | `var(--wel-color-surface)` | — | Inverted pairing; listed in the 05 pairing table (≥ 4.5:1 both schemes) |
| `--wel-tooltip-radius` | `var(--wel-radius-control)` | — | |
| `--wel-tooltip-padding-block` / `-inline` | `var(--wel-space-1)` / `var(--wel-space-2)` | — | |
| `--wel-tooltip-max-inline-size` | `18rem` | — | Wraps beyond this; if it wraps twice, rewrite the text |
| `--wel-tooltip-offset` | `var(--wel-space-1)` | — | Gap to trigger (Enhanced) |
| `--wel-tooltip-show-delay` | `600ms` | — | Consumed by `wel-tooltip` via `getComputedStyle`. Interaction timing, not motion — deliberately **not** multiplied by `--wel-motion` (a zeroed delay would make tooltips *more* eager under reduced motion) |

## Behaviour tiers

### Core (Baseline Widely Available)

The Popover API is Core ([03](../03-browser-support-policy.md)). With zero JS the
tooltip is a **toggletip**: click / Enter / Space on the trigger shows it; Esc and
light dismiss close it; the description is exposed to AT throughout. There is no hover
behaviour in Core-without-JS — stated honestly and acceptable, because the information
is already available to every user (description) and reachable by every input (toggle).
Core placement: the popover UA default — centred panel (see
[popover-menu.md](popover-menu.md) for why top-layer elements cannot be tethered without
anchor positioning); visually odd for a tooltip but rare (Enhanced CSS or the module
covers real deployments) and fully functional.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| CSS anchor positioning (implicit invoker anchor, `position-area`) | `@supports (anchor-name: --x)` | Tooltip tethers to its trigger on the `data-placement` side, offset by `--wel-tooltip-offset`, with `position-try-fallbacks` flip. Status honesty: Chromium + WebKit shipped, Gecko in progress at writing — enters source at intake per [ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md) | Centred panel (03 row); `wel-tooltip` positions it where present |
| `@starting-style` + `transition-behavior: allow-discrete` | `@supports (transition-behavior: allow-discrete)` | Short fade in/out (opacity only) | Instant show/hide (03 row) |
| `popover="hint"` | — (HTML attribute value; **cannot be gated and degrades badly**, see below) | Hint popovers don't close open `auto` popovers (tooltip over an open menu) and close each other | **Markup ships `popover` (auto).** The invalid-value default for `popover` is `manual` — so hard-coding `hint` in markup on a non-supporting engine silently *removes* light dismiss and Esc. Pre-Baseline at writing. Therefore `hint` is applied only at runtime by `wel-tooltip` after `el.popover = 'hint'; el.popover === 'hint'` feature detection |

### JS enhancement

The hover/focus behaviour that makes it a true tooltip:

- **Ladder justification:** rungs 1–2 deliver reveal-on-activation, dismissal, and the
  AT description — but not show-on-hover/focus, and not the WCAG 1.4.13 trio
  (dismissable / hoverable / persistent) for hover-triggered content. No CSS mechanism
  can express "Esc hides it without moving focus" or "keep it open while the pointer is
  over it". Interest Invokers (`interestfor`) will make this declarative; pre-Baseline
  at writing, so per ADR-0012 not in shipped source — the module is deleted when it
  graduates.
- **Element/module:** `wel-tooltip.js` data-attribute upgrader over `[popovertarget]`
  elements whose target is a `.tooltip`; ≤ 2 KB per [08](../08-javascript-policy.md).
  Behaviour: show after `--wel-tooltip-show-delay` on `pointerenter`, immediately on
  `focusin`; hide on `pointerleave` of *trigger + tooltip* (hoverable), `focusout`, and
  Esc (dismissable, without moving focus); persists while hovered/focused (persistent).
  Upgrades `popover` → `hint` where detection passes (table above). Detects and yields
  to CSS anchor positioning for placement per 08.
- **Attributes (config in):** none of its own — it reads `data-placement`,
  `--wel-tooltip-show-delay`, and the existing `popovertarget` wiring.
- **Events (state out):** none — native `beforetoggle`/`toggle` on the popover are the
  API.
- **No-JS baseline:** the Core toggletip, stated concretely: keyboard and touch users
  toggle it from the focusable trigger; Esc/light-dismiss closes; AT users have the
  description without opening anything. Usable, not merely "not broken".

## Accessibility

- **Roles/ARIA:** `aria-describedby` from trigger to tooltip is the required
  relationship (description is computed from the hidden element — this is the
  zero-interaction guarantee). `role="tooltip"` on the panel. The tooltip itself is
  never focusable and never named — it describes; the trigger carries the accessible
  name (e.g. `aria-label` on icon buttons, which the tooltip text may duplicate).
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Enter / Space on trigger | Toggle tooltip (Core, native `popovertarget`) |
| Focus into trigger | Show (with `wel-tooltip`) |
| Esc | Hide without moving focus or activating anything (native popover; module keeps it true for hover-shown state) |
| Tab away | Hide (focus leaves trigger) |

- **Focus behaviour:** focus never moves into the tooltip; no trap participation; no
  focus return needed (focus never left the trigger).
- **Forced colors:** the inverted bg/ink pair collapses to `Canvas`/`CanvasText` — a
  `forced-colors: active` block adds a `CanvasText` border so the bubble keeps an edge.
  No `forced-color-adjust` overrides.
- **Reduced motion:** the fade is opacity-only (non-vestibular, permitted per
  [09](../09-accessibility.md)) but still routes through `--wel-motion` and drops to 0ms;
  show-delay is unaffected by design (token note above).
- **Contrast:** the inverted `--wel-tooltip-bg`/`--wel-tooltip-ink` pairing ships in the
  05 table at ≥ 4.5:1 in both schemes.
- **WCAG 2.2 criteria specifically implicated:** **1.4.13 Content on Hover or Focus** —
  the module satisfies all three requirements: *dismissable* (Esc, no pointer/focus
  move), *hoverable* (pointer may move onto the tooltip), *persistent* (remains until
  hover/focus withdrawn or dismissed). The Core toggletip is click-triggered, so 1.4.13
  does not apply to it. Also 1.1.1/4.1.2 hygiene: the tooltip supplements, never
  replaces, the trigger's accessible name.

## Container behaviour

None — top-layer element, content-sized up to `--wel-tooltip-max-inline-size`, sized
against the viewport. No subgrid participation.

## Composition

May contain: plain text (phrasing content, no links, no buttons, no headings — hard
rule; interactive content means it is a [popover-menu.md](popover-menu.md) panel). May
be attached to: inherently focusable controls only (`.button`, links, inputs). Forbidden:
tooltips on disabled controls (`:disabled` elements don't receive focus or pointer
events — put the explanation in visible text); tooltips as form error messages; nesting
a tooltip trigger inside another tooltip's trigger.

## Open questions

- Ship a shared show/hide delay pair (`-hide-delay` for the pointer corridor to the
  tooltip) or keep hide immediate-on-leave with the tooltip itself hoverable? Leaning
  single show-delay token until real usage complains.
- `interestfor` intake: when Interest Invokers reach Baseline, does the module delete
  entirely or remain for the `hint` upgrade path? Revisit per ADR-0012 cadence.
- Arrow/beak on the bubble: pure aesthetics, needs `anchor()`-based positioning to point
  correctly — Enhanced-only nicety or omit entirely? Leaning omit for v1.

## References

Bootstrap Tooltip — requires `bootstrap.js` + Popper, per-element JS initialisation,
`title`-attribute mutation, and offers no non-hover path beyond focus. We differ: the
resting state is a JS-free toggletip on `popovertarget` with the text exposed as an
`aria-describedby` description regardless of visibility; hover behaviour is one ≤ 2 KB
module written directly against WCAG 1.4.13's three requirements; placement is CSS
anchor positioning, not a JS engine; and `popover="hint"` is adopted honestly — runtime
feature-detected, never hard-coded, because its markup fallback (`manual`) would
silently degrade dismissal ([03](../03-browser-support-policy.md)).

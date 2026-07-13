# Component: Popover / Dropdown menu

| | |
|---|---|
| **Status** | Draft |
| **Tier** | Platform |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

The transient anchored surface: dropdown menus, action menus, disclosure panels (filter
panels, "more" overflow), built on the Popover API. **Headline: the invoker is
`popovertarget` — opening, closing, toggling, light dismiss, Esc, and top-layer rendering
are fully declarative and JS-free.** Do NOT use for blocking interruptions
([dialog.md](dialog.md)), supplementary hover text ([tooltip.md](tooltip.md)), persistent
primary navigation ([navbar.md](navbar.md)), or choosing a form value
([select.md](select.md)). Content behind light dismiss is ephemeral by contract — never
put a critical flow inside one.

## Anatomy

```
┌─ invoker (.button[popovertarget]) ─┐
└────────────────────────────────────┘
        │ (tethered under Enhanced; centred panel in Core)
┌─ root (.popover, [popover]) ───────┐
│  ┌─ content ──────────────────────┐│
│  │  list of links / panel content ││
│  └────────────────────────────────┘│
└────────────────────────────────────┘
```

Parts: invoker (any button with `popovertarget`; not part of this component — usually
`.button`); root (`.popover[popover]`); content (plain list for menus, arbitrary flow
content for panels).

## HTML structure

```html
<button class="button" popovertarget="project-menu">
  Project <svg aria-hidden="true">…</svg>
</button>

<div class="popover" id="project-menu" popover>
  <ul>
    <li><a href="/settings">Settings</a></li>
    <li><a href="/members">Members</a></li>
    <li><button class="button" data-variant="ghost" data-dialog-open="confirm-delete">
      Delete…</button></li>
  </ul>
</div>
```

Rationale: `popover` (default `auto`) gives top layer, one-open-at-a-time, light
dismiss, Esc, and focus return natively; `popovertarget` gives a declarative toggle
whose expanded/collapsed state the browser exposes to assistive tech automatically — no
`aria-expanded` bookkeeping. Place the popover element immediately after its invoker in
the DOM: sequential focus order out of an open popover then reads invoker → panel →
rest of page, per [09](../09-accessibility.md). Under Enhanced anchor positioning the
`popovertarget` invoker is the popover's *implicit anchor* — no `anchor-name` wiring for
the common case; explicit `anchor-name`/`position-anchor` only when the anchor is not
the invoker.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-placement` | *(absent)* = `block-end`, `block-start`, `inline-start`, `inline-end` | Preferred side of the anchor, mapped to `position-area`. **Enhanced-only effect** — in Core (no anchor positioning) placement is the centred panel regardless |
| `data-size` | *(absent)* = `md`, `sm` | Padding + `--wel-popover-min-inline-size` step |

Axes compose freely. `data-placement` is a preference, not a promise:
`position-try-fallbacks` flips it when there is no room.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Open | `:popover-open` | Visible in top layer; entry transition where Enhanced | Invoker's expanded state exposed natively by `popovertarget` |
| Closed | *(default)* | `display: none` (UA) | Removed from a11y tree |
| Item hover | `:hover` | `--wel-color-accent-tint` background | — |
| Item focus | `:focus-visible` | Global focus ring | — |
| Current item | `[aria-current]` | Accent ink + marker (not colour-only) | `aria-current` |

There is no CSS pseudo-class for "invoker whose popover is open"; where the popover is
the invoker's next sibling, `.button:has(+ .popover:popover-open)` may style the invoker
(Core, `:has()`), and this is the documented pattern — otherwise the invoker simply keeps
its own states.

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-popover-bg` | `var(--wel-color-surface-raised)` | — | |
| `--wel-popover-ink` | `var(--wel-color-ink)` | — | Pairing partner of bg |
| `--wel-popover-radius` | `var(--wel-radius-surface)` | — | |
| `--wel-popover-padding` | `var(--wel-space-2)` | — | Panels may raise it; menu items pad themselves |
| `--wel-popover-shadow` | `var(--wel-shadow-3)` | — | |
| `--wel-popover-min-inline-size` | `12rem` | — | Menus; panels are content-sized up to max |
| `--wel-popover-max-inline-size` | `min(24rem, calc(100dvw - 2 * var(--wel-space-gutter)))` | — | |
| `--wel-popover-offset` | `var(--wel-space-1)` | — | Gap to anchor (Enhanced margin) |

## Behaviour tiers

### Core (Baseline Widely Available)

Fully functional with zero JS: toggle via `popovertarget`, light dismiss (`auto`), Esc,
one-at-a-time, top layer. **Core placement — the honest reality:** a popover's UA default
position is *centred in the viewport* (top-layer, `inset: 0; margin: auto`); without
anchor positioning it does not appear next to its trigger, and top-layer elements cannot
be positioned relative to a positioned ancestor (their containing block is the viewport),
so the classic "absolute inside a relative wrapper" trick is unavailable. **The chosen
Core approach: we keep the centred placement and style it deliberately** — a centred,
shadowed, gutter-inset panel, closer to a lightweight action sheet than a broken
dropdown. This is designed, not accidental (extends the 03 anchor-positioning contract
row), and on small screens it is arguably the better presentation. Projects wanting
tethered placement in non-supporting browsers opt into the `wel-anchor` module below.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| CSS anchor positioning (`position-anchor`, `position-area`, implicit invoker anchor) | `@supports (anchor-name: --x)` | Popover tethers to its invoker on the `data-placement` side, offset by `--wel-popover-offset` | Centred panel as above (03 row + this spec's Core detail) |
| `position-try-fallbacks` | same block as above | Flips to the opposite side / slides when the preferred side lacks room | — (part of the same enhancement) |
| `@starting-style` + `transition-behavior: allow-discrete` | `@supports (transition-behavior: allow-discrete)` | Fade + 2% scale entry, fade exit (`display` transitions with `allow-discrete`) | Instant appear/disappear (03 row) |

Honesty note on anchor positioning status: Chromium and WebKit have shipped; Gecko is in
progress at time of writing — strictly pre-Baseline, so per
[ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md) it enters shipped source
only when the last engine ships. [03](../03-browser-support-policy.md) already carries
its contract row; this spec defines the behaviour so implementation is unblocked the day
intake completes. Until then, all browsers get the Core centred panel (or `wel-anchor`).

### JS enhancement

Optional polish only — the component is fully functional without it:

- **Ladder justification:** rungs 1–2 deliver everything functional. What they cannot
  yet deliver everywhere is *tethered placement* (anchor positioning pre-Baseline /
  unsupported); that is presentation, not function, so the module is optional.
- **Element/module:** `wel-anchor.js` data-attribute upgrader; positions any
  `[popover]` with a `popovertarget` invoker on `toggle`. **Detect and yield**
  ([08](../08-javascript-policy.md)): exits immediately when
  `CSS.supports('anchor-name: --x')`; deleted entirely when anchor positioning graduates.
- **Attributes (config in):** none of its own — it reads `data-placement` and
  `--wel-popover-offset` from the styled element.
- **Events (state out):** none — native `beforetoggle`/`toggle` on the popover are the
  API.
- **No-JS baseline:** the full Core experience above — open/close/light-dismiss/Esc all
  work; placement is the centred panel (or tethered, where Enhanced CSS applies).

## Accessibility

Two documented patterns — choosing correctly is the a11y decision:

- **Pattern A — list popover (the default).** Most "dropdowns" are navigation or a short
  list of actions: mark them up as a plain `<ul>` of links/buttons with **no ARIA menu
  roles**. Tab/Shift+Tab moves through items (small lists; fully conformant), Esc closes
  and returns focus. This is what ships in v1 and what almost every use case should use.
- **Pattern B — true menu (`role="menu"`).** Only for a menu of *commands* mimicking a
  desktop application menu. The role is a promise of the full APG keyboard pattern
  (arrow keys, Home/End, roving tabindex, type-ahead) which the Popover API does **not**
  supply — `role="menu"` on a plain list without that keyboard support is a defect, not
  an enhancement. Pattern B therefore requires a JS module (`wel-menu`, post-v1 — see Open
  questions) and is documented but not shipped in v1.

- **Roles/ARIA:** Pattern A: none beyond native link/button semantics; the browser
  exposes the invoker's expanded state via `popovertarget`. Pattern B (post-v1):
  `role="menu"`/`menuitem`, managed by the module.
- **Keyboard interaction (Pattern A):**

| Key | Action |
|-----|--------|
| Enter / Space on invoker | Toggle popover (native) |
| Esc | Close; focus returns to invoker (native) |
| Tab / Shift+Tab | Move through items; tabbing past the end leaves the popover (it closes via light dismiss on focus moving out — expected order per [09](../09-accessibility.md): invoker → panel → rest of page) |
| Enter on item | Activate link/button (native) |

- **Focus behaviour:** opening does not move focus (stays on invoker); first Tab enters
  the panel (DOM-adjacent placement makes this true). Focus return on Esc/light dismiss
  is native. No trap participation.
- **Forced colors:** shadow is removed — the panel ships a `var(--wel-border-width)`
  border so its edge survives; links map to `LinkText`, buttons to `ButtonText`; item
  hover/current treatments must not be background-only (current item keeps a marker).
- **Reduced motion:** entry/exit transitions at 0ms via `--wel-motion`; instant, same as
  Core.
- **Contrast:** surface-raised/ink pairing (4.5:1, 05 table); accent-tint hover keeps
  item ink at 4.5:1 (pairing table worst-case row).
- **WCAG 2.2 criteria specifically implicated:** 2.5.8 Target Size (menu items ≥ 24px
  block-size), 2.4.3 Focus Order (DOM-adjacent panel), 1.4.13 does not apply (click-
  triggered, not hover-triggered — that is [tooltip.md](tooltip.md)'s problem).

## Container behaviour

None — top-layer element, sized by content between the min/max tokens against the
viewport, not a container. No subgrid participation.

## Composition

May contain: plain lists of links/buttons (Pattern A), small forms (filter panels),
headings, dividers; a button that opens a dialog (the dialog stacks above in the top
layer). May be contained by: any flow context; DOM-nested popovers are permitted (the
platform keeps the ancestor chain open — used by [navbar.md](navbar.md) submenus).
Forbidden: `.dialog` inside `.popover`; critical or long-form flows behind light
dismiss; a `.popover` as sole container of content that must be reachable in print.

## Open questions

- `wel-menu` (Pattern B roving-tabindex module): post-v1, or does v1 documenting "don't
  use `role="menu"` without it" suffice?
- Should `data-placement` also accept `span-*` refinements (e.g. `block-end
  span-inline-end`) or stay four-value simple? Leaning simple until asked.
- `popover="hint"` interaction with menus (hover-open submenus) — deferred with
  [tooltip.md](tooltip.md)'s hint discussion.

## References

Bootstrap Dropdown — requires `bootstrap.js` + Popper for open/close, positioning,
dismiss, and keyboard; applies `role="menu"`-ish ARIA to what are usually just lists of
links. We differ: zero JS to function (`popovertarget` — the headline), tethering in CSS
(anchor positioning) with a designed centred-panel fallback rather than a JS positioning
engine, honest role guidance (plain lists by default;
`role="menu"` only with real APG keyboard support), attribute axes per
[ADR-0001](../decisions/ADR-0001-variant-syntax.md).

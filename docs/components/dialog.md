# Component: Dialog

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Platform |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

The interruption surface: modal confirmations, blocking forms, and (rarely) non-modal
panels, built on native `<dialog>`. Use when the user must acknowledge or complete
something before continuing. Do NOT use for transient anchored surfaces (menus, filter
panels — [popover-menu.md](popover-menu.md)), supplementary hover text
([tooltip.md](tooltip.md)), or passive notices ([alert-callout.md](alert-callout.md),
toast). The platform payoff, per [09](../09-accessibility.md): `showModal()` gives focus
trapping, `inert` backgrounding, Escape handling, and top-layer rendering for free — zero
lines of focus-management JS.

## Anatomy

```
┌─ ::backdrop ──────────────────────────────────┐
│   ┌─ root (.dialog / <dialog>) ─────────────┐ │
│   │ ┌─ header ─────────────────┬─ close ──┐ │ │
│   │ │  title (h2)              │  button  │ │ │
│   │ ├─ body ──────────────────────────────┤ │ │
│   │ ├─ footer (.cluster of actions) ──────┤ │ │
│   │ └─────────────────────────────────────┘ │ │
│   └─────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

Parts: root (`<dialog class="dialog">`); `::backdrop` (modal only); header with title and
close button; body (flow content); footer (action cluster).

## HTML structure

```html
<button class="button" data-variant="danger" data-dialog-open="confirm-delete">
  Delete project…
</button>

<dialog class="dialog" id="confirm-delete" aria-labelledby="confirm-delete-title">
  <header>
    <h2 id="confirm-delete-title">Delete this project?</h2>
    <form method="dialog">
      <button class="button" data-variant="ghost" aria-label="Close">✕</button>
    </form>
  </header>
  <p>This permanently removes the project and all its data.</p>
  <footer class="cluster">
    <form method="dialog">
      <button class="button" value="cancel" autofocus>Cancel</button>
      <button class="button" data-variant="danger" value="delete">Delete</button>
    </form>
  </footer>
</dialog>
```

Rationale: `<dialog>` + `showModal()` is the only element that gives modality (focus
trap, background `inert`, Esc, top layer, `aria-modal`) natively — every div-based modal
re-implements all of it in JS, imperfectly. Closing is fully declarative:
`<form method="dialog">` closes the dialog and sets `returnValue` from the button's
`value`, no script. `aria-labelledby` is required. An explicit close button is required
even when `closedby="any"` light-dismiss is present — light dismiss is never the only
exit. Non-modal use (`.show()`) is permitted but exceptional: no backdrop, no trap, no
Esc (unless `closedby` provides it), renders in flow, not top layer; styled via
`.dialog:not(:modal)`.

**The one platform gap — stated precisely:** the dialog itself, its closing, its focus
behaviour, and its modality are JS-free. *Opening* a closed dialog is not: there is no
Baseline declarative invoker today. Invoker Commands
(`<button command="show-modal" commandfor="confirm-delete">`) close this gap and are
shipping across engines through 2025–26, but at time of writing they are not confirmed
Baseline Newly Available, so per
[ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md) they may not appear in
shipped markup. Until intake, the Core path is a ~3-line script or the optional
`wel-dialog` module (see Behaviour tiers).

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-size` | *(absent)* = `md`, `sm`, `lg` | `--wel-dialog-max-inline-size` step (≈ 24 / 36 / 48rem); block-size always content-driven, capped to viewport |

One axis. Modality (modal vs non-modal) is invocation behaviour (`showModal()` vs
`show()`), not a variant — the same element supports both, styled via `:modal`.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Open | `[open]` | Visible; entry transition where Enhanced | `dialog` role; content enters a11y tree |
| Modal open | `:modal` | `::backdrop` shown; page behind inert | `aria-modal="true"` implicit via `showModal()` |
| Closed | *(default)* | `display: none` (UA) | Removed from a11y tree |

Interior controls carry their own states (`:focus-visible` etc.) per their specs.

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-dialog-bg` | `var(--wel-color-surface-raised)` | — | |
| `--wel-dialog-ink` | `var(--wel-color-ink)` | — | Pairing partner of bg (05 table) |
| `--wel-dialog-radius` | `var(--wel-radius-surface)` | — | |
| `--wel-dialog-padding` | `var(--wel-space-5)` | — | |
| `--wel-dialog-shadow` | `var(--wel-shadow-4)` | — | |
| `--wel-dialog-max-inline-size` | per `data-size`; `36rem` default | — | Always additionally capped by viewport minus gutter |
| `--wel-dialog-backdrop` | `light-dark(oklch(21% 0.01 250 / 0.45), oklch(8% 0.005 250 / 0.6))` | — | A scrim always **darkens** — an ink-based mix inverts in dark mode (ink is near-white there, so the dim lit the page; caught in T-40 review). See `::backdrop` inheritance note below |

`::backdrop` note: custom-property inheritance into `::backdrop` (from the dialog)
reached Baseline in 2024 and is near Widely Available at time of writing; until the
graduation audit ([ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md))
confirms it, the `::backdrop` rule carries a literal fallback in its `var()`.

## Behaviour tiers

### Core (Baseline Widely Available)

Everything except declarative opening. `<dialog>` is Core
([03](../03-browser-support-policy.md)): `showModal()` provides top layer, focus trap,
background inert, Esc-to-close, backdrop. Closing via `form method="dialog"` and
`returnValue` is declarative. Opening requires the Core script path:

```html
<script type="module">
  for (const b of document.querySelectorAll('[data-dialog-open]'))
    b.addEventListener('click', () =>
      document.getElementById(b.dataset.dialogOpen)?.showModal());
</script>
```

This is the entire behaviour; the optional `wel-dialog` module is this plus late-added-DOM
handling. Open/close is instant in Core (03 contract).

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| `@starting-style` + `transition-behavior: allow-discrete` | `@supports (transition-behavior: allow-discrete)` | Fade/scale entry and exit on panel and `::backdrop`; `display` and `overlay` in the transition list so exit animates before leaving the top layer (engines without `overlay` skip it — exit may snap, entry unaffected) | Instant open/close (03 row) |
| `closedby="any"` | — (inert HTML attribute; no gate possible, none needed) | Light dismiss: outside-click and close-request close the dialog. Near/at Baseline Newly Available at writing; if the intake review finds it pre-Baseline it is withheld — nothing else changes, because the close button is mandatory regardless | Explicit close button + Esc (Core) |
| Invoker Commands (`command="show-modal"` / `commandfor`) | — (HTML; **pre-Baseline at writing — not in shipped markup**, ADR-0012) | Fully declarative opening; the Core script is deleted on graduation | Core script path above |

All durations route through `calc(var(--wel-motion-duration-2) * var(--wel-motion))`.

### JS enhancement

Documented here although the tier is Platform, because opening is the one gap:

- **Ladder justification:** rung 2 delivers modality, trap, Esc, closing, focus return.
  It cannot yet deliver *opening* — Invoker Commands will, but are pre-Baseline. Scope of
  JS: one `showModal()` call.
- **Element/module:** `[data-dialog-open]` data-attribute upgrader; `wel-dialog.js`
  (optional; the inline 3-liner above is an equally supported choice). ≤ 2 KB per
  [08](../08-javascript-policy.md).
- **Attributes (config in):**

| Attribute | On | Meaning |
|-----------|----|---------|
| `data-dialog-open="{id}"` | invoker button | `showModal()` the dialog with that id |
| `data-dialog-modal="false"` | invoker button | use `show()` (non-modal) instead |

- **Events (state out):** none of our own — native `close` and `cancel` on the dialog
  are the API; `returnValue` carries the closing button's `value`.
- **No-JS baseline:** a closed dialog cannot be opened without script — stated plainly.
  Consequence: content that must be reachable no-JS does not belong in a dialog; serve it
  as a page, or server-render the dialog with the `open` attribute (renders in-flow,
  non-modal, close button still works via `method="dialog"`). This is the documented
  no-JS pattern.

## Accessibility

- **Roles/ARIA:** native `dialog` role; `aria-modal` implicit via `showModal()`.
  `aria-labelledby` pointing at the title is required; `aria-describedby` for a body
  summary recommended on confirmations. No ARIA re-statement of what the element provides.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Esc | Close (native `cancel`, modal; non-modal only with `closedby`) |
| Tab / Shift+Tab | Cycle focus within the modal dialog (native trap) |
| Enter | Submit the focused `method="dialog"` form → close with value |

- **Focus behaviour:** *initial focus* — exactly one `autofocus` inside the dialog, on
  the primary control; for destructive confirmations, on the non-destructive action
  (Cancel). Without `autofocus` the browser focuses the first focusable element — spec
  authors must not rely on that ordering accident. For long text content, `autofocus` on
  the dialog itself so reading starts at the top. *Return focus* — native: closing a
  `showModal()` dialog returns focus to the previously focused element; keep the invoker
  in the DOM while the dialog is open or focus falls to `<body>`. Trap participation:
  the dialog *is* the trap (native).
- **Forced colors:** panel maps to `Canvas`/`CanvasText`; `--wel-dialog-shadow` is
  removed by the UA, so the component ships a `var(--wel-border-width)` border (visible in
  forced colors, hairline otherwise) to keep the panel edge. Backdrop dimming may be
  suppressed; acceptable — modality is conveyed by inertness, not tint. No
  `forced-color-adjust` overrides.
- **Reduced motion:** entry/exit transitions run at 0ms via `--wel-motion`; open/close is
  instant, identical to Core.
- **Contrast:** `--wel-dialog-bg`/`--wel-dialog-ink` is the surface-raised/ink 4.5:1
  pairing from the 05 table, both schemes.
- **WCAG 2.2 criteria specifically implicated:** 2.1.2 No Keyboard Trap (trap is
  escapable — Esc and close button), 2.4.3 Focus Order (initial focus + native return),
  2.4.11 Focus Not Obscured (top layer cannot be covered by sticky chrome).

## Container behaviour

None — a top-layer element sizes against the viewport, not a container:
`inline-size: min(var(--wel-dialog-max-inline-size), calc(100dvw - 2 * var(--wel-space-gutter)))`,
`max-block-size: calc(100dvh - 2 * var(--wel-space-gutter))` with internal body scroll.
No subgrid participation.

## Composition

May contain: headings, flow content, forms (including full [form-controls](form-controls.md)),
`.button` clusters via `.cluster`; popovers and tooltips (top-layer stacking handles
them). May be contained by: anywhere in the DOM — top layer removes it from visual flow.
Forbidden: nesting a modal dialog trigger flow more than one level deep (platform allows
stacking; the design system does not); `.dialog` inside `.popover`.

## Open questions

- ~~`closedby` intake: confirm Baseline status at Phase 1 audit.~~ **Resolved (T-40):
  withheld** — checked at implementation (July 2026): Chrome 134 / Firefox 137 shipped,
  Safari has not (Baseline blocked since 2025; Interop 2026 item). Per the spec's own
  contingency the attribute is omitted from shipped markup and nothing else changes —
  the mandatory close button covers every user. Re-check at each minor-release audit
  (ADR-0012).
- ~~Does `wel-dialog.js` ship in v1, or is the documented inline 3-liner enough until
  Invoker Commands graduate?~~ **Resolved (T-65): module ships.** `wel-dialog.js` is the
  3-liner as one *delegated* root listener, so late-added invokers need no re-scan, plus
  an already-open guard (`showModal()` on an open dialog throws, and a server-rendered
  in-flow panel must not be re-modal-ised). The inline 3-liner remains an equally
  supported choice. Both are deleted when Invoker Commands graduate (ADR-0012).
- Drawer/sheet placement (`data-placement="inline-end"`) — post-v1, needs its own motion
  contract.

## References

Bootstrap Modal — requires `bootstrap.js` + a hand-rolled focus trap, `data-bs-toggle`
plumbing, scroll-lock hacks, and ARIA wired manually. We differ: the browser's
`<dialog>` supplies trap/inert/Esc/top-layer ([09](../09-accessibility.md) names this the
platform-first selling point); our total JS is one `showModal()` call, deleted entirely
when Invoker Commands graduate ([ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md));
entry/exit animation is pure CSS (`@starting-style`), not a JS class-toggle dance.

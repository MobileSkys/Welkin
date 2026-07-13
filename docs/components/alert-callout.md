# Component: Alert / Callout

| | |
|---|---|
| **Status** | Draft |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

A toned message surface that speaks to the reader about the surrounding content or the
system's state: notes, warnings, success confirmations, error summaries. One visual
component, two usages with different semantics: a **callout** is static, authored content
(a warning box in documentation); an **alert** is a dynamically inserted, urgent message
(form submission failed). Use a badge for one-word status labels, a toast (`toast.md`,
JS-enhanced) for transient self-dismissing notifications, and inline field errors for
per-field validation ([form-controls](form-controls.md)). This component has no dismiss
affordance in v1 — a message worth interrupting the reader for is worth leaving on
screen; transient messaging is the toast's job.

## Anatomy

```
┌─ root (.alert) ──────────────────────────────┐
│  [icon (.alert-icon)?]  ┌─ content ────────┐ │
│                         │ [title (.alert-title)?] │
│                         │ body (flow)       │ │
│                         └──────────────────┘ │
└──────────────────────────────────────────────┘
```

Parts: root; optional icon (inline SVG, decorative); optional title (`.alert-title`);
body (flow content — the rest of the root's children).

## HTML structure

```html
<!-- Static callout: authored content, present at page load -->
<aside class="alert" data-tone="warning">
  <svg class="alert-icon" aria-hidden="true">…</svg>
  <p class="alert-title">Check your browser targets</p>
  <p>Enhanced-tier features are gated behind <code>@supports</code>.</p>
</aside>

<!-- Dynamic alert: inserted after an event, urgent -->
<div class="alert" role="alert" data-tone="danger">
  <p class="alert-title">Payment failed</p>
  <p>Your card was declined. No charge was made.</p>
</div>
```

Rationale and the role discipline (**this distinction is the point of the spec**):

- `role="alert"` creates an assertive live region. It exists for messages **inserted or
  revealed dynamically** — screen readers announce the content immediately, interrupting
  the current output. On static content it does nothing useful at page load, and
  sprinkling it on every toned box trains real interruptions to be ignored. **Only
  dynamically inserted urgent messages get `role="alert"`.**
- Non-urgent dynamic messages (success confirmations) use `role="status"` (polite).
- Static callouts are an `<aside>` when tangential to the main flow, or a `<div>` when
  part of it. No ARIA at all.
- The title, when present, is a `<p class="alert-title">`, not a heading — callouts
  should not fragment the document outline; if a callout genuinely needs an outline
  entry, the author may use a heading of the correct level with the same class.
- The icon is decorative (`aria-hidden="true"`): the tone's meaning must be carried by
  the title/body text, so the icon adds nothing for assistive technology.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-tone` | *(absent)* = neutral, `info`, `success`, `warning`, `danger` | Tint background, tone accent border, tone-inked title/icon from the tone token sets |

One axis. Tone is visual reinforcement only — the words must convey the severity
(WCAG 1.4.1). No `data-variant`, no `data-size`.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| None | — | — | — |

The component is non-interactive. Links or buttons inside it carry their own states.

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-alert-bg` | `var(--wel-color-surface-sunken)`; tone tint (`--wel-color-{tone}-tint`) per `data-tone` | — | |
| `--wel-alert-ink` | `var(--wel-color-ink)` | — | Body stays body-inked; only title/icon take tone ink |
| `--wel-alert-accent` | `var(--wel-color-border-strong)`; `--wel-color-{tone}` per `data-tone` | — | Paints the inline-start accent border, title, and icon |
| `--wel-alert-radius` | `var(--wel-radius-surface)` | — | |
| `--wel-alert-padding` | `var(--wel-space-4)` | — | |
| `--wel-alert-gap` | `var(--wel-space-3)` | — | Icon ↔ content, title ↔ body |
| `--wel-alert-icon-size` | `1.25em` | — | Tracks the alert's font size |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything. Tones, the icon/content arrangement, and the accent border are Core CSS.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience |
|---------|------------------|-------------|---------------------|
| None | — | — | — |

### JS enhancement

None. (Insertion of dynamic alerts is host-app code by nature; queued, timed, self-
dismissing messages are the JS-enhanced toast component.)

## Accessibility

- **Roles/ARIA:** static callout — none (element semantics only). Dynamic urgent —
  `role="alert"` (implicit `aria-live="assertive"`, `aria-atomic="true"`). Dynamic
  polite — `role="status"`. The role goes on the element **before or as** the message
  content is inserted; toggling `hidden` off on a pre-existing `role="alert"` element is
  the reveal pattern that announces most reliably. Never `role="alert"` on content
  present at load.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| None | The component itself is not focusable; links/buttons inside follow their own specs |

- **Focus behaviour:** live regions announce without moving focus — do not programmatically
  focus an alert on insertion (that is a dialog's behaviour). For form error summaries
  that *should* receive focus, the documented pattern is `tabindex="-1"` + host-app
  `focus()` on a `role="alert"`-free container, so the announcement comes from focus, not
  a double-fire with the live region.
- **Forced colors:** tone tints vanish; the accent border and the root border render in
  `CanvasText`, so the box and its inline-start emphasis survive. Tone differences
  collapse (acceptable — the text carries severity).
- **Reduced motion:** none — the component ships no motion. (Hosts animating insertion
  must route durations through `--wel-motion`.)
- **Contrast:** tone tint/ink and tint/accent pairings come from the
  [05](../05-design-tokens.md) pairing table at 4.5:1 (text) and 3:1 (accent border vs
  tint).
- **WCAG 2.2 implicated:** 1.4.1 Use of Colour — severity in words, tone as
  reinforcement; 4.1.3 Status Messages — the `role="alert"` / `role="status"` discipline
  above is precisely this criterion.

## Container behaviour

Below **24rem** in the nearest `layout` container the icon column drops and the icon
renders inline with the title line, keeping the text measure usable. Sensible minimum
width ~12rem. No subgrid participation.

## Composition

May contain: flow content (paragraphs, lists, links, `code`), one optional icon, one
optional title, buttons for related actions (a "Retry" in a failure alert). May be
contained by: any flow context — page flow, card bodies, form headers. Stacks of alerts
are arranged by `.stack`. Forbidden: `.alert` inside `.alert`; interactive elements as
the *only* content (an alert is a message, not a control surface); headings inside
callouts that break the document outline.

## Open questions

- Neutral default tone: is a toneless grey callout useful enough to keep, or should the
  bare class default to `info` visuals? Currently neutral, to keep tone opt-in.
- Should `role="status"` usage get its own visual cue (calmer tint) or is that
  over-designing the distinction?

## References

Bootstrap `.alert alert-{color}` — puts `role="alert"` in every documented example
including static content, dismissal via the Alert JS plugin, `.alert-link` colour
utility. We differ: the live-region role is specified as a *usage* decision with a
static/dynamic discipline (4.1.3-driven), tones are one attribute axis fed by tone tokens
([ADR-0001](../decisions/ADR-0001-variant-syntax.md)) rather than per-colour classes, no
dismiss plugin (transient messages are the toast's job), and links inside inherit normal
link styling — no special-cased descendant colour classes.

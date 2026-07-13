# Component: Toast

| | |
|---|---|
| **Status** | Draft |
| **Tier** | JS-enhanced |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

Transient, non-blocking notifications confirming background outcomes ("Saved",
"Upload complete", "Connection lost"). Use when the user should be informed without
being interrupted. Do NOT use for messages requiring a decision (that is a
[dialog](dialog.md)), for persistent contextual messages (that is
[alert/callout](alert-callout.md)), or for form validation errors (those belong inline
at the field — [form-controls.md](form-controls.md)).

## Anatomy

```
┌─ region (<wel-toast-region>) — overlay when upgraded ─┐
│  ┌─ toast (<wel-toast>) ───────────────────────────┐  │
│  │ [icon?]  message   [action?]  [dismiss ✕]      │  │
│  └────────────────────────────────────────────────┘  │
│  ┌─ toast ────────────────────────────────────────┐  │
│  └────────────────────────────────────────────────┘  │
│    …visible stack (≤ max); excess queued FIFO        │
└──────────────────────────────────────────────────────┘
```

Parts: region (`<wel-toast-region>`, the manager); toast (`<wel-toast>`); message text;
optional leading icon; optional single action link/button; dismiss button (generated
by the region).

## HTML structure

```html
<!-- The region: once per page, in flow (see no-JS baseline for why) -->
<wel-toast-region aria-label="Notifications">
  <!-- Server-rendered flash message: works with or without JS -->
  <wel-toast data-tone="success">Profile saved.</wel-toast>
</wel-toast-region>

<!-- The declarative API: the host appends a child; the region adopts it -->
<script type="module">
  import "welkincss/js/wel-toast-region.js";
  const region = document.querySelector("wel-toast-region");

  region.insertAdjacentHTML("beforeend",
    `<wel-toast data-tone="danger">Upload failed. <a href="/retry">Retry</a></wel-toast>`);

  // Convenience method — mirrors the append, never the only path (ADR-0011)
  region.push("Profile saved.", { tone: "success", duration: 6000 });
</script>
```

**The declarative mechanism, honestly stated:** the API *is* the DOM. Appending an
`<wel-toast>` child is the canonical way to raise a toast; the region observes
`childList` mutations and adopts new children (queue slot, timer, live-region role,
dismiss button). `region.push()` exists as a convenience that constructs and appends
exactly that child — per [ADR-0011](../decisions/ADR-0011-js-delivery-mechanism.md),
methods mirror declarative state, never replace it. This makes server-rendered flash
messages, `htmx`-style fragment swaps, and framework renders all first-class: anything
that can produce a child element can raise a toast. Configuration is attributes in;
lifecycle is events out.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-tone` (on `<wel-toast>`) | *(absent)* = neutral, `info`, `success`, `warning`, `danger` | Tone colour + tone icon; also selects live-region politeness (see JS enhancement) |
| `data-placement` (on region) | *(absent)* = `end` (block-end/inline-end), `start`, `center` | Overlay corner/edge, in logical directions; applies only to the upgraded (`:defined`) region |

Axes compose (any tone in any placement). Behavioural attributes (`duration`, `max`,
`dismissible`) are element API — see JS enhancement.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover | `:hover` on region | None visually; **all timers pause** | — |
| Focus within | `:focus-visible` on dismiss/action | Global focus ring; **all timers pause** while focus is inside the region | — |
| Pre-upgrade | `wel-toast-region:not(:defined)` | In-flow static alerts (no overlay, no timers) | Rendered content |

Timer state is behavioural, not visual, in v1 (remaining-time indicator is an open
question). Toast entry/exit visuals are Enhanced-tier (below).

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-toast-bg` | `var(--wel-color-surface-raised)` | — | Tone tints via `--wel-color-{tone}-tint` |
| `--wel-toast-ink` | `var(--wel-color-ink)` | — | |
| `--wel-toast-border` | `var(--wel-color-border)`; tone sets `--wel-color-{tone}` | — | Tone is never colour-alone (icon too) |
| `--wel-toast-radius` | `var(--wel-radius-surface)` | — | |
| `--wel-toast-shadow` | `var(--wel-shadow-3)` | — | |
| `--wel-toast-gap` | `var(--wel-space-2)` | — | Between stacked toasts |
| `--wel-toast-max-inline-size` | `24rem` | — | Toasts are `min(100%, max-inline-size)` |

Timeouts are behaviour, not animation, so they are configured by attribute (ms), not
motion tokens — the 05 "no raw durations" rule governs transitions, which all route
through `--wel-motion`.

## Behaviour tiers

### Core (Baseline Widely Available)

All box styling, tone treatment, and stacking layout. Overlay positioning
(`position: fixed`, placement per `data-placement`) is applied **only** to
`wel-toast-region:defined` — CSS applies without JS, so an unconditioned fixed overlay
would break the no-JS baseline; gating on `:defined` keeps the pre-upgrade region in
document flow.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| `@starting-style` + `transition-behavior: allow-discrete` | `@supports (transition-behavior: allow-discrete)` | Toasts slide/fade in on entry and fade out on dismissal (including transitioning `display`) | Toasts appear/disappear instantly ([03 contract](../03-browser-support-policy.md)) |
| View transitions | `@supports (view-transition-name: --x)` | Remaining stack reflows smoothly when a toast leaves | Stack reflows instantly ([03](../03-browser-support-policy.md)) |

### JS enhancement

- **Ladder justification:** queueing (max-visible + FIFO overflow), per-toast timers
  with pause/resume, and choosing `aria-live` politeness per message are **state over
  time** — rung 1 has no timers or counters, and rung 2 has no platform notification
  primitive (Popover API is dismiss-on-interaction UI, not a queued live-region
  manager). Announcing to screen readers at the right politeness *requires* DOM
  role management at insertion time. Toast is rung 3 by justification
  ([08](../08-javascript-policy.md)).
- **Element/module:** `<wel-toast-region>` light-DOM custom element (manager);
  `<wel-toast>` children are styled markup adopted by the region (no logic of their
  own). `js/wel-toast-region.js`, plain ESM, zero dependencies. **Budget: ≤ 2 KB
  min+gzip.**
- **Attributes (config in):**

| Attribute | On | Values | Meaning |
|-----------|----|--------|---------|
| `duration` | region | ms, default `6000` | Default auto-dismiss timeout for adopted toasts |
| `duration` | toast | ms; `0` = persistent | Per-toast override. **Ignored (treated as `0`) for `data-tone="danger"`** — errors never auto-dismiss |
| `max` | region | integer, default `3` | Max simultaneously visible; excess queue FIFO |
| `dismissible` | toast | `false` to omit | Region generates a dismiss button unless `dismissible="false"`; only auto-dismissing toasts may omit it |
| `data-tone` | toast | see Variants | Also selects politeness: neutral/info/success → `role="status"`; warning/danger → `role="alert"` |

- **Events (state out):**

| Event | Bubbles | `detail` | When |
|-------|---------|----------|------|
| `wel-toast-show` | yes | `{ toast }` | Toast leaves the queue and becomes visible |
| `wel-toast-dismiss` | yes | `{ toast, reason: "timeout" \| "dismiss" \| "api" }` | Toast removed (timer, user, or host removal) |

- **No-JS baseline:** pre-upgrade (or with JS disabled) the region renders **in
  document flow** and every `<wel-toast>` child renders as a static, tone-styled alert
  block — which is why the docs place the region markup where flash messages belong
  (top of `<main>`), not at the end of `<body>`. Server-rendered messages are fully
  readable; nothing times out; nothing is overlaid. Usable, per the
  [08 no-JS table](../08-javascript-policy.md).

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** region: `role="region"` with host-supplied `aria-label`
  (e.g. "Notifications") — the module never injects English text. Each adopted toast:
  `role="status"` (implicit `aria-live="polite"`) for neutral/info/success,
  `role="alert"` (assertive) for warning/danger, set **before** insertion into the
  visible stack so insertion itself triggers the announcement. Dismiss button:
  `aria-label="Dismiss"`-equivalent host-localised via a `dismiss-label` attribute on
  the region.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Reach toast action links and dismiss buttons in DOM order (no special handling) |
| Enter / Space | Activate dismiss or action (native button/link) |

- **Focus behaviour:** **focus is never stolen** — toasts appear without moving focus
  (announcement is the live region's job). Focus is paused-on: while focus is inside
  the region, no timer expires. If the toast containing focus is dismissed, focus
  moves to the next toast's dismiss button, if any (open question below on restoring
  further). No trap participation.
- **Forced colors:** toast surface gets a `CanvasText` border (shadow disappears);
  tone colour distinctions collapse — acceptable because tone is *also* conveyed by
  the tone icon and message text (1.4.1, never colour alone). Dismiss button maps to
  `ButtonFace`/`ButtonText` natively.
- **Reduced motion:** entry/exit transitions and the view-transition reflow are gated
  off (`--wel-motion: 0` + the [09 preference matrix](../09-accessibility.md) rule for
  view transitions); an opacity-only fade may remain (non-vestibular). Timers are
  unaffected.
- **Contrast:** toast ink/bg and tone-icon pairings from the 05 table (4.5:1 text,
  3:1 icons/border).
- **WCAG 2.2 criteria specifically implicated:** **2.2.1 Timing Adjustable** — the
  load-bearing criterion: timers pause on hover and on focus-within, `duration` is
  host-adjustable per region and per toast, and `role="alert"` errors never
  auto-dismiss (a message the user must act on cannot evaporate). 4.1.3 Status
  Messages (announced without focus). 1.4.1 Use of Color (tone icons). 2.1.1 Keyboard
  (dismiss reachable). 1.4.3 Contrast.

## Container behaviour

None — the upgraded region is viewport-anchored page chrome (the one legitimate
viewport-relative context per [06](../06-layout-system.md) scaffolding rules), not a
container-responsive component. Toasts cap at `--wel-toast-max-inline-size` and shrink
to `100%` on narrow viewports. No subgrid participation.

## Composition

A toast may contain: short text, one tone icon, at most one action link/button, the
dismiss button. Anything richer (forms, multiple actions, long content) is a dialog or
an inline callout — forbidden here, and a documented lint candidate. The region
contains only `<wel-toast>` children; one region per page (multiple regions are
unspecified in v1). `<wel-toast>` outside a region renders with alert styling but gets
no management — documented, not supported.

## Open questions

- Focus recovery when the last focused toast is dismissed: restoring to the
  pre-region `activeElement` is the ideal, but tracking it robustly may not fit the
  2 KB budget — measure in Phase 1.
- A keyboard shortcut to jump to the region (F6-style rotor stop) — no standard
  exists; document a host-app pattern instead?
- Visible remaining-time indicator (progress ring) — pairs naturally with
  pause-on-hover; Enhanced tier candidate post-v1.
- Should `warning` map to `status` rather than `alert`? Assertive interruption may be
  too aggressive for non-blocking warnings — decide with SR testing (09 floor).

## References

Bootstrap toasts: markup is hidden until `new bootstrap.Toast(el).show()` — imperative
JS is the *only* path, no-JS users get nothing; positioning is hand-rolled utility
classes; `autohide` has no focus-pause and no politeness distinction (one
`aria-live="assertive"` suggestion in docs, hand-authored). We differ: append-a-child
declarative API with a method as mere convenience (ADR-0011), a no-JS baseline where
flash messages render as static in-flow alerts, per-tone `status`/`alert` politeness
managed by the region, WCAG 2.2.1 timing (pause on hover *and* focus, persistent
errors), and CSS-owned entry/exit animation via `@starting-style` instead of JS
class-swap transitions.

# Component: Progress / Spinner / Skeleton

| | |
|---|---|
| **Status** | Draft |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

Three related loading indicators in one spec because choosing between them is the design
decision: **progress** when completion is measurable, **spinner** when it isn't,
**skeleton** when the *shape* of incoming content is known and layout stability matters.
One spec keeps the decision matrix in one place.

## Purpose

Communicate that the system is working. Use `<progress>` for determinate operations
(upload, multi-step import); the spinner for short indeterminate waits attached to a
control or region; skeletons for first-paint content loading where reserving layout
prevents shift. Do NOT use a spinner where progress is knowable (lazy — measure it), do
NOT use skeletons for post-interaction waits (spinner + `aria-busy` is honest), and do
NOT ship any of them for waits under ~300 ms (flash of meaningless indicator).

## Anatomy

```
progress:  ┌─ root (progress.progress) ──────────────┐
           │ ███████████████░░░░░░░░░  track + fill  │
           └─────────────────────────────────────────┘
spinner:   ┌─ root (.spinner) ─┐   role="status"
           │   ◜ arc + track   │ + visually-hidden label
           └───────────────────┘
skeleton:  ┌─ root (.skeleton) ─┐  aria-hidden="true"
           │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │  inside an [aria-busy] region
           └────────────────────┘
```

Parts — progress: root (native element), track, fill. Spinner: root, arc, track,
accessible label. Skeleton: root (repeated per placeholder shape), host region
(the element carrying `aria-busy`, not part of this component).

## HTML structure

```html
<!-- Progress: determinate, native -->
<label for="upload">Uploading photos…</label>
<progress class="progress" id="upload" max="100" value="62">62%</progress>

<!-- Spinner -->
<div class="spinner" role="status">
  <span class="visually-hidden">Loading results…</span>
</div>

<!-- Skeleton: placeholders are decorative; the REGION carries the loading state -->
<section aria-busy="true" aria-describedby="feed-status">
  <p id="feed-status" class="visually-hidden">Loading feed…</p>
  <div class="skeleton" data-variant="circle" aria-hidden="true"></div>
  <div class="skeleton" data-variant="text" aria-hidden="true"></div>
  <div class="skeleton" data-variant="text" aria-hidden="true"></div>
</section>
```

Rationale: native `<progress>` exposes role, `aria-valuenow/-max`, and value updates to
AT for free — a `<div role="progressbar">` reimplements all of that by hand and drifts.
The `value`-less form (`<progress>` alone) is the native indeterminate state,
selectable via `:indeterminate`; we style it but recommend the spinner for indeterminate
waits (clearer idiom). The spinner's `role="status"` is a polite live region — the
visually-hidden label is announced once when inserted; the fallback text inside
`<progress>` serves pre-CSS rendering. Skeletons are **decorative**: `aria-hidden="true"`
always, because a screen-reader user gains nothing from "grey rectangle"; the loading
state must instead be announced by `aria-busy="true"` **on the region** plus a text
status — skeletons without a busy region are a documented conformance bug.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-size` | *(absent)* = `md`, `sm`, `lg` | Progress: track block-size. Spinner: diameter (1em-relative at `sm` for inline-in-button use) |
| `data-variant` *(skeleton only)* | *(absent)* = `block`, `text`, `circle` | Placeholder shape: rectangle; line (1em block-size, `--wel-radius-sm`); circle (avatar) |

Progress and spinner take no `data-variant` — tone/colour is the accent token's job.
Inline size of skeletons is the author's layout concern (they mirror incoming content).

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Indeterminate (progress) | `progress:indeterminate` | Track without fill + subtle track pulse (docs steer to spinner) | Native (no value reported) |
| Busy (host region) | `[aria-busy="true"]` | Region containing skeletons; also consumed by other components (button spec) | `aria-busy` |

Hover/focus/active/disabled do not apply — all three indicators are non-interactive.

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-progress-track-bg` | `var(--wel-color-surface-sunken)` | — | |
| `--wel-progress-fill` | `var(--wel-color-accent)` | — | Also fed to `accent-color` on the quick path |
| `--wel-progress-block-size` | `var(--wel-space-2)` | — | Scaled by `data-size` |
| `--wel-progress-radius` | `var(--wel-radius-full)` | — | |
| `--wel-spinner-size` | `var(--wel-space-6)` | — | `1em`-relative at `data-size="sm"` |
| `--wel-spinner-thickness` | `var(--wel-border-width-strong)` | — | Border-based construction (survives forced colors) |
| `--wel-spinner-ink` | `var(--wel-color-accent)` | — | Arc colour |
| `--wel-spinner-track` | `var(--wel-color-border)` | — | Full ring behind the arc |
| `--wel-skeleton-bg` | `var(--wel-color-surface-sunken)` | — | |
| `--wel-skeleton-shimmer` | `var(--wel-color-surface-raised)` | — | Gradient highlight, motion-gated |
| `--wel-skeleton-radius` | `var(--wel-radius-sm)` | — | `--wel-radius-full` for `circle` |

## Behaviour tiers

### Core (Baseline Widely Available)

**Progress — the honest styling story.** There is no standard styling API for
`<progress>` internals. What exists:

- **The quick path (recommended default):** keep native rendering and set
  `accent-color: var(--wel-progress-fill)`. One line, correct in every engine, inherits
  dark mode via `color-scheme`. `.progress` ships this unconditionally.
- **The full restyle (what `.progress` layers on top):** engine-specific pseudo-elements
  — `::-webkit-progress-bar` / `::-webkit-progress-value` (Chromium/WebKit, requires
  `appearance: none` first) and `::-moz-progress-bar` (Firefox). These are
  non-standard, and an unrecognised pseudo-element invalidates its **entire rule**, so
  each engine's block must be written as a separate rule — never comma-joined. We accept
  this documented, contained ugliness because it is fallback-safe: any engine that
  rejects the pseudos keeps the accent-coloured native bar. No pixel parity is promised
  between engines (per the [03](../03-browser-support-policy.md) stance).

**Spinner.** A border/conic arc rotated by a CSS animation. The duration is written
`calc(var(--wel-motion-duration-4) * 2 * var(--wel-motion))` — token-derived, multiplier
applied, no raw durations ([05](../05-design-tokens.md)). Under
`@media (prefers-reduced-motion: reduce)` the animation is removed entirely (see
Accessibility for the static design).

**Skeleton.** Static tinted shapes in Core. The shimmer is a background-position sweep
applied **only inside `@media (prefers-reduced-motion: no-preference)`** — motion is the
opt-in wrapper, stillness the default, per the additive rule in
[03](../03-browser-support-policy.md).

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| Style queries | `@container style(--wel-motion: 0)` | Spinner/shimmer also go static when a **theme** sets `--wel-motion: 0` (not just the OS preference) | Only the `prefers-reduced-motion` path stops motion; theme-set multiplier still zeroes transition durations everywhere but cannot halt these two infinite animations (style-queries row in [03](../03-browser-support-policy.md)) |

## Accessibility

- **Roles/ARIA:** progress — native `progressbar` role with value semantics; label via
  `<label for>` or `aria-labelledby` (required). Spinner — `role="status"` (polite live
  region) with a visually-hidden text label (required; the ring alone has no name).
  Skeleton — `aria-hidden="true"` on every placeholder (required); host region carries
  `aria-busy="true"` while loading and a text status node; when content arrives,
  `aria-busy` is removed by the app. Long spinner waits inside a region should likewise
  set `aria-busy` on that region.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| — | None; all three indicators are non-interactive and never focusable |

- **Focus behaviour:** never receives focus; must not disturb focus when
  inserted/removed. Apps swap skeletons for content in place — focus stays where it was.
- **Forced colors:** progress falls back to native rendering semantics — the full
  restyle's backgrounds would be stripped, so a `@media (forced-colors: active)` block
  reverts to native appearance where the fill maps to `Highlight` (this is the per-case
  pattern [09](../09-accessibility.md) requires; no blanket `forced-color-adjust`).
  Spinner is border-built, so arc and track map to `CanvasText`/`GrayText` and survive
  intact. Skeletons lose their backgrounds → they gain a `1px solid GrayText` border
  under forced colors so reserved space stays visible (decorative, but invisible blanks
  read as breakage).
- **Reduced motion:** the defining requirement. At `--wel-motion: 0` / PRM-reduce: the
  spinner's rotation stops and it renders as a **static partial arc over a visible
  track** — a composition chosen to read as "busy" without motion (a full static ring
  would read as decoration). It must still convey busyness non-motionally: the
  `role="status"` text announces it, and docs require a visible text label
  ("Loading…") beside spinners that persist beyond a couple of seconds. Skeleton
  shimmer is simply absent — static shapes already convey "pending". Native
  indeterminate `<progress>` animation is UA-controlled and exempt.
- **Contrast:** progress fill vs track and spinner arc vs track are 3:1 non-text
  pairings from the [05](../05-design-tokens.md) pairing table (WCAG 1.4.11). Skeletons
  are decorative and contrast-exempt, but the shipped tint remains perceivable on
  `--wel-color-surface` in both schemes.
- **WCAG 2.2 criteria specifically implicated:** 4.1.3 Status Messages (spinner's
  `role="status"`, region `aria-busy` — state changes announced without focus moves);
  1.4.11 Non-text Contrast (fill/track, arc/track); 2.2.2 Pause, Stop, Hide (spinner and
  shimmer are progress indicators, exempt as such, but the reduced-motion path removes
  them anyway); 2.3.3 Animation from Interactions (AAA, noted — satisfied by the
  multiplier).

## Container behaviour

None. Progress spans its container's inline size (block-size fixed by token); spinner
and skeleton `circle` are content/token-sized; skeleton `block`/`text` take the size the
author gives them (they mirror incoming content, which container queries cannot know).
No `@container` breakpoints; no subgrid participation.

## Composition

May contain: nothing (progress, skeleton) / the visually-hidden label (spinner). May be
contained by: buttons (`sm` spinner in the `[aria-busy]` button pattern —
[button.md](button.md)), cards, dialogs, table cells, any `[aria-busy]` region for
skeletons. Forbidden: interactive content inside any of the three; skeletons outside an
`aria-busy` region (conformance bug, see above); spinner as a permanent decorative
element.

## Open questions

- Static-spinner busyness: 09 permits opacity-only fades under reduced motion — a slow
  opacity pulse would convey *ongoing* activity better than a frozen arc, but it
  requires a duration that deliberately bypasses the `--wel-motion` multiplier, which the
  lint rule forbids. Needs a ruling: lint exception, or stay fully static (current
  position: fully static).
- Skeleton composition helpers: ship prefab arrangements (`media-object` skeleton) or
  keep only the three primitives? Leaning primitives-only; arrangements are `.stack`/
  `.cluster` compositions in docs.
- `<progress>` value transitions cannot be animated cross-engine; is a width-animated
  fill worth an opt-in custom-markup variant post-v1, or does it violate the
  native-first stance?

## References

Bootstrap: progress is nested `<div class="progress"><div class="progress-bar" style="width: 62%">`
with hand-managed `role="progressbar"` + `aria-valuenow` (semantics reimplemented,
routinely omitted); spinners are `.spinner-border` divs; placeholders (`.placeholder`)
ship a shimmer with no reduced-motion gate on the glow variant and no `aria-busy`
doctrine. We differ: the **native `<progress>` element** with free semantics
(accent-color quick path + honestly-documented engine pseudos instead of div soup), a
spinner whose motion routes through the `--wel-motion` multiplier with a designed static
state, and skeletons specified as decorative-only with a mandatory `aria-busy` region
contract — the announcement model is part of the spec, not an afterthought.

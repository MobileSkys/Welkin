# Component: Badge / Tag

| | |
|---|---|
| **Status** | Draft |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

Two small labelling components, specified together because they are commonly confused.
A **badge** is a non-interactive status or count marker attached to something else ("New",
"3 unread", "Deprecated"). A **tag** (chip) names a categorisation the user may act on —
it can be a link (filter navigation) and may carry a dismiss affordance. Use a badge when
the label is pure information; use a tag when it is a thing the user selects, follows, or
removes. Do NOT use either for messages ([alert-callout.md](alert-callout.md)) or for
actions (a button is a `.button`). Rows of tags are arranged by `.cluster`, not by this
component.

## Anatomy

```
┌─ root (.badge) ─┐    ┌─ root (.tag) ──────────────────┐
│  label (text)   │    │  label   [dismiss (.tag-dismiss)?] │
└─────────────────┘    └────────────────────────────────┘
```

Parts: badge — root and label text only. Tag — root, label text, optional dismiss button
(`.tag-dismiss`).

## HTML structure

```html
<!-- Badge: status -->
<span class="badge" data-tone="success">Published</span>

<!-- Badge: count, with context for screen readers -->
<a href="/inbox">Inbox <span class="badge">3<span class="visually-hidden"> unread messages</span></span></a>

<!-- Tag as link -->
<a class="tag" href="/topics/css">CSS</a>

<!-- Dismissible tag -->
<span class="tag">
  Draft
  <button class="tag-dismiss" type="button" aria-label="Remove filter: Draft">
    <svg aria-hidden="true">…</svg>
  </button>
</span>
```

Rationale: a badge is a `<span>` — it has no semantics of its own and must never be
focusable. A tag is a `<span>` (static), an `<a>` (navigational), or a `<span>` containing
a real `<button>` for dismissal. The dismiss control is a plain `<button>` so it is
focusable and activable natively; its `aria-label` must name *what* it removes, not just
"Remove". **Dismissal state handling belongs to the host app**: Welkin ships no JS in v1,
so removing the tag from the DOM (and from whatever model it represents) is the host
application's click handler. A tag is never itself a `<button>` — the dismiss button
inside it would then be nested interactive content (invalid HTML).

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-tone` | *(absent)* = neutral, `info`, `success`, `warning`, `danger` | Tint background + tone ink from the tone token sets |

Applies to both `.badge` and `.tag`. One axis; no `data-variant`, no `data-size` in v1
(see Open questions). Tone is reinforcement, never the sole carrier of meaning — the
label text must convey the status by itself.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover (link tag) | `a.tag:hover` (`@media (hover: hover)`) | Background shifts to derived `-hover` shade | — |
| Focus (link tag / dismiss) | `:focus-visible` | Global focus ring | — |
| Active (link tag / dismiss) | `:active` | Derived `-active` shade | — |
| Selected (filter tag) | `[aria-selected="true"]` on the tag (within a listbox pattern) or `[aria-pressed="true"]` when the tag is host-app-wired as a toggle | Fills with tone/accent colour; forced-colors border treatment | `aria-selected` / `aria-pressed` |

Badges have no states — they are static by definition.

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-badge-bg` | `var(--wel-color-surface-sunken)`; tone tint (`--wel-color-{tone}-tint`) per `data-tone` | — | |
| `--wel-badge-ink` | `var(--wel-color-ink-muted)`; tone ink per `data-tone` | — | Pairing partner of the bg ([05](../05-design-tokens.md)) |
| `--wel-badge-radius` | `var(--wel-radius-full)` | — | Pill by default; themes flatten it here |
| `--wel-badge-padding-block` / `-inline` | `var(--wel-space-1)` / `var(--wel-space-2)` | — | |
| `--wel-tag-bg` / `--wel-tag-ink` | as badge equivalents | — | Separate namespace: themes may diverge the two |
| `--wel-tag-radius` | `var(--wel-radius-sm)` | — | Tags read as objects, not pills |
| `--wel-tag-padding-block` / `-inline` | `var(--wel-space-1)` / `var(--wel-space-3)` | — | |
| `--wel-tag-border` | `var(--wel-color-border)` | — | |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything. Both components are fully realised in Core CSS.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience |
|---------|------------------|-------------|---------------------|
| None | — | — | — |

### JS enhancement

None. (Dismissal is host-app behaviour, deliberately: a library-owned "remove this node"
handler would hide the real work — updating the application state the tag represents.)

## Accessibility

- **Roles/ARIA:** badge — none; it is inline text. Count badges need visible or
  visually-hidden text making the number meaningful ("3" alone announces as "three").
  Icon-only dismiss buttons require `aria-label` naming the specific tag. Badges conveying
  status by tone alone are a spec violation — the text carries the meaning.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Reaches link tags and dismiss buttons (native); never a badge |
| Enter | Follows a link tag (native) |
| Enter / Space | Activates the dismiss button (native) |

- **Focus behaviour:** normal tab order. After host-app dismissal, focus must not be
  dropped on a removed node — the host moves it to the next tag or the list's container
  (documented obligation, since dismissal is host-owned).
- **Forced colors:** tone tints vanish; both components render a `CanvasText` border so
  the boundary survives. Link tags map to `LinkText`; the dismiss button to
  `ButtonText`. Selected tags add a treatment that is not background-only (border weight).
- **Reduced motion:** hover/active colour transitions run at 0ms via `--wel-motion`.
- **Contrast:** every tone tint/ink pair is a guaranteed 4.5:1 pairing from the
  [05](../05-design-tokens.md) table; the tag border meets 3:1 against surface.
- **WCAG 2.2 implicated:** 2.5.8 Target Size — the dismiss button is ≥ 24×24 CSS px even
  though the tag's text box is shorter; the tag grows to accommodate it. 1.4.1 Use of
  Colour — tone never sole carrier.

## Container behaviour

None — badges and tags are content-sized inline elements. Long labels truncate with an
ellipsis beyond `--wel-tag-max-inline-size` (default: none; opt-in knob). No `@container`
breakpoints; no subgrid participation.

## Composition

Badge may be contained by: headings, links, buttons, table cells, card footers — any
inline context. Badge may contain: text and a visually-hidden span only. Tag may contain:
text, a leading icon, one dismiss button. Tags are grouped by `.cluster`. Forbidden:
interactive content inside a badge; a badge inside a tag; `.tag` on a `<button>`;
nesting a link tag's dismiss button inside the `<a>` (nested interactive content — a
dismissible tag is a `<span>`).

## Open questions

- `data-size` for badges (a `sm` for dense tables)? Deferred until a real density case
  appears; the fluid space scale may cover it.
- Selected/filter tags: is `[aria-pressed]` toggle wiring worth a documented pattern page,
  or does it belong to a post-v1 filter-group composite?

## References

Bootstrap `.badge` + `text-bg-{color}` utilities and `rounded-pill` — colour utilities in
markup, no tag/chip concept at all (badges get abused for it, dismiss behaviour requires
the Alert JS plugin or hand-rolling). We differ: a real tag component with a specified
dismiss part and host-app ownership of removal, one `data-tone` axis fed by tone tokens
([ADR-0001](../decisions/ADR-0001-variant-syntax.md)), radius as a theme token rather
than a pill utility, and an explicit non-interactivity rule for badges.

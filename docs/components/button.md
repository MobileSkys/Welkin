# Component: Button

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

The action trigger. Use for actions (submit, open, toggle, delete). Do NOT use for
navigation — a link that goes somewhere is an `<a>`, styled as a link or, exceptionally,
with `.button` when design demands button appearance (permitted, with the caveat that
Space-key activation differs). Groups of buttons are arranged with the `.cluster`
primitive, not by this component.

## Anatomy

```
┌─ root (.button) ─────────────────────┐
│  [icon?]  label (text)  [icon?]      │
└──────────────────────────────────────┘
```

Parts: root; optional leading/trailing icon (inline SVG); label text.

## HTML structure

```html
<button class="button" data-variant="primary">Save changes</button>

<button class="button" data-variant="ghost" data-size="sm">
  <svg aria-hidden="true">…</svg>
  Filter
</button>

<a class="button" data-variant="secondary" href="/pricing">See pricing</a>
```

Rationale: a real `<button>` brings focusability, Enter+Space activation, `:disabled`,
form participation, and forced-colors mapping for free. `type="button"` is required on
non-submit buttons inside forms (documented footgun). Icon-only buttons require
`aria-label` and are a documented pattern, not a separate component.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-variant` | *(absent)* = `default`, `primary`, `secondary`, `ghost`, `danger` | Visual weight/intent. `default` is a neutral filled button |
| `data-size` | *(absent)* = `md`, `sm`, `lg` | Padding + font-size step; `sm` still meets 24px target size |

Axes compose freely. `danger` is a variant (visual intent), not a tone — buttons don't
take `data-tone`.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover | `:hover` (`@media (hover: hover)`) | `--wel-button-bg` shifts to derived `-hover` shade | — |
| Focus | `:focus-visible` | Global focus ring | — |
| Active | `:active` | Derived `-active` shade; optional 1px translate gated on `--wel-motion` | — |
| Disabled | `:disabled` | Reduced-contrast ink+bg pair (still ≥ 3:1 vs surface); `cursor: not-allowed` omitted (native) | Implicit via `disabled` |
| Busy | `[aria-busy="true"]` | Inline spinner replaces leading icon slot; label remains visible; pointer-events off | `aria-busy` |

`.button` on `<a>` has no `:disabled`; disabled link-buttons are out of scope (remove the
href or the button).

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-button-bg` | `var(--wel-color-accent)` for `primary`; surface/tint tokens per variant | — | Hover/active shades derive via the 05 formulas — themes set only this |
| `--wel-button-ink` | pairing partner of bg (05 pairing table) | — | |
| `--wel-button-radius` | `var(--wel-radius-control)` | — | |
| `--wel-button-padding-block` / `-inline` | `var(--wel-space-2)` / `var(--wel-space-4)` | — | Scaled by `data-size` |
| `--wel-button-border` | `transparent`; `var(--wel-color-border-strong)` for `secondary`/`ghost` | — | |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything. The button is fully realised in Core CSS: variants, states, derived
interaction colours, fluid sizing.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| None | — | — | — |

### JS enhancement

None.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** native `button` role. Icon-only: `aria-label` required.
  `aria-busy="true"` during async action; `aria-pressed` for toggle buttons (documented
  pattern using the same class).
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Enter / Space | Activate (native) |

- **Focus behaviour:** normal tab order; no trap participation.
- **Forced colors:** native `<button>` maps to `ButtonFace`/`ButtonText`; variant
  distinctions collapse (acceptable); disabled maps to `GrayText`. No
  `forced-color-adjust` overrides.
- **Reduced motion:** the active-state translate and any transition run at 0ms via
  `--wel-motion`; colour states remain (instant).
- **Increased contrast (`prefers-contrast: more`):** token-layer handled ([09](../09-accessibility.md)) — `secondary`/`ghost` borders strengthen via the border tokens; no component-specific treatment.
- **Reduced transparency (`prefers-reduced-transparency: reduce`):** None.
- **Contrast:** every `data-variant` bg/ink pairing is a guaranteed 4.5:1 pairing from
  the 05 table, in both light and dark schemes; disabled pair documented as exempt
  (WCAG 1.4.3 exception for disabled controls).
- **WCAG 2.2 implicated:** 2.5.8 Target Size — all sizes ≥ 24px block-size including
  `sm`.

## Container behaviour

None — a button is content-sized. Full-width behaviour is opt-in
(`data-fill` on the button or a `.stack` context), not container-driven. No subgrid
participation.

## Composition

May contain: text, inline SVG icons. May be contained by: anything; arranged in groups by
`.cluster`. Forbidden: interactive content inside a button (native constraint); `.button`
inside `.button`.

## Open questions

- Is `data-fill` (full-width) an axis on the button or a utility? Leaning axis, since
  it's a designer word.
- Split-button / button-with-menu: separate composite pattern doc post-Batch B
  (popover-menu dependency).

## References

Bootstrap `.btn btn-{variant} btn-{size}` — modifier soup, 9 colour variants forcing a
palette monoculture, `disabled` class for links. We differ: attribute axes
([ADR-0001](../decisions/ADR-0001-variant-syntax.md)), 5 intent variants themed by
tokens, derived interaction colours (Bootstrap enumerates every hover hex), no
link-disabling pretence.

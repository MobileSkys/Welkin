# Component: Select

| | |
|---|---|
| **Status** | Draft |
| **Tier** | Platform |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

Choose one option from a closed list, as a form value — native `<select>`, styled as far
as each tier honestly allows. Use for genuine value selection in forms. Do NOT use for
commands or navigation ([popover-menu.md](popover-menu.md)), free text with suggestions
(combobox, post-v1; `<input list>` meanwhile), or ≤ ~5 always-visible options (radio
group, [form-controls.md](form-controls.md)). `<select multiple>` is out of scope for v1
(poor UX everywhere; use a checkbox group). **This component is the safest progressive
enhancement in the toolkit: the Enhanced tier is a pure restyle, and its fallback is a
fully functional native select — nothing to break, ever.**

## Anatomy

```
┌─ trigger (.select / <select>) ──────────────┐
│  selected label            caret            │
└─────────────────────────────────────────────┘
┌─ picker (UA-native; ::picker(select) under ─┐
│  Enhanced)                                  │
│   option ✓ / option / optgroup label        │
└─────────────────────────────────────────────┘
```

Parts: trigger (the closed control: selected label + caret); picker (the dropdown list);
option; optgroup label. In Core the picker and its parts are UA-rendered; under Enhanced
they become real styleable parts (`::picker(select)`, `option`, `::picker-icon`,
`::checkmark`, `<selectedcontent>`).

## HTML structure

```html
<label class="field">
  <span>Country</span>
  <select class="select" name="country">
    <option value="">Choose…</option>
    <optgroup label="Europe">
      <option value="fr">France</option>
      <option value="de">Germany</option>
    </optgroup>
  </select>
</label>
```

Rationale: native `<select>` brings label association, form participation, full keyboard
interaction, type-ahead, correct AT mappings, and — decisively — the OS-native picker on
mobile (wheel/sheet), all free. Every JS rebuild (Select2 et al.) forfeits some of that.
Optional Enhanced-ready rich-trigger form (only when the trigger must show more than
text):

```html
<select class="select" name="assignee">
  <button><selectedcontent></selectedcontent></button>
  <option value="ada"><img src="…" alt="">Ada Lovelace</option>
  …
</select>
```

Honesty: `<button>`/`<selectedcontent>` inside `<select>` relies on the relaxed select
parser that ships alongside `base-select`; older parsers drop those wrapper elements at
parse time, degrading safely to a bare option list — but option content beyond text
(the `<img>`) also renders only under Enhanced. Recommendation: use the plain form
unless the design needs a rich trigger.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-size` | *(absent)* = `md`, `sm`, `lg` | Padding + font-size step, matching `.button`/input control heights; `sm` still ≥ 24px block-size |

One axis. Validation state is not a variant — it is the `:user-invalid` state supplied by
the platform ([form-controls.md](form-controls.md)).

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover | `:hover` (`@media (hover: hover)`) | Border → `--wel-color-border-strong` | — |
| Focus | `:focus-visible` | Global focus ring | — |
| Disabled | `:disabled` | Reduced-contrast ink/bg pair; native semantics | Implicit via `disabled` |
| Invalid | `:user-invalid` | `--wel-color-danger` border; error text via field wrapper | Error via `aria-describedby` (field pattern) |
| Open (picker) | `:open` — **Enhanced-only styling hook**; not in the 07 core vocabulary, declared here as component-specific | Caret rotates; trigger border accent | Native expanded state (UA) |
| Option selected | `option:checked` (Enhanced styling) | `::checkmark` + accent ink | Native selected state (UA) |

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-select-bg` | `var(--wel-color-surface)` | — | |
| `--wel-select-ink` | `var(--wel-color-ink)` | — | |
| `--wel-select-border` | `var(--wel-color-border-strong)` | — | |
| `--wel-select-radius` | `var(--wel-radius-control)` | — | |
| `--wel-select-padding-block` / `-inline` | `var(--wel-space-2)` / `var(--wel-space-3)` | — | Scaled by `data-size` |
| `--wel-select-caret-color` | `var(--wel-color-ink-muted)` | — | Fully honoured under Enhanced (`::picker-icon`); **Core limitation below** |
| `--wel-select-picker-bg` | `var(--wel-color-surface-raised)` | — | Enhanced only |
| `--wel-select-option-padding` | `var(--wel-space-2)` | — | Enhanced only |

## Behaviour tiers

### Core (Baseline Widely Available)

The honest Core reality, stated plainly:

- **Trigger:** fully styleable with `appearance: none` — border, radius, padding,
  typography, colours, focus ring. The custom caret is a `background-image` SVG data-URI;
  background images cannot consume `currentColor`/custom-property ink, so the Core caret
  is baked per scheme (two data-URIs swapped on `color-scheme`), approximating
  `--wel-select-caret-color` rather than consuming it. Documented limitation; resolved by
  Enhanced `::picker-icon`.
- **Picker:** UA-rendered and effectively unstylable — engines honour at most
  `color`/`background-color` on `option`, inconsistently. Policy: **treat the picker as
  native; do not attempt Core option styling.**
- **Colour-scheme correctness comes free:** `color-scheme: light dark` on `:root`
  ([ADR-0007](../decisions/ADR-0007-dark-mode-mechanism.md)) means the native picker
  renders dark in dark mode — no white-flash dropdown. This matters more than any Core
  styling trick.
- **`accent-color`:** honestly, near-irrelevant here — it drives checkbox/radio/range/
  progress, and its effect on `<select>` pickers is engine-dependent to none. Set
  globally in `base` for the controls it does affect; not part of this component's
  contract.
- Full function: keyboard, type-ahead, form participation, mobile native pickers.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| `appearance: base-select` (on `.select` **and** `.select::picker(select)`) | `@supports (appearance: base-select)` | Fully styleable in-page picker: `::picker(select)` panel gets popover-style surface tokens; `option` gets real box styling and rich content; `::picker-icon` consumes `--wel-select-caret-color`; `::checkmark` styles selection; `<selectedcontent>` mirrors the chosen option into the trigger; picker is anchored to the trigger with flip behaviour by the UA. Browser retains all keyboard/AT/form behaviour | Native select rendering — always usable (03 row). **The whole point: the fallback is not a degraded custom control, it is the platform control** |
| `@starting-style` + `transition-behavior: allow-discrete` (picker entry) | `@supports (transition-behavior: allow-discrete)` — nested inside the `base-select` block | Fade/scale picker entry | Instant picker (03 row) |

Honesty on status: `appearance: base-select` is Chromium-only at time of writing —
pre-Baseline, so per [ADR-0012](../decisions/ADR-0012-feature-graduation-criteria.md) it
enters shipped source only when all three engines ship;
[03](../03-browser-support-policy.md) already carries the contract row and this spec
defines the behaviour so intake is unblocked the day it completes. Also honest:
`base-select` does not apply to `<select multiple>` or `size > 1` (they stay native),
and the mobile OS picker is replaced by the in-page picker — a deliberate trade projects
should make knowingly (documented in the usage guide).

### JS enhancement

None. There is no select JS in Welkin and there never will be — rebuilding `<select>` in
JS is the anti-pattern this component exists to end.

## Accessibility

- **Roles/ARIA:** none added — native `<select>` exposes the correct role, value,
  states, and (under `base-select`, per spec) retains them. A visible `<label>` is
  required (the `.field` pattern); placeholder-as-label is forbidden.
- **Keyboard interaction** (all native, both tiers — inherited behaviour is still
  contract per [09](../09-accessibility.md)):

| Key | Action |
|-----|--------|
| Space / Enter / Alt+↓ | Open picker |
| ↑ / ↓ | Move through options (closed trigger: change value, engine-dependent) |
| Home / End | First / last option |
| a–z… | Type-ahead to matching option |
| Enter | Commit highlighted option |
| Esc | Close picker without committing |

- **Focus behaviour:** single tab stop; picker focus handling is the UA's. No trap
  participation.
- **Forced colors:** `@media (forced-colors: active)` reverts the trigger to
  `appearance: auto` (Core) / suppresses the `base-select` opt-in (Enhanced) — forced
  colors removes our background-image caret and backgrounds anyway, and the native
  control's `Field`/`FieldText`/`ButtonText` mappings are the correct experience. The
  one place in the toolkit where we deliberately hand rendering back wholesale.
- **Reduced motion:** picker entry transition at 0ms via `--wel-motion`; instant.
- **Contrast:** surface/ink and surface-raised/ink pairings (05 table); danger border on
  `:user-invalid` meets 3:1 non-text contrast; disabled pair documented exempt (1.4.3).
- **WCAG 2.2 criteria specifically implicated:** 2.5.8 Target Size (trigger ≥ 24px in
  all sizes), 1.4.11 Non-text Contrast (border + caret vs. surface ≥ 3:1), 4.1.2
  Name/Role/Value (native; preserved under `base-select`).

## Container behaviour

The trigger fills its field container (`inline-size: 100%` within `.field`); intrinsic
minimum ≈ `8rem`. No container breakpoints of its own — the `.field` wrapper
([form-controls.md](form-controls.md)) owns label/control stacking decisions. No subgrid
participation.

## Composition

May contain: `<option>`/`<optgroup>` (Core); additionally `<button><selectedcontent>`
wrapper and phrasing content + images inside options (Enhanced markup form). May be
contained by: the `.field` wrapper (canonical), toolbars, dialog forms. Forbidden:
interactive elements inside options; `.select` styling on JS-rebuilt listbox widgets
(the class is for real `<select>` only).

## Open questions

- Ship the Core caret as two scheme-baked data-URIs, or accept the UA arrow
  (`appearance: auto`) in Core and restyle only under `base-select`? Leaning custom
  caret — visual coherence with `.button` matters at rest — but the honest cost is the
  token-approximation caveat above.
- When `base-select` reaches intake: is the in-page picker on mobile acceptable as the
  default, or should docs recommend gating the opt-in to pointer-fine contexts?
- Does `<selectedcontent>` clone markup we would rather not duplicate (ids inside
  options)? Verify and document the footgun at implementation.

## References

Bootstrap `.form-select` is, fairly, also CSS-only — a background-image caret on
`appearance: none`, same Core reality as ours. The difference is what happens next: the
Bootstrap ecosystem's answer to styled dropdowns is Select2/Choices.js — full JS
rebuilds that discard native semantics, type-ahead fidelity, and mobile OS pickers. We
refuse that path entirely: Core styles what the platform allows and no further; the
styled picker arrives via `appearance: base-select` as a pure CSS opt-in whose fallback
is the untouched native control ([03](../03-browser-support-policy.md) contract) — the
safest progressive enhancement in the toolkit.

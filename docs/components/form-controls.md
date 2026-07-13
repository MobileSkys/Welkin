# Component: Form Controls & Field

| | |
|---|---|
| **Status** | Draft |
| **Tier** | Platform |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

Styled native form controls — text input, textarea, checkbox, radio, switch — plus the
`.field` wrapper that composes a control with its label, hint, and error text. Use for
any form data entry. Do NOT use for pick-from-a-long-list (see
[select.md](select.md)) or filtered suggestions (combobox, post-template batch). This
spec styles controls and validation states; it does **not** script validation — native
constraint validation is the engine, and custom validation logic belongs to the host
app (v1 scope decision).

## Anatomy

```
┌─ root (.field) ─────────────────────────────┐
│  label (<label>)                            │
│  ┌─ control (input | textarea | checks) ─┐  │
│  └────────────────────────────────────────┘  │
│  hint (.hint)                               │
│  error (.error)   [shown only when invalid] │
└─────────────────────────────────────────────┘
```

Parts: root (`.field`); label; control (one per field); optional hint; optional error.
For check/radio/switch fields the label follows the control on one line. Radio and
checkbox *groups* use a `<fieldset class="field">` with `<legend>` as the label part.

## HTML structure

```html
<!-- Text field with hint and error -->
<div class="field">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required
         aria-describedby="email-hint email-error">
  <p class="hint" id="email-hint">We never share it.</p>
  <p class="error" id="email-error">Enter a valid email address.</p>
</div>

<!-- Checkbox -->
<div class="field">
  <input id="tos" name="tos" type="checkbox" required>
  <label for="tos">I accept the terms</label>
</div>

<!-- Switch: a checkbox with switch semantics -->
<div class="field">
  <input id="notify" type="checkbox" role="switch" class="switch">
  <label for="notify">Email notifications</label>
</div>

<!-- Radio group -->
<fieldset class="field">
  <legend>Billing cycle</legend>
  <div class="field"><input id="m" type="radio" name="cycle"><label for="m">Monthly</label></div>
  <div class="field"><input id="y" type="radio" name="cycle"><label for="y">Yearly</label></div>
</fieldset>
```

Rationale: native controls bring focus, keyboard behaviour, form participation,
constraint validation, `:user-invalid`, forced-colors mapping, and mobile keyboards for
free. `label[for]` (never placeholder-as-label) is required — it is the accessible name
and enlarges the hit target. The error element is present in markup (its `id` is wired
into `aria-describedby`) and revealed by CSS only when the control is `:user-invalid`,
via `.field:has(:user-invalid) .error`. The **switch is a checkbox** with
`role="switch"` — same form participation and keyboard behaviour, announced as a
switch; no bespoke element.

**Native bubbles:** browsers show their own validation bubble on submit. Welkin styles
inline errors but does not suppress the bubble; a host app that implements its own
inline error messaging (JS) adds `novalidate` and takes over. Suppressing bubbles
without replacing them is an a11y regression and is documented as forbidden.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-size` | *(absent)* = `md`, `sm`, `lg` | Scales control padding, font-size step, and check/radio box; set on `.field`, inherited by the control. `sm` checks still meet 24px target size |

No `data-variant` or `data-tone` axes: validation state is expressed by the platform
(`:user-invalid`), not by an author-set attribute. Composes with `data-size` on nested
group fields (innermost wins).

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover | `:hover` (`@media (hover: hover)`) | Border shifts to `--wel-color-border-strong` | — |
| Focus | `:focus-visible` | Global focus ring | — |
| Disabled | `:disabled` | Reduced-contrast ink/bg; label dimmed via `.field:has(:disabled) label` | Implicit via semantics |
| Read-only | `:read-only` | Sunken surface, border retained (distinguishable from disabled) | Implicit via semantics |
| Invalid | `:user-invalid` | Danger-tone border + `.field:has(:user-invalid)` turns label/error danger ink and reveals `.error` | Error text via `aria-describedby` |
| Valid | `:user-valid` | Success-tone border (subtle; opt-in via `data-show-valid` on the form) | — |
| Checked | `:checked` | Accent fill (check/radio/switch); switch thumb slides to end | Implicit via semantics |
| Indeterminate | `:indeterminate` | Dash mark (checkbox only) | Implicit via semantics |

**Never bare `:invalid`** ([07 state vocabulary](../07-component-model.md)): a required
empty form is `:invalid` at page load, so bare `:invalid` paints a wall of red errors
before the user has typed a single character. `:user-invalid` fires only after
interaction (typing/blur/submit attempt), so errors appear when they are information,
not accusation. Same logic for `:user-valid`.

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-field-gap` | `var(--wel-space-1)` | — | Rhythm between label/control/hint |
| `--wel-input-bg` | `var(--wel-color-surface)` | — | |
| `--wel-input-ink` | `var(--wel-color-ink)` | — | |
| `--wel-input-border` | `var(--wel-color-border-strong)` | — | Must hold 3:1 vs surface (1.4.11) |
| `--wel-input-radius` | `var(--wel-radius-control)` | — | |
| `--wel-input-padding-block` / `-inline` | `var(--wel-space-2)` / `var(--wel-space-3)` | — | Scaled by `data-size` |
| `--wel-control-accent` | `var(--wel-color-accent)` | — | Feeds `accent-color` for checks/radios/switch |
| `--wel-field-hint-ink` | `var(--wel-color-ink-muted)` | — | |
| `--wel-field-error-ink` | `var(--wel-color-danger)` | — | Pairing vs surface from the 05 table |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything functional is Core:

- Text inputs/textarea: token-driven box styling; `:user-valid`/`:user-invalid` (Core
  per [03](../03-browser-support-policy.md)); `.field:has()` state propagation to
  label and error (Core).
- **Checks/radios/switch, the quick win:** `accent-color: var(--wel-control-accent)`
  retints native checkboxes, radios (and their forced-colors/dark-mode behaviour stays
  native). This is the default shipped path.
- **The richer path (documented pattern, still Core):** `appearance: none` fully custom
  check/radio/switch — box, mark, and motion drawn from tokens. Costs: the spec's
  forced-colors block becomes mandatory (see Accessibility) and the mark must be drawn
  in `currentColor`/borders, not background images that forced colors erase. Shipped as
  an opt-in class documented in the theming guide, not the default.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| `field-sizing: content` | `@supports (field-sizing: content)` | Textareas (and sized inputs) auto-grow with content up to a `max-block-size` | Fixed-size textarea with native manual resize handle ([03 contract](../03-browser-support-policy.md)) |

### JS enhancement

None.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** native roles throughout. Every control has a `<label for>` (or
  `<legend>` for groups). Hint and error are referenced by `aria-describedby` on the
  control — both ids are listed even while the error is hidden, so the association is
  static and the description simply materialises when the error is revealed.
  Switch: `role="switch"` on the checkbox; checked state maps to switch state
  natively. No `aria-invalid` scripting in v1: `:user-invalid` implies constraint
  validation, which ATs surface from the control's validity itself; hosts adding
  custom validation set `aria-invalid` themselves.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Move between fields (native) |
| Space | Toggle checkbox / switch (native) |
| Arrow keys | Move selection within a radio group (native roving) |
| Enter | Submit form from a text input (native) |

- **Focus behaviour:** normal tab order; no trap participation. Clicking label focuses
  its control (native).
- **Forced colors:** the `accent-color` path is fully native — `Field`/`FieldText`
  mappings, checks drawn by the UA. The `appearance: none` custom path must ship an
  `@media (forced-colors: active)` block: box border in `FieldText`, mark drawn in
  `Highlight`/`FieldText` via border/currentColor techniques, disabled in `GrayText`.
- **Reduced motion:** switch thumb slide and border-color transitions run through the
  `--wel-motion` multiplier; at `0` states change instantly.
- **Contrast:** input border ≥ 3:1 vs surface (1.4.11); error ink/surface and
  ink/bg pairings from the 05 table at 4.5:1; disabled pair exempt (1.4.3 exception).
- **WCAG 2.2 criteria specifically implicated:** 1.4.11 Non-text Contrast (control
  borders, check marks); 2.5.8 Target Size (checks/radios/switch ≥ 24px at every
  `data-size`); 3.3.1 Error Identification (error text + `aria-describedby`); 3.3.2
  Labels or Instructions (label required, placeholder never a label); 3.3.7 Redundant
  Entry (docs-level guidance, not component code).

## Container behaviour

None in v1 — a `.field` is a vertical stack at any width (label-beside-control layouts
are an open question). Sensible minimum width ~12rem; controls are
`inline-size: 100%` of the field. No subgrid participation in v1 (cross-field label
column alignment noted as an open question).

## Composition

May contain: exactly one control, plus label, hint, error; group fields
(`fieldset.field`) contain single-control fields. May be contained by: `<form>`,
`.stack` (the sanctioned way to space fields), `.sidebar-layout`/`.switcher` for
multi-column forms. Forbidden: nested `.field` except the fieldset-group pattern; two
controls in one field; interactive content inside `.hint`/`.error`.

## Open questions

- Inline label layout (`label` beside control) as a `data-layout` axis, or leave to a
  documented grid pattern?
- `aria-describedby` pointing at a hidden `.error`: AT handling of
  hidden-description targets is inconsistent; verify against the 09 testing floor
  (NVDA/VoiceOver) during Phase 1, else switch to visually-hidden-until-invalid.
- Cross-field label alignment via subgrid — worth a `data-align` opt-in on `.stack`?
- Does the `data-show-valid` opt-in for `:user-valid` styling live on the form or the
  field?

## References

Bootstrap: `.form-control`, `.form-check`, `.form-switch`, plus `.is-valid`/`.is-invalid`
classes toggled by JS and the `.was-validated` form-class dance — validation state as
class bookkeeping. We differ: platform state selectors (`:user-invalid` — no JS, no
class churn, no error walls), `:has()` field propagation instead of sibling-selector
gymnastics, `accent-color` retint instead of Bootstrap's fully repainted SVG-background
checks (which need bespoke dark-mode/forced-colors care), and switches as
`role="switch"` checkboxes rather than a purely visual `.form-switch`.

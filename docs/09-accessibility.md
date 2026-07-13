---
status: Review
depends-on: [01-vision-and-principles.md, 03-browser-support-policy.md]
---

# 09 — Accessibility

**Conformance target: WCAG 2.2 AA.** Accessibility sections in component specs are
**blocking acceptance criteria**, not advisory notes: a component that fails its a11y
section does not ship, regardless of how finished it looks.

## WCAG 2.2 additions that specifically bite toolkits

Called out because they are new and easy to miss:

| Criterion | Toolkit consequence |
|-----------|--------------------|
| 2.4.11 Focus Not Obscured | Sticky navbars/footers must not cover the focused element; scroll-padding defaults in `base` account for sticky chrome |
| 2.5.8 Target Size (Minimum) | Interactive targets ≥ 24×24 CSS px — encoded as a minimum in button/control tokens, including `data-size="sm"` |
| 2.5.7 Dragging Movements | Any drag interaction (carousel swipe) must have a non-drag alternative (buttons/markers) |
| 3.2.6 Consistent Help / 3.3.7 Redundant Entry | Pattern-level guidance in docs rather than component code |

## Focus management

- **`:focus-visible` everywhere**; never remove focus indication, never style `:focus`
  alone in a way that shows rings on mouse click.
- One system-wide focus ring driven by tokens: `--wel-focus-ring-color`,
  `--wel-focus-ring-width`, `--wel-focus-ring-offset`. Components restyle the ring only via
  these tokens, so user themes change focus treatment globally.
- Focus ring must meet 3:1 contrast against adjacent colours (WCAG 1.4.11) in every
  shipped token pairing.
- **Dialogs:** native `<dialog showModal>` provides focus trapping, `inert` backgrounding,
  and Escape handling for free — a concrete selling point of the platform-first principle.
  Specs must define initial-focus and return-focus behaviour.
- Popovers (Popover API) get light-dismiss and focus-return natively; specs state expected
  tab order out of an open popover.

## User-preference matrix

Every component must behave correctly under all of these; the spec template has a row for
each.

| Preference | System-wide mechanism |
|------------|----------------------|
| `prefers-reduced-motion: reduce` | All durations route through the `--wel-motion` multiplier token, set to `0` under the preference ([05-design-tokens.md](05-design-tokens.md)). No component writes a raw duration. Scroll-driven and view-transition effects are additionally gated off. Opacity-only fades may remain (non-vestibular). |
| `prefers-contrast: more` | Semantic border/divider tokens strengthen; low-contrast decorative tints deepen. Handled in the `tokens` layer, not per component. |
| `prefers-reduced-transparency: reduce` | Any translucent surface treatment falls back to an opaque equivalent; no shipped token pairing may rely on transparency to meet contrast. |
| `forced-colors: active` | See below. |
| `prefers-color-scheme` | Dark mode via `light-dark()` ([ADR-0007](decisions/ADR-0007-dark-mode-mechanism.md)). |

## Forced-colors mode (Windows High Contrast)

Semantic HTML pays off here: real `<button>`, `<a>`, `<input>` elements map to system
colors automatically. Policy:

- Never disable forced colors globally (`forced-color-adjust: none` only with per-case
  justification, e.g. colour swatches whose colour *is* the content).
- Components whose state is conveyed by background alone (selected tab, active page in
  pagination) must add a forced-colors-visible treatment (border/underline) —
  `@media (forced-colors: active)` blocks live alongside the component.
- System-color mappings (`Canvas`, `CanvasText`, `ButtonText`, `Highlight`, `LinkText`)
  are specified per component in its spec.

## Colour contrast policy

Contrast is guaranteed **by the token system**, not by per-use vigilance:

- Every semantic foreground/background **pairing** shipped by Welkin meets 4.5:1 (text) or
  3:1 (large text, UI components/graphics). Pairings are the unit of guarantee — the token
  doc lists valid pairings, and components consume pairings, not loose colours.
- Derived interaction shades (`color-mix()` hover/active) must stay within contrast
  bounds; derivation formulas in [05-design-tokens.md](05-design-tokens.md) are chosen so
  they do, and the pairing table records worst-case results.
- Roadmap: automated contrast checking of the shipped pairing table in CI (Phase 1 exit
  criterion in [12-roadmap.md](12-roadmap.md)).
- User re-theming can break contrast; the theming guide
  ([10-theming-and-customisation.md](10-theming-and-customisation.md)) documents which
  tokens participate in guaranteed pairings and how to re-verify.

## Keyboard interaction

- Every component spec contains a **keyboard table** (key → action), following the ARIA
  Authoring Practices Guide patterns where one exists for the component.
- Platform-primitive components inherit most keyboard behaviour (dialog: Esc; details:
  Enter/Space; popover: Esc + light dismiss) — specs still state it, because inherited
  behaviour is still contract.
- JS-enhanced components implement APG patterns in full (tabs: arrow keys + Home/End,
  roving tabindex) — this is typically *why* they are JS-enhanced
  ([08-javascript-policy.md](08-javascript-policy.md)).

## Screen reader expectations

- Testing floor per release: NVDA + Firefox (Windows), VoiceOver + Safari (macOS + iOS).
- Names/roles/values come from semantic HTML first, ARIA only to fill genuine gaps
  (first rule of ARIA). Specs list required roles/properties explicitly.
- Live-region behaviour (toasts, form errors, busy states) is specified per component;
  `aria-live` regions are created deliberately, never sprinkled.

## Sizing and zoom

rem-based sizing ([ADR-0008](decisions/ADR-0008-sizing-units-and-fluid-scales.md)) makes
browser font-size preferences and text-only zoom work structurally (WCAG 1.4.4), and
container-query layout ([ADR-0006](decisions/ADR-0006-container-query-first-responsiveness.md))
keeps 400%-zoom reflow (WCAG 1.4.10) coherent, since components adapt to their shrunken
containers the same way they adapt to narrow layouts.

# ADR-0001 — Variant syntax: single component class + data-attribute axes

**Status:** Accepted

## Context

A component needs variant axes: visual variant (primary/secondary/ghost…), size, tone.
Bootstrap expresses these as stacked modifier classes (`btn btn-outline-secondary btn-lg`),
which the vision names as an anti-goal ("letter-soup"). We need a syntax that is
designer-legible, enumerable, and safe against contradictory combinations.

## Decision

Each component is **one semantic class**; every variant axis is a **data-attribute** with
enumerated values:

```html
<button class="button" data-variant="primary" data-size="lg">Save</button>
<div class="alert" data-tone="warning">…</div>
```

```css
@layer variants {
  .button[data-variant="primary"] { … }   /* specificity 0-2-0, flat across all variants */
}
```

Rules:

- Standard axes shared across components: `data-variant` (visual style), `data-size`,
  `data-tone` (semantic colour intent). Component-specific axes are declared in the
  component's spec, which is the closed list of valid values per axis.
- Axes compose freely unless a spec says otherwise; each axis has exactly one value.
- Defaults: an absent attribute means the default variant — components must look correct
  with the bare class alone.

## Rationale

- **Mutual exclusion by construction.** `data-variant="primary"` cannot coexist with
  `data-variant="secondary"` on the same element; `class="btn-primary btn-secondary"` can,
  and Bootstrap's answer is "undefined behaviour".
- **Reads like a design spec.** Attribute name = the axis a designer names ("variant",
  "size"); value = the option. Inspectable in devtools as name/value pairs.
- **Flat specificity.** Every variant selector is class+attribute (0-2-0) inside the
  `variants` layer; no modifier-class specificity games.
- **Clean framework mapping.** A React/Vue wrapper (post-v1) maps props to attributes
  1:1 — `variant="primary"` → `data-variant="primary"`.

## Consequences

- Slightly more verbose than terse modifier classes; accepted deliberately — legibility
  over keystrokes.
- CSS attribute selectors on `data-*` perform identically to classes at real-world scale;
  no practical cost.
- Validation is possible (a lint/dev-mode script can flag unknown axis values, impossible
  with open-ended class soup).

## Alternatives considered

- **BEM modifier classes** (`.button--primary`) — familiar, but no mutual exclusion, soup
  accumulates, and `--` punctuation is exactly the "not how designers talk" aesthetic we
  reject.
- **Bootstrap-style prefixed utility-modifiers** (`btn-primary`) — the named anti-goal.
- **Separate classes per combination** (`.button-primary-lg`) — combinatorial explosion.

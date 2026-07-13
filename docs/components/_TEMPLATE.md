# Component: {Name}

| | |
|---|---|
| **Status** | Draft \| Review \| Accepted |
| **Tier** | Pure CSS \| Platform \| JS-enhanced |
| **Stability** | Experimental \| Stable |
| **Version target** | v1 \| post-v1 |

<!--
Template rules:
- Keep every section, in this order, even if a section is one line ("None." is valid).
- Tables where the template shows tables.
- The Accessibility section is a blocking acceptance criterion (09-accessibility.md).
- JS-enhanced components MUST fill the ladder justification in Behaviour tiers.
-->

## Purpose

One paragraph: what it is, when to use it, when NOT to use it (with pointers to the
component to use instead).

## Anatomy

Named parts, as a list or ASCII diagram. Part names here are the vocabulary the rest of
the spec uses.

```
┌─ root (.{name}) ─────────────┐
│ ┌─ part ──┐  ┌─ part ──────┐ │
│ └─────────┘  └─────────────┘ │
└──────────────────────────────┘
```

## HTML structure

The canonical markup — **this is the API**. Required elements/attributes; optional parts
marked. Explain the semantic-HTML rationale (why this element and not another).

```html
<!-- canonical example -->
```

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-variant` | | |
| `data-size` | | |

Composability rules: which axes combine; any forbidden combinations.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover | `:hover` | | — |
| Focus | `:focus-visible` | Global focus ring | — |
| Active | `:active` | | — |
| Disabled | `:disabled` | | Implicit via semantics |
| Invalid | `:user-invalid` | | Error text via `aria-describedby` |
| Busy | `[aria-busy="true"]` | | `aria-busy` |

(Delete rows that don't apply; add component-specific states.)

## Tokens consumed

**This table is the component's theming contract.**

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-{name}-…` | `var(--wel-…)` | — | |

## Behaviour tiers

### Core (Baseline Widely Available)

Exact behaviour with Core-tier CSS only.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| | | | |

### JS enhancement *(JS-enhanced tier only — otherwise write "None.")*

- **Ladder justification:** what rungs 1–2 cannot deliver (specifically).
- **Element/module:** `<wel-{name}>` or `[data-…]` upgrader; module path.
- **Attributes (config in):** table.
- **Events (state out):** table (`wel-…` events, bubbling, `detail` payload).
- **No-JS baseline:** the usable resting behaviour, stated concretely.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** required roles, properties, and relationships.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| | |

- **Focus behaviour:** initial focus, focus return, trap participation.
- **Forced colors:** system-color mappings; state treatments that survive
  `forced-colors: active`.
- **Reduced motion:** what the `--wel-motion: 0` experience is.
- **Contrast:** pairings consumed (from the 05 pairing table).
- **WCAG 2.2 criteria specifically implicated:** list.

## Container behaviour

`@container` breakpoints (rem) and what changes at each; sensible minimum width; subgrid
participation (yes/no/how).

## Composition

May contain / may be contained by; interaction with layout primitives; forbidden nestings.

## Open questions

- …

## References

Prior art surveyed (Bootstrap, others) and **what we do differently and why**.

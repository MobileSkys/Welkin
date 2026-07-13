# Architecture Decision Records

ADRs are the **source of truth for decisions** in this suite. Topic documents link here
and never restate the reasoning. Format: Status / Context / Decision / Consequences /
Alternatives considered.

**Status key:** `Proposed` → `Accepted` → (`Superseded by ADR-xxxx` | `Deprecated`).

| ADR | Title | Status |
|-----|-------|--------|
| [0001](ADR-0001-variant-syntax.md) | Variant syntax: single component class + data-attribute axes | Accepted |
| [0002](ADR-0002-source-format-and-build.md) | Source format: plain modern CSS, no Sass | Accepted |
| [0003](ADR-0003-distribution-and-imports.md) | Distribution: layered single bundle and per-component files | Accepted |
| [0004](ADR-0004-reset-strategy.md) | Reset: own minimal reset in `@layer reset`, zero specificity | Accepted |
| [0005](ADR-0005-class-and-token-prefixing.md) | Prefixing: unprefixed semantic classes; prefixed tokens and elements | Accepted |
| [0006](ADR-0006-container-query-first-responsiveness.md) | Container-query-first responsiveness | Accepted |
| [0007](ADR-0007-dark-mode-mechanism.md) | Dark mode: `color-scheme` + `light-dark()` on semantic tokens | Accepted |
| [0008](ADR-0008-sizing-units-and-fluid-scales.md) | Sizing: rem-based, fluid `clamp()` scales; px for hairlines only | Accepted |
| [0009](ADR-0009-logical-properties-rtl.md) | Logical properties exclusively; RTL = `dir="rtl"` | Accepted |
| [0010](ADR-0010-specificity-budget.md) | Specificity budget | Accepted |
| [0011](ADR-0011-js-delivery-mechanism.md) | JS delivery: light-DOM custom elements + data-attribute upgraders | Accepted |
| [0012](ADR-0012-feature-graduation-criteria.md) | Feature intake and graduation criteria | Accepted |

New ADRs take the next number; never renumber. A superseding ADR links both ways.

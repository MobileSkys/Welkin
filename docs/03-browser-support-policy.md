---
status: Review
depends-on: [01-vision-and-principles.md]
---

# 03 — Browser Support Policy

Welkin uses **tiered progressive enhancement**. Two tiers, both defined against the
[Baseline](https://web.dev/baseline) initiative's vocabulary:

- **Core tier** — features that are **Baseline Widely Available** (interoperable across
  all major engines for ~30 months). Everything in the Core tier works unconditionally;
  it is the toolkit's contract.
- **Enhanced tier** — features that are **Baseline Newly Available** (shipped in all three
  major engines, but recently). Enhanced features are always gated behind `@supports` (or
  equivalent detection) and always carry a written **degradation contract**.

Stance, quoted from the vision: **"functional everywhere, delightful where supported."**
We never promise pixel parity between tiers.

## Core tier — load-bearing features

These features may be used unconditionally anywhere in the codebase:

| Feature | Used for |
|---------|----------|
| Container queries (`@container`, `container-type`) | The entire responsive model ([ADR-0006](decisions/ADR-0006-container-query-first-responsiveness.md)) |
| `:has()` | Parent/state-aware styling (navbar state, form field wrappers) |
| Native CSS nesting | Source authoring ([ADR-0002](decisions/ADR-0002-source-format-and-build.md)) |
| Cascade layers (`@layer`) | The architecture spine ([04-css-architecture.md](04-css-architecture.md)) |
| `@property` | Typed, animatable tokens ([05-design-tokens.md](05-design-tokens.md)) |
| `<dialog>` | Modal/non-modal dialogs, free focus trapping |
| Popover API (`popover`, `popovertarget`) | Dropdowns, menus, tooltips |
| `color-mix()` | Derived interaction colour scales |
| `oklch()` | All primitive colours |
| Subgrid | Aligned card-grid internals |
| `:user-valid` / `:user-invalid` | Form validation styling that waits for interaction |
| `text-wrap: balance` | Heading typography |
| `clamp()`, logical properties, `aspect-ratio`, `gap`, `:focus-visible`, `prefers-*` media queries | Long-established; listed for completeness |

## Enhanced tier — gated features and degradation contracts

Every Enhanced feature has a contract: what the fallback experience is when the feature is
absent. Component specs that use an Enhanced feature must reference the contract row here
(or extend it with component-specific detail).

| Feature | Enhancement | Degradation contract (fallback experience) |
|---------|-------------|--------------------------------------------|
| CSS anchor positioning | Popovers/menus/tooltips tethered to their trigger with flip/slide | Popover centres via default popover positioning or fixed placement below trigger; fully functional, less elegant placement |
| `@starting-style` + `transition-behavior: allow-discrete` | Entry/exit transitions for dialogs, popovers, toasts | Elements appear/disappear instantly; no animation |
| `interpolate-size` / `::details-content` | Smooth accordion open/close animation | Accordion opens/closes instantly |
| Scroll-driven animations (`animation-timeline`) | Scroll progress bars, reveal-on-scroll effects | Effects simply absent; content static and fully readable |
| View transitions (same-document) | Cross-state morph animations (tabs indicator, toast stack) | Instant state change. Cross-engine since Firefox shipped View Transitions Level 1 |
| Cross-document view transitions (`@view-transition`) | **Opt-in module** `components/view-transitions.css` (never bundled): same-origin MPA navigations cross-fade and `--wel-vt`-named elements morph — full effect in Chrome 126+ / Safari 18.2+ | Firefox (View Transitions Level 1 only, same-document) ignores the unknown at-rule: instant navigation, fully functional. Additive by nature — no `@supports` gate exists for an at-rule, and none is needed |
| `field-sizing: content` | Auto-growing textareas/inputs | Fixed-size textarea with manual resize handle |
| `light-dark()` | Single-declaration dual-mode colour tokens | See [ADR-0007](decisions/ADR-0007-dark-mode-mechanism.md) — treated as core-eligible pending graduation audit; static light fallback if audit fails |
| `::scroll-marker` / `::scroll-button` | CSS-only carousel markers and prev/next buttons | Carousel remains a scroll-snap scroller; navigation by swipe/scrollbar only, or JS-enhanced buttons |
| `appearance: base-select` | Fully styleable `<select>` with rich options | Native select rendering — always usable |
| `<details name>` exclusive grouping | Single-open accordion groups with no JS | Browsers ignoring `name` render independent `<details>` — multiple panels may be open at once; fully functional (additive by nature: no `@supports` gate exists for HTML attributes) |
| Style queries (`@container style(…)`) | Context-aware component variants (e.g. auto-invert on dark surface) | Component keeps its explicit variant; context awareness absent |

> **Opt-in modules — a narrow third lane.** A feature *below* Newly Available may
> still ship when all three hold: (1) it is distributed **only** as an à-la-carte
> file that no bundle includes, so linking the file is an explicit, revocable
> opt-in; (2) its absence degrades additively with no possible `@supports` gate
> (an unknown at-rule/pseudo-class is ignored wholesale); (3) its spec documents
> the engines honestly. Cross-document view transitions (T-89) is the first and
> only occupant. Opt-in modules still follow the ADR-0012 review cadence — the
> row above graduates into the normal Enhanced tier when Firefox ships Level 2.

> **Baseline-status audit note.** The tier assignments above reflect the state of
> Baseline at the time of writing; several rows (anchor positioning, `interpolate-size`,
> `appearance: base-select`, `::scroll-marker`/`::scroll-button`, `<details name>`
> grouping) sit near the Newly Available boundary and engines move. Before Phase 1
> implementation begins — and at every minor release thereafter
> ([ADR-0012](decisions/ADR-0012-feature-graduation-criteria.md)) — each row must be
> re-verified against live Baseline data. A feature that has not yet reached Newly
> Available in all three engines is **design-approved but implementation-blocked**: its
> spec sections stand, its CSS may not ship until it passes intake. Component specs note
> per-feature status honestly where they use these rows.

## `@supports` strategy

1. **Gate on the specific feature you use**, never a proxy:
   `@supports (anchor-name: --x)`, not "modern browser" sniffing.
2. **Enhanced rules must never change layout-critical behaviour.** An `@supports` block may
   add motion, tethering, or polish; it must not move content in ways that change meaning
   or reachability. If removing the block would break a task, the feature is being misused.
3. **Additive only.** Never `@supports not (…)` to *remove* core behaviour; fallbacks are
   the unwrapped default, enhancements are the wrapped addition.
4. Enhanced JS behaviour follows the same rule via `CSS.supports()` — JS must detect and
   yield when the CSS enhancement is present
   (see [08-javascript-policy.md](08-javascript-policy.md)).

## Feature lifecycle

Governed by [ADR-0012](decisions/ADR-0012-feature-graduation-criteria.md):

- **Intake:** a platform feature may enter the Enhanced tier once it is Baseline Newly
  Available (shipped in all three engines).
- **Graduation:** an Enhanced feature loses its `@supports` wrapper (becomes Core) when it
  reaches Baseline Widely Available **and** a release-time audit of real-world support data
  confirms no layout-critical fallback population remains. Graduation ships in a minor
  release and changes no behaviour — it only removes the wrapper.
- **Review cadence:** every minor release.

## Testing matrix

| Browser | Versions tested |
|---------|-----------------|
| Chrome | Latest 2 stable |
| Edge | Latest 2 stable |
| Firefox | Latest 2 stable |
| Safari (macOS) | Latest 2 |
| Safari (iOS) | Latest 2 |

Below the Core baseline (browsers lacking Widely Available features): **declared
unsupported.** No polyfills, no fallback engineering. The reset and semantic HTML mean
content remains readable there, but no support commitment exists.

## No-JS behaviour

Orthogonal to the tiers and non-negotiable: every component is usable with JavaScript
disabled ([01-vision-and-principles.md](01-vision-and-principles.md), headline promise).
Tier fallbacks and no-JS fallbacks are documented separately in each component spec.

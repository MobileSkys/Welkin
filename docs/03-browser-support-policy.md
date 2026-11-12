---
status: Accepted
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

> **Status source.** Baseline statuses and dates on this page are from the
> [web-features](https://github.com/web-platform-dx/web-features) npm package
> **3.46.0** (`data.json`, queried 2026-11-12), the same data webstatus.dev serves.
> "Widely on *date*" for a feature still at Newly is low date + 30 months, the
> web-features rule. Usage figures are from the 1.4.0 re-audit (board doc D-14):
> caniuse-db 1.0.30001826 where a caniuse id exists, otherwise D-14's derivation from
> MDN browser-compat-data 8.1.9 first-versions x caniuse per-version global share.

## Core tier — load-bearing features

These features may be used unconditionally anywhere in the codebase:

| Feature | Used for | Baseline status (web-features id) |
|---------|----------|-----------------------------------|
| Container queries (`@container`, `container-type`) | The entire responsive model ([ADR-0006](decisions/ADR-0006-container-query-first-responsiveness.md)) | Widely since 2025-08-14 (`container-queries`) |
| `:has()` | Parent/state-aware styling (navbar state, form field wrappers) | Widely since 2026-06-19 (`has`) |
| Native CSS nesting | Source authoring ([ADR-0002](decisions/ADR-0002-source-format-and-build.md)) | Widely since 2026-06-11 (`nesting`) |
| Cascade layers (`@layer`) | The architecture spine ([04-css-architecture.md](04-css-architecture.md)) | Widely since 2024-09-14 (`cascade-layers`) |
| `@property` | Typed, animatable tokens ([05-design-tokens.md](05-design-tokens.md)) | **Newly in Core** — Newly since 2024-07-09, Widely on 2027-01-09 (`registered-custom-properties`); see note below |
| `<dialog>` | Modal/non-modal dialogs, free focus trapping | Widely since 2024-09-14 (`dialog`) |
| Popover API (`popover`, `popovertarget`) | Dropdowns, menus, tooltips | **Newly in Core** — Newly since 2025-01-27, Widely on 2027-07-27 (`popover`); see note below |
| `color-mix()` | Derived interaction colour scales | Widely since 2025-11-09 (`color-mix`) |
| `oklch()` | All primitive colours | Widely since 2025-11-09 (`oklab`, "Oklab and OkLCh") |
| Subgrid | Aligned card-grid internals | Widely since 2026-03-15 (`subgrid`) — **still `@supports`-wrapped on purpose**; see note below |
| `:user-valid` / `:user-invalid` | Form validation styling that waits for interaction | Widely since 2026-05-02 (`user-pseudos`) |
| `text-wrap: balance` | Heading typography | **Newly in Core** — Newly since 2024-05-13, Widely on 2026-11-13 (`text-wrap-balance`); see note below |
| `clamp()`, logical properties, `aspect-ratio`, `gap`, `:focus-visible`, `prefers-*` media queries | Long-established; listed for completeness | Widely since 2024-09-14 or earlier (`min-max-clamp`, `logical-properties`, `aspect-ratio`, `flexbox-gap`, `focus-visible`, `prefers-reduced-motion`, `prefers-color-scheme`) |

> **Newly-in-Core exceptions.** Three Core rows are not yet Widely Available. They stay
> in Core, used ungated, because each is load-bearing in a way an `@supports` gate cannot
> honestly fence, and the population lacking it is already below the Core floor for
> other reasons:
>
> - **Popover API** — Newly since 2025-01-27 (Chrome 116, Firefox 125, Safari 17; iOS
>   18.3); ~93.5% global usage (D-14, derived). Menus, dropdowns and tooltips are built on
>   it; there is no non-popover markup path to fall back to, so a gate would only hide
>   the menus. Honest gap: engines that meet every Widely row but predate popover
>   (e.g. Firefox 121–124) get menus that do not open. Accepted at the Core floor.
> - **`@property`** — Newly since 2024-07-09 (Chrome 85, Firefox 128, Safari 16.4);
>   ~95.7% global usage (D-14, derived). The typed-token system
>   ([05-design-tokens.md](05-design-tokens.md), [ADR-0007](decisions/ADR-0007-dark-mode-mechanism.md))
>   is defined by registration, and other contracts (relative colour, `light-dark()`)
>   fall back *to* `@property` initial values, so it cannot itself sit behind a gate.
>   Without it, tokens behave as untyped custom properties and those typed fallbacks
>   are lost.
> - **`text-wrap: balance`** — Newly since 2024-05-13 (Chrome 114, Firefox 121,
>   Safari 17.5); caniuse `css-text-wrap-balance` 89.33% full + 4.56% partial
>   (2026-11-11). Additive by nature: an engine without it wraps headings greedily.
>   Becomes Widely on 2026-11-13, so this exception expires with the 1.4.0 release.
>
> Each exception is re-checked at every minor release and disappears when the feature
> reaches Widely. No new Newly-in-Core exception may be added without a row here.

> **Subgrid keeps its gate.** Subgrid is Core (Widely since 2026-03-15; caniuse
> `css-subgrid` 94.68%), yet `src/layout/grid.css` still wraps
> `.grid[data-align="rows"]` in `@supports (grid-template-rows: subgrid)`. This is
> intentional and layout-critical: without subgrid, the `grid-row: span 3` rule would
> interleave cards across three outer rows. Inside the gate the whole rule drops and
> cards stay self-sized. ADR-0012 graduation condition (2) (no population for which the
> fallback is layout-critical) is exactly the case the wrapper protects, so it stays
> until that population is gone, even though the feature itself is Core.

## Enhanced tier — gated features and degradation contracts

Every Enhanced feature has a contract: what the fallback experience is when the feature is
absent. Component specs that use an Enhanced feature must reference the contract row here
(or extend it with component-specific detail).

| Feature | Enhancement | Degradation contract (fallback experience) | Baseline status (web-features 3.46.0) |
|---------|-------------|--------------------------------------------|---------------------------------------|
| CSS anchor positioning | Popovers/menus/tooltips tethered to their trigger with flip/slide | Popover centres via default popover positioning or fixed placement below trigger; fully functional, less elegant placement | Feature-level Limited (only `position-visibility: anchor-valid`/`anchor-visible`, unused here, lack Firefox). The keys Welkin uses are Newly since 2026-01-13 (Firefox 147); `position-anchor` per-key since 2026-09-14 |
| `@starting-style` + `transition-behavior: allow-discrete` | Entry/exit transitions for dialogs, popovers, toasts | Elements appear/disappear instantly; no animation | Newly since 2024-08-06 |
| `interpolate-size` / `::details-content` | Smooth accordion open/close animation | Accordion opens/closes instantly | `::details-content` Newly since 2025-09-16; `interpolate-size` Limited (Chrome only) and **not shipped** |
| Scroll-driven animations (`animation-timeline`) | Scroll progress bars, reveal-on-scroll effects (`.reveal` image utility), `.parallax` image drift | Effects simply absent; content static and fully readable. The `.reveal` hidden start state exists **only inside** the `@supports` gate, so no engine ever holds content at `opacity: 0`; `.parallax` keeps its headroom scale inside the same gate, so the fallback image is unscaled and motionless | Newly since 2026-10-27 (Chrome 115, Firefox 159, Safari 26) |
| `backdrop-filter` | `.frosted-caption` glass caption bars (blur+saturate over a translucent scrim) | Ungated near-solid surface scrim — caption text stays readable over any image; only the glass look is absent | Newly since 2024-09-16 |
| `clip-path: shape()` | `.organic-frame` blob/arch/scallop image crops | Ungated `border-radius` approximations (blob/arch analogues, plain rounded crop for scallop); the fallback radius is zeroed inside the `@supports` gate so the clips never intersect | Newly since 2026-02-24 |
| Relative colour syntax (`oklch(from …)`) | Derived interaction shades (typed tokens) and `.duotone` endpoints | Typed tokens fall back to their `@property` initial values (static light palette, ADR-0007); the untyped duotone endpoints invalidate at computed-value time, so overlays go transparent and the image renders desaturated-only — readable | Newly since 2024-09-16 |
| View transitions (same-document) | Cross-state morph animations (tabs indicator, toast stack) | Instant state change. Cross-engine since Firefox shipped View Transitions Level 1 | Newly since 2025-10-14 |
| Cross-document view transitions (`@view-transition`) | **Opt-in module** `components/view-transitions.css` (never bundled): same-origin MPA navigations cross-fade and `--wel-vt`-named elements morph — full effect in Chrome 126+ / Safari 18.2+ | Firefox (no cross-document navigation transitions in stable) ignores the unknown at-rule: instant navigation, fully functional. Additive by nature — no `@supports` gate exists for an at-rule, and none is needed | **Limited** — Firefox Nightly only (BCD 8.1.9 `preview`); opt-in lane, see below |
| `field-sizing: content` | Auto-growing textareas/inputs | Fixed-size textarea with manual resize handle | Newly since 2026-06-16 |
| `::scroll-marker` / `::scroll-button` | CSS-only carousel markers and prev/next buttons | Carousel remains a scroll-snap scroller; navigation by swipe/scrollbar only, or JS-enhanced buttons | Limited (Chrome only) — **not shipped** in CSS; JS only detects it to yield |
| `appearance: base-select` | Fully styleable `<select>` with rich options | Native select rendering — always usable | Limited (Chrome 135, Safari 27; Firefox behind a flag) — **not shipped** |
| `<details name>` exclusive grouping | Single-open accordion groups with no JS | Browsers ignoring `name` render independent `<details>` — multiple panels may be open at once; fully functional (additive by nature: no `@supports` gate exists for HTML attributes) | Newly since 2024-09-03 |
| Style queries (`@container style(…)`) | Context-aware component variants (e.g. auto-invert on dark surface) | Component keeps its explicit variant; context awareness absent | Newly since 2026-05-19 |
| Alternative text for generated content (`content: "x" / ""`) | Breadcrumb separators (`breadcrumb.css`) and table sort arrows (`table.css`) are declared empty for assistive tech, gated `@supports (content: "a" / "b")` | The ungated plain `content` glyph stands: visually identical, but a screen reader may announce the separator or arrow glyph. Table sort state is still announced via `aria-sort`; nothing becomes unreachable | Newly since 2024-07-09, Widely on 2027-01-09 (`alt-text-generated-content`); ~95.1% usage (D-14). Graduation candidate at the first minor on or after 2027-01-09 |
| Invoker commands (`commandfor` / `command`) | Declarative dialog and popover open/close (`show-modal`, `close`, `request-close`, `toggle-popover`) with no script; `wel-dialog.js` yields where the browser supports them natively | The existing behaviour, unchanged: the Core inline script / `wel-dialog` module opens and closes the dialog as before, and with neither JS nor invoker support the dialog cannot open, which is the already-documented no-JS gap. HTML attributes cannot be `@supports`-gated, so detection is in JS (`'command' in HTMLButtonElement.prototype`); engines without invokers simply ignore the attributes (additive by nature) | Newly since 2025-12-12 (`invoker-commands`: Chrome 135, Firefox 144, Safari 26.2) |
| `sibling-index()` / `sibling-count()` | Staggered entry delays for the toast stack, popover menu items and `.reveal` groups (`transition-delay` / `animation-delay` scaled by sibling index and the `--wel-motion` multiplier) | Items enter together, with no stagger. Engines without the functions drop the declaration (at parse time, or as invalid at computed-value time when it sits behind `var()`), so the delay resolves to its unstaggered value. Motion-only, never layout; zeroed under reduced motion via `--wel-motion` | Newly since 2026-08-18 (`sibling-count`, which covers both functions: Chrome 138, Firefox 154, Safari 26.2) |
| `:open` pseudo-class | Select caret rotation while the picker is open | Static caret; the native expanded state is unchanged. An unknown pseudo-class invalidates its whole rule, so `:open` must live in its own rule (never in a selector list with Core selectors) or behind `@supports selector(:open)` | Newly since 2026-05-11 (`open-pseudo`: Chrome 133, Firefox 136, Safari 26.5) |

> **Opt-in modules — a narrow third lane.** A feature *below* Newly Available may
> still ship when all three hold: (1) it is distributed **only** as an à-la-carte
> file that no bundle includes, so linking the file is an explicit, revocable
> opt-in; (2) its absence degrades additively with no possible `@supports` gate
> (an unknown at-rule/pseudo-class is ignored wholesale); (3) its spec documents
> the engines honestly. Cross-document view transitions (T-89) is the first and
> only occupant; its `data-vt-image` morph treatment (T-109) rides inside it on
> Level 2 `view-transition-class` (itself Newly since 2025-10-14, Firefox 144) with
> the same additive posture (unknown selector/property drop wholesale). Opt-in modules
> still follow the ADR-0012 review cadence — the row above graduates into the normal
> Enhanced tier when Firefox ships **cross-document view transitions in stable**: the
> `@view-transition { navigation: auto; }` at-rule (web-features
> `cross-document-view-transitions` reaching Newly; Firefox is Nightly-only as of
> BCD 8.1.9, [bugzil.la/1860854](https://bugzil.la/1860854)). Firefox's other Level 2
> pieces (`view-transition-class`, `:active-view-transition`) have already shipped and
> are not the gate.

> **Experimental lane — additive paint-only properties.** Per the
> [ADR-0012 amendment of 2026-11-12](decisions/ADR-0012-feature-graduation-criteria.md#amendment-2026-11-12--experimental-lane)
> (decided by Phil, board Q-98), a property below Newly Available may ship **ungated in
> the main bundle** only when **all** hold: (1) it is purely additive, so its absence is
> indistinguishable from the property being unset; (2) it reshapes paint only, never
> layout or reachability; (3) the utility is marked **Experimental** and semver-exempt in
> its spec; (4) the spec lists the engines honestly; (5) it is reviewed at every minor
> release and promoted to a normal Enhanced row when it reaches Newly Available. Current
> occupants:
>
> | Property | Utility | Engines (stable, BCD 8.1.9 / web-features 3.46.0) | Degradation contract |
> |----------|---------|------------------------------------------|----------------------|
> | `corner-shape` | `.squircle` superellipse corners | Limited: Chrome 139; Safari 27.3 **beta**; Firefox Nightly only | Plain round corners at the same radius — `corner-shape` only reshapes how `border-radius` corners draw; engines without it drop the unknown property |
> | `object-view-box` | `.view-crop` in-source art-direction crops | Limited: Chrome 104; Safari 27.3 **beta**; Firefox not implemented | Full uncropped image — engines without it drop the unknown property at parse time, and the paired ungated `object-fit: cover` is a no-op at the image's natural ratio |

> **Baseline-status audit note.** Every row above is re-verified against live Baseline
> data at every minor release ([ADR-0012](decisions/ADR-0012-feature-graduation-criteria.md));
> the 1.4.0 re-audit is board doc D-14 (2026-11-12). Outside the opt-in and
> Experimental lanes, a feature that has not yet reached Newly Available in all three
> engines is **design-approved but implementation-blocked**: its spec sections stand,
> its CSS may not ship until it passes intake. Rows above marked Limited and **not
> shipped** (`interpolate-size`, `::scroll-marker`/`::scroll-button`,
> `appearance: base-select`) are in that state. Component specs note per-feature status
> honestly where they use these rows.

## Graduated features (archive)

Rows that left the Enhanced table under ADR-0012 graduation. Kept for the historical
contract. Both 1.4.0 graduations were already ungated (additive by nature), so
graduation removes no wrapper and changes **no `src/`** file; it is a records change only.

| Feature | Graduated | Evidence | Former contract |
|---------|-----------|----------|-----------------|
| `mask-image` / `mask-composite` (`.edge-fade`, `.textured`) | 1.4.0 | Widely since 2026-06-07 (`masks`: Chrome 120, Firefox 53, Safari 15.4); caniuse `css-masks` 94.42% full + 2.98% partial (2026-11-11). Fallback is never layout-critical | Unfaded / unmasked image — additive by nature, shipped ungated |
| `light-dark()` | 1.4.0 | Newly since 2024-05-13, so **Widely on 2026-11-13**; 1.4.0 ships on or after that date, so it is Widely at release. ~91.5% usage (D-14, derived; no caniuse id). Fallback is colour-only, never layout-critical | Typed tokens fall back to their `@property` initial values (static light palette, [ADR-0007](decisions/ADR-0007-dark-mode-mechanism.md)) — shipped ungated as core-eligible since Phase 1 |

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
- **Experimental lane:** narrow exception to intake for additive, paint-only properties
  (ADR-0012 amendment 2026-11-12; see the lane note above).
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

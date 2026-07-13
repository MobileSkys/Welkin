---
status: Review
depends-on: [01-vision-and-principles.md, 03-browser-support-policy.md]
---

# 04 — CSS Architecture

The technical spine. Decisions referenced here are argued in their ADRs; this document
shows how they compose.

## Cascade layer plan

Every Welkin style lives in a named cascade layer. The order declaration — **which is
public API; reordering is a breaking change** — is:

```css
@layer reset, tokens, base, layout, components, variants, states, utilities, overrides;
```

| Layer | Contents | Notes |
|-------|----------|-------|
| `reset` | The ~40-line zero-specificity reset | [ADR-0004](decisions/ADR-0004-reset-strategy.md) |
| `tokens` | All custom property definitions and `@property` registrations | [05-design-tokens.md](05-design-tokens.md) |
| `base` | Opinionated element defaults (typography, links, form elements) — the "classless-ish" experience | No class selectors here |
| `layout` | Layout primitives (`.stack`, `.grid`, …) | [06-layout-system.md](06-layout-system.md) |
| `components` | Component structure and default appearance | Max specificity 0-1-0 ([ADR-0010](decisions/ADR-0010-specificity-budget.md)) |
| `variants` | `data-variant` / `data-size` / `data-tone` rules | After `components` so variants win without specificity |
| `states` | `:disabled`, `:user-invalid`, `[aria-*]`, `:focus-visible` treatments | **After `variants`** so a disabled primary button is disabled first, primary second — no specificity hacks |
| `utilities` | The small utility garnish layer | Only layer where `!important` is permitted |
| `overrides` | **Empty. Reserved for users.** | A named home for user layer-ordered overrides |

Two user-facing consequences to document loudly (they are features):

1. **Unlayered user CSS beats everything.** The cascade places unlayered styles above all
   layers, so a user's plain stylesheet overrides any Welkin rule with any selector — no
   `!important`, no specificity war.
2. Users who *want* to participate in the layer system can put styles in
   `@layer overrides` and still beat all Welkin layers while keeping their own code layered.

## Naming convention

Per [ADR-0001](decisions/ADR-0001-variant-syntax.md):

- **One semantic class per component**, named as the design vocabulary: `.button`,
  `.card`, `.navbar`. Unprefixed ([ADR-0005](decisions/ADR-0005-class-and-token-prefixing.md)).
- **Variant axes as data-attributes:** `data-variant`, `data-size`, `data-tone`, plus
  component-specific axes declared in the component's spec.

```html
<button class="button" data-variant="primary" data-size="lg">Save</button>
```

```css
@layer variants {
  .button[data-variant="primary"] { background: var(--wel-button-bg-primary); }
}
```

- Named **parts** inside a component use nested element selectors or, where an element
  isn't distinctive, a part class named `{component}-{part}` (`.card-header`). No BEM
  punctuation.

## Scoping strategy

- Components style their internals **via nesting under the component class**. No component
  rule may reach outside its root.
- **No global element selectors outside `base`.** If `.card h2` needs styling it is
  written nested inside `.card`, in the `components` layer.
- `reset` and `base` wrap selectors in `:where()` where any specificity would otherwise
  accumulate.
- Component-to-component styling is forbidden (a `.card` must not restyle a `.button`
  inside it); composition happens through tokens — a card may set
  `--wel-button-bg` for its subtree, never select `.button` directly. The subgrid
  exceptions are named in [06-layout-system.md](06-layout-system.md).

## Specificity budget

Per [ADR-0010](decisions/ADR-0010-specificity-budget.md): `components` ≤ 0-1-0; `variants`
≤ 0-2-0 (class + attribute); `states` ≤ 0-2-0; no IDs anywhere; `!important` only in
`utilities`. The layer system, not specificity, carries all ordering intent.

## Source tree and file organisation

```
src/
  layers.css              # the @layer order declaration, nothing else
  reset.css
  tokens/
    color.css  type.css  space.css  radius-border-shadow.css  motion.css  focus-ring.css
  base/
    typography.css  forms.css  media.css  tables.css
  layout/
    stack.css  cluster.css  sidebar.css  switcher.css  grid.css  center.css  cover.css  frame.css
  components/
    button.css  card.css  …           # one file per component
  utilities.css
js/
  wel-tabs.js  wel-toast.js  …          # one ESM module per JS-enhanced component
```

**Every source file is a valid standalone stylesheet**: each begins with the full
`@layer` order declaration (identical string, enforced by lint) and then opens only the
layers it populates. Because layer order is fixed by first declaration, any subset of
files concatenates correctly **in any order** — this is what makes per-component
distribution ([ADR-0003](decisions/ADR-0003-distribution-and-imports.md)) safe.

## Authoring conventions (lint-enforced)

| Rule | Enforcement |
|------|-------------|
| Nesting depth ≤ 3 | stylelint `max-nesting-depth` |
| Logical properties only ([ADR-0009](decisions/ADR-0009-logical-properties-rtl.md)) | stylelint plugin; physical props need a justifying comment |
| rem-based sizing, px only for hairlines ([ADR-0008](decisions/ADR-0008-sizing-units-and-fluid-scales.md)) | stylelint `declaration-property-unit-allowed-list` |
| No IDs, no `!important` outside `utilities` | stylelint |
| Every file starts with the canonical `@layer` order line | custom lint |
| Property order: layout → box → typography → visual → motion | stylelint `order` |
| Enhanced-tier features only inside `@supports` ([03-browser-support-policy.md](03-browser-support-policy.md)) | build-time browser-target check (Lightning CSS) |

## The reset, line by line

Implemented at [`src/reset.css`](../src/reset.css), which is itself the annotated
line-by-line documentation (source = shippable, ADR-0002). Scope, fixed by
[ADR-0004](decisions/ADR-0004-reset-strategy.md):

- `box-sizing: border-box` on everything including generated content;
- universal margin trimming (spacing belongs to `.stack`, not element defaults) — with
  `margin: auto` restored on `dialog`/`[popover]`, whose UA centring against `inset: 0`
  is layout, not flow rhythm (found at T-40/T-41: a zero-margin top-layer element pins
  to the viewport corner);
- root `line-height: 1.5` + `-webkit-text-size-adjust: 100%` (justified physical/vendor
  exception, [ADR-0009](decisions/ADR-0009-logical-properties-rtl.md));
- `scroll-behavior: smooth` gated on `prefers-reduced-motion: no-preference` directly —
  the `--wel-motion` multiplier cannot zero a discrete keyword, so the preference is the
  gate (additive rule, [03](03-browser-support-policy.md));
- `scroll-padding-block-start` fed by `--wel-navbar-block-size` (2.4.11 companion);
- media defaults (`display: block; max-inline-size: 100%; block-size: auto`);
- `font: inherit` on form controls;
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs,
  `overflow-wrap: break-word` on both.

Every selector is `:where()`-wrapped: the whole layer is zero-specificity.

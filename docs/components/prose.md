# Component: Prose

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

A wrapper that applies full editorial typography to long-form, element-only content —
rendered Markdown, CMS output, documentation bodies — where authors control the text but
not the markup's classes. Use it around any block of "writing". Do NOT use it around
application UI: forms, toolbars, card grids and other componentry get their rhythm from
layout primitives, and wrapping them in `.prose` invites element styling they don't want.

**Relationship to the `base` layer:** `base` styles elements *lightly, everywhere* — the
classless-ish experience: sensible link colours, form-control inheritance, balanced
headings ([04](../04-css-architecture.md)). It deliberately stops short of editorial
rhythm, because opinionated inter-element spacing on every `<p>` in an application is
wrong more often than right. `.prose` is where the full opinion lives: measure, vertical
rhythm, heading scale relationships, list/quote/code/table/figure treatment. `base` makes
elements *presentable*; `.prose` makes a document *composed*.

## Anatomy

```
┌─ root (.prose) ──────────────────────────────┐
│  h1–h6 · p · ul/ol/dl · blockquote · pre/code│
│  table · figure/figcaption · img · hr · a …  │
│  (descendant elements — no part classes)     │
└──────────────────────────────────────────────┘
```

Parts: the root class and the HTML elements themselves. **This is the one component where
descendant element selectors are the API** — the whole point is styling markup that
carries no classes. There are no `.prose-*` part classes.

## HTML structure

```html
<article class="prose">
  <h1>Container queries change the question</h1>
  <p>Components should respond to the space they are given…</p>
  <h2>The doctrine</h2>
  <ul>
    <li>Respond to the container, never the viewport.</li>
  </ul>
  <blockquote><p>Functional everywhere, delightful where supported.</p></blockquote>
  <pre><code>@container (inline-size > 30rem) { … }</code></pre>
</article>
```

Rationale: the root is whatever element the content region already is (`<article>`,
`<section>`, `<div>`) — the class adds no semantics and requires none.

**The `:where()` specificity discipline:** every descendant rule is written
`.prose :where(h2)`, `.prose :where(ul li)`, etc. The `:where()` wrapper zeroes the
descendant part, so **every prose rule has exactly the specificity of the class alone
(0-1-0)** — the `components`-layer budget ([ADR-0010](../decisions/ADR-0010-specificity-budget.md)).
Consequences, both deliberate: a user overrides any prose treatment with a single class
selector, no specificity war; and any *component* placed inside `.prose` (a callout in an
article) beats the prose element rules with its own class rules by normal layer/order
behaviour — prose styling never "reaches into" componentry with accumulated specificity.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| None | — | No variant axes in v1; density and scale are theme/token territory (see Open questions) |

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover (links) | `a:hover` (nested; `@media (hover: hover)`) | Underline thickens / ink deepens per `base` link treatment | — |
| Focus (links) | `:focus-visible` | Global focus ring | — |
| Current (in-page nav targets) | `:target` | Scroll-margin from `base`; optional heading highlight | — |

Prose itself is non-interactive; these are the states of elements inside it.

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-prose-measure` | `var(--wel-text-measure)` | — | Max line length (`ch`-based); applied to the root's text content |
| `--wel-prose-gap` | `var(--wel-space-4)` | — | Base inter-block rhythm (paragraph spacing); other gaps derive from it |
| `--wel-prose-heading-gap` | `calc(var(--wel-prose-gap) * 2)` | — | Space *above* headings; below stays at the base gap — headings bind to what follows |
| `--wel-prose-ink` | `var(--wel-color-ink)` | — | Captions/metadata use `--wel-color-ink-muted` directly |
| `--wel-prose-code-bg` | `var(--wel-color-surface-sunken)` | — | Inline code and `pre` blocks |
| `--wel-prose-quote-accent` | `var(--wel-color-border-strong)` | — | Blockquote inline-start rule |
| `--wel-prose-rule` | `var(--wel-color-border)` | — | `hr`, table row rules |

Type sizes come straight from the fluid scale (`--wel-text-size--1 … -6`,
[05](../05-design-tokens.md)) — no prose-local sizes; the heading hierarchy maps h1→size-5
… h6→size-0, body→size-0, small print→size--1.

## Behaviour tiers

### Core (Baseline Widely Available)

Everything: measure cap, rhythm, heading scale, lists, blockquotes, code blocks
(`--wel-text-font-mono`, `overflow-x: auto`), tables (hairline rules, `th` alignment
inherited from content), figures with muted captions, `text-wrap: balance` on headings
(Core per [03](../03-browser-support-policy.md); `text-wrap: pretty` on paragraphs comes
from the reset).

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| None | — | — | — |

### JS enhancement

None.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** none — prose is semantics-transparent; the content's own elements carry
  everything. Heading-level hierarchy is the content author's responsibility (the CMS
  pipeline's, in practice); prose styles levels, it cannot repair a broken outline.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Reaches links within the content (native) |
| Enter | Follows the focused link (native) |

- **Focus behaviour:** normal document order. `:target` headings respect the
  `scroll-padding` sticky-chrome companion rule from `base` (2.4.11 Focus Not Obscured).
- **Forced colors:** fully native — semantic elements map to `CanvasText`/`LinkText`;
  code-block and blockquote tints vanish but their borders/indentation survive.
- **Reduced motion:** none shipped; smooth in-page scrolling is the reset's concern,
  already behind `--wel-motion`.
- **Increased contrast (`prefers-contrast: more`):** token-layer handled ([09](../09-accessibility.md)) — rules, quote accents, and muted inks strengthen via the tokens; no component-specific treatment.
- **Reduced transparency (`prefers-reduced-transparency: reduce`):** None.
- **Contrast:** ink-on-surface, muted-ink-on-surface, and ink-on-sunken (code blocks) are
  guaranteed pairings from the [05](../05-design-tokens.md) table.
- **WCAG 2.2 implicated:** 1.4.8 Visual Presentation (AAA, treated as a target) — measure
  ≤ ~80ch via `--wel-text-measure`, generous leading via `--wel-text-leading-normal`;
  1.4.4 Resize Text / 1.4.10 Reflow — rem/ch sizing means the measure re-caps correctly
  at any zoom; 1.4.12 Text Spacing — rhythm uses margins, not fixed heights, so user
  spacing overrides don't clip.

## Container behaviour

None by way of breakpoints — measure-capped text is intrinsically responsive; the cap
simply stops binding in containers narrower than the measure. Wide content that cannot
wrap (tables, `pre` blocks) becomes an inline-axis scroll container inside the measure
rather than forcing page overflow. Sensible minimum width ~16rem. No subgrid
participation. Composes with `.center` (page column): `.center` positions the column,
`.prose` sets the internal typography — their measure defaults come from the same
`--wel-text-measure` token so they agree by construction.

## Composition

May contain: flow/phrasing HTML content; sparingly, Welkin components (an `.alert` callout
in documentation) — the `:where()` discipline guarantees prose rules never out-compete a
component's own. May be contained by: `.center`, `article`/`main` scaffolding, card
bodies for rendered excerpts. Forbidden: `.prose` inside `.prose` (rhythm compounds);
wrapping application UI (forms, grids of cards) in `.prose`; using `.prose` as a
substitute for `.stack` on non-text content.

## Open questions

- A `data-size="compact"` density axis (docs sidebars, changelogs) — or is overriding
  `--wel-prose-gap` per instance sufficient? Leaning tokens-only until demand proves the
  axis.
- Syntax-highlighting token hooks inside `pre` (a `--wel-prose-code-*` sub-palette) —
  probably a docs-site concern, not toolkit API.
- `dl` definition-list treatment needs a design pass; currently inherits `base` only.

## References

Bootstrap has no prose equivalent: Reboot styles elements globally (the opinion applies
everywhere, wanted or not) and its table/blockquote treatments require classes
(`.table`, `.blockquote`) on every element — unreachable for rendered Markdown. Closest
prior art is Tailwind's `@tailwindcss/typography` `.prose` plugin, which validates the
wrapper approach. We differ from Bootstrap: opt-in scope instead of global opinion, and
zero per-element classes by design; from Tailwind typography: token-driven values on the
fluid scales rather than a generated size-modifier matrix (`prose-lg` etc.), `:where()`
zero-specificity discipline plus cascade layers for effortless override, and one
component class per [ADR-0001](../decisions/ADR-0001-variant-syntax.md) with no
`prose-*` modifier soup.

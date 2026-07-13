# Component: Breadcrumb

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

## Purpose

A trail of links locating the current page within a site hierarchy, ending at the current
page. Use on pages more than one level deep where the hierarchy is meaningful navigation.
Do NOT use for linear multi-step processes (that is a stepper/progress pattern, deferred
post-v1), for history ("back to results" is a single link), or as a substitute for
primary navigation ([navbar.md](navbar.md)).

## Anatomy

```
┌─ root (nav.breadcrumb) ─────────────────────────────┐
│ ┌─ list (ol) ───────────────────────────────────┐   │
│ │ item(li) ▸ item(li) ▸ item(li, current)       │   │
│ │   └ link(a)  └ link(a)  └ link(a[aria-current])│   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Parts: root (the `<nav>`); list (`<ol>`); items (`<li>`); links (`<a>`); the current item
(last, carrying `aria-current="page"`); separators (CSS-generated, not parts of the
markup).

## HTML structure

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs">Docs</a></li>
    <li><a href="/docs/components" aria-current="page">Components</a></li>
  </ol>
</nav>
```

Rationale: `<nav aria-label="Breadcrumb">` gives screen-reader users a named landmark
(the label is required — a page can have several `nav` landmarks). `<ol>` because the
order is the meaning: assistive technology announces position and count. The current page
is a link carrying `aria-current="page"` (APG pattern) — keeping it a link means the trail
is self-consistent and the current location is F5-discoverable; authors may use a
non-link `<span>` instead, in which case `aria-current` is omitted (redundant on
non-interactive text, though harmless).

**Separators are CSS, never markup.** A `/` or `›` typed into the HTML is list content:
screen readers may announce it, it pollutes copy-paste, and restyling it means editing
every page. The separator is generated on `li + li::before` from a token, with CSS
alternative-text syntax (`content: var(--wel-breadcrumb-separator) / "";`) declaring it
explicitly empty for assistive technology — no `aria-hidden` spans needed because there
are no spans.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| None | — | No variant axes in v1; the separator glyph and colours are tokens, not variants |

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover | `a:hover` (nested; `@media (hover: hover)`) | Link ink darkens to full `--wel-color-ink`; underline appears | — |
| Focus | `:focus-visible` | Global focus ring | — |
| Current | `[aria-current="page"]` | Full-ink, no underline, non-link cursor styling omitted (it is a real link) | `aria-current` announced as "current page" |

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-breadcrumb-ink` | `var(--wel-color-ink-muted)` | — | Trail links are subdued |
| `--wel-breadcrumb-ink-current` | `var(--wel-color-ink)` | — | |
| `--wel-breadcrumb-gap` | `var(--wel-space-2)` | — | Around separators |
| `--wel-breadcrumb-separator` | `"/"` | — | A `<string>` token; themes swap for `"›"` etc. at runtime |
| `--wel-breadcrumb-item-max` | `12rem` | — | Per-item ellipsis cap engaged at narrow container widths |

## Behaviour tiers

### Core (Baseline Widely Available)

The full component: landmark, list, generated separators (`content:
var(--wel-breadcrumb-separator)`), current-page treatment, wrap-based overflow behaviour.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| Generated-content alternative text | `@supports (content: "a" / "b")` | Separator declared with empty alt text (`content: … / ""`), guaranteeing screen readers ignore it | Plain `content:` separator; punctuation glyphs are ignored by screen readers in practice — cosmetic-risk only, no task impact ([03](../03-browser-support-policy.md), additive-only rule) |

### JS enhancement

None.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** `<nav>` landmark with `aria-label="Breadcrumb"` (required);
  `aria-current="page"` on the last item's link (required when it is a link). No
  `role`s — the elements supply list and link semantics. Separators contribute nothing
  to the accessibility tree (generated content with empty alt text; see Enhanced tier).
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab | Moves through the trail's links in order (native) |
| Enter | Follows the focused link (native) |

- **Focus behaviour:** normal tab order; no trap participation. The current-page link is
  focusable like the rest.
- **Forced colors:** links map to `LinkText`; the ink-muted/ink distinction collapses, so
  the current item's identification must not be colour-only — trail links are underlined
  on hover *and* the current item is distinguished by `aria-current` plus its
  non-underlined, end-of-list position; under `forced-colors: active` the current link
  additionally renders without the link underline treatment the others receive.
- **Reduced motion:** none — no motion shipped.
- **Increased contrast (`prefers-contrast: more`):** token-layer handled ([09](../09-accessibility.md)) — the muted trail ink deepens via the tokens; no component-specific treatment.
- **Reduced transparency (`prefers-reduced-transparency: reduce`):** None.
- **Contrast:** `ink-muted`-on-surface and `ink`-on-surface are guaranteed 4.5:1 pairings
  ([05](../05-design-tokens.md)); separators are decorative and exempt.
- **WCAG 2.2 implicated:** 2.4.8 Location (AAA, but the component's purpose); 1.3.1 Info
  and Relationships — hierarchy encoded in the `<ol>`, not the separators; 2.5.8 Target
  Size — link targets padded to ≥ 24px block-size.

## Container behaviour

The list wraps by default — every crumb always remains reachable and legible; wrapping is
the baseline overflow behaviour, never hidden overflow. In the nearest `layout` container:

- **< 30rem:** each item is capped at `--wel-breadcrumb-item-max` with
  `text-overflow: ellipsis` (full text remains available on the target page and via the
  link's accessible name, which is the full text node — ellipsis is visual only).
- **< 20rem:** the cap tightens (~8rem) so at least the first and last crumbs share a
  line where possible.

Collapsing middle items behind a "…" disclosure requires interaction state and is out of
scope for the Pure CSS tier (see Open questions). Sensible minimum width ~10rem. No
subgrid participation.

## Composition

May contain: only the `<ol>` of items; items contain one link (plus an optional leading
icon in the first "Home" crumb, `aria-hidden` with visible or visually-hidden text). May
be contained by: page header scaffolding, `.center`, cards in exceptional listing
contexts. Forbidden: dropdowns/menus inside crumbs in v1; separators in markup; nesting
a breadcrumb inside another `nav` component's list.

## Open questions

- Collapsed middle items ("Home / … / Current") — post-v1 as a Platform-tier pattern
  (`<details>` or popover disclosing the hidden crumbs)? Needs a11y design for what the
  "…" announces.
- Structured-data guidance (`BreadcrumbList` JSON-LD) — docs-site concern or a note in
  this spec?

## References

Bootstrap `.breadcrumb`/`.breadcrumb-item` — separator injected via `::before` from the
`$breadcrumb-divider` Sass variable (build-time only; the CSS-custom-property override is
a documented escape hatch), `active` class plus manual `aria-current`, no overflow
behaviour. We differ: the separator is a runtime string token with alternative-text
syntax so theming needs no build step and screen readers are guaranteed silence, no item
class (the `<li>` is the item — one semantic class per component,
[ADR-0001](../decisions/ADR-0001-variant-syntax.md)), current state styled from
`[aria-current="page"]` itself so the accessibility attribute is the styling hook
([07](../07-component-model.md) state vocabulary), and container-driven truncation is
specified rather than left to chance.

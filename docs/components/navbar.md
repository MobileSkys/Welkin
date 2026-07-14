# Component: Navbar

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | Pure CSS |
| **Stability** | Experimental |
| **Version target** | v1 |

Pure CSS with a platform assist: the collapsed menu is the **Popover API**
(`popover` + `popovertarget`, both Core tier per
[03](../03-browser-support-policy.md)) — fully declarative, **zero JavaScript**. This is
a headline demo: the pattern Bootstrap ships a JS collapse plugin for, we ship as
markup.

## Purpose

The page-level navigation header: brand, primary navigation links, and page-level
actions (sign in, search trigger). Use once per page, inside the `.page` shell. Do NOT
use for in-page section navigation (use a plain `<nav>` with `.cluster`), for tabbed
interfaces (tabs component), or for deep multi-level menus (v1 supports one level; a
mega-menu is a post-v1 pattern).

## Anatomy

```
┌─ root (header.navbar) ─────────────────────────────────────────────┐
│ ┌─ nav ──────────────────────────────────────────────────────────┐ │
│ │ ┌─ brand ─┐  ┌─ menu (ul) ────────────┐  ┌─ actions ─┐ [menu-  │ │
│ │ │ logo    │  │ link  link  link       │  │ buttons   │  button]│ │
│ │ └─────────┘  └────────────────────────┘  └───────────┘         │ │
│ └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
Collapsed: menu-button visible; menu becomes a popover panel below the bar.
```

Parts: root (`<header class="navbar">`); nav landmark; brand (`.navbar-brand`); menu
(`.navbar-menu`, the link list — doubles as the popover panel when collapsed);
menu-button (`.navbar-menu-button`, hidden when expanded); actions (`.navbar-actions`).

## HTML structure

```html
<header class="navbar" data-sticky>
  <nav aria-label="Primary">
    <a class="navbar-brand" href="/">Acme</a>

    <button class="navbar-menu-button" popovertarget="primary-menu">
      <svg aria-hidden="true">…</svg> Menu
    </button>

    <ul class="navbar-menu" id="primary-menu" popover>
      <li><a href="/" aria-current="page">Home</a></li>
      <li><a href="/docs">Docs</a></li>
      <li><a href="/pricing">Pricing</a></li>
    </ul>

    <div class="navbar-actions">
      <a class="button" data-variant="primary" href="/signup">Sign up</a>
    </div>
  </nav>
</header>
```

Rationale: `<header>` + `<nav aria-label>` are the landmark pair AT users navigate by.
The **same `<ul>`** is both the inline link row and the collapsed panel — the `popover`
attribute's UA `display: none` applies only until our expanded-state container query
overrides `display` (author styles beat UA popover display), so there is one list, one
DOM order, no duplicated menus. `popovertarget` gives toggle behaviour, Esc-to-close,
light dismiss, and browser-synced `aria-expanded` on the button — all declarative. The
current page is marked with `aria-current="page"`, never a class.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `data-variant` | *(none in v1)* | Bare `.navbar` is the only visual style; theming is via tokens |
| `data-size` | *(none in v1)* | Height derives from content + `--wel-navbar-padding-block` |
| `data-sticky` | *(boolean, present/absent)* | `position: sticky` at block-start, plus the scroll-padding companion (see Sticky navbar) |

## Sticky navbar (`data-sticky`)

One attribute makes the bar stick: `position: sticky` at block-start, a raised
shadow, and — Enhanced, behind `@supports (animation-timeline: scroll())` — the
shadow appearing only once the page has scrolled.

Two scaffolding rules make it actually work. Both follow from how CSS positions
sticky elements, and both live in the host page, not the component:

1. **The bar's containing block must be taller than the bar.** A sticky element
   travels only within its containing block. Wrap the navbar in a bar-height
   wrapper, or make it the `auto` header row of a page-shell grid (the grid
   area is the containing block), and it has zero travel — `data-sticky`
   appears to do nothing. Since the navbar also *requires* a `page` named
   container ancestor (Container behaviour), the recommended scaffold makes
   **that wrapper the sticky element** — the sticky chrome pattern
   ([06](../06-layout-system.md)):

   ```html
   <div class="chrome">  <!-- page container AND sticky element -->
     <header class="navbar" data-sticky>…</header>
   </div>
   <main>…</main>
   ```

   ```css
   .chrome {
     container-name: page; container-type: inline-size;
     position: sticky; inset-block-start: 0; z-index: 10;
   }
   ```

   A stuck wrapper sits at viewport top, which also keeps the collapsed
   panel's Core fixed placement (Behaviour tiers) honest at any scroll
   position: the bar never leaves its contract position. If the page uses a
   footer-pinning shell grid, the chrome sits *above* the shell and the shell
   drops its header row (`grid-template-rows: 1fr auto`;
   `min-block-size: calc(100dvb - var(--wel-navbar-block-size, 3.5rem))`).

2. **Re-declare the height token at the root.** The reset's
   `scroll-padding-block-start` reads `--wel-navbar-block-size` from the root
   element, where the component's own scoped `3.5rem` declaration is invisible
   — without a root re-declaration the `1rem` fallback applies and anchor
   targets land under the stuck bar (2.4.11 Focus Not Obscured):

   ```css
   :root { --wel-navbar-block-size: 4rem; }  /* bar height + breathing room */
   ```

   The navbar keeps its own scoped value, so panel placement is unaffected.

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Hover (link) | `:hover` (`@media (hover: hover)`) | Link ink shifts to `--wel-color-accent-hover` | — |
| Focus | `:focus-visible` | Global focus ring | — |
| Active | `:active` | `--wel-color-accent-active` ink | — |
| Current page | `[aria-current="page"]` | Accent ink **and** underline/border bar (never colour alone) | `aria-current` |
| Menu open (panel) | `.navbar-menu:popover-open` | Panel visible below the bar | Browser-synced `aria-expanded` on button |
| Menu open (bar) | `.navbar:has(.navbar-menu:popover-open)` | The `:has()` trick: bar raises `--wel-shadow-3` (one tier above the sticky rest shadow, so the raise reads even while stuck), menu-button gets pressed treatment — parent styled by child state, no JS class juggling | — |

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-navbar-bg` | `var(--wel-color-surface-raised)` | — | Opaque — content scrolls beneath when sticky |
| `--wel-navbar-ink` | `var(--wel-color-ink)` | — | Links use `-ink-muted` → accent on hover/current |
| `--wel-navbar-padding-block` / `-inline` | `var(--wel-space-2)` / `var(--wel-space-gutter)` | — | |
| `--wel-navbar-gap` | `var(--wel-space-4)` | — | Between brand / menu / actions |
| `--wel-navbar-block-size` | `3.5rem` | — | Consumed by the page shell's `scroll-padding-block-start` rule ([06](../06-layout-system.md)); authors changing navbar height override this token |
| `--wel-navbar-panel-bg` | `var(--wel-navbar-bg)` | — | Collapsed popover panel |
| `--wel-navbar-border` | `var(--wel-color-border)` | — | Block-end hairline |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything: the expanded bar, the container-query collapse, the popover panel
(`popover`/`popovertarget` are Core per [03](../03-browser-support-policy.md)), the
`:has()` open-state styling, and `data-sticky`. Panel placement in Core is fixed
positioning below the bar (`inset-block-start: var(--wel-navbar-block-size)`,
inline inset 0) — correct whenever the navbar sits at the top of the viewport, which is
its contract position.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| Anchor positioning | `@supports (anchor-name: --x)` | Panel tethers to the menu-button (correct even if the navbar isn't viewport-top) | Fixed placement below the bar via `--wel-navbar-block-size`; fully functional (anchor-positioning row in [03](../03-browser-support-policy.md)) |
| `@starting-style` + `transition-behavior: allow-discrete` | `@supports (transition-behavior: allow-discrete)` | Panel fades/slides open and closed; durations × `--wel-motion` | Panel appears/disappears instantly (per contract row in [03](../03-browser-support-policy.md)) |
| Scroll-driven animations | `@supports (animation-timeline: scroll())` | Sticky bar gains its shadow only after the page has scrolled | Shadow shown whenever `data-sticky` is present; effect absent, content unaffected |

### JS enhancement

None. That is the point of this component.

## Accessibility

*Blocking acceptance criteria.*

- **Roles/ARIA:** `<header>` (banner when top-level) + `<nav aria-label="Primary">`.
  Menu-button: visible text label preferred; icon-only requires `aria-label="Menu"`.
  `aria-expanded` is synced natively by the `popovertarget` association — authors must
  not hand-manage it. `aria-current="page"` on the current link.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Tab / Shift+Tab | Through brand → menu-button (collapsed) → links (panel is next in DOM order, so tab order is natural) → actions |
| Enter / Space (menu-button) | Toggle the popover panel (native) |
| Esc (panel open) | Close panel, focus returns to menu-button (native popover behaviour) |

- **Focus behaviour:** opening the panel does not move focus (popover invoker
  behaviour); the panel is next in tab order. Esc and light-dismiss return/keep focus
  per the platform. No trap — it's navigation, not a modal.
- **Forced colors:** bar backgrounds and shadows are stripped; the block-end border
  (`CanvasText`) keeps the bar delineated. Links map to `LinkText`; the current-page
  underline/bar survives because it is a border, not a background — the bg-only-state
  rule from [09](../09-accessibility.md). Menu-button maps to `ButtonFace`/`ButtonText`.
- **Reduced motion:** panel entry/exit transitions and the sticky-shadow fade all route
  through `--wel-motion`; at `0` every state change is instant. No other motion exists.
- **Increased contrast (`prefers-contrast: more`):** token-layer handled ([09](../09-accessibility.md)) — the block-end hairline and muted link ink strengthen via the tokens; no component-specific treatment.
- **Reduced transparency (`prefers-reduced-transparency: reduce`):** None — bar and panel backgrounds are required to be opaque.
- **Contrast:** `--wel-navbar-ink` on `--wel-navbar-bg` and accent-on-surface link states
  are guaranteed pairings from [05](../05-design-tokens.md).
- **WCAG 2.2 criteria specifically implicated:** 2.4.11 Focus Not Obscured — `data-sticky`
  ships with the `scroll-padding-block-start: var(--wel-navbar-block-size)` companion in
  the page scaffolding so focused/anchored elements never land under the bar; 2.5.8
  Target Size — menu-button and links ≥ 24 px (links padded to ~44 px in the panel);
  2.4.1 Bypass Blocks — docs pattern places a skip link before the navbar.

## Container behaviour

Queries the **`page` named container** (the `.page` shell sets `container-name: page`,
[06](../06-layout-system.md)) — the navbar is page chrome, so the page container is the
honest subject, not the viewport and not a local wrapper:

| Condition | Arrangement |
|-----------|-------------|
| `@container page (inline-size >= 48rem)` | Expanded: menu inline (`display: flex` override on the popover list), menu-button hidden |
| below `48rem` | Collapsed: menu-button shown; menu is the popover panel below the bar |

`48rem` is the component's default; authors override with one custom-property-free
re-declaration. Stated requirement: without a `page` named container ancestor the query
never matches and the navbar stays collapsed-safe (collapsed is the default,
non-queried state — mobile-first, so the failure mode is usable). Sensible minimum:
~18rem (brand + button). No subgrid participation.

## Composition

May contain: brand link/image, nav links, `.button` in actions, a search `<input>`
(documented pattern). The actions part lays out its own children (flex + gap) — do not
compose it with `.cluster`: a layout primitive's inline-size containment collapses it to
zero width as an auto-sized flex item. May be contained by: the
`.page` shell header row — one per page. Forbidden: `.navbar` inside `.navbar`; dialogs
or full components inside the menu list; nested link lists (v1 is one level — no
dropdown submenus until the popover-menu component composes in post-v1).

## Open questions

- ~~Part-naming convention~~ — resolved: part classes (`{component}-{part}`) ratified in
  [07](../07-component-model.md) / [04](../04-css-architecture.md); `data-part` rejected.
- Should `.navbar-actions` fold into the popover panel below a second, tighter
  breakpoint, or always stay inline? Currently always inline (the primary CTA should
  not hide behind a menu).
- Auto-close the popover on same-page anchor navigation: platform light-dismiss covers
  most cases; is `:target`-based closing worth documenting?

## References

Bootstrap: `.navbar navbar-expand-lg` + `data-bs-toggle="collapse"` — the collapse
requires bootstrap.js, the breakpoint is a **viewport** class baked into markup, and
`aria-expanded` is managed by the plugin. We differ: zero JS (Popover API supplies
toggle, Esc, light dismiss, and `aria-expanded` sync natively), collapse driven by the
`page` **container** query per
[ADR-0006](../decisions/ADR-0006-container-query-first-responsiveness.md) (drop the same
navbar into a narrower shell and it adapts, no class edits), one DOM list for both
arrangements, `:has()` for open-state styling instead of plugin-injected classes, and a
sticky option that ships its 2.4.11 scroll-padding companion instead of leaving focus
obscured.

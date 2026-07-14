# Welkin gotchas & anti-patterns

> Source: docs 04/08/10, ADR-0003/0010, and issues actually hit during
> Welkin's own development. Read before debugging "Welkin is broken".

## Loading & files

- **`file://` breaks ES modules.** Opening a page from disk CORS-blocks every
  `<script type="module" src=…>` and dynamic `import()` — tabs, toasts,
  combobox etc. silently stay in their no-JS baseline. CSS `@import` of other
  local files can fail the same way. Fix: serve the folder
  (`npx serve`, `python -m http.server`) — or accept the no-JS baseline,
  which is designed to work.
- **Any subset of dist files works in any order** — core + three components,
  components without core loaded first, whatever. Every file self-declares
  the canonical `@layer` order line. Don't "fix" ordering; there's nothing
  to fix.
- **Never wrap a Welkin stylesheet in your own `@layer`** (e.g.
  `@import "welkin.css" layer(vendor)`). It demotes Welkin's internal layer
  system and breaks the variants/states ordering contract.
- **Don't concatenate/minify Welkin through a pipeline that strips
  `@layer` statements** or reorders rules. If a bundler mangles it, link the
  shipped `.min.css` directly — it's already minified.

## The cascade contract (use it, don't fight it)

- **Your unlayered CSS beats every Welkin rule, at any specificity.** One
  class selector overrides anything. If an override "isn't working", the
  selector isn't matching — it is never a specificity problem against Welkin.
- Consequently: `!important` against Welkin is never needed; seeing it in a
  diff is a bug. Prefer, in order: token (Level 1/3) → `@layer overrides` →
  plain unlayered rule.
- **Don't restyle component internals** (`.card > div:first-child`,
  `.button:hover { background: … }`). Internals aren't API. Use the
  component's published `--wel-{component}-*` tokens; see theming.md
  anti-pattern gallery.

## Layout traps

- **Navbar never collapses?** The page shell must establish the named
  container: `container-name: page; container-type: inline-size` on a
  wrapper. The navbar's breakpoint queries `page`, not the viewport.
- **Primitive collapses to zero width / content overflows?** It's inside a
  content-sized box (auto flex basis, `auto` grid track, float,
  `inline-block`, abs-pos). Give it `flex-grow`, an explicit basis, or a
  sized track. (Containment physics — see layout.md.)
- **Spacing "missing" between elements?** The reset removes element margins
  on purpose — rhythm belongs to `.stack`. Wrap siblings in a stack instead
  of re-adding margins.
- **`.switcher` cap is markup** (`data-limit="2|3|4"`), not a custom
  property — selectors can't read custom props. Don't invent
  `--wel-switcher-limit`.
- **Don't nest components inside `.prose`.** Prose's descendant list/table
  rules can beat component styles on source-order ties. `.prose` is for
  element-only editorial content; place components as siblings.
- **Don't combine `.center` and `.stack` on one element.** Stack's
  `display: flex` silently overrides center's grid, so the measure cap dies
  and content goes full-bleed to x=0. Nest instead:
  `<div class="center"><div class="stack">…`. (Same trap for any two
  display-setting primitives on one element.)

## Behaviour & a11y

- **Static alerts carry no ARIA role.** Only dynamically inserted messages
  get `role="alert"` (urgent) or `role="status"`. A server-rendered callout
  with `role="alert"` double-announces.
- **No `role="menu"` on popover dropdowns** — that role promises APG
  keyboard behaviour the Popover API doesn't supply. Plain lists of
  links/buttons.
- **Don't wire your own validation styling.** `:user-invalid` (after
  interaction) + markup errors via `aria-describedby` is the system;
  `aria-invalid="true"` for server-rendered errors. No JS class-toggling.
- **Icon-only buttons need `aria-label`.** Decorative SVGs need
  `aria-hidden="true"`.
- **Danger toasts never auto-dismiss** (WCAG); don't pass a duration to
  force it.
- **Spring easing is invisible on colour-only transitions.** Retheming
  `--wel-motion-ease` to the spring only *reads* on movement. Buttons already
  transition `translate`, so one line makes it visible:
  `.button:hover { translate: 0 calc(-3px * var(--wel-motion)); }` (multiply
  the offset too — motion-off users get no position jump).
- **Motion:** never write raw durations — multiply by `--wel-motion` (goes
  to 0 under reduced motion; zero-duration transitions still fire
  `transitionend`, so no JS branches). Don't add your own
  `prefers-reduced-motion` blocks for Welkin-driven animation.
- **Dark mode is already on** (`color-scheme: light dark` + `light-dark()`
  tokens). Don't add a `prefers-color-scheme` media query for colours;
  don't build a JS theme toggle that swaps stylesheets — toggle
  `data-theme="dark|light"` on `<html>` instead.

## Cross-document view transitions (opt-in module, post-1.0.1)

`dist/components/view-transitions.min.css` makes same-origin MPA navigations
morph (`--wel-vt: <name>` pairs elements across pages). It is **never** in
`welkin.css` — linking it on *every page of the site* is the opt-in. Its traps:

- **`file://` can never morph.** Each local file is its own opaque origin, so
  the same-origin navigation check always fails — you get instant navigations
  and no error. Serve over HTTP to see any cross-document transition.
- **A slow `defer` script on the destination page silently kills the
  transition.** Chrome activates the inbound morph only if the new page's
  `DOMContentLoaded` beats its first paint; deferred scripts hold DCL back
  (flaky even on localhost, guaranteed dead past ~600 ms of latency). Load
  heavy scripts **`async`** and gate wiring on the `load` event — async only
  delays `load`, never DCL. Parser-blocking `<head>` scripts also work; end-of-
  body and `defer` do not.
- **One `--wel-vt` name, once per page.** A duplicate name aborts the entire
  transition. (The property is registered non-inheriting, so names can't leak
  into descendants — but two authored uses still collide.)
- **Firefox = instant navigation, by contract.** It ships View Transitions
  Level 1 (same-document) only and ignores the `@view-transition` at-rule.
  There is no `@supports` gate for an at-rule and none is needed.
- **Reduced motion turns the whole module off** (media-gated at the source).
  Don't re-gate it, and don't expect `pagereveal.viewTransition` under reduce.
- **Navigating during a running morph skips the next one** — spec behaviour,
  not a bug.
- **Morphing images? Tag both sides `data-vt-image`.** Snapshots then
  cover-fit the morphing box and swap opaquely — untagged image pairs stretch
  between aspect ratios and double-expose mid-morph. Also applies to your own
  same-document `startViewTransition` while the module is linked
  (see references/image-fx.md).
- **White blink between dark pages?** The pre-CSS canvas is white until the
  stylesheet's `color-scheme` applies. Put
  `<meta name="color-scheme" content="light dark">` in the `<head>` of every
  page (good hygiene even without the module — fixes Firefox's white first
  paint).

## Testing & verification traps (for probes/E2E)

- Pages **smooth-scroll** (reset opt-in under no-preference): automated
  probes must wait for scroll settle before asserting positions, or set
  reduced motion in the browser context.
- A **skipped view transition rejects its `ready` promise** — `.catch` it
  (wel-tabs' indicator morph uses VT where supported).
- Test under **`file://` as well as HTTP** if users will open files from
  disk — module loading differs (above).
- Verify **both colour schemes**, `forced-colors`, and reduced motion —
  Welkin's own CI gates on all three; your theme changes can regress them.
- After changing any colour token, re-check contrast pairings
  (theming.md "Contrast: your duty").
- Verify UI **visually** (screenshot), not only via DOM assertions — a
  broken layout can pass every DOM check.
- **Cross-document view transitions never fire under stock Playwright.** Its
  default Chromium switches disable `PaintHolding` (every transition is
  skipped, `pagereveal` never fires) and back/forward cache (back-nav
  transitions skip). Pass your own `--disable-features=…` (a later flag wins)
  and `ignoreDefaultArgs: ['--disable-back-forward-cache']`; assert on
  `pagereveal`'s `viewTransition`, and use JS clicks — actionability
  scroll-into-view fights the smooth-scroll reset.

## Quick fix table

| Symptom | Cause | Fix |
|---------|-------|-----|
| Tabs/toasts/combobox inert | `file://` CORS-blocked modules | Serve over HTTP |
| Navbar always expanded (vertical list) | No `page` named container | Add container wrapper |
| Stack/grid squashed to zero width | Content-sized parent | `flex-grow` / sized track |
| Override ignored | Selector not matching (never specificity) | Inspect; fix selector; drop `!important` |
| Variants look wrong after bundling | Pipeline stripped `@layer` | Link shipped files directly |
| Everything double-spaced/no spacing | Fighting the margin-trimming reset | Use `.stack`, not margins |
| Dropdown popover in page corner | Old engine, no anchor positioning | Load `wel-anchor.js` (no-ops elsewhere) |
| Dark-mode colours wrong after theming | Single-scheme token value | Use `light-dark(a, b)` at definition |
| Page morphs never fire | `file://` (opaque origins) or module missing on one side | Serve HTTP; link the module on every page |
| Page morphs flaky / skip on some pages | `defer`/end-of-body script delays `DOMContentLoaded` | Load scripts `async`, wire on `load` |
| Content full-bleed, heading at x=0 | `.center`+`.stack` on one element | Nest: `.center > .stack` |
| White blink between dark pages | Pre-CSS canvas is white | `<meta name="color-scheme" content="light dark">` in head |

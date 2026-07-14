# Welkin component catalogue

> Source: docs/components/*.md specs + examples/components.html (the reviewed,
> a11y-smoked demo page). Markup below is canonical — copy it; don't invent
> classes, parts, or attribute values. Class names, part names, variant values,
> custom-element tags/attributes/events are all semver-governed API.

Conventions that apply to every component:
- One semantic class (`.button`); axes are `data-variant`, `data-size`,
  `data-tone` (+ component-specific attrs listed per component).
- Parts are `{component}-{part}` classes (`.card-header`). No BEM punctuation.
- À la carte: each component is `dist/components/{name}.min.css` on top of
  `welkin-core`; JS-enhanced ones add `dist/js/{module}.js` (ES module).
- `.visually-hidden` (utility) is available for AT-only text.
- **Knobs** listed per component are its published `--wel-{component}-*`
  tokens — the Level-3 theming surface (see theming.md). Set them on the
  component's selector or an ancestor scope, never restyle internals.
- SVGs abbreviated `<svg aria-hidden="true" …>` in snippets are placeholder
  icons: any inline SVG works, icons are optional (a text-only navbar Menu
  button is fine) — just keep `aria-hidden="true"` on decorative ones.

## Button — pure CSS (`button.css`)

Variants: `primary | secondary | ghost | danger` (unset = default).
Sizes: `sm | lg`. States via native attrs: `disabled`, `aria-busy="true"`.

```html
<button class="button" type="button" data-variant="primary" data-size="lg">Save</button>
<button class="button" type="button" data-variant="ghost" aria-label="Settings">
  <svg aria-hidden="true" …></svg>          <!-- icon-only: aria-label required -->
</button>
<a class="button" data-variant="primary" href="/pricing">See pricing</a>
```

Knobs: `--wel-button-bg` / `-bg-hover` / `-bg-active`, `--wel-button-ink` /
`-ink-hover`, `--wel-button-border`, `--wel-button-radius`,
`--wel-button-padding-block` / `-padding-inline`.

## Card — pure CSS (`card.css`)

Variants: `outlined | plain` (unset = raised). Parts: `card-header`,
`card-body`, `card-footer`, `card-media`, `card-link`.

```html
<article class="card">
  <figure class="card-media">
    <img class="frame" src="…" alt="…">     <!-- media bleeds to edge -->
  </figure>
  <header class="card-header">
    <h3><a class="card-link" href="…">Title — whole card is the target</a></h3>
  </header>
  <div class="card-body"><p>…</p></div>
  <footer class="card-footer"><small>3 min read</small></footer>
</article>
```

Card grids: wrap in `.grid`; add `data-align="rows"` on the grid for
subgrid-aligned headers/bodies/footers.

Knobs: `--wel-card-bg`, `--wel-card-ink`, `--wel-card-border` /
`-border-hover`, `--wel-card-radius`, `--wel-card-padding`, `--wel-card-gap`,
`--wel-card-shadow` / `-shadow-hover`.

## Badge & Tag — pure CSS (`badge-tag.css`)

Tones: `info | success | warning | danger` (unset = neutral).

```html
<span class="badge" data-tone="success">Published</span>
<a href="/inbox">Inbox <span class="badge">3<span class="visually-hidden"> unread messages</span></span></a>

<a class="tag" href="…">CSS</a>
<span class="tag">
  Draft
  <button class="tag-dismiss" type="button" aria-label="Remove filter: Draft">
    <svg aria-hidden="true" …></svg>
  </button>
</span>
```

Selected filter tags: `<li class="tag" role="option" aria-selected="true">`
inside a `role="listbox"` list.

Knobs: `--wel-badge-bg` / `-ink` / `-radius` / `-padding-block` /
`-padding-inline`; `--wel-tag-bg` / `-bg-hover` / `-bg-active` / `-ink` /
`-ink-hover` / `-border` / `-radius` / `-padding-*`,
`--wel-tag-max-inline-size` (truncation).

## Alert / Callout — pure CSS (`alert.css`)

Tones: `info | success | warning | danger` (unset = quiet neutral). Parts:
`alert-title`, `alert-icon`. **Static callouts carry no ARIA role**; only
dynamically inserted messages get `role="alert"` (urgent) or `role="status"`.

```html
<aside class="alert" data-tone="info">
  <svg class="alert-icon" aria-hidden="true" …></svg>
  <p class="alert-title">Heads up</p>
  <p>Body text; links allowed.</p>
</aside>
```

Knobs: `--wel-alert-bg`, `--wel-alert-ink`, `--wel-alert-accent`,
`--wel-alert-radius`, `--wel-alert-padding`, `--wel-alert-gap`,
`--wel-alert-icon-size`.

## Breadcrumb — pure CSS (`breadcrumb.css`)

Separators are CSS-generated (`--wel-breadcrumb-separator: '›'` to swap) —
never markup. Current page = `aria-current="page"`.

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs">Docs</a></li>
    <li><a href="" aria-current="page">This page</a></li>
  </ol>
</nav>
```

Knobs: `--wel-breadcrumb-separator` (a string), `--wel-breadcrumb-gap`,
`--wel-breadcrumb-ink` / `-ink-current`, `--wel-breadcrumb-item-max`.

## Table — pure CSS + optional `table-sort.js`

Variants: `striped | ruled`; `data-size="sm"`; `data-hover`;
`data-sticky="first-column"`. Always wrap in the focusable labelled scroll
region — narrow containers scroll, never cell-stack:

```html
<div class="table-scroller" tabindex="0" role="region" aria-labelledby="t-cap">
  <table class="table" data-variant="striped" data-hover>
    <caption id="t-cap">Q3 invoices</caption>
    <thead><tr><th scope="col">Invoice</th><th scope="col" aria-sort="descending">Amount</th></tr></thead>
    <tbody><tr><th scope="row">#1044</th><td>€3,150</td></tr></tbody>
  </table>
</div>
```

Sorting (JS): add `data-sortable` on the table, `data-sort="text|number|date"`
on sortable `th`s (omit it on columns that shouldn't sort), optional
`data-sort-value` on cells; load `table-sort.js`. The module wraps header
content in real `<button>`s (keyboard/AT for free); all state lives in
`aria-sort` — a pre-set `aria-sort` in markup reflects the server order and
does **not** trigger an initial client sort. Cancel the `wel-sort` event
(`preventDefault()`) to sort server-side instead.

Knobs: `--wel-table-bg`, `--wel-table-border`, `--wel-table-stripe-bg`,
`--wel-table-hover-bg`, `--wel-table-head-ink`,
`--wel-table-cell-padding-block` / `-inline`, `--wel-table-sticky-shadow`.

## Prose — pure CSS (`prose.css`)

Editorial typography for element-only content — no classes inside:

```html
<article class="prose">
  <h2>…</h2><p>…</p><ul>…</ul><blockquote>…</blockquote><pre><code>…</code></pre>
</article>
```

Knobs: `--wel-prose-measure`, `--wel-prose-gap`, `--wel-prose-heading-gap`,
`--wel-prose-ink`, `--wel-prose-code-bg`, `--wel-prose-quote-accent`,
`--wel-prose-rule`.

## Progress / Spinner / Skeleton — pure CSS (`progress.css`)

```html
<label for="up">Uploading…</label>
<progress class="progress" id="up" max="100" value="62">62%</progress>

<div class="spinner" role="status"><span class="visually-hidden">Loading…</span></div>

<section aria-busy="true" aria-describedby="feed-status">
  <p id="feed-status" class="visually-hidden">Loading feed…</p>
  <div class="skeleton" data-variant="circle" aria-hidden="true"></div>
  <div class="skeleton" data-variant="text" aria-hidden="true"></div>
</section>
```

Progress/spinner take `data-size="sm|lg"`. Indeterminate work → spinner, not
valueless `<progress>`. Skeletons are decorative: always `aria-hidden="true"`
inside an `aria-busy` region with a visually-hidden status line.

Knobs: `--wel-progress-fill` / `-track-bg` / `-block-size` / `-radius`;
`--wel-spinner-ink` / `-track` / `-size` / `-thickness`;
`--wel-skeleton-bg` / `-shimmer` / `-radius`.

## Navbar — pure CSS (`navbar.css`)

Zero JS: the collapsed menu is the Popover API. One `<ul>` serves both
arrangements; collapse follows the **`page` named container** — the page shell
must set `container-name: page; container-type: inline-size` on a wrapper or
the navbar never collapses. Current page: `aria-current="page"`.

```html
<header class="navbar">
  <nav aria-label="Primary">
    <a class="navbar-brand" href="/">Brand</a>
    <button class="navbar-menu-button" popovertarget="nav-menu">
      <svg aria-hidden="true" …></svg> Menu
    </button>
    <ul class="navbar-menu" id="nav-menu" popover>
      <li><a href="/" aria-current="page">Home</a></li>
      <li><a href="/docs">Docs</a></li>
    </ul>
    <div class="navbar-actions">
      <a class="button" data-variant="primary" data-size="sm" href="/signup">Sign up</a>
    </div>
  </nav>
</header>
```

**Sticky bar**: add `data-sticky` (sticky position + shadow; the shadow fades
in on scroll where scroll-driven animations are supported). Two host-page
rules make it work:

1. **The sticky element must be the page-container wrapper, not the bar** — a
   sticky navbar inside a bar-height wrapper or an `auto` shell-grid row has
   zero travel (its containing block is no taller than the bar), so
   `data-sticky` appears to do nothing:

   ```css
   .chrome {  /* wraps ONLY the navbar; page shell sits after it */
     container-name: page; container-type: inline-size;
     position: sticky; inset-block-start: 0; z-index: 10;
   }
   ```

2. **Re-declare the height token at the root** — the reset's
   `scroll-padding-block-start` reads `--wel-navbar-block-size` from the root,
   where the navbar's own scoped `3.5rem` is invisible; without it the `1rem`
   fallback leaves anchor targets under the stuck bar:

   ```css
   :root { --wel-navbar-block-size: 4rem; }  /* bar height + breathing room */
   ```

Full scaffold (chrome + footer-pinning shell): recipes.md → "The shell every
page shares".

Knobs: `--wel-navbar-bg` / `-ink` / `-border` / `-gap` / `-padding-block` /
`-padding-inline` / `-panel-bg` (collapsed menu), `--wel-navbar-block-size`.

There is no side-navigation component: an app sidebar is plain links (in a
`.stack`-arranged `<nav>`); style `[aria-current="page"]` yourself — only
navbar/breadcrumb/pagination ship current-state styling.

## Pagination — pure CSS (`pagination.css`)

Links in a landmark — navigation, not buttons. Page 1 **omits** Previous
rather than faking a disabled link. Gaps are `aria-hidden` ellipses.

```html
<nav class="pagination" aria-label="Pagination">
  <ol>
    <li><a href="?p=4" rel="prev">‹ Previous</a></li>
    <li><a href="?p=1">1</a></li>
    <li aria-hidden="true">…</li>
    <li><a href="?p=5" aria-current="page">5</a></li>
    <li><a href="?p=6" rel="next">Next ›</a></li>
  </ol>
</nav>
```

Knobs: `--wel-pagination-current-bg` / `-current-ink` / `-item-ink` /
`-item-size` / `-gap` / `-radius`.

## Select — platform (`select.css`)

Native `<select>`, styled trigger, UA picker. No JS, ever. `data-size="sm|lg"`.

```html
<label class="field">
  <span>Country</span>
  <select class="select" name="country" required>
    <option value="">Choose…</option>
    <optgroup label="Europe"><option value="fr">France</option></optgroup>
  </select>
</label>
```

Both field forms are canonical: the wrapping `<label class="field">` (compact,
no hint/error) and `<div class="field">` + `<label for>` — **use the `div`
form whenever the field carries a `.hint` or `.error`** (those can't sensibly
live inside a label).

Knobs: `--wel-select-bg` / `-ink` / `-border` / `-radius` / `-padding-*`,
`--wel-select-caret-color` / `-caret-size`.

## Form controls & validation — platform (`form-controls.css`)

Native constraint validation is the engine. Errors ship in markup, wired via
`aria-describedby`, and appear via `:user-invalid` — after interaction, never
at page load. `aria-invalid="true"` is the server-rendered twin.

```html
<form class="stack">
  <div class="field">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required
           aria-describedby="email-hint email-error">
    <p class="hint" id="email-hint">We never share it.</p>
    <p class="error" id="email-error">Enter a valid email address.</p>
  </div>
  <fieldset class="field">
    <legend>Billing cycle</legend>
    <div class="field"><input id="m" type="radio" name="cycle" checked><label for="m">Monthly</label></div>
  </fieldset>
  <div class="field">
    <input id="tos" name="tos" type="checkbox" required
           aria-describedby="tos-error">
    <label for="tos">I accept the terms</label>
    <p class="error" id="tos-error">You must accept the terms to continue.</p>
  </div>
  <div class="field">
    <input id="notify" type="checkbox" role="switch" class="switch" checked>
    <label for="notify">Email notifications</label>
  </div>
  <div class="cluster"><button class="button" data-variant="primary">Submit</button></div>
</form>
```

Checkbox/radio errors follow the same pattern — `.error` after the label,
wired via `aria-describedby`, revealed by `:user-invalid`.

`data-show-valid` on the form opts into success styling; `data-size="sm"` on
a `.field` for compact controls. Textareas auto-grow under Enhanced
(`field-sizing: content`).

Knobs: `--wel-field-gap`, `--wel-field-hint-ink`, `--wel-field-error-ink`.

## Dialog / Modal — platform (`dialog.css`) + optional `wel-dialog.js`

Native `<dialog>`: `showModal()` gives focus trap, inert background, Esc, top
layer. Closing is declarative (`form method="dialog"`). Opening: load
`wel-dialog.js` and use `data-dialog-open="<id>"` on any button (or call
`dialog.showModal()` yourself — 3 lines). `data-size="sm|lg"`;
`data-dialog-modal="false"` on the invoker opens non-modally.

```html
<button class="button" data-variant="danger" data-dialog-open="confirm">Delete…</button>

<dialog class="dialog" id="confirm" data-size="sm" aria-labelledby="confirm-title">
  <header>
    <h2 id="confirm-title">Delete this project?</h2>
    <form method="dialog"><button class="button" data-variant="ghost" aria-label="Close">✕</button></form>
  </header>
  <p>This permanently removes the project.</p>
  <footer class="cluster" style="--wel-cluster-justify: flex-end">
    <form method="dialog">
      <button class="button" value="cancel" autofocus>Cancel</button>
      <button class="button" data-variant="danger" value="delete">Delete</button>
    </form>
  </footer>
</dialog>
```

Consuming the result is pure platform: listen for the dialog's `close` event
and read `dialog.returnValue` (the `value` of the submitting button). To reuse
one dialog for N rows (inject a name, remember the row), write your own small
glue — `wel-dialog.js` only opens; it exposes no events and won't conflict
with your listeners. A closed `<dialog>` generates no box, so it can live
anywhere (end of `<body>`, outside the page shell — doesn't matter).

Knobs: `--wel-dialog-bg` / `-ink` / `-radius` / `-padding` / `-shadow` /
`-backdrop` / `-max-inline-size`.

## Popover / Dropdown menu — platform (`popover.css`) + optional `wel-anchor.js`

Fully declarative: `popovertarget` toggles; light dismiss and Esc are native.
Plain lists — **no `role="menu"`** (it promises APG keyboard support the
Popover API doesn't supply). `data-placement="block-end|inline-end|…"`,
`data-size="sm"`. Load `wel-anchor.js` to tether where CSS anchor positioning
is unsupported (it no-ops where supported).

```html
<button class="button" popovertarget="project-menu">Project <svg aria-hidden="true" …></svg></button>
<div class="popover" id="project-menu" popover>
  <ul>
    <li><a href="…" aria-current="page">Overview</a></li>
    <li><a href="…">Settings</a></li>
    <li><button data-dialog-open="confirm">Delete…</button></li>
  </ul>
</div>
```

Knobs: `--wel-popover-bg` / `-ink` / `-radius` / `-padding` / `-shadow` /
`-offset` / `-min-inline-size` / `-max-inline-size`.

## Accordion — platform (`accordion.css`)

`<details>/<summary>`; exclusivity via shared `name` attribute (omit for
independent multi-open — the default recommendation). Zero accordion JS.
Variant: `separated`.

```html
<div class="accordion">
  <details name="faq" open>
    <summary><h3>Can I self-host?</h3></summary>
    <p>Yes — static CSS plus optional ESM modules.</p>
  </details>
  <details name="faq">
    <summary><h3>Which browsers?</h3></summary>
    <p>Core on Baseline Widely Available.</p>
  </details>
</div>
```

Knobs: `--wel-accordion-bg` / `-ink` / `-border` / `-radius` /
`-marker-color` / `-panel-padding` / `-summary-padding-block` / `-inline`.

## Tooltip — platform (`tooltip.css`) + optional `wel-tooltip.js`

Core = Popover-API **toggletip**: click toggles; text doubles as the trigger's
`aria-describedby` description (exposed to AT without opening).
`data-placement` on the tooltip. Load `wel-tooltip.js` for hover/focus reveal
(WCAG 1.4.13-compliant: dismissable, hoverable, persistent).

```html
<button class="button" popovertarget="fmt-tip" aria-describedby="fmt-tip">Help</button>
<div class="tooltip" id="fmt-tip" popover role="tooltip">Markdown is supported</div>
```

Knobs: `--wel-tooltip-bg` / `-ink` / `-radius` / `-padding-*` / `-offset` /
`-max-inline-size` / `-show-delay` (hover delay, used by `wel-tooltip.js`).

## Carousel — platform (`carousel.css`) + optional `carousel-buttons.js`

Scroll-snap rail; browser supplies touch/momentum/keyboard/RTL. **No autoplay,
ever.** Slide width knob: `--wel-carousel-slide-size`. `data-carousel-buttons`
+ `carousel-buttons.js` adds prev/next buttons on engines without CSS
`::scroll-button` (no-ops elsewhere).

```html
<section class="carousel" data-carousel-buttons aria-roledescription="carousel"
         aria-label="Featured work" style="--wel-carousel-slide-size: min(100%, 18rem)">
  <div class="carousel-track" tabindex="0" role="group" aria-label="Slides">
    <div role="group" aria-roledescription="slide" aria-label="1 of 3">…</div>
    <div role="group" aria-roledescription="slide" aria-label="2 of 3">…</div>
    <div role="group" aria-roledescription="slide" aria-label="3 of 3">…</div>
  </div>
</section>
```

Knobs: `--wel-carousel-slide-size` / `-gap` / `-padding` / `-marker` /
`-marker-current` / `-button-bg` / `-button-ink`.

## Tabs — JS-enhanced (`tabs.css` + `wel-tabs.js`)

Author plain heading+section pairs — that markup **is** the no-JS baseline
(stacked, headed sections). The module generates tablist, ARIA, roving
tabindex, arrow keys. Attributes: `activation="auto|manual"`,
`selected-index="n"` (reflected), `data-variant="pills"`. Event:
`wel-tab-change` bubbles with `{ index, previousIndex, tab, panel }`.

```html
<script type="module" src=".../dist/js/wel-tabs.js"></script>

<wel-tabs aria-label="Product information">
  <h3>Overview</h3>
  <section><p>…</p></section>
  <h3>Specifications</h3>
  <section><p>…</p></section>
</wel-tabs>
```

Knobs: `--wel-tabs-border`, `--wel-tabs-gap`.

## Combobox — JS-enhanced (`combobox.css` + `wel-combobox.js`)

Wraps native `<input list>` + `<datalist>` — that pair is the no-JS baseline.
Upgraded: stylable filtered listbox, `aria-activedescendant` navigation, Enter
commits (fires native `input`/`change`). Datalist stays the option source —
swap options anytime. `filter="none"` disables substring filtering.

```html
<div class="field">
  <label for="country">Country</label>
  <wel-combobox>
    <input id="country" name="country" list="country-list">
    <datalist id="country-list">
      <option value="Denmark"></option>
      <option value="Estonia"></option>
    </datalist>
  </wel-combobox>
</div>
```

Knobs: `--wel-combobox-bg` / `-ink` / `-border` / `-active-bg`.

## Toast — JS-enhanced (`toast.css` + `wel-toast-region.js`)

The API is the DOM: append a `<wel-toast>` child or call `push()`. The region
queues past `max`, sets `status`/`alert` politeness by tone, adds dismiss,
pauses timers on hover/focus. Danger toasts never auto-dismiss. Place the
region **in the page flow** (server-rendered flash messages read as static
alerts with JS off), not at end of body.

```html
<wel-toast-region aria-label="Notifications">
  <wel-toast data-tone="success">Profile saved.</wel-toast>  <!-- server flash -->
</wel-toast-region>

<script type="module">
  const region = document.querySelector('wel-toast-region');
  region.push('Upload complete.', { tone: 'info' });          // 6s default
  region.push('Working offline.', { tone: 'warning', duration: 0 });  // persistent
</script>
```

Knobs: `--wel-toast-bg` / `-ink` / `-border` / `-accent` / `-radius` /
`-gap` / `-shadow` / `-max-inline-size`.

## JS module summary

| Module | Pairs with | Loading it does |
|--------|-----------|-----------------|
| `wel-tabs.js` | `<wel-tabs>` | Upgrades heading+section pairs to APG tabs |
| `wel-combobox.js` | `<wel-combobox>` | Upgrades input+datalist to filtered listbox |
| `wel-toast-region.js` | `<wel-toast-region>` | Queue/politeness/dismiss/timers |
| `wel-dialog.js` | `[data-dialog-open]` | Declarative dialog opening (delegated) |
| `wel-tooltip.js` | `.tooltip[popover]` triggers | Hover/focus reveal, 1.4.13 trio |
| `wel-anchor.js` | any `[popover]` + invoker | JS tether where CSS anchor positioning missing (else no-op) |
| `table-sort.js` | `.table[data-sortable]` | Client sort; `wel-sort` cancelable event |
| `carousel-buttons.js` | `.carousel[data-carousel-buttons]` | Prev/next where `::scroll-button` missing (else no-op) |

All are self-initialising ES modules — just include the `<script type="module">`
tag; each also exports a default `upgrade(root)` for manual scoping. Modules
handle late-added DOM (MutationObserver/delegation) — no re-init calls needed.

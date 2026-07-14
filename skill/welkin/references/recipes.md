# Welkin page recipes

> Complete page scaffolds composed from the primitives and components. Copy a
> skeleton, then swap content. Every recipe assumes `welkin.min.css` is linked
> (see SKILL.md install tree); JS modules noted per recipe where used.

## The shell every page shares

The page shell is authored (not shipped). It must establish the `page` named
container — the navbar's collapse queries it — and pin the footer on short
pages. The **sticky chrome** pattern below also makes the bar stick: the page
container wrapper is the sticky element, because a sticky navbar inside a
bar-height wrapper (or an `auto` shell-grid row) has zero travel — its
containing block is no taller than the bar, so `data-sticky` appears inert.
Don't want a sticky bar? Drop `.chrome`'s `position/inset/z-index` lines and
`data-sticky` — keep the container declarations:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>…</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/welkincss@1/dist/welkin.min.css">
  <style>
    /* Sticky chrome: page container AND sticky element in one wrapper. */
    .chrome {
      container-name: page; container-type: inline-size;
      position: sticky; inset-block-start: 0; z-index: 10;
    }
    /* Companion: the reset's scroll-padding reads this from the root (the
       navbar's own 3.5rem is scoped and invisible there) — without it,
       anchor targets land under the stuck bar. Bar height + breathing. */
    :root { --wel-navbar-block-size: 4rem; }
    .shell {
      display: grid; grid-template-rows: 1fr auto;
      min-block-size: calc(100dvb - var(--wel-navbar-block-size, 3.5rem));
    }
  </style>
</head>
<body>
<div class="chrome">
  <header class="navbar" data-sticky>
    <nav aria-label="Primary">
      <a class="navbar-brand" href="/">Brand</a>
      <button class="navbar-menu-button" popovertarget="nav-menu">Menu</button>
      <ul class="navbar-menu" id="nav-menu" popover>
        <li><a href="/" aria-current="page">Home</a></li>
        <li><a href="/docs">Docs</a></li>
      </ul>
      <div class="navbar-actions">
        <a class="button" data-variant="primary" data-size="sm" href="/signup">Sign up</a>
      </div>
    </nav>
  </header>
</div>

<div class="shell">
  <main><!-- recipe body goes here --></main>

  <footer class="center">
    <div class="cluster" style="--wel-cluster-justify: space-between">
      <small>© 2026 Brand</small>
      <nav class="cluster" aria-label="Footer"><a href="/privacy">Privacy</a> <a href="/terms">Terms</a></nav>
    </div>
  </footer>

</div>
</body>
</html>
```

Dark mode already works (OS-following). Brand it with a Level-1 token block
(theming.md) — not with component CSS.

## Recipe: content / article page

`.center` caps the measure; `.prose` styles the editorial body; breakout for
full-bleed figures. Components stay **outside** `.prose`. One element, one
primitive (doc 06): children sit flat in `.center` (so `data-breakout` still
works — it must be a *direct* child) and a `row-gap` supplies the rhythm a
nested `.stack` would otherwise own.

```html
<main class="center" style="row-gap: var(--wel-space-5)">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/blog">Blog</a></li>
      <li><a href="" aria-current="page">This post</a></li>
    </ol>
  </nav>

  <article class="prose">
    <h1>Title</h1>
    <p>Lead paragraph…</p>
    <h2>Section</h2>
    <p>…</p>
  </article>

  <figure data-breakout class="frame" style="--wel-frame-ratio: 21 / 9">
    <img src="…" alt="…">
  </figure>

  <aside class="alert" data-tone="info">
    <p class="alert-title">Related</p>
    <p>Callout sits outside the prose block as a sibling.</p>
  </aside>
</main>
```

## Recipe: marketing / landing page

Hero on `.cover`, feature grid on `.grid` + aligned cards, CTA band with a
scoped dark theme.

```html
<main class="stack" style="--wel-stack-gap: var(--wel-space-8)">

  <section class="cover" style="--wel-cover-min-height: 70dvb">
    <div class="center" data-principal style="--wel-center-max: 70rem">
      <div class="stack">
        <h1 style="font-size: var(--wel-text-size-5)">Headline that sells</h1>
        <p style="color: var(--wel-color-ink-muted)">One-sentence value proposition.</p>
        <div class="cluster">
          <a class="button" data-variant="primary" data-size="lg" href="/signup">Get started</a>
          <a class="button" data-variant="ghost" data-size="lg" href="/docs">Read the docs</a>
        </div>
      </div>
    </div>
  </section>

  <section class="center" style="--wel-center-max: 70rem">
    <div class="grid" data-align="rows">
      <article class="card">
        <header class="card-header"><h3>Feature one</h3></header>
        <div class="card-body"><p>…</p></div>
        <footer class="card-footer"><a href="…">Learn more</a></footer>
      </article>
      <!-- more cards; subgrid keeps footers aligned -->
    </div>
  </section>

  <!-- data-theme (≥1.0.1) re-resolves every token for the subtree AND paints
       its own surface + ink — no inline background needed (theming.md, Level 2) -->
  <section data-theme="dark">
    <div class="cover" style="--wel-cover-min-height: 30dvb">
      <div class="center" data-principal style="--wel-center-max: 70rem">
        <div class="cluster" style="--wel-cluster-justify: space-between">
          <h2>Ready?</h2>
          <a class="button" data-variant="primary" data-size="lg" href="/signup">Start free</a>
        </div>
      </div>
    </div>
  </section>

</main>
```

Note the CTA band: `data-theme="dark"` pins the scheme for the subtree and
every `light-dark()` token follows — no manual dark palette. (Needs
welkincss ≥1.0.1; and remember Level-1 themes declare on
`:root, [data-theme]` so they survive inside the band.)

## Recipe: form page (settings / signup)

Native validation; errors in markup; `.stack` for rhythm; `.switcher` pairs
fields that sit side-by-side when space allows.

```html
<main class="center">
  <div class="stack">
  <h1>Create account</h1>

  <form class="stack" style="max-inline-size: 28rem">
    <div class="switcher" style="--wel-switcher-threshold: 24rem">
      <div class="field">
        <label for="first">First name</label>
        <input id="first" name="first" autocomplete="given-name" required
               aria-describedby="first-error">
        <p class="error" id="first-error">Enter your first name.</p>
      </div>
      <div class="field">
        <label for="last">Last name</label>
        <input id="last" name="last" autocomplete="family-name">
      </div>
    </div>

    <div class="field">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required
             aria-describedby="email-hint email-error">
      <p class="hint" id="email-hint">We never share it.</p>
      <p class="error" id="email-error">Enter a valid email address.</p>
    </div>

    <div class="field">
      <label for="plan">Plan</label>
      <select class="select" id="plan" name="plan" required>
        <option value="">Choose…</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
    </div>

    <div class="field">
      <input id="tos" name="tos" type="checkbox" required>
      <label for="tos">I accept the terms</label>
    </div>

    <div class="cluster">
      <button class="button" data-variant="primary">Create account</button>
      <a class="button" data-variant="ghost" href="/login">I have an account</a>
    </div>
  </form>
  </div>
</main>
```

## Recipe: dashboard / app page

`.sidebar-layout` for nav + content; stat cards on `.grid`; data on `.table`
with sorting; toasts for async feedback.

```html
<script type="module" src=".../dist/js/table-sort.js"></script>
<script type="module" src=".../dist/js/wel-toast-region.js"></script>

<main class="sidebar-layout"
      style="--wel-sidebar-width: 16rem; padding: var(--wel-space-gutter)">

  <nav class="stack" aria-label="Sections">
    <ul class="stack" style="list-style: none; padding: 0; --wel-stack-gap: var(--wel-space-1)">
      <li><a href="#" aria-current="page">Overview</a></li>
      <li><a href="#">Reports</a></li>
      <li><a href="#">Settings</a></li>
    </ul>
  </nav>

  <section class="stack">
    <div class="cluster" style="--wel-cluster-justify: space-between">
      <h1>Overview</h1>
      <button class="button" data-variant="primary" data-dialog-open="new-item">New item…</button>
    </div>

    <div class="grid" style="--wel-grid-min: 12rem">
      <article class="card">
        <header class="card-header"><h3>Sessions</h3></header>
        <div class="card-body"><p style="font-size: var(--wel-text-size-3)">18,003</p></div>
      </article>
      <article class="card">
        <header class="card-header"><h3>Sign-ups <span class="badge" data-tone="success">+9%</span></h3></header>
        <div class="card-body"><p style="font-size: var(--wel-text-size-3)">455</p></div>
      </article>
    </div>

    <div class="table-scroller" tabindex="0" role="region" aria-labelledby="rows-cap">
      <table class="table" data-sortable data-hover>
        <caption id="rows-cap">Recent items</caption>
        <thead>
          <tr>
            <th scope="col" data-sort="text">Name</th>
            <th scope="col" data-sort="date">Created</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><th scope="row">Alpha</th><td data-sort-value="2026-07-01">1 Jul 2026</td>
              <td><span class="badge" data-tone="success">Active</span></td></tr>
        </tbody>
      </table>
    </div>
  </section>

</main>

<wel-toast-region aria-label="Notifications"></wel-toast-region>
```

The sidebar stacks automatically when its share of the container gets too
small — no breakpoints to manage. Notes:

- The sidebar nav is the **first child** (use `data-side="end"` to flip).
- The `.sidebar-layout` doesn't come with gutters — own them (padding on
  `main`, as above, or wrap in `.center`).
- There is no side-nav component: plain links in a `.stack` are the
  sanctioned pattern; mark the active link `aria-current="page"` and style
  that state yourself (one small unlayered rule).
- Dialogs can live anywhere (a closed `<dialog>` renders no box); react to
  the result via the `close` event + `dialog.returnValue` — see
  components.md → Dialog.

## Recipe: FAQ / docs section

```html
<main class="center">
  <div class="stack">
  <h1>FAQ</h1>
  <div class="accordion">
    <details name="faq">
      <summary><h3>Question one?</h3></summary>
      <p>Answer.</p>
    </details>
    <details name="faq">
      <summary><h3>Question two?</h3></summary>
      <p>Answer.</p>
    </details>
  </div>
  </div>
</main>
```

Drop the shared `name` for independently openable items (the default
recommendation).

## Composition cheat notes

- Space between page sections: outer `.stack` with a bigger
  `--wel-stack-gap`; nested stacks keep their own rhythm.
- Toolbar rows (heading + actions): `.cluster` with
  `--wel-cluster-justify: space-between`.
- Anything + cards that must align: `.grid[data-align="rows"]`.
- Density theming (compact dashboards): shrink `--wel-space-anchor-min/max`
  on a wrapper — every gap and padding follows.

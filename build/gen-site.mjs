// Docs-site generator (docs/11, T-51 + T-67 review). Static HTML from
// the markdown sources, styled EXCLUSIVELY by the built Welkin bundle —
// dogfooding is the acceptance test (AC-126) — and every page works with
// JS disabled (AC-127): navigation is plain links, content is
// server-rendered, the only JS is the component modules themselves
// (inlined verbatim so the site works from file://) plus the toast
// demo's wiring. The no-JS toggle is a static "--nojs" twin page.
//
//   node build/gen-site.mjs          -> site/
//
// Component pages render the spec verbatim (the spec IS the docs —
// _TEMPLATE.md structure) with tier badges on the Behaviour-tiers
// headings, PLUS a live demo embedded from the reviewed demo page
// (examples/components.html) — spec fences document (they contain
// example scripts, dead hrefs, "…" elisions); the demo page
// demonstrates. Demos sit OUTSIDE .prose, whose descendant list/table
// rules otherwise fight component styling (T-67). Core docs (01–12),
// ADRs, and the changelog render under /docs.
//
// Known limitation: docs links into the repo source tree (../src/…,
// ../build/…) pass through untranslated — they resolve in the repo, not
// on the site. Rewrite to a code-host URL once the repo has a remote.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { PAIRINGS } from './token-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'site');
const read = (...p) => readFileSync(join(root, ...p), 'utf8');

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'components'), { recursive: true });
mkdirSync(join(out, 'docs'), { recursive: true });
mkdirSync(join(out, 'examples'), { recursive: true });

// The site links the real build output — regenerate first (npm run build).
cpSync(join(root, 'dist'), join(out, 'dist'), { recursive: true });
for (const f of readdirSync(join(root, 'examples')).filter((f) => f.endsWith('.html'))) {
  cpSync(join(root, 'examples', f), join(out, 'examples', f));
}

// Where the page being rendered lands in site/ ('', 'docs', 'components') —
// set before each parse so .md cross-references rewrite relative to it.
let outDir = '';
const rel = (to) => (outDir === to ? '' : outDir === '' ? `${to}/` : `../${to}/`);

marked.use({
  // Keep spec-relative links working inside the generated tree. Both core
  // docs and ADRs land in site/docs/; specs land in site/components/.
  walkTokens(t) {
    if (t.type !== 'link' || !/^[\w./-]+\.md(#|$)/.test(t.href)) return;
    const [path, hash] = t.href.split('#');
    const p = path.replace(/^\.\//, '');
    let m;
    if ((m = p.match(/^(?:\.\.\/|docs\/)?decisions\/([\w-]+)\.md$/))) t.href = rel('docs') + m[1];
    else if ((m = p.match(/^docs\/(\d\d-[\w-]+)\.md$/))) t.href = rel('docs') + m[1];
    else if ((m = p.match(/^docs\/components\/([\w-]+)\.md$/))) t.href = rel('components') + m[1];
    else if ((m = p.match(/^(?:\.\.\/)?(\d\d-[\w-]+)\.md$/))) t.href = rel('docs') + m[1];
    else if ((m = p.match(/^(?:\.\.\/)?components\/([\w-]+)\.md$/))) t.href = rel('components') + m[1];
    else if ((m = p.match(/^([\w-]+)\.md$/))) {
      // bare sibling reference: same directory as the source
      t.href = (outDir === '' ? 'docs/' : '') + m[1];
    } else return;
    t.href += '.html' + (hash ? `#${hash}` : '');
  },
});

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// a11y post-pass on rendered markdown: code blocks scroll horizontally, so
// they must be keyboard-reachable (axe scrollable-region-focusable), and the
// spec meta table's deliberately blank header cells must not be <th> (axe
// empty-table-header).
const a11y = (html) => html
  .replace(/<pre>/g, '<pre tabindex="0">')
  .replace(/<th><\/th>/g, '<td></td>');

/* Which JS module (if any) a component page needs, for the no-JS loader. */
const MODULES = {
  tabs: ['wel-tabs.js'],
  combobox: ['wel-combobox.js'],
  toast: ['wel-toast-region.js'],
  dialog: ['wel-dialog.js'],
  tooltip: ['wel-tooltip.js'],
  carousel: ['carousel-buttons.js'],
  table: ['table-sort.js'],
  'popover-menu': ['wel-anchor.js'],
};

const TIER_TONE = { Core: 'success', Enhanced: 'info', 'JS enhancement': 'warning' };

function page({ title, crumb, body, depth, modules = [], extra = '', prose = true, self = '', nojs = false }) {
  const p = '../'.repeat(depth);
  // Modules are inlined VERBATIM (as the demo page does at build): a
  // dynamic import() is CORS-blocked under file://, and the docs must
  // work double-clicked from disk (T-67 review — dead tab/toast demos).
  // The no-JS toggle (docs/11 req 4) is a static twin page ("--nojs")
  // with the scripts simply absent — both directions are plain links,
  // no chrome JS at all.
  const loader = nojs ? '' : modules
    .map((m) => `<script type="module">\n${read('js', m)}</script>`).join('\n');
  const toggle = modules.length ? (nojs
    ? `
        <li><a href="${self}.html">Re-enable JS</a></li>`
    : `
        <li><a href="${self}--nojs.html">Disable JS (show the no-JS baseline)</a></li>`) : '';
  const banner = nojs ? `
    <div class="alert" data-tone="info"><p class="alert-title">No-JS mode</p>
    <p>This copy of the page loads no JavaScript — everything below is the
    component's no-JS baseline, exactly as a scripting-disabled visitor gets it.</p></div>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Welkin</title>
<link rel="stylesheet" href="${p}dist/welkin.css">
</head>
<body>
<!-- The page container the navbar collapses against (doc 06 naming
     convention; scaffolding container-name is the host page's job). -->
<div style="container-name: page; container-type: inline-size">
  <header class="navbar">
    <nav aria-label="Site">
      <a class="navbar-brand" href="${p}index.html">Welkin</a>
      <button class="navbar-menu-button" popovertarget="site-menu">
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h12M2 8h12M2 12h12"/></svg>
        Menu
      </button>
      <ul class="navbar-menu" id="site-menu" popover>
        <li><a href="${p}index.html#components">Components</a></li>
        <li><a href="${p}index.html#docs">Design docs</a></li>
        <li><a href="${p}examples/components.html">Demos</a></li>
        <li><a href="${p}playground.html">Playground</a></li>
        <li><a href="https://www.npmjs.com/package/welkincss">npm</a></li>${toggle}
      </ul>
    </nav>
  </header>
</div>
<main class="center" style="--wel-center-max: 52rem">
  <div class="stack">
    ${crumb ? `<nav class="breadcrumb" aria-label="You are here"><ol>
      <li><a href="${p}index.html">Welkin</a></li><li aria-current="page">${esc(crumb)}</li>
    </ol></nav>` : ''}${banner}
    ${prose ? '<div class="prose">' : '<div class="stack">'}
${body}
    </div>
  </div>
</main>
<footer class="center" style="--wel-center-max: 52rem">
  <p><small>Built with Welkin itself — this site loads <code>dist/welkin.css</code>
  and nothing else. MIT.</small></p>
</footer>
${loader}${nojs ? '' : extra}
</body>
</html>
`;
}

/* Live demos come from the reviewed demo page, not auto-lifted spec
   fences (T-67: fences carry example <script> blocks, root-absolute
   hrefs, and elided "…" content — they document, the demo demonstrates).
   Split examples/components.html into its <h2>-titled sections. */
const demoDoc = read('examples', 'components.html');
const demoSections = {};
for (const m of demoDoc.matchAll(/<section class="stack">\s*<h2>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>\n(?=\s*(?:<section|<\/main>))/g)) {
  // demo-page links are relative to examples/; re-home them for components/
  demoSections[m[1].trim()] = m[2]
    .replace(/href="\.\.\/docs\/decisions\/([\w-]+)\.md"/g, 'href="../docs/$1.html"')
    .replace(/href="\.\.\/docs\/components\/([\w-]+)\.md"/g, 'href="$1.html"')
    .replace(/href="\.\.\/docs\/([\w-]+)\.md"/g, 'href="../docs/$1.html"');
}
const DEMO_TITLE = {
  button: 'Button', card: 'Card', 'badge-tag': 'Badge &amp; Tag',
  'alert-callout': 'Alert / Callout', breadcrumb: 'Breadcrumb', table: 'Table',
  prose: 'Prose', 'progress-spinner-skeleton': 'Progress / Spinner / Skeleton',
  navbar: 'Navbar', pagination: 'Pagination', select: 'Select',
  'form-controls': 'Form controls &amp; validation', tooltip: 'Tooltip',
  carousel: 'Carousel', dialog: 'Dialog', 'popover-menu': 'Popover / Dropdown menu',
  accordion: 'Accordion', tabs: 'Tabs', combobox: 'Combobox', toast: 'Toast',
};

/* A section may invoke elements that live in ANOTHER section of the demo
   page (the popover menu opens the dialog section's #confirm-delete).
   Pull any missing invocation targets in, so every button on the page
   does something. */
function resolveTargets(html) {
  for (const m of html.matchAll(/(?:data-dialog-open|popovertarget)="([\w-]+)"/g)) {
    const id = m[1];
    if (new RegExp(`id="${id}"`).test(html)) continue;
    const el = demoDoc.match(new RegExp(`<(dialog|div)[^>]*id="${id}"[\\s\\S]*?</\\1>`));
    if (el) html += `\n${el[0]}`;
  }
  return html;
}

// The toast demo buttons are wired by a page script on the demo page;
// the toast docs page carries the same wiring.
const TOAST_WIRING = `
<script type="module">
  const region = document.querySelector('wel-toast-region');
  let n = 0;
  document.getElementById('toast-status')?.addEventListener('click', () =>
    region.push(\`Upload \${++n} complete.\`, { tone: 'info' }));
  document.getElementById('toast-sticky')?.addEventListener('click', () =>
    region.push('Working offline — changes stored locally.', { tone: 'warning', duration: 0 }));
  document.getElementById('toast-error')?.addEventListener('click', () =>
    region.push('Connection lost.', { tone: 'danger' }));
</script>`;

function componentPage(file) {
  const name = basename(file, '.md');
  const md = read('docs', 'components', file);
  const title = (md.match(/^# Component: (.+)$/m) || [, name])[1];

  outDir = 'components';
  let spec = a11y(marked.parse(md));
  // Tier badges (docs/11 req 5): label the Behaviour-tiers headings.
  spec = spec.replace(/<h3>(Core|Enhanced|JS enhancement)([^<]*)<\/h3>/g, (m, tier, rest) =>
    `<h3>${tier}${rest} <span class="badge" data-tone="${TIER_TONE[tier]}">${
      tier === 'Core' ? 'works everywhere' : tier === 'Enhanced' ? '@supports-gated' : '≤ 2 KB module'
    }</span></h3>`);

  const demo = demoSections[DEMO_TITLE[name]];
  const fence = (md.match(/## HTML structure[\s\S]*?```html\n([\s\S]*?)```/) || [])[1];
  const modules = MODULES[name] || [];
  let live = '';
  if (demo) {
    live = `
<section class="stack">
<h2>Live demo</h2>
${resolveTargets(demo)}
${fence ? `<div class="accordion" data-variant="separated"><details>
<summary>Canonical markup (from the spec)</summary>
<pre tabindex="0"><code>${esc(fence)}</code></pre>
</details></div>` : ''}
</section>`;
  }

  // Demos live OUTSIDE .prose — its descendant list/table rules tie with
  // component styles on specificity and win on source order (T-67:
  // misrendered examples). Split the spec around the demo instead.
  const at = spec.indexOf('<h2>Anatomy</h2>');
  const body = at === -1 || !live
    ? `<div class="prose">\n${spec}\n</div>${live}`
    : `<div class="prose">\n${spec.slice(0, at)}\n</div>${live}\n<div class="prose">\n${spec.slice(at)}\n</div>`;

  const opts = {
    title, crumb: title, body, depth: 1, prose: false, self: name, modules,
    extra: name === 'toast' ? TOAST_WIRING : '',
  };
  writeFileSync(join(out, 'components', `${name}.html`), page(opts));
  // Static no-JS twin for pages that otherwise load modules (docs/11 req 4).
  if (modules.length || name === 'toast') {
    writeFileSync(join(out, 'components', `${name}--nojs.html`), page({ ...opts, nojs: true }));
  }
  return { name, title };
}

function docPage(file, dir = ['docs']) {
  const name = basename(file, '.md');
  const md = read(...dir, file).replace(/^---[\s\S]*?---\n/, ''); // frontmatter off
  const title = (md.match(/^# (.+)$/m) || [, name])[1].replace(/^\d\d — /, '');
  outDir = 'docs';
  writeFileSync(join(out, 'docs', `${name}.html`),
    page({ title, crumb: title, body: a11y(marked.parse(md)), depth: 1 }));
  return { name, title };
}

const components = readdirSync(join(root, 'docs', 'components'))
  .filter((f) => f.endsWith('.md') && f !== '_TEMPLATE.md')
  .map(componentPage);

// The frozen spec template is linked from the core docs — publish it too
// (plain doc rendering; it has no live example of its own).
outDir = 'components';
writeFileSync(join(out, 'components', '_TEMPLATE.html'), page({
  title: 'Component spec template',
  crumb: 'Spec template',
  body: a11y(marked.parse(read('docs', 'components', '_TEMPLATE.md'))),
  depth: 1,
}));

const docs = readdirSync(join(root, 'docs'))
  .filter((f) => /^\d\d-.*\.md$/.test(f))
  .map((f) => docPage(f));

const adrs = readdirSync(join(root, 'docs', 'decisions'))
  .filter((f) => f.startsWith('ADR-'))
  .map((f) => docPage(f, ['docs', 'decisions']));

docPage('CHANGELOG.md', []); // linked from the README on the index page

// Index: README intro + component/doc directories, all Welkin-styled.
const readme = read('README.md');
outDir = '';
const indexBody = `
${a11y(marked.parse(readme))}
<h2 id="components">Components</h2>
<div class="grid" style="--wel-grid-min: 14rem">
${components.map((c) => `  <article class="card">
    <header class="card-header"><h3><a class="card-link" href="components/${c.name}.html">${esc(c.title)}</a></h3></header>
  </article>`).join('\n')}
</div>
<h2 id="docs">Design documentation</h2>
<ul>
${docs.map((d) => `  <li><a href="docs/${d.name}.html">${esc(d.title)}</a></li>`).join('\n')}
</ul>
<h3>Decision records</h3>
<ul>
${adrs.map((d) => `  <li><a href="docs/${d.name}.html">${esc(d.title)}</a></li>`).join('\n')}
</ul>`;

writeFileSync(join(out, 'index.html'),
  page({ title: 'Welkin — the CSS-first toolkit', crumb: '', body: indexBody, depth: 0 }));

// ---- Token playground (docs/11 req 2, T-52): Level 1 theming, live. ----
// Editors write semantic tokens onto :root inline style; the whole page
// (it IS Welkin-styled) restyles live. Contrast read-outs recompute the
// doc-05 guaranteed pairings in both schemes via per-scheme probe
// elements (light-dark() resolves at computed-value time) + a canvas
// round-trip that turns any resolved <color> into sRGB bytes.
const CONTROLS = [
  ['--wel-color-accent', 'Accent colour', 'color', ''],
  ['--wel-radius-control', 'Control radius', 'range', 'min="0" max="1.5" step="0.125" data-unit="rem"'],
  ['--wel-radius-surface', 'Surface radius', 'range', 'min="0" max="2" step="0.125" data-unit="rem"'],
  ['--wel-text-anchor-min', 'Type anchor (min)', 'range', 'min="0.85" max="1.25" step="0.025" data-unit="rem"'],
  ['--wel-space-anchor-min', 'Density anchor (min)', 'range', 'min="0.15" max="0.45" step="0.025" data-unit="rem"'],
];
const playgroundBody = `
<h1>Token playground</h1>
<p class="prose">A Welkin theme is a token file — nothing else
(<a href="docs/10-theming-and-customisation.html">doc 10</a>, Level 1). Every control
below writes one semantic token onto <code>:root</code>; hover/active shades, tints,
and the focus ring re-derive in the browser. This page is styled by the same tokens,
so it restyles itself.</p>
<noscript><div class="alert" data-tone="info"><p class="alert-title">The playground
needs JavaScript</p><p>The toolkit doesn't — but live editing does. The theme format
it teaches is just the CSS shown below.</p></div></noscript>

<div class="sidebar-layout" style="--wel-sidebar-width: 18rem">
  <form class="stack" id="pg" aria-label="Theme tokens">
${CONTROLS.map(([token, label, type, attrs]) => `    <div class="field">
      <label for="pg${token}">${label} <code>${token}</code></label>
      <input id="pg${token}" data-token="${token}" type="${type}" ${attrs}>
    </div>`).join('\n')}
    <div class="field">
      <label for="pg-font">Body font <code>--wel-text-font-body</code></label>
      <select id="pg-font" data-token="--wel-text-font-body">
        <option value="system-ui, sans-serif">System sans</option>
        <option value="Georgia, 'Times New Roman', serif">Serif</option>
        <option value="'Segoe UI', Tahoma, sans-serif">Humanist</option>
        <option value="ui-monospace, Consolas, monospace">Mono</option>
      </select>
    </div>
    <div class="cluster">
      <button class="button" data-variant="primary" type="button" id="pg-copy">Copy theme CSS</button>
      <button class="button" data-variant="ghost" type="reset" id="pg-reset">Reset</button>
    </div>
  </form>

  <div class="stack">
    <h2>Sample</h2>
    <div class="cluster">
      <button class="button" type="button" data-variant="primary">Primary</button>
      <button class="button" type="button" data-variant="secondary">Secondary</button>
      <span class="badge" data-tone="info">Badge</span>
    </div>
    <article class="card"><header class="card-header"><h3>Card surface</h3></header>
      <div class="card-body"><p>Body text with a <a href="#">link</a> and
      <code>inline code</code>.</p></div></article>
    <div class="field"><label for="pg-sample-input">Input</label>
      <input id="pg-sample-input" type="text" placeholder="Focus me"></div>
  </div>
</div>

<h2>Your theme</h2>
<pre tabindex="0"><code id="pg-css">:root {
  /* move a control to start your theme */
}</code></pre>

<h2>Guaranteed contrast pairings, live</h2>
<p class="prose">The same pairings CI verifies (<code>build/check-contrast.mjs</code>),
recomputed against your tokens in both schemes. If your accent breaks one, the
read-out goes red before your users do.</p>
<table id="pg-pairs">
  <thead><tr><th>Foreground on background</th><th>Used for</th><th>Floor</th>
  <th>Light</th><th>Dark</th></tr></thead>
  <tbody>
${PAIRINGS.map(([fg, bg, min, why]) => `    <tr data-fg="${fg}" data-bg="${bg}" data-min="${min}">
      <td><code>${fg.slice(12)}</code> / <code>${bg.slice(12)}</code></td>
      <td>${esc(why)}</td><td>${min}:1</td><td>—</td><td>—</td>
    </tr>`).join('\n')}
  </tbody>
</table>
<div hidden><div id="pg-probe-light" data-theme="light"></div><div id="pg-probe-dark" data-theme="dark"></div></div>`;

const playgroundScript = `
<script type="module">
  const rootStyle = document.documentElement.style;
  const dirty = new Map();
  const css2d = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

  const toBytes = (probe, token) => {
    probe.style.color = 'var(' + token + ')';
    const resolved = getComputedStyle(probe).color; // light-dark() resolved per probe scheme
    css2d.fillStyle = '#000'; css2d.fillRect(0, 0, 1, 1);
    css2d.fillStyle = resolved; css2d.fillRect(0, 0, 1, 1);
    return css2d.getImageData(0, 0, 1, 1).data;
  };
  const lum = ([r, g, b]) => {
    const c = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  function contrast() {
    for (const row of document.querySelectorAll('#pg-pairs tbody tr')) {
      const { fg, bg, min } = row.dataset;
      ['light', 'dark'].forEach((scheme, i) => {
        const probe = document.getElementById('pg-probe-' + scheme);
        const r = ratio(toBytes(probe, fg), toBytes(probe, bg));
        const cell = row.cells[3 + i];
        const ok = r >= +min;
        cell.innerHTML = '<span class="badge" data-tone="' + (ok ? 'success' : 'danger') + '">'
          + r.toFixed(2) + ':1' + (ok ? '' : ' ✗') + '</span>';
      });
    }
  }

  function emit() {
    document.getElementById('pg-css').textContent = dirty.size
      ? ':root {\\n' + [...dirty].map(([t, v]) => '  ' + t + ': ' + v + ';').join('\\n') + '\\n}'
      : ':root {\\n  /* move a control to start your theme */\\n}';
  }

  document.getElementById('pg').addEventListener('input', (e) => {
    const el = e.target;
    const token = el.dataset.token;
    if (!token) return;
    const value = el.value + (el.dataset.unit || '');
    rootStyle.setProperty(token, value);
    dirty.set(token, value);
    emit(); contrast();
  });

  document.getElementById('pg-copy').addEventListener('click', function () {
    navigator.clipboard?.writeText(document.getElementById('pg-css').textContent);
    this.textContent = 'Copied ✓';
    setTimeout(() => { this.textContent = 'Copy theme CSS'; }, 1500);
  });

  document.getElementById('pg').addEventListener('reset', () => {
    for (const t of dirty.keys()) rootStyle.removeProperty(t);
    dirty.clear();
    requestAnimationFrame(() => { emit(); contrast(); });
  });

  // seed control positions from the live computed tokens
  const rs = getComputedStyle(document.documentElement);
  for (const el of document.querySelectorAll('#pg [data-token]')) {
    const v = rs.getPropertyValue(el.dataset.token).trim();
    if (el.type === 'range') el.value = parseFloat(v) || el.value;
    else if (el.type === 'color') {
      const [r, g, b] = toBytes(document.getElementById('pg-probe-light'), el.dataset.token);
      el.value = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
    }
  }
  contrast();
</script>`;

writeFileSync(join(out, 'playground.html'), page({
  title: 'Token playground',
  crumb: 'Playground',
  body: playgroundBody,
  depth: 0,
  prose: false,
  extra: playgroundScript,
}));

console.log(`site/ generated: index + ${components.length} components + ${docs.length} docs + ${adrs.length} ADRs + playground`);
if (!existsSync(join(out, 'dist', 'welkin.css'))) {
  console.error('dist/welkin.css missing from site — run npm run build first');
  process.exit(1);
}

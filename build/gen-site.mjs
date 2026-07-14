// Docs-site generator (docs/11, T-51). Static HTML from the markdown
// sources, styled EXCLUSIVELY by the built Welkin bundle — dogfooding is
// the acceptance test (AC-126), and every page works with JS disabled
// (AC-127): navigation is plain links, content is server-rendered, and
// the only site JS is the component modules themselves plus the loader
// that implements the no-JS toggle (a plain ?nojs=1 link, usable with
// scripting off in either direction).
//
//   node build/gen-site.mjs          -> site/
//
// Component pages render the spec verbatim (the spec IS the docs —
// _TEMPLATE.md structure), with: a live example lifted from the first
// "HTML structure" code fence, tier badges on the Behaviour-tiers
// headings, and the raw markup in a <details> accordion. Core docs
// (01–12) render under /docs. No client-side rendering anywhere.
//
// Known limitation: docs links into the repo source tree (../src/…,
// ../build/…) pass through untranslated — they resolve in the repo, not
// on the site. Rewrite to a code-host URL once the repo has a remote.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

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
    if ((m = p.match(/^(?:\.\.\/)?decisions\/([\w-]+)\.md$/))) t.href = rel('docs') + m[1];
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

function page({ title, crumb, body, depth, modules = [] }) {
  const p = '../'.repeat(depth);
  // The loader is the no-JS toggle (docs/11 req 4): with ?nojs=1 the
  // component modules are simply not injected. Both toggle directions
  // are plain links, so the toggle itself works with scripting off.
  const loader = modules.length ? `
<script type="module">
  if (!new URLSearchParams(location.search).has('nojs'))
    for (const m of ${JSON.stringify(modules)})
      import('${p}dist/js/' + m);
</script>` : '';
  const toggle = modules.length ? `
      <li><a id="nojs-toggle" href="?nojs=1">Disable JS (show the no-JS baseline)</a></li>` : '';
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
        <li><a href="https://www.npmjs.com/package/welkincss">npm</a></li>${toggle}
      </ul>
    </nav>
  </header>
</div>
<main class="center" style="--wel-center-max: 52rem">
  <div class="stack">
    ${crumb ? `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="${p}index.html">Welkin</a></li><li aria-current="page">${esc(crumb)}</li>
    </ol></nav>` : ''}
    <div class="prose">
${body}
    </div>
  </div>
</main>
<footer class="center" style="--wel-center-max: 52rem">
  <p><small>Built with Welkin itself — this site loads <code>dist/welkin.css</code>
  and nothing else. MIT.</small></p>
</footer>
<script type="module">
  // Round-trip affordance only; the links work without this script.
  const t = document.getElementById('nojs-toggle');
  if (t && new URLSearchParams(location.search).has('nojs')) {
    t.href = location.pathname;
    t.textContent = 'Re-enable JS';
  }
</script>${loader}
</body>
</html>
`;
}

/* Lift the first code fence of the "## HTML structure" section for the
   live example. */
function liveExample(md) {
  const m = md.match(/## HTML structure[\s\S]*?```html\n([\s\S]*?)```/);
  return m ? m[1] : null;
}

function componentPage(file) {
  const name = basename(file, '.md');
  const md = read('docs', 'components', file);
  const title = (md.match(/^# Component: (.+)$/m) || [, name])[1];

  outDir = 'components';
  let body = a11y(marked.parse(md));
  // Tier badges (docs/11 req 5): label the Behaviour-tiers headings.
  body = body.replace(/<h3>(Core|Enhanced|JS enhancement)([^<]*)<\/h3>/g, (m, tier, rest) =>
    `<h3>${tier}${rest} <span class="badge" data-tone="${TIER_TONE[tier]}">${
      tier === 'Core' ? 'works everywhere' : tier === 'Enhanced' ? '@supports-gated' : '≤ 2 KB module'
    }</span></h3>`);

  const example = liveExample(md);
  if (example) {
    const live = `
<h2>Live example</h2>
<p>The canonical markup from the spec, rendered by this page's stylesheet.
${MODULES[name] ? 'This component\'s JS module is loaded; use “Disable JS” above to see the no-JS baseline.' : 'No JavaScript involved.'}</p>
<div class="card" data-variant="outlined"><div class="card-body stack">
${example}
</div></div>
<div class="accordion" data-variant="separated"><details>
<summary>Markup</summary>
<pre tabindex="0"><code>${esc(example)}</code></pre>
</details></div>`;
    body = body.replace('<h2>Anatomy</h2>', `${live}\n<h2>Anatomy</h2>`);
  }

  writeFileSync(join(out, 'components', `${name}.html`),
    page({ title, crumb: title, body, depth: 1, modules: MODULES[name] || [] }));
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

console.log(`site/ generated: index + ${components.length} components + ${docs.length} docs + ${adrs.length} ADRs`);
if (!existsSync(join(out, 'dist', 'welkin.css'))) {
  console.error('dist/welkin.css missing from site — run npm run build first');
  process.exit(1);
}

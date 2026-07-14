// Welkin build (ADR-0002): concatenate, validate against browser targets, minify.
// The build never provides language features — source files are shippable CSS.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, cpSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import browserslist from 'browserslist';
import { transform, browserslistToTargets } from 'lightningcss';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');
const dist = join(root, 'dist');

const targets = browserslistToTargets(browserslist(undefined, { path: root }));

const cssIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.css')).sort().map((f) => join(dir, f))
    : [];

// Bundle contents per ADR-0003. Concat order is cosmetic — layer order is
// fixed by the first @layer declaration, which every file repeats.
const coreFiles = [
  join(src, 'layers.css'),
  join(src, 'reset.css'),
  ...cssIn(join(src, 'tokens')),
  ...cssIn(join(src, 'base')),
  ...cssIn(join(src, 'layout')),
];
const componentFiles = cssIn(join(src, 'components'));
// Opt-in modules (T-89): page-behaviour files that must never ride along in
// welkin.css — @view-transition opts every navigation in, so linking the
// dist/components file is the user's opt-in. Still emitted per-file below.
const OPT_IN = new Set(['view-transitions.css']);
const bundledComponents = componentFiles.filter((f) => !OPT_IN.has(basename(f)));
const fullFiles = [...coreFiles, ...bundledComponents, join(src, 'utilities.css')];

// The canonical layer pre-declaration is THE ordering contract (doc 04,
// ADR-0003: any subset of dist files concatenates correctly in any order).
// Lightning drops "unused" names from it — which silently re-introduces
// first-use ordering (e.g. combobox declares states with no variants;
// loaded before button, variants would outrank states). So: unminified
// artifacts are the raw source concat (source = shipped, comments and the
// full layer line intact; Lightning still runs as validator), and minified
// artifacts get the canonical line re-prepended.
const LAYER_LINE = readFileSync(join(src, 'layers.css'), 'utf8')
  .split('\n').find((l) => l.startsWith('@layer'));

function compile(code, filename, minify) {
  const { code: out, warnings } = transform({
    filename,
    code: Buffer.from(code),
    targets,
    minify,
    errorRecovery: false,
  });
  for (const w of warnings) console.warn(`  warn ${filename}: ${w.message}`);
  return minify ? `${LAYER_LINE}\n${out.toString()}` : out.toString();
}

function emit(name, files) {
  const code = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  compile(code, `${name}.css`, false); // validate against targets
  writeFileSync(join(dist, `${name}.css`), code);
  writeFileSync(join(dist, `${name}.min.css`), compile(code, `${name}.min.css`, true));
  console.log(`  dist/${name}.css + .min.css (${files.length} source files)`);
}

mkdirSync(join(dist, 'components'), { recursive: true });

emit('welkin', fullFiles);
emit('welkin-core', coreFiles);

for (const f of componentFiles) {
  const name = basename(f, '.css');
  const code = readFileSync(f, 'utf8');
  compile(code, `components/${name}.css`, false); // validate
  writeFileSync(join(dist, 'components', `${name}.css`), code);
  writeFileSync(join(dist, 'components', `${name}.min.css`), compile(code, `components/${name}.min.css`, true));
}
if (componentFiles.length) console.log(`  dist/components/ (${componentFiles.length} components)`);

// Never ship the ordering bug again: every dist stylesheet must open with
// the full canonical layer declaration.
for (const f of [
  join(dist, 'welkin.css'), join(dist, 'welkin.min.css'),
  join(dist, 'welkin-core.css'), join(dist, 'welkin-core.min.css'),
  ...readdirSync(join(dist, 'components')).map((f) => join(dist, 'components', f)),
]) {
  const txt = readFileSync(f, 'utf8');
  // the declaration must appear before any rule block opens
  const head = txt.slice(0, txt.indexOf('{'));
  if (!head.includes(LAYER_LINE)) {
    console.error(`dist artifact missing canonical layer line: ${f}`);
    process.exit(1);
  }
}

// JS-enhanced components ship as plain ESM, copied verbatim (ADR-0011).
const jsDir = join(root, 'js');
if (existsSync(jsDir) && readdirSync(jsDir).length) {
  cpSync(jsDir, join(dist, 'js'), { recursive: true });
  console.log('  dist/js/');

  // Demo page: ES-module src is CORS-blocked under file://, so the modules
  // are inlined between markers — the page must keep working double-clicked
  // from disk (T-50 review). An inline module script may keep its exports.
  const demoPath = join(root, 'examples', 'components.html');
  if (existsSync(demoPath)) {
    const demo = readFileSync(demoPath, 'utf8');
    const start = demo.indexOf('<!-- inline-modules:start');
    const end = demo.indexOf('<!-- inline-modules:end -->');
    if (start !== -1 && end !== -1) {
      const afterStart = demo.indexOf('-->', start) + 3;
      const inlined = readdirSync(jsDir)
        .filter((f) => f.endsWith('.js'))
        .map((f) => `<script type="module">\n${readFileSync(join(jsDir, f), 'utf8')}</script>`)
        .join('\n');
      writeFileSync(demoPath, demo.slice(0, afterStart) + '\n' + inlined + '\n' + demo.slice(end));
      console.log('  examples/components.html (modules inlined)');
    }
  }
}

console.log('build complete');

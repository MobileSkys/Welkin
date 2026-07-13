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
const fullFiles = [...coreFiles, ...componentFiles, join(src, 'utilities.css')];

function compile(code, filename, minify) {
  const { code: out, warnings } = transform({
    filename,
    code: Buffer.from(code),
    targets,
    minify,
    errorRecovery: false,
  });
  for (const w of warnings) console.warn(`  warn ${filename}: ${w.message}`);
  return out.toString();
}

function emit(name, files) {
  const code = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  writeFileSync(join(dist, `${name}.css`), compile(code, `${name}.css`, false));
  writeFileSync(join(dist, `${name}.min.css`), compile(code, `${name}.min.css`, true));
  console.log(`  dist/${name}.css + .min.css (${files.length} source files)`);
}

mkdirSync(join(dist, 'components'), { recursive: true });

emit('welkin', fullFiles);
emit('welkin-core', coreFiles);

for (const f of componentFiles) {
  const name = basename(f, '.css');
  const code = readFileSync(f, 'utf8');
  writeFileSync(join(dist, 'components', `${name}.css`), compile(code, `components/${name}.css`, false));
  writeFileSync(join(dist, 'components', `${name}.min.css`), compile(code, `components/${name}.min.css`, true));
}
if (componentFiles.length) console.log(`  dist/components/ (${componentFiles.length} components)`);

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

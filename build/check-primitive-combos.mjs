// Layout-primitive combo lint (docs/06, T-95): every primitive owns
// `display`, so two primitives on one element silently disable one of them
// (which one depends on stylesheet load order — .center's measure cap dying
// under .stack's flex shipped in five showcases before this existed).
// Scans class attributes in examples/**/*.html; exit 1 on any combo.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'examples');
const PRIMITIVES = new Set([
  'stack', 'cluster', 'center', 'grid', 'switcher', 'sidebar-layout', 'cover', 'frame',
]);

function* htmlFiles(d) {
  for (const entry of readdirSync(d)) {
    const p = join(d, entry);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (entry.endsWith('.html')) yield p;
  }
}

let violations = 0;
for (const file of htmlFiles(dir)) {
  const src = readFileSync(file, 'utf8');
  for (const [i, line] of src.split('\n').entries()) {
    for (const m of line.matchAll(/class="([^"]*)"/g)) {
      const prims = m[1].split(/\s+/).filter((c) => PRIMITIVES.has(c));
      if (prims.length > 1) {
        violations++;
        console.error(
          `FAIL ${relative(root, file)}:${i + 1}: "${prims.join(' ')}" on one element — compose by nesting (docs/06)`
        );
      }
    }
  }
}

if (violations) {
  console.error(`${violations} primitive combo(s) in examples/`);
  process.exit(1);
}
console.log('primitive-combo check passed: one primitive per element in examples/');

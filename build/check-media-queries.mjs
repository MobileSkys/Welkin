// No-viewport-MQ audit (docs/06 doctrine, T-29): components respond to
// their container, never the viewport. The only @media allowed in src/ are
// user-preference queries (prefers-*) and input-capability queries
// (hover/pointer — e.g. the button spec's `@media (hover: hover)` hover
// gate); page-level scaffolding is the named exception and would be
// allowlisted here explicitly if it ever needs one. Exit 1 on any
// violation. Runs in `npm run lint` and CI.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const srcDir = fileURLToPath(new URL('../src/', import.meta.url));

function* cssFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) yield* cssFiles(p);
    else if (entry.endsWith('.css')) yield p;
  }
}

let violations = 0;
for (const file of cssFiles(srcDir)) {
  const src = readFileSync(file, 'utf8');
  for (const [i, line] of src.split('\n').entries()) {
    const m = line.match(/@media\s*([^{]+)/);
    if (m && !/^\(\s*(prefers-|(any-)?(hover|pointer)\s*:)/.test(m[1].trim())) {
      violations++;
      console.error(
        `FAIL ${path.relative(srcDir, file)}:${i + 1}: viewport media query "${m[1].trim()}" — use container queries (docs/06)`
      );
    }
  }
}

if (violations) {
  console.error(`${violations} viewport media quer${violations === 1 ? 'y' : 'ies'} in src/`);
  process.exit(1);
}
console.log('media-query audit passed: only prefers-* queries in src/');

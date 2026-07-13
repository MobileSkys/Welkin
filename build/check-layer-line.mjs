// Lint (docs/04, authoring conventions): every source file must begin with the
// canonical @layer order line — this is what makes any-subset, any-order
// concatenation safe (ADR-0003).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CANONICAL =
  '@layer reset, tokens, base, layout, components, variants, states, utilities, overrides;';

const src = fileURLToPath(new URL('../src', import.meta.url));

function* cssFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* cssFiles(p);
    else if (entry.endsWith('.css')) yield p;
  }
}

let failures = 0;
for (const file of cssFiles(src)) {
  // First statement must be the canonical line; leading comments are allowed.
  const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').trimStart();
  if (!code.startsWith(CANONICAL)) {
    console.error(`missing/incorrect canonical @layer line: ${file}`);
    failures++;
  }
}

if (failures) {
  console.error(`${failures} file(s) failed the layer-line check`);
  process.exit(1);
}
console.log('layer-line check passed');

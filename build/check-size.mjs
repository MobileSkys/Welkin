// CSS/JS size-budget gate (docs/12, ADR-0011). Budgets are min+gzip bytes,
// defined in build/budgets.json. Run after `npm run build`; exits 1 over
// budget. Never silent: prints every artifact it measured.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const budgets = JSON.parse(readFileSync(join(root, 'build', 'budgets.json'), 'utf8'));

if (!existsSync(dist)) {
  console.error('dist/ missing — run `npm run build` before the size gate');
  process.exit(1);
}

const gz = (p) => gzipSync(readFileSync(p)).length;
let failures = 0;

function check(label, path, budget) {
  const size = gz(path);
  const ok = size <= budget;
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'OVER'} ${label}: ${size} / ${budget} bytes (min+gzip)`);
}

for (const name of ['welkin.min.css', 'welkin-core.min.css']) {
  check(name, join(dist, name), budgets[name]);
}

const compDir = join(dist, 'components');
if (existsSync(compDir)) {
  for (const f of readdirSync(compDir).filter((f) => f.endsWith('.min.css'))) {
    check(`components/${f}`, join(compDir, f), budgets[`components/${f}`] ?? budgets['per-component-css']);
  }
}

const jsDir = join(dist, 'js');
if (existsSync(jsDir)) {
  for (const f of readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
    check(`js/${f}`, join(jsDir, f), budgets['per-js-module']);
  }
}

if (failures) {
  console.error(`${failures} artifact(s) over budget`);
  process.exit(1);
}
console.log('size budget check passed');

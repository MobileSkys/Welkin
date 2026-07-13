// Contrast checker (docs/05 pairing table, docs/09): verifies every pairing
// components are allowed to consume, in BOTH schemes, from the actual token
// source — not by eye. Exit 1 on any failure. Runs in `npm run lint` and CI.
// Pairing list, parser, and evaluator live in build/token-lib.mjs (shared
// with the docs/05 appendix generator).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PAIRINGS, parseDecls, evaluate, ratio } from './token-lib.mjs';

const src = readFileSync(
  fileURLToPath(new URL('../src/tokens/color.css', import.meta.url)),
  'utf8'
);
const decls = parseDecls(src);

let failures = 0;
for (const scheme of ['light', 'dark']) {
  for (const [fg, bg, min, why] of PAIRINGS) {
    const r = ratio(
      evaluate(`var(${fg})`, scheme, decls),
      evaluate(`var(${bg})`, scheme, decls)
    );
    const ok = r >= min;
    if (!ok) {
      failures++;
      console.error(
        `FAIL [${scheme}] ${fg} on ${bg}: ${r.toFixed(2)}:1 < ${min}:1 (${why})`
      );
    }
  }
}

if (failures) {
  console.error(`${failures} pairing(s) below threshold`);
  process.exit(1);
}
console.log(`contrast check passed: ${PAIRINGS.length} pairings x 2 schemes`);

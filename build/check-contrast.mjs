// Contrast checker (docs/05 pairing table, docs/09): verifies every pairing
// components are allowed to consume, in BOTH schemes, from the actual token
// source — not by eye. Exit 1 on any failure. Runs in `npm run lint` and CI.
// Pairing list, parser, and evaluator live in build/token-lib.mjs (shared
// with the docs/05 appendix generator).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PAIRINGS, parseDecls, evaluate, ratio, inSrgbGamut } from './token-lib.mjs';

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

// ---- The accent-contrast derivation promises text-on-accent >= 4.5:1 for
// ANY in-gamut accent (T-130, docs/05) — not just the shipped default.
// Sweep the oklch space with the accent overridden and hold it to that.
// (Scheme is irrelevant here: the override is a literal and the derivation
// depends only on the accent itself.)
let sweep = 0;
let sweepFailures = 0;
for (let l = 0; l <= 1.001; l += 0.05) {
  for (let h = 0; h < 360; h += 30) {
    for (const c of [0, 0.08, 0.16, 0.24]) {
      const accent = { l, c, h };
      if (!inSrgbGamut(accent, 1e-3)) continue;
      const d = new Map(decls);
      d.set('--wel-color-accent', `oklch(${l.toFixed(2)} ${c} ${h})`);
      const r = ratio(
        evaluate('var(--wel-color-accent-contrast)', 'light', d),
        evaluate('var(--wel-color-accent)', 'light', d)
      );
      sweep++;
      if (r < 4.5) {
        sweepFailures++;
        console.error(`SWEEP FAIL accent oklch(${l.toFixed(2)} ${c} ${h}): text-on-accent ${r.toFixed(2)}:1`);
      }
    }
  }
}
if (sweepFailures) {
  console.error(`${sweepFailures} swept accent(s) below 4.5:1`);
  process.exit(1);
}
console.log(`contrast check passed: ${PAIRINGS.length} pairings x 2 schemes + ${sweep} swept accents`);

// Contrast checker (docs/05 pairing table, docs/09): verifies every pairing
// components are allowed to consume, in BOTH schemes, from the actual token
// source — not by eye. Exit 1 on any failure. Runs in `npm run lint` and CI.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(
  fileURLToPath(new URL('../src/tokens/color.css', import.meta.url)),
  'utf8'
);

// ---- Pairings: fg on bg, minimum ratio, why. This list IS the pairing
// table's contract; extend it when doc 05's appendix gains rows.
const PAIRINGS = [
  ['--wel-color-ink', '--wel-color-surface', 4.5, 'body text'],
  ['--wel-color-ink', '--wel-color-surface-raised', 4.5, 'text on cards'],
  ['--wel-color-ink', '--wel-color-surface-sunken', 4.5, 'text on sunken (code blocks)'],
  ['--wel-color-ink-muted', '--wel-color-surface', 4.5, 'secondary text'],
  ['--wel-color-ink-muted', '--wel-color-surface-raised', 4.5, 'secondary text on cards'],
  ['--wel-color-ink-faint', '--wel-color-surface', 3, 'placeholders/decorative (non-text floor)'],
  ['--wel-color-accent', '--wel-color-surface', 4.5, 'links / accent text'],
  ['--wel-color-accent-hover', '--wel-color-surface', 4.5, 'hovered links'],
  ['--wel-color-accent-active', '--wel-color-surface', 4.5, 'active links'],
  ['--wel-color-accent-contrast', '--wel-color-accent', 4.5, 'text on accent (primary button)'],
  ['--wel-color-border-strong', '--wel-color-surface', 3, 'control borders (1.4.11)'],
  ['--wel-color-info', '--wel-color-surface', 4.5, 'info text'],
  ['--wel-color-success', '--wel-color-surface', 4.5, 'success text'],
  ['--wel-color-warning', '--wel-color-surface', 4.5, 'warning text'],
  ['--wel-color-danger', '--wel-color-surface', 4.5, 'danger text (form errors)'],
  ['--wel-color-info', '--wel-color-info-tint', 4.5, 'info alert title on tint'],
  ['--wel-color-success', '--wel-color-success-tint', 4.5, 'success alert title on tint'],
  ['--wel-color-warning', '--wel-color-warning-tint', 4.5, 'warning alert title on tint'],
  ['--wel-color-danger', '--wel-color-danger-tint', 4.5, 'danger alert title on tint'],
  ['--wel-color-ink', '--wel-color-info-tint', 4.5, 'alert body on tint'],
  ['--wel-color-ink', '--wel-color-danger-tint', 4.5, 'alert body on tint'],
  ['--wel-color-ink', '--wel-color-accent-tint', 4.5, 'text on hover tint (pagination/table rows)'],
];

// ---- Parse custom-property declarations out of the source.
const decls = new Map();
for (const m of src.matchAll(/(--wel-[\w-]+)\s*:\s*([^;]+);/g)) {
  // Last declaration wins, matching the cascade within one file.
  decls.set(m[1], m[2].trim());
}

// ---- Tiny value evaluator -> {l, c, h, alpha} in oklch space.
function evaluate(expr, scheme, depth = 0) {
  if (depth > 16) throw new Error(`var() resolution too deep at: ${expr}`);
  expr = expr.trim();

  const varMatch = expr.match(/^var\((--[\w-]+)\)$/);
  if (varMatch) {
    const v = decls.get(varMatch[1]);
    if (!v) throw new Error(`undefined token ${varMatch[1]}`);
    return evaluate(v, scheme, depth + 1);
  }

  if (expr.startsWith('light-dark(')) {
    const [a, b] = splitArgs(expr.slice('light-dark('.length, -1));
    return evaluate(scheme === 'light' ? a : b, scheme, depth + 1);
  }

  if (expr.startsWith('color-mix(')) {
    const args = splitArgs(expr.slice('color-mix('.length, -1));
    if (args[0].trim() !== 'in oklch') throw new Error(`only oklch mixing supported: ${expr}`);
    const pm = args[1].trim().match(/^(.*?)\s+([\d.]+)%$/);
    const c1 = evaluate(pm[1], scheme, depth + 1);
    const p = Number(pm[2]) / 100;
    const c2 = evaluate(args[2], scheme, depth + 1);
    return {
      l: c1.l * p + c2.l * (1 - p),
      c: c1.c * p + c2.c * (1 - p),
      h: mixHue(c1.h, c2.h, p),
      alpha: 1,
    };
  }

  // Relative color syntax: oklch(from <source> <l> <c> <h>) with calc on l.
  const rcs = expr.match(/^oklch\(from\s+(.+?)\s+(calc\([^)]+\)|[\d.%]+|l)\s+(c|[\d.]+)\s+(h|[\d.]+)\)$/);
  if (rcs) {
    const base = evaluate(rcs[1], scheme, depth + 1);
    let l = base.l;
    const calcM = rcs[2].match(/^calc\(l\s*([+-])\s*([\d.]+)\)$/);
    if (calcM) l = calcM[1] === '-' ? base.l - Number(calcM[2]) : base.l + Number(calcM[2]);
    else if (rcs[2] !== 'l') l = parseComponent(rcs[2]);
    return {
      l,
      c: rcs[3] === 'c' ? base.c : Number(rcs[3]),
      h: rcs[4] === 'h' ? base.h : Number(rcs[4]),
      alpha: 1,
    };
  }

  const lit = expr.match(/^oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%]+)?\)$/);
  if (lit) return { l: parseComponent(lit[1]), c: Number(lit[2]), h: Number(lit[3]), alpha: 1 };

  throw new Error(`unsupported colour expression: ${expr}`);
}

const parseComponent = (s) => (s.endsWith('%') ? Number(s.slice(0, -1)) / 100 : Number(s));

function mixHue(h1, h2, p) {
  let d = h2 - h1;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return (h1 + d * (1 - p) + 360) % 360;
}

function splitArgs(s) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((a) => a.trim());
}

// ---- oklch -> linear sRGB -> WCAG relative luminance.
function luminance({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3, M = m_ ** 3, S = s_ ** 3;
  let r = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  let g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  let bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;
  // Gamut-clamp: primitive ramps are chosen in-gamut; tiny excursions from
  // mixing are clamped like browsers render them.
  [r, g, bl] = [r, g, bl].map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

const ratio = (fg, bg) => {
  const [y1, y2] = [luminance(fg), luminance(bg)];
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
};

// ---- Run.
let failures = 0;
for (const scheme of ['light', 'dark']) {
  for (const [fg, bg, min, why] of PAIRINGS) {
    const r = ratio(
      evaluate(`var(${fg})`, scheme),
      evaluate(`var(${bg})`, scheme)
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

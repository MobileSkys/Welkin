// Shared token machinery for build-time checks and docs generation:
// parses `src/tokens/*.css` custom-property declarations and @property
// registrations, evaluates colour expressions to oklch, computes WCAG
// ratios, and owns the PAIRINGS contract consumed by both the contrast
// checker (build/check-contrast.mjs) and the docs/05 appendix generator
// (build/gen-token-appendix.mjs).
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const TOKENS_DIR = fileURLToPath(new URL('../src/tokens/', import.meta.url));

// ---- Pairings: fg on bg, minimum ratio, why. This list IS the pairing
// table's contract; the docs/05 appendix is generated from it and the
// checker verifies it in both schemes.
export const PAIRINGS = [
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
  ['--wel-color-accent-hover', '--wel-color-accent-tint', 4.5, 'ghost/secondary button text on hover tint'],
  ['--wel-color-border-strong', '--wel-color-surface-raised', 3, 'outlined card border on card bg (1.4.11)'],
  ['--wel-color-ink-muted', '--wel-color-surface-sunken', 4.5, 'neutral badge/tag label'],
];

// ---- Parse custom-property declarations out of a token source file.
// @media blocks are stripped first (e.g. the reduced-motion re-declaration
// of --wel-motion) so the inventory reflects default values; within what
// remains, last declaration wins, matching the cascade within one file.
export function parseDecls(src) {
  const decls = new Map();
  for (const m of stripAtMedia(src).matchAll(/(--wel-[\w-]+)\s*:\s*([^;]+);/g)) {
    decls.set(m[1], m[2].trim());
  }
  return decls;
}

// ---- Parse @property registrations: name -> { syntax, initialValue }.
export function parseRegistrations(src) {
  const regs = new Map();
  const re = /@property\s+(--wel-[\w-]+)\s*\{([^}]*)\}/g;
  for (const m of src.matchAll(re)) {
    const body = m[2];
    const syntax = body.match(/syntax:\s*"([^"]*)"/)?.[1] ?? null;
    const initialValue = body.match(/initial-value:\s*([^;]+);/)?.[1]?.trim() ?? null;
    regs.set(m[1], { syntax, initialValue });
  }
  return regs;
}

function stripAtMedia(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const at = src.indexOf('@media', i);
    if (at === -1) { out += src.slice(i); break; }
    out += src.slice(i, at);
    let j = src.indexOf('{', at);
    let depth = 1;
    while (depth > 0 && ++j < src.length) {
      if (src[j] === '{') depth++;
      if (src[j] === '}') depth--;
    }
    i = j + 1;
  }
  return out;
}

// ---- Load every token source file, in name order: [{ file, src, decls, regs }].
export function loadTokenFiles() {
  return readdirSync(TOKENS_DIR)
    .filter((f) => f.endsWith('.css'))
    .sort()
    .map((file) => {
      const src = readFileSync(path.join(TOKENS_DIR, file), 'utf8');
      return { file, src, decls: parseDecls(src), regs: parseRegistrations(src) };
    });
}

// ---- Tiny value evaluator -> {l, c, h, alpha} in oklch space.
export function evaluate(expr, scheme, decls, depth = 0) {
  if (depth > 16) throw new Error(`var() resolution too deep at: ${expr}`);
  expr = expr.trim();

  const varMatch = expr.match(/^var\((--[\w-]+)\)$/);
  if (varMatch) {
    const v = decls.get(varMatch[1]);
    if (!v) throw new Error(`undefined token ${varMatch[1]}`);
    return evaluate(v, scheme, decls, depth + 1);
  }

  if (expr.startsWith('light-dark(')) {
    const [a, b] = splitArgs(expr.slice('light-dark('.length, -1));
    return evaluate(scheme === 'light' ? a : b, scheme, decls, depth + 1);
  }

  if (expr.startsWith('color-mix(')) {
    const args = splitArgs(expr.slice('color-mix('.length, -1));
    if (args[0].trim() !== 'in oklch') throw new Error(`only oklch mixing supported: ${expr}`);
    const pm = args[1].trim().match(/^(.*?)\s+([\d.]+)%$/);
    const c1 = evaluate(pm[1], scheme, decls, depth + 1);
    const p = Number(pm[2]) / 100;
    const c2 = evaluate(args[2], scheme, decls, depth + 1);
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
    const base = evaluate(rcs[1], scheme, decls, depth + 1);
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

export function splitArgs(s) {
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
export function luminance({ l, c, h }) {
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

export const ratio = (fg, bg) => {
  const [y1, y2] = [luminance(fg), luminance(bg)];
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
};

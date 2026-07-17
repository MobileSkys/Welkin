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
  ['--wel-color-surface', '--wel-color-ink', 4.5, 'tooltip inverted bubble'],
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
  ['--wel-color-ink', '--wel-color-success-tint', 4.5, 'alert body on tint'],
  ['--wel-color-ink', '--wel-color-warning-tint', 4.5, 'alert body on tint'],
  ['--wel-color-ink', '--wel-color-danger-tint', 4.5, 'alert body on tint'],
  ['--wel-color-ink', '--wel-color-accent-tint', 4.5, 'text on hover tint (pagination/table rows)'],
  ['--wel-color-accent-hover', '--wel-color-accent-tint', 4.5, 'ghost/secondary button text on hover tint'],
  ['--wel-color-border-strong', '--wel-color-surface-raised', 3, 'outlined card border on card bg (1.4.11)'],
  ['--wel-color-ink-muted', '--wel-color-surface-sunken', 4.5, 'neutral badge/tag label'],
  ['--wel-color-info', '--wel-color-surface-sunken', 4.5, 'links in neutral alert (subtree accent retint)'],
  ['--wel-color-accent', '--wel-color-surface-sunken', 3, 'progress fill vs track (1.4.11)'],
  ['--wel-color-accent', '--wel-color-border', 3, 'spinner arc vs track (1.4.11)'],
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

  // Relative color syntax, oklch destination: oklch(from <source> <l> <c> <h>).
  // Components are channel names, numbers, or calc()/clamp() arithmetic
  // over the source channels (evalCalc).
  if (expr.startsWith('oklch(from ')) {
    const parts = splitTop(expr.slice('oklch(from '.length, -1));
    if (parts.length !== 4) throw new Error(`unsupported relative colour: ${expr}`);
    const base = evaluate(parts[0], scheme, decls, depth + 1);
    const vars = { l: base.l, c: base.c, h: base.h };
    return {
      l: evalComponent(parts[1], vars),
      c: evalComponent(parts[2], vars),
      h: evalComponent(parts[3], vars),
      alpha: 1,
    };
  }

  // Relative color syntax, xyz-d65 destination — the accent-contrast flip
  // (docs/05). Channels may reference y, the source's linear luminance;
  // browsers compute it from the SPECIFIED colour, before gamut mapping,
  // so it is exposed un-clamped here too.
  if (expr.startsWith('color(from ')) {
    const parts = splitTop(expr.slice('color(from '.length, -1));
    if (parts[1] !== 'xyz-d65' || parts.length !== 5) {
      throw new Error(`only xyz-d65 relative colours supported: ${expr}`);
    }
    const base = evaluate(parts[0], scheme, decls, depth + 1);
    const vars = { y: linearY(base) };
    return xyzToOklch(
      evalComponent(parts[2], vars),
      evalComponent(parts[3], vars),
      evalComponent(parts[4], vars)
    );
  }

  const lit = expr.match(/^oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%]+)?\)$/);
  if (lit) return { l: parseComponent(lit[1]), c: Number(lit[2]), h: Number(lit[3]), alpha: 1 };

  throw new Error(`unsupported colour expression: ${expr}`);
}

const parseComponent = (s) => (s.endsWith('%') ? Number(s.slice(0, -1)) / 100 : Number(s));

// ---- One relative-colour channel: a channel name, a number, or arithmetic.
function evalComponent(s, vars) {
  if (s in vars) return vars[s];
  if (/^[\d.]+%?$/.test(s)) return parseComponent(s);
  if (/^(calc|clamp|min|max)\(/.test(s)) return evalCalc(s, vars);
  throw new Error(`unsupported colour component: ${s}`);
}

// ---- Split a relative-colour body on top-level whitespace (parens bind).
function splitTop(s) {
  const parts = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) { parts.push(cur); cur = ''; }
      continue;
    }
    cur += ch;
  }
  if (cur) parts.push(cur);
  return parts;
}

// ---- Tiny calc()/clamp() arithmetic over channel variables — enough for
// the token derivations (lightness steps, the luminance flip). Supports
// + - * / ( ), min/max/clamp, `infinity`, numbers (± %), and the names in
// `vars`. NaN (0 * infinity, exactly at a flip boundary) is censored to
// zero, matching CSS top-level calculation censoring.
export function evalCalc(expr, vars = {}) {
  const toks = expr.match(/\d+\.?\d*%?|\.\d+%?|[a-zA-Z][a-zA-Z-]*|[()+\-*/,]/g) ?? [];
  let i = 0;
  const peek = () => toks[i];
  const expect = (t) => {
    if (toks[i++] !== t) throw new Error(`expected '${t}' in: ${expr}`);
  };
  function primary() {
    const t = toks[i++];
    if (t === undefined) throw new Error(`unexpected end of: ${expr}`);
    if (t === '(') { const v = sum(); expect(')'); return v; }
    if (t === '-') return -primary();
    if (t === '+') return primary();
    if (t === 'infinity') return Infinity;
    if (t === 'calc') { expect('('); const v = sum(); expect(')'); return v; }
    if (t === 'min' || t === 'max' || t === 'clamp') {
      expect('(');
      const args = [sum()];
      while (peek() === ',') { i++; args.push(sum()); }
      expect(')');
      if (t === 'min') return Math.min(...args);
      if (t === 'max') return Math.max(...args);
      return Math.min(Math.max(args[1], args[0]), args[2]);
    }
    if (t in vars) return vars[t];
    if (/^[\d.]/.test(t)) return parseComponent(t);
    throw new Error(`unknown token '${t}' in: ${expr}`);
  }
  function term() {
    let v = primary();
    while (peek() === '*' || peek() === '/') {
      v = toks[i++] === '*' ? v * primary() : v / primary();
    }
    return v;
  }
  function sum() {
    let v = term();
    while (peek() === '+' || peek() === '-') {
      v = toks[i++] === '+' ? v + term() : v - term();
    }
    return v;
  }
  const out = sum();
  if (i !== toks.length) throw new Error(`trailing tokens in: ${expr}`);
  return Number.isNaN(out) ? 0 : out;
}

// ---- XYZ (D65) -> oklch, for xyz-destination relative colours.
export function xyzToOklch(x, y, z) {
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return { l: L, c: Math.hypot(a, b), h: (Math.atan2(b, a) * 180 / Math.PI + 360) % 360, alpha: 1 };
}

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

// ---- oklch -> linear sRGB (un-clamped; may excurse outside [0,1]).
function linearRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3, M = m_ ** 3, S = s_ ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

// ---- WCAG relative luminance, as RENDERED. Gamut-clamp first: primitive
// ramps are chosen in-gamut; tiny excursions from mixing are clamped like
// browsers render them.
export function luminance(color) {
  const [r, g, b] = linearRgb(color).map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---- Linear luminance of the SPECIFIED colour (no gamut clamp) — what the
// y channel of an xyz-d65 relative colour sees in the browser.
export function linearY(color) {
  const [r, g, b] = linearRgb(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---- Is a colour inside the sRGB gamut (within rounding)?
export function inSrgbGamut(color, eps = 1e-4) {
  return linearRgb(color).every((v) => v >= -eps && v <= 1 + eps);
}

export const ratio = (fg, bg) => {
  const [y1, y2] = [luminance(fg), luminance(bg)];
  return (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
};

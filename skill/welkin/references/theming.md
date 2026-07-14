# Welkin theming & tokens

> Source: docs 05 (design tokens), 10 (theming), ADR-0007 (dark mode). Token
> names are semver-governed API — everything here is stable across 1.x.

**A theme is a token file. Nothing else.** Only custom-property declarations —
no selectors targeting components, no specificity, no `!important`. If your
"theme" contains a component selector, it's an override and belongs in the
escape hatches at the bottom. ("File" means content, not packaging: an inline
`<style>` `:root { … }` block in a single-file page is equally a theme — the
rule is *token declarations only*, wherever they live.)

## Token grammar and tiers

```
--wel-{category}-{concept}[-{variant}][-{state}]
```

Categories: `color`, `text`, `space`, `radius`, `border`, `shadow`, `motion`,
`focus-ring`, plus one namespace per component (`button`, `card`, …).

| Tier | Examples | Themes may set? |
|------|----------|-----------------|
| Primitive | `--wel-blue-500` (oklch 12-step ramps: grey/blue/green/amber/red) | Rarely — palette swaps only |
| Semantic | `--wel-color-accent`, `--wel-radius-control` | **Yes — primary theming surface** |
| Component | `--wel-button-bg`, `--wel-card-padding` | One-off scoped surgery only (Level 3) |

Boundary rules: components consume only semantic/component tokens; **themes
override only semantic/primitive tokens**. Every component token defaults to a
semantic token, so setting semantics restyles everything coherently.

## Level 1 — retheme the system (the 80% case)

Semantic tokens on `:root, [data-theme]` — both, always. Welkin's colour
tokens are typed, so they resolve where declared; Welkin (≥1.0.1)
re-declares its palette on every `[data-theme]` subtree root to make
scheme pinning and sub-brand derivation work, and a `:root`-only theme
is shadowed inside those subtrees. A complete brand theme is ~10 lines:

```css
/* my-brand.css — a complete Welkin theme */
:root, [data-theme] {
  --wel-color-accent: oklch(60% 0.19 145);        /* brand green */
  --wel-text-font-body: "Inter", system-ui, sans-serif;
  --wel-text-font-display: "Fraunces", serif;
  --wel-radius-control: 0.25rem;                  /* squarer buttons/inputs */
  --wel-radius-surface: 1rem;                     /* rounder cards */
  --wel-space-anchor-min: 0.85rem;                /* denser layouts */
}
```

Setting `--wel-color-accent` **alone** re-derives hover (`l - 0.06`), active
(`l - 0.10`), focus ring, tinted backgrounds, and selection colours — the
derivation formulas live in the token layer (`oklch(from …)` / `color-mix()`).
Never enumerate hover/active shades by hand.

### The semantic colour roles

| Token | Role |
|-------|------|
| `--wel-color-surface` / `-surface-raised` / `-surface-sunken` | Page bg / cards / wells & code blocks |
| `--wel-color-ink` / `-ink-muted` / `-ink-faint` | Text hierarchy (faint = placeholders, non-text only) |
| `--wel-color-accent` (+ derived `-hover/-active/-tint/-contrast`) | Brand / interactive |
| `--wel-color-border` / `-border-strong` | Dividers / control borders |
| `--wel-color-info/-success/-warning/-danger` (+ `-tint` each) | `data-tone` axes (alerts, badges, validation) |

### Non-colour knobs worth knowing

- **Type:** fluid modular scale `--wel-text-size--1 … -6` driven by anchors
  `--wel-text-anchor-min/max` (1rem/1.125rem) and ratios `--wel-text-ratio-min/max`
  (1.2/1.25). Fonts: `--wel-text-font-body/-display/-mono` (system stacks, no
  bundled webfonts). `--wel-text-measure: 65ch` caps line length (`.prose`, `.center`).
- **Space:** fluid steps `--wel-space-1 … -9` from `--wel-space-anchor-min/max`
  (0.25rem/0.3125rem) — shrink/grow anchors for density. `--wel-space-gutter`
  = default container padding (alias of `-5`).
- **Shape:** `--wel-radius-control` (buttons/inputs, 0.375rem) and
  `--wel-radius-surface` (cards/dialogs, 0.75rem) set product personality;
  scale `--wel-radius-sm/-md/-lg/-full` behind them.
- **Elevation:** `--wel-shadow-1 … -4`, all built from `--wel-shadow-color` —
  dark mode already deepens it; themes tune one token.
- **Motion:** durations `--wel-motion-duration-1..4` (100–500ms), easings
  `--wel-motion-ease[-in/-out/-spring]`. Global `--wel-motion` multiplier goes
  to `0` under `prefers-reduced-motion` — never write raw durations; multiply:
  `calc(var(--wel-motion-duration-2) * var(--wel-motion))`.
- **Focus:** `--wel-focus-ring-color` (defaults to accent), `-width`, `-offset` —
  consumed by the single global `:focus-visible` rule. Don't write your own
  focus styles.

## Dark mode — you get it for free

`color-scheme: light dark` on `:root`; every semantic colour is defined once
with `light-dark(lightVal, darkVal)`. Consequences:

- A default page already follows the OS scheme — **do not** write
  `@media (prefers-color-scheme: dark)` blocks or duplicate token sets.
- Pin a subtree: `<section data-theme="dark">` (dark hero on a light page) or
  `data-theme="light"` — it just pins `color-scheme`; all tokens follow.
- When theming colours, supply both halves at the definition site:
  ```css
  :root { --wel-color-accent: light-dark(oklch(48% 0.19 145), oklch(72% 0.17 145)); }
  ```
  A single non-`light-dark()` value applies to both schemes — check it works
  in both, or it'll fail contrast in one.

## Level 2 — scoped themes (`[data-theme]` subtrees)

Any token block can scope to a subtree. Two orthogonal uses:

- **Scheme pinning:** `data-theme="dark"` / `"light"` (above). Requires
  welkincss ≥1.0.1 (in 1.0.0 the pin only retinted native widgets). The
  pinned subtree re-resolves every `light-dark()` token AND paints its own
  surface + ink (a base rule on `[data-theme]`), so
  `<section data-theme="dark">` alone gives a dark band on a light page.
  Under forced-colors the pin deliberately un-pins — the system palette wins.
- **Named sub-brands:** restyle a section without touching the page theme:
  ```css
  [data-theme="campaign"] { --wel-color-accent: oklch(60% 0.2 30); }
  ```

## Level 3 — component-token surgery (one-offs)

Component tokens are the sanctioned one-off hook — scoped, inline if need be,
still no selectors into internals:

```css
.pricing .button { --wel-button-radius: 999px; }  /* pill buttons here only */
```

You're setting the component's **published knobs** (listed per component in
components.md), not fighting its CSS. This is also how composition works:
a card that wants muted buttons sets `--wel-button-*` tokens on itself — it
never selects `.button`.

**"One-off" describes the mechanism, not a scope limit.** A site-wide designer
mandate ("pill primary buttons everywhere") is still Level 3 — just widen the
selector: `.button[data-variant="primary"] { --wel-button-radius: 999px; }`.
Scope it to the component class (or a variant of it), not `:root` — components
define their token defaults on their own root, which would shadow an inherited
`:root` value.

## Contrast: your duty after theming

Shipped tokens guarantee WCAG contrast via an audited pairing table (31
pairings, both schemes, CI-enforced at 4.5:1 text / 3:1 non-text). **Changing
a colour token transfers that duty to you.** Rules of thumb:

- Keep accent lightness near the shipped band (light ≈ L 0.54, dark ≈ L 0.71)
  and the derived hover/active/contrast shades stay safe. Keep chroma near the
  shipped range too (≤ ~0.17 at those lightnesses) — high-chroma oklch values
  at mid lightness can fall outside sRGB and clip unpredictably per channel.
- After changing any colour token, spot-check: body text on surface, accent
  text on surface, `accent-contrast` on accent (primary button), tone colours
  on their tints.
- The docs-site token playground recomputes pairing ratios live — point the
  user there for manual theme work.

## Escape hatches (in order, when tokens aren't enough)

1. **`@layer overrides { … }`** — a named empty layer reserved for users;
   outranks every Welkin layer while keeping your code layered.
2. **Plain unlayered CSS** — beats all Welkin layers at any specificity by
   cascade design. One class selector overrides anything. A feature, not a hack.

## Anti-pattern gallery

| Anti-pattern | Instead |
|--------------|---------|
| `.button:hover { background: … !important }` | Set `--wel-color-accent` (L1) or `--wel-button-bg` (L3) |
| Retheming via primitives (`--wel-blue-500: green`) | Override semantic tokens |
| Copying component CSS into the project to edit | Tokens, then escape hatches |
| `.card > div:nth-child(2) { … }` | Internals aren't API — use part classes/tokens from the spec |
| Theme file containing component selectors | Keep themes to token declarations only |
| `@media (prefers-color-scheme: dark)` token blocks | `light-dark()` at the definition site |
| Raw `transition: 0.2s` durations | `calc(var(--wel-motion-duration-2) * var(--wel-motion))` |

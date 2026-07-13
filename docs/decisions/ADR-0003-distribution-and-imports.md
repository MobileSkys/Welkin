# ADR-0003 — Distribution: layered single bundle AND per-component files

**Status:** Accepted

## Context

Historically, à-la-carte CSS was fragile because rule order carried meaning — importing
component files in the wrong order broke overrides. Cascade layers remove that hazard:
order is fixed by the first `@layer` declaration, not by file concatenation order. That
makes offering both a bundle and per-component files nearly free.

## Decision

Ship three consumption forms, all plain CSS, importable via `<link>`, `@import`, or npm:

| Artifact | Contents |
|----------|----------|
| `welkin.css` (+ `.min`) | Everything: reset, tokens, base, layout, all components, utilities |
| `welkin-core.css` (+ `.min`) | reset + tokens + base + layout — the "classless-ish" foundation |
| `components/*.css` | One file per component, usable on top of core |

Because every source file self-declares the canonical `@layer` order first
([04-css-architecture.md](../04-css-architecture.md)), **any subset of files concatenates
correctly in any order**. Users can `<link>` core plus exactly the three components they
use.

JS-enhanced components ship their ESM module separately under `js/`
([ADR-0011](ADR-0011-js-delivery-mechanism.md)); CSS never imports JS and vice versa.

Channels: npm package, CDN (jsdelivr/unpkg via npm), and plain zip download. No mandatory
bundler, no install step for any channel.

## Consequences

- Minimal sites pay only for what they use without needing a tree-shaking toolchain.
- The build ([ADR-0002](ADR-0002-source-format-and-build.md)) is trivially simple:
  concatenate lists, minify.
- Per-component files must each be self-sufficient given core — enforced naturally by the
  scoping rules (components consume only tokens, never other components' selectors).

## Alternatives considered

- **Single bundle only** — simpler to document, but forces full payload on minimal sites
  for no technical reason once layers exist.
- **npm-only with required bundler** — violates "no build step required".
- **CSS modules / import maps machinery** — over-engineering; plain files suffice.

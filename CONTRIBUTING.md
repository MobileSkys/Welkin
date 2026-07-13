# Contributing to Welkin

Welkin is a **docs-first, CSS-first** toolkit. The design documentation in
[`docs/`](docs/) is the source of truth — code implements an Accepted spec, never the
other way round.

## Ground rules

- **Spec before code.** A component PR must implement its spec in
  [`docs/components/`](docs/components/) with **Status: Accepted**. If the spec needs
  changing, change the spec first (separate PR welcome).
- **Plain modern CSS, no preprocessors** ([ADR-0002](docs/decisions/ADR-0002-source-format-and-build.md)).
  Every source file is a valid standalone stylesheet a browser can load directly.
- **Hard-to-reverse decisions live in ADRs** ([docs/decisions/](docs/decisions/)).
  Propose a new ADR rather than arguing architecture in a PR thread.
- **Accessibility sections of specs are blocking acceptance criteria**
  ([docs/09-accessibility.md](docs/09-accessibility.md)).

## Authoring conventions (lint-enforced)

See [docs/04-css-architecture.md](docs/04-css-architecture.md) for the full table. The
short version:

- Every source file begins with the canonical `@layer` order line.
- One semantic class per component; variants via `data-*` attributes
  ([ADR-0001](docs/decisions/ADR-0001-variant-syntax.md)).
- Logical properties only; rem-based sizing (px for hairlines only); nesting ≤ 3;
  no IDs; `!important` only in `utilities`.
- Enhanced-tier features go inside `@supports` gates
  ([docs/03-browser-support-policy.md](docs/03-browser-support-policy.md)).

## Working locally

```sh
npm install
npm test        # stylelint + layer-line lint + build
```

`npm run build` emits `dist/welkin.css`, `dist/welkin-core.css`, per-component files,
and minified variants. No other toolchain is needed — or permitted.

## Pull requests

- Keep PRs to one concern (one component, one doc, one fix).
- Reference the spec/ADR the change implements.
- `npm test` must pass.

## Licence

By contributing you agree your contributions are licensed under the
[MIT License](LICENSE).

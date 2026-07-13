# Welkin Design Documentation

> The toolkit is named **Welkin** — decision closed 2026-07-13, full vetting record in
> [02-naming.md](02-naming.md). Canonical identifiers: npm `welkincss`, files
> `welkin.css`/`welkin-core.css`, token prefix `--wel-`, element prefix `wel-`.

This directory is the design documentation suite for Welkin — a CSS-first frontend toolkit
for websites. Every document here is written **before code** and governs what gets built.

## Reading order

Read the numbered documents in order. Later documents assume the earlier ones.

| # | Document | Purpose |
|---|----------|---------|
| — | [README.md](README.md) | This index |
| 01 | [Vision & Principles](01-vision-and-principles.md) | The constitution — who this is for, what we believe, what we refuse to do |
| 02 | [Naming](02-naming.md) | Naming criteria and candidates (**OPEN decision**) |
| 03 | [Browser Support Policy](03-browser-support-policy.md) | Core/Enhanced tier definitions, degradation contracts, `@supports` strategy |
| 04 | [CSS Architecture](04-css-architecture.md) | Cascade layers, scoping, specificity budget, file organisation |
| 05 | [Design Tokens](05-design-tokens.md) | Three-tier token system, colour, type, space, motion |
| 06 | [Layout System](06-layout-system.md) | Container-query-first layout primitives |
| 07 | [Component Model](07-component-model.md) | Component taxonomy, catalogue, and the spec template |
| 08 | [JavaScript Policy](08-javascript-policy.md) | The CSS → platform → JS decision ladder |
| 09 | [Accessibility](09-accessibility.md) | WCAG 2.2 AA standard and user-preference matrix |
| 10 | [Theming & Customisation](10-theming-and-customisation.md) | How designers theme the toolkit |
| 11 | [Docs Site & DX](11-docs-site-and-dx.md) | Requirements for the eventual documentation site |
| 12 | [Roadmap](12-roadmap.md) | Phasing from docs to v1.0 |

Component specifications live in [components/](components/) and each follows
[components/_TEMPLATE.md](components/_TEMPLATE.md).

Architectural decisions live in [decisions/](decisions/) as ADRs — see the
[ADR index](decisions/README.md).

## Rules of this documentation

1. **ADRs are the source of truth for decisions.** Topic documents *link* to ADRs; they never
   restate the reasoning or re-argue the decision. If a topic doc and an ADR disagree, the
   ADR wins and the topic doc has a bug.
2. **Every document carries frontmatter** with `status:` and `depends-on:` fields so the
   suite is self-auditing.
3. **Status legend:**
   - `Draft` — being written; content may change freely.
   - `Review` — content-complete; awaiting review.
   - `Accepted` — governs implementation; changes require the same scrutiny as a code API change.
4. **Component accessibility sections are blocking, not advisory** (see
   [09-accessibility.md](09-accessibility.md)).
5. **Canonical identifier spellings** (`welkincss`, `--wel-`, `<wel-…>`) are fixed by
   [02-naming.md](02-naming.md) — do not introduce variants.

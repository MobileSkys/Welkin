# ADR-0011 — JS delivery: light-DOM custom elements + data-attribute upgraders, plain ESM

**Status:** Accepted

## Context

The JS policy ([08-javascript-policy.md](../08-javascript-policy.md)) demands declarative,
dependency-free, no-build JavaScript with a structurally guaranteed no-JS baseline. The
delivery question: what form does that JS take?

## Decision

Two forms, chosen by whether the widget owns state:

1. **Vanilla custom elements for stateful widgets** — `<wel-tabs>`, `<wel-toast-region>`,
   `<wel-combobox>`. The element wraps and upgrades its **light-DOM children**; no shadow
   DOM. Custom elements provide lifecycle (connected/disconnected/attributeChanged),
   automatic upgrade of late-added content, and a natural declarative API (attributes) —
   the exact features hand-rolled `init()` scripts reinvent badly.
2. **Data-attribute upgraders for enhancements to existing semantics** — a module scans
   for `[data-sortable]` etc. (with a `MutationObserver` for late content) and enhances in
   place. Used when the markup is already a complete HTML structure (a `<table>`) and
   wrapping it in a custom element would be ceremony.

Common rules (restated from 08): plain ESM, one module per component, zero dependencies,
≤ 2 KB min+gzip each, attributes in / events out, state reflected to attributes.

**No shadow DOM** is a deliberate sub-decision: shadow encapsulation would block user CSS
and the token cascade — Welkin's whole styling model. Slots and style encapsulation solve
problems we've solved with layers and tokens; adopting them would fork the styling story.

## Consequences

- No-JS baseline is structural: pre-upgrade, the light DOM renders as ordinary HTML, so
  every widget's resting markup *is* its fallback.
- Works in any framework or none (custom elements are plain HTML to React/Vue/etc.);
  framework wrapper packages become trivial post-v1.
- FOUC-of-unupgraded-widget must be handled: specs define pre-upgrade styling via
  `:not(:defined)` where needed.
- We accept manual upgrade bookkeeping in data-attribute modules (observer boilerplate)
  for the cases where custom-element wrapping is unnatural.

## Alternatives considered

- **Data-attributes only, no custom elements** (Bootstrap 5 model) — rejected: reinvents
  lifecycle management per component; no late-content story without per-component
  observers; imperative `new bootstrap.Tab(el)` escape hatches creep in.
- **Shadow-DOM web components** — rejected above: fights the styling model.
- **A tiny shared runtime (Stimulus-like)** — rejected: a dependency by another name;
  per-component budget keeps modules small enough not to need it.

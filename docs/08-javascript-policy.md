---
status: Draft
depends-on: [01-vision-and-principles.md, 03-browser-support-policy.md]
---

# 08 — JavaScript Policy

JavaScript is the fallback, never the default. This document codifies that as an
enforceable ladder.

## The decision ladder

Every interactive behaviour must be implemented at the **highest rung that does the job
well**:

1. **Pure CSS.** Selectors, `:has()`, container queries, scroll-snap, transitions.
2. **HTML platform feature.** `<dialog>`, Popover API, `<details name>`, native form
   validation, `<datalist>`. The browser's implementation brings focus management,
   keyboard behaviour, and assistive-technology semantics for free.
3. **Declarative JS enhancement.** A small custom element or data-attribute upgrader
   ([ADR-0011](decisions/ADR-0011-js-delivery-mechanism.md)).

**Burden of proof:** a component may only occupy a lower rung with a written justification
in its spec's "Behaviour tiers" section, naming specifically what the higher rungs cannot
deliver. "Easier in JS" is not a justification; missing ARIA semantics or keyboard
interaction that CSS cannot express (e.g. roving tabindex in tabs) is.

The classic trap this forbids: the checkbox/radio-hack tab panel. It "works" in pure CSS
but cannot deliver `role="tablist"` semantics or arrow-key navigation — so tabs are rung 3
*by justification*, not rung 1 by hack. Accessibility outranks CSS purity.

## Delivery mechanism

Per [ADR-0011](decisions/ADR-0011-js-delivery-mechanism.md):

- **Stateful widgets** are vanilla **custom elements**: `<wel-tabs>`, `<wel-toast-region>`.
  Light DOM only — the element upgrades its existing children; no shadow DOM (user CSS
  must reach everything; the token/layer system is the encapsulation).
- **Enhancements to existing markup** (e.g. sortable table headers) are **data-attribute
  upgraders**: a module that finds `[data-sortable]` and enhances it.
- Plain **ESM**, zero dependencies, no build step, loaded with
  `<script type="module">` (deferred by nature). One module per component, importable
  individually.

## API rules

- **Declarative configuration only.** Attributes in, DOM events out. No constructor
  options objects, no imperative `show()`/`hide()` calls required for normal use
  (methods may exist as conveniences mirroring attribute changes, never as the only path).
- **No global namespace object** (`window.welkincss` does not exist), no plugin registry, no
  jQuery-style `$(el).component()` pattern.
- Events are `CustomEvent`s with the `wel-` prefix (`wel-tab-change`), bubbling, with
  useful `detail` payloads.
- State is reflected to attributes so CSS can style every JS state without JS-injected
  classes.

## The no-JS baseline

Restating the headline promise as an acceptance criterion: **every JS-enhanced component
defines its no-JS behaviour in its spec, and that behaviour must be usable — not merely
"not broken".**

| Component | No-JS baseline |
|-----------|----------------|
| Tabs | Panels render as stacked, headed sections — all content reachable |
| Combobox | Plain `<input>` + `<datalist>` suggestions |
| Toast region | Messages render as static alerts in document flow |
| Sortable table | Plain table; if server-side sort links exist they still work |

Custom elements achieve this structurally: before upgrade (or without JS) the element's
light-DOM children render as ordinary HTML, so specs must design that resting state as the
fallback.

## Size and dependency budget

- Per-component JS: **≤ ~2 KB min+gzip** — a testable release gate, not an aspiration.
- **Zero runtime dependencies.** No framework, no helper library, not even internal shared
  utilities beyond what stays under budget when duplicated.

## Interaction with the Enhanced CSS tier

JS must not duplicate what Enhanced CSS provides — **detect and yield**:

```js
if (!CSS.supports('anchor-name: --x')) {
  // JS positioning fallback only where CSS anchor positioning is absent
}
```

When a CSS feature graduates ([ADR-0012](decisions/ADR-0012-feature-graduation-criteria.md)),
the corresponding JS fallback path is deleted in the same release.

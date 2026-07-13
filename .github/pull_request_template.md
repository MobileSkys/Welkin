## What

<!-- One concern per PR. -->

## Spec / ADR

<!-- Link the Accepted spec or ADR this implements. Spec changes ride separately. -->

## Checklist

- [ ] `npm test` passes (stylelint, layer-line lint, build)
- [ ] Plain CSS only; canonical `@layer` line first in any new source file
- [ ] Logical properties; rem sizing; no IDs; nesting ≤ 3
- [ ] Enhanced-tier features gated behind `@supports`
- [ ] Accessibility section of the spec still holds (blocking)

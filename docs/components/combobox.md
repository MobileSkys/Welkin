# Component: Combobox

| | |
|---|---|
| **Status** | Accepted |
| **Tier** | JS-enhanced |
| **Stability** | Experimental |
| **Version target** | v1 |

*Batch D spec ([12](../12-roadmap.md)) — deferred from Phase 0 by decision
([07](../07-component-model.md)) until the form-controls field pattern and the JS
ladder exemplar ([tabs.md](tabs.md)) had settled the conventions this spec leans on.*

## Purpose

A text input with a filtered suggestion list: type to narrow, arrow to choose, Enter to
commit — for picking from a list too long for a `<select>` while still allowing free
text (country, tag, city fields). Do NOT use when the value must be one of a closed set
with few options ([select.md](select.md) — the platform picker is better at that), for
searching remote data with previews (that is a search pattern, post-v1), or when free
text isn't allowed at all (a combobox that silently rejects typing is a select wearing
a costume).

## Anatomy

```
┌─ .field ───────────────────────────────┐
│  label                                 │
│  ┌─ root (<wel-combobox>) ──────────┐  │
│  │  input[list] + datalist (authored)│ │
│  │  ┌─ listbox (generated) ───────┐ │  │
│  │  │ [option][option][option]    │ │  │
│  │  └─────────────────────────────┘ │  │
│  └──────────────────────────────────┘  │
│  hint / error                          │
└────────────────────────────────────────┘
```

Parts: root (`<wel-combobox>`, the popup positioning context); input (the authored
`<input list>`); datalist (the authored option source — stays the source of truth);
listbox + options (generated on upgrade).

## HTML structure

```html
<div class="field">
  <label for="country">Country</label>
  <wel-combobox>
    <input id="country" name="country" list="country-list">
    <datalist id="country-list">
      <option value="Denmark"></option>
      <option value="Germany"></option>
      <option value="Ghana"></option>
    </datalist>
  </wel-combobox>
  <p class="hint" id="country-hint">Start typing to filter.</p>
</div>
```

The authored markup is a native `<input list>` + `<datalist>` — **this is the API and
it is also the fallback** (ADR-0011): pre-upgrade or with JS off, the browser's own
datalist suggestions work as-is. The element nests *inside* `.field`
([form-controls.md](form-controls.md)), so label, hint, error, and validation styling
compose unchanged. On upgrade the module removes the `list` attribute (one suggestion
UI, not two), sets `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`,
`aria-controls` on the input, and generates the listbox. The datalist remains in the
DOM as the option source and is re-read on every open, so options may be swapped at any
time (e.g. fetched) with no module API.

## Variants & modifiers

| Attribute | Values | Effect |
|-----------|--------|--------|
| `filter` | *(absent)* = `substring`, `none` | `substring`: case-insensitive match anywhere in the value. `none`: never filter — for lists the server has already narrowed |

No `data-variant`/`data-size` axes in v1; the input inherits its styling from
[form-controls.md](form-controls.md).

## States

| State | Trigger selector | Visual treatment | How announced (a11y) |
|-------|------------------|------------------|----------------------|
| Focus | `:focus-visible` on input | Global focus ring | — |
| Expanded | `input[aria-expanded="true"]` | Listbox visible below the input | `aria-expanded` |
| Active option | `[role="option"][aria-selected="true"]` | `--wel-combobox-active-bg` fill | `aria-activedescendant` |
| Option hover | `:hover` (`@media (hover: hover)`) | Same fill as active | — |
| Invalid | `:user-invalid` / `[aria-invalid="true"]` on input | From form-controls, unchanged | Error via `aria-describedby` |

## Tokens consumed

| Component token | Default (semantic token) | `@property` typed | Notes |
|-----------------|--------------------------|-------------------|-------|
| `--wel-combobox-bg` | `var(--wel-color-surface-raised)` | — | Listbox panel |
| `--wel-combobox-ink` | `var(--wel-color-ink)` | — | Pairing partner of bg (05 table) |
| `--wel-combobox-border` | `var(--wel-color-border)` | — | Panel edge; THE edge in forced colors |
| `--wel-combobox-radius` | `var(--wel-radius-surface)` | — | |
| `--wel-combobox-shadow` | `var(--wel-shadow-3)` | — | |
| `--wel-combobox-active-bg` | `var(--wel-color-accent-tint)` | — | Active/hover option; tint/ink pairing |
| `--wel-combobox-max-block-size` | `18rem` | — | Listbox scrolls beyond this |

## Behaviour tiers

### Core (Baseline Widely Available)

Everything: the listbox is plain absolute positioning inside the `position: relative`
root — deliberately **not** a top-layer popover, so no anchor positioning is needed and
placement works identically everywhere. All styling keys to generated
roles/attributes. Pre-upgrade the native datalist UI functions.

### Enhanced (Baseline Newly Available)

| Feature | `@supports` gate | Enhancement | Fallback experience (contract ref in 03) |
|---------|------------------|-------------|------------------------------------------|
| None | — | The component is Core-complete; motion is inherited from form-controls/global tokens | — |

### JS enhancement

- **Ladder justification:** rung 2 (`<input list>` + `<datalist>`) delivers real
  suggestions but with unfixable gaps: the UA popup is unstylable (a themed system
  breaks visually at its most-used control), filtering behaviour varies by engine, and
  there is no `aria-activedescendant`/`aria-expanded` contract an author can style or
  test against. Rung 1 cannot express filtering or active-option state at all. The
  module's scope: mirror datalist options into a stylable listbox and manage
  active-descendant state — nothing the platform already does is reimplemented
  (caret movement, text editing, form participation, validation all stay native).
- **Element/module:** `<wel-combobox>` light-DOM custom element; `js/wel-combobox.js`,
  plain ESM, zero dependencies. ≤ 2 KB min+gzip.
- **Attributes (config in):** `filter` (table above). Everything else is the authored
  input/datalist.
- **Events (state out):** **none of our own** — committing a suggestion sets
  `input.value` and dispatches native `input` and `change` events on the input, which
  is what forms, frameworks, and validation already listen for. The attribute states
  (`aria-expanded`, `aria-selected`) are the styleable/testable surface.
- **No-JS baseline:** the authored `<input list>` + `<datalist>` — native suggestion
  dropdown, free text, form submission, validation all work. Usable, not merely "not
  broken".

## Accessibility

*Blocking acceptance criteria. Implements the APG Editable Combobox with List
Autocomplete pattern.*

- **Roles/ARIA:** input: `role="combobox"`, `aria-autocomplete="list"`,
  `aria-expanded`, `aria-controls={listbox id}`, `aria-activedescendant` while
  navigating. Listbox: `role="listbox"`, `aria-labelledby` pointing at the field's
  `<label>` (id generated if absent). Options: `role="option"`, generated ids,
  `aria-selected` on the active one. All generated — cannot be hand-authored wrong.
- **Keyboard interaction:**

| Key | Action |
|-----|--------|
| Printable keys | Native editing; list opens/filters on `input` events |
| ArrowDown / ArrowUp | Open the list if closed; move active option down/up, wrapping. DOM focus never leaves the input (`aria-activedescendant`, per APG) |
| Enter | Commit the active option (sets value, fires `input`+`change`, closes). Without an active option: native form behaviour untouched |
| Escape | Close the list; a closed list means Esc reaches its usual targets (dialog etc.). `preventDefault` only while open |
| Tab / focus out | Close without committing; typed text stays (free-text control) |
| Home / End / editing keys | Native — the module never intercepts text editing |

- **Focus behaviour:** DOM focus stays on the input at all times; the active option is
  a *virtual* focus via `aria-activedescendant` (APG). Pointer commit refocuses the
  input. No trap participation.
- **Forced colors:** panel border survives as the edge (shadow stripped); active
  option maps to `Highlight`/`HighlightText` with `forced-color-adjust: none` — the
  same convention the UA's own select highlight uses; hover/active never conveyed by
  colour-mix alone.
- **Reduced motion:** no component motion in v1 — nothing to reduce.
- **Increased contrast (`prefers-contrast: more`):** token-layer handled; no
  component-specific treatment.
- **Reduced transparency (`prefers-reduced-transparency: reduce`):** None.
- **Contrast:** surface-raised/ink and accent-tint/ink pairings from the 05 table,
  both schemes.
- **WCAG 2.2 criteria specifically implicated:** 4.1.2 Name, Role, Value (generated
  ARIA state); 2.1.1 Keyboard (arrow/Enter/Esc handling); 1.4.13 does not apply (the
  popup is keyboard/input-triggered, not hover); 2.5.8 Target Size (option padding ≥
  24px block); 3.2.2 On Input (opening a suggestion list is not a change of context).

## Container behaviour

None of its own — the listbox matches the input's inline size (`inset-inline: 0` on
the relative root) at any container width; the input's own sizing comes from
form-controls. Minimum sensible width is the input's. No subgrid participation.

## Composition

May contain: exactly one `<input list>` and its `<datalist>`. Must be contained by a
`.field` for label/hint/error composition (the module only requires the input;
the field wrapper is the documented pattern). Works inside dialogs and popovers
(absolute positioning stays within the top-layer element). Forbidden: `<select>`
inside (that is [select.md](select.md)); nesting comboboxes.

## Open questions

- Result-count announcement (`aria-live` "12 suggestions") — APG-adjacent nicety;
  costs bytes and a politeness decision. Post-v1 unless testing shows SR users need it.
- `starts-with` filter mode — trivial to add if asked; v1 ships substring + none.
- Multi-select tokens (tag input) — a different component, post-v1.

## References

Bootstrap has no combobox; the ecosystem default is Select2/Choices.js (jQuery-era,
tens of KB, replaces the input wholesale, breaks native form participation). We
differ: the native input stays (editing, validation, form submission untouched), the
datalist stays as the declarative option source, the no-JS baseline is the same markup,
and the whole enhancement is one ≤2 KB module that only manages list rendering and
active-descendant state.

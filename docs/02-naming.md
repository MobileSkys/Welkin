---
status: Accepted (decision CLOSED 2026-07-13)
depends-on: [01-vision-and-principles.md]
---

# 02 — Naming

**Status: CLOSED.** The toolkit is named **Welkin**.

| Identifier | Value |
|------------|-------|
| Name | Welkin |
| npm package | `welkincss` (register `welkin-css` as an alias/redirect) |
| Distributed files | `welkin.css`, `welkin-core.css`, `components/*.css` |
| Token prefix | `--wel-` (`--wel-color-accent`) |
| Custom element / event prefix | `wel-` (`<wel-tabs>`, `wel-tab-change`) |
| Docs domain (to register) | `welkincss.com` / `welkincss.dev` |

**Welkin** is an archaic English word for *the sky, the firmament* ("praise it to the
welkin") — a literal fit for Mobileskys' branding, distinctive in the CSS/UI category,
and short enough to derive a clean prefix.

## Why the working title "MsCSS" was dropped

- Read as "Microsoft CSS" — trademark-confusing and unfindable in search.
- `--ms-` collided with the `-ms-` CSS vendor prefix.

## Vetting record (2026-07-13)

Criteria: pronounceable; npm available; domains plausibly available; no trademark
conflict; unique in search; short prefix derivable; evokes the CSS-first/designer angle;
compatible with Mobileskys sky equity.

| Candidate | Verdict | Disqualifier |
|-----------|---------|--------------|
| Stratus | ✗ | Kinsta ships a design system named "Stratus UI"; "Stratus" is a registered computing trademark (Stratus Technologies, marks now held by Penguin Solutions); npm `stratus` squatted since 2012 |
| Cirrus | ✗ | Cirrus CSS (cirrus-ui.com) is an established SCSS framework |
| Zephyr | ✗ | npm squatted; Zephyr RTOS (Linux Foundation) dominates search |
| Caelum | ✗ | Caelum is a known Brazilian developer-education brand (VRaptor framework); npm taken; ambiguous pronunciation |
| Alto | ✗ | beqom/alto is an existing HTML/CSS framework + React components |
| Cirro | ✗ | Search-indistinguishable from Cirrus CSS |
| Vela | ✗ | Vela is Target's CI/pipeline platform (developer-tools collision) |
| Aloft | runner-up | Category-clean; npm `aloftcss` free; but Aloft Hotels (Marriott) is a famous mark with broad dilution reach, and Aloft Technologies operates in drone software |
| **Welkin** | **✓ chosen** | No CSS/UI or developer-tool collisions found; npm `welkincss` and `welkin-css` unregistered; `welkincss.com`/`.dev` show no DNS records; only small out-of-category trademark holders (Welkin Health — healthcare; Welkin Technologies — staffing/recovery services) |

Notes: bare npm `welkin` is an empty 2021 squat (v1.0.0, no description) — the
`welkincss` form follows the `tailwindcss` precedent and a name dispute remains possible
later. `welkin.dev` is registered (GitHub Pages); `welkincss.*` and `usewelkin.com` were
free at check time.

## Remaining actions before public release

1. **Register** npm `welkincss` (+ `welkin-css`) and the `welkincss.com`/`.dev` domains —
   availability was verified 2026-07-13 and is perishable.
2. **Formal trademark search** (UK/EU/US, Nice classes 9 and 42) — the checks above are
   discovery-level, not legal clearance.
3. Rename the repository/directory (`MsCSS` → `welkin`).

## Prefix decision

`--wel-` was chosen over `--wk-` (reads as WebKit) and `--welkin-` (too long in
token-dense theme files). Custom elements use `wel-` (hyphen required by the platform
anyway).

The placeholder rule from the draft phase (`mscss` / `--ms-` / `ms-`) is retired; all
documents in this suite have been mechanically renamed to the identifiers above.

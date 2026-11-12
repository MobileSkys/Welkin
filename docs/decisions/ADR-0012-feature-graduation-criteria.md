# ADR-0012 — Feature intake and graduation criteria

**Status:** Accepted (amended 2026-11-12 — see "Amendment 2026-11-12 — Experimental lane")

## Context

The tiered support policy ([03-browser-support-policy.md](../03-browser-support-policy.md))
needs objective rules for when a CSS feature may enter the Enhanced tier and when it stops
needing its `@supports` wrapper. Without written criteria these calls become vibes.

## Decision

**Intake (feature may enter the Enhanced tier):**

- The feature is **Baseline Newly Available** — shipped in stable Chrome, Firefox, and
  Safari.
- It has a writable degradation contract (a fallback experience we are willing to ship);
  the contract is added to the table in 03 before any component uses the feature.
- Pre-Baseline features (shipped in fewer than all three engines) may not appear in Welkin
  source at all, however tempting. Two narrow, written exceptions exist: the opt-in module
  lane in 03 (unbundled à-la-carte files) and the Experimental lane (see "Amendment
  2026-11-12 — Experimental lane" below).

**Graduation (feature moves Enhanced → Core, wrapper removed):**

1. The feature is **Baseline Widely Available** (~30 months after Newly Available), and
2. A **release-time audit** of current support data (caniuse/statcounter usage-weighted)
   confirms no user population remains for which the fallback is layout-critical.

Both conditions required; condition 2 lets us delay graduation if real-world data lags the
Baseline label.

**Mechanics:**

- Review at **every minor release**: walk the Enhanced table in 03, check intake queue and
  graduation candidates.
- Graduation ships in a **minor version**. It removes the `@supports` wrapper only — no
  behaviour change for any supported browser. The degradation-contract row moves to a
  "graduated" archive section in 03 for historical reference.
- If an Enhanced feature regresses (removed/broken in an engine), it stays Enhanced and
  its contract already covers affected users — no emergency release needed. That
  resilience is the point of the wrapper discipline.

## Consequences

- Feature adoption is auditable: every wrapper in the source corresponds to a contract row
  in 03; every unwrapped modern feature corresponds to a graduation record.
- The toolkit modernises continuously on a predictable cadence instead of via big-bang
  major versions.

## Alternatives considered

- **Graduate on Baseline WA label alone** — rejected: the label is calendar-driven;
  usage-weighted reality occasionally lags.
- **Never graduate (wrappers forever)** — rejected: accumulating dead wrappers bloats and
  obscures the source.
- **Manual per-feature judgement calls** — rejected: that is the absence of a policy.

## Amendment 2026-11-12 — Experimental lane

**Decided by:** Phil, via board question Q-98 (option "experimental"), following the
1.4.0 Baseline re-audit (board doc D-14).

**Context.** The re-audit found two utilities in the main bundle whose properties are
below intake: `.squircle` (`corner-shape`) and `.view-crop` (`object-view-box`). Both are
Limited (Chrome only in stable; Safari 27.3 beta; Firefox Nightly-only or not
implemented). They break the intake rule above, and they do not qualify for the opt-in
module lane in [03](../03-browser-support-policy.md) because they ship in
`welkin.css`. Their failure mode is nevertheless as safe as a property can have: an
engine that does not know the property drops it, and the result is exactly the
unstyled-by-that-property rendering.

**Decision.** A narrow exception to intake. A property below Baseline Newly Available may
ship **ungated** (including in the main bundle) only if **all** of these hold:

1. **Purely additive:** its absence is indistinguishable from the property being unset.
   No other declaration may depend on it, and no fallback needs to be zeroed for it.
2. **Paint only:** it reshapes how something is painted, never layout (size, position,
   flow) or reachability (focus, hit-testing that hides controls, content visibility).
3. **Marked Experimental:** the utility is labelled **Experimental** in its component
   spec and is therefore semver-exempt (CHANGELOG preamble,
   [docs/11](../11-docs-site-and-dx.md)); it may change or be removed in a minor.
4. **Honest engines:** the spec lists real engine support (stable versions, betas named
   as betas, missing engines named).
5. **Reviewed every minor release:** at each release audit, re-check status; when the
   property reaches Baseline Newly Available it is promoted to a normal Enhanced row in
   03 and loses the Experimental label (subject to the component's own stability).

The lane is a property-by-property exception, recorded as a lane note in 03 that lists
every occupant. It does not relax intake for anything that needs a gate, affects layout,
or touches behaviour; those still wait for Newly Available. Current occupants (1.4.0):
`corner-shape` (`.squircle`) and `object-view-box` (`.view-crop`).

**Consequences.** "Every unwrapped modern feature corresponds to a graduation record" now
reads "... to a graduation record or an Experimental-lane entry in 03". The audit walk at
each minor release includes the Experimental lane.

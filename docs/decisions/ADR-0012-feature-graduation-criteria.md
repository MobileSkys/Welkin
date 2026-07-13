# ADR-0012 — Feature intake and graduation criteria

**Status:** Accepted

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
  source at all, however tempting.

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

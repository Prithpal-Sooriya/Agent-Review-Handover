<!--
  Sync Impact Report
  Version change: [template placeholders] → 1.0.0
  Modified principles: N/A (initial fill)
  Added sections: Core Principles (5), Additional Constraints, Development Workflow & Quality Gates, Governance
  Removed sections: None
  Templates: plan-template.md ✅ (Constitution Check wording updated); spec-template.md ✅ (no structural change); tasks-template.md ✅ (task types align with testing/quality/performance)
  Follow-up TODOs: None
-->

# Agent-Review-Handover Constitution

## Core Principles

### I. Code Quality

Code MUST be clear, maintainable, and consistent with project conventions. Naming, structure, and style
MUST follow language and project norms. Complexity MUST be justified; prefer simple, readable
implementations. Rationale: Quality reduces defects and makes handover and agent-driven review sustainable.

### II. Testing Standards

Features that affect behavior MUST have tests. Tests MUST be deterministic and fast where possible.
Integration or contract tests are required for shared boundaries and contract changes. Test-first or
test-alongside implementation is expected; tests MUST exist before or with the code they validate.
Rationale: Reliable tests enable safe refactors and confident agent and human reviews.

### III. User Experience Consistency

User-facing behavior (CLI, UI, APIs) MUST be consistent across the product. Terminology, patterns,
and error handling MUST align with established conventions. New flows MUST not introduce
inconsistent interactions without explicit justification. Rationale: Consistency reduces cognitive
load and support burden.

### IV. Performance Requirements

Performance goals MUST be stated for features that affect latency, throughput, or resource use.
Implementations MUST meet or document deviation from those goals. Regressions in measured
performance MUST be justified and tracked. Rationale: Explicit performance expectations keep
the system predictable and scalable.

### V. Minimal Third-Party Tooling (Built-ins First)

Prefer platform and language built-ins over third-party libraries. New dependencies MUST be
justified by clear need that cannot be met with standard libraries or small, focused code.
Vendor lock-in and heavy frameworks MUST be avoided unless explicitly accepted. Rationale:
Fewer dependencies reduce supply-chain risk and maintenance cost.

## Additional Constraints

- Technology choices MUST align with the principles above (quality, testing, UX, performance, built-ins).
- New third-party dependencies require documentation of need and alternatives considered.
- Compliance with these constraints is verified at plan and review stages.

## Development Workflow & Quality Gates

- **Constitution Check**: Before Phase 0 research and again after Phase 1 design, the implementation
  plan MUST confirm alignment with Code Quality, Testing Standards, UX Consistency, Performance
  Requirements, and Built-ins First. Violations MUST be documented in the plan with justification.
- All changes (PRs/reviews) MUST verify compliance with the constitution; complexity and
  exceptions MUST be justified in writing.

## Governance

This constitution supersedes ad-hoc practices for the Agent-Review-Handover project. Amendments
MUST be documented with rationale and version bump. Compliance is reviewed at plan gates and
code review; use project README and spec docs for runtime development guidance.

**Version**: 1.0.0 | **Ratified**: 2025-03-09 | **Last Amended**: 2025-03-09

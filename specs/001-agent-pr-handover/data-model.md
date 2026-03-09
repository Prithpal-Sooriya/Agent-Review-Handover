# Data Model: Agent Handover for Pull Requests

**Feature**: 001-agent-pr-handover\
**Phase 1 output**: Entities, fields, relationships, and validation derived from
[spec.md](./spec.md).

---

## Entities

### Pull Request (PR)

The unit of work; represents a GitHub pull request that may be opted in and driven through workflow
states.

| Field / concept       | Type / description                                              |
| --------------------- | --------------------------------------------------------------- |
| id                    | GitHub PR number or node ID (string/number as per API)          |
| repo (owner/name)     | Repository identifier                                           |
| base / target branch  | Branch names                                                    |
| description           | Body text; may contain embedded analysis report                 |
| state                 | open                                                            |
| labels                | Array of label names; includes opt-in and workflow state labels |
| has_opt_in            | Derived: opt-in label present                                   |
| mergeable / conflicts | Merge state (e.g. clean, conflicted) from API                   |
| head_sha              | Current head commit (for idempotency / “current state”)         |

**Validation**: Opt-in label must be configured and present for workflow processing. State labels
must be from allowed set.

**Relationships**: Has many Comments; has one current AnalysisReport (embedded in description or
stored); has workflow state via labels; may reference Memory/Learnings.

---

### Analysis Report

Structured content generated for an opted-in PR; stored in or appended to the PR description.

| Field            | Type / description                                      |
| ---------------- | ------------------------------------------------------- |
| code_walkthrough | Text summary of changes                                 |
| complexity       | Estimated complexity (e.g. simple / moderate / complex) |
| review_effort    | Suggested review effort (e.g. “~10 minutes”)            |
| generated_at     | Timestamp (for staleness / refresh)                     |

**Validation**: All three elements (walkthrough, complexity, review_effort) required when report is
present. Report update replaces or updates existing report in description (spec: “updated or
replaced so the description reflects current state”).

**State**: No separate state machine; report is either absent or present (and optionally stale).

---

### Comment

Feedback on a PR; only comments from organization members are processed.

| Field          | Type / description                                  |
| -------------- | --------------------------------------------------- |
| id             | GitHub comment ID                                   |
| pr_id          | Parent PR                                           |
| author         | Login or user id; must be org member for processing |
| body           | Raw comment text                                    |
| classification | nit                                                 |

**Validation**: Only process when author is in configured organization. Classification required
before applying behavior (nit → resolve and notify; discussion → acknowledge; unclear → ask
clarifying questions).

**Relationships**: Belongs to one PR. May trigger one AgentAction (fix, acknowledgment, or
clarification).

---

### Workflow State

Represented by labels on the PR; drives what the agent does next and what users see.

| Concept       | Representation | Allowed values (example)         |
| ------------- | -------------- | -------------------------------- |
| opt-in        | Label present  | e.g. `agent-handover`            |
| post-analysis | Label          | e.g. `agent-handover-analyzed`   |
| monitoring    | Label          | e.g. `agent-handover-monitoring` |

**Validation**: State labels must be from a configured set. Transitions: add opt-in → eligible for
analysis; after analysis → analyzed (+ monitoring if applicable); no formal FSM required beyond
“eligible / analyzed / monitoring” for behavior.

**State transitions (logical)**:

- PR gets opt-in label → becomes eligible for analysis.
- After analysis report is generated/updated → apply analyzed (and optionally monitoring) label.
- Comment handling and conflict resolution apply when PR is opted-in and in appropriate state;
  reflection runs on merge.

---

### Memory / Learnings

Captured patterns from resolved nits and review evolution; used to improve future agent behavior and
reduce review friction.

| Field       | Type / description                                              |
| ----------- | --------------------------------------------------------------- |
| id          | Optional stable id (e.g. for dedup)                             |
| source_pr   | PR id or merge event (for traceability)                         |
| pattern     | Text or structured summary of pattern (e.g. “prefer X in nits”) |
| captured_at | Timestamp                                                       |
| scope       | Optional: global vs repo-specific (implementation choice)       |

**Validation**: At least pattern and source_pr (or merge event) for traceability. Retention and
format are implementation-defined; spec only requires “learnings are captured and available for
future PRs.”

**Relationships**: Many per PR (on merge); read at workflow start or per-step to inform agent (e.g.
comment classification, nit resolution).

---

## Cross-cutting rules (from spec)

- **Opt-in**: Only PRs with the designated opt-in label are processed (FR-001).
- **Org membership**: Only comments from configured organization members trigger processing (FR-003,
  security).
- **Idempotency**: Re-running analysis updates or replaces the report so description reflects
  current state (User Story 1, scenario 3).
- **Re-request reviews**: When conflict resolution adds commits that invalidate approvals,
  re-request reviews from the appropriate set (FR-007); policy (same reviewers vs code owners) is
  configurable.

No separate persistence model is mandated; storage can be file-based, in-memory, or key-value, as
long as workflow state is visible via labels and reports live in the PR description.

# Feature Specification: Agent Handover for Pull Requests

**Feature Branch**: `001-agent-pr-handover`  
**Created**: 2026-03-09  
**Status**: Draft  
**Input**: User description: "A personal automation system that manages the lifecycle of Pull Requests I create, enabling seamless handover between human work and AI agents. The system monitors PRs, generates analysis reports, responds to reviewer feedback, resolves merge conflicts, and captures learnings for continuous improvement."

## Clarifications

### Session 2025-03-09

- Q: How should "organization" and "member" be defined for this system? → A: GitHub organization only: "Organization" means a GitHub org; "member" = member of that org via GitHub API.
- Q: When the agent and a human might both change the same PR, what should the system do? → A: Conflict-avoid: before applying, agent checks that the PR (or target ref/description) hasn't changed since it started; if it has, abandon or retry without overwriting. To indicate that the agent has picked up a comment, the agent replies to that comment for visibility.
- Q: How should users and reviewers see that the agent has taken action (or that it did not)? → A: PR-only (comments/labels): all visibility via the PR—reply to comment, description updates, labels, and a comment when the agent abandons or escalates; no separate logs or UI.
- Q: Should the 1-hour (nit) and 30-minute (conflict) time windows be hard guarantees or best-effort targets? → A: Targets with best-effort notification: best-effort; when the window is missed the agent posts a short comment on the PR (e.g., "Handling delayed"). Preference: ideally near real-time responses; 1h/30 min are acceptable fallbacks.
- Q: At what scope should captured learnings (memory updates) apply—per repo, per org, or per user? → A: Per repository: learnings apply to future PRs in the same repository only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - PR Analysis Report on Open (Priority: P1)

When I open a pull request and opt in by adding the designated label, the system generates a structured analysis report and adds it to the PR description. The report includes a code walkthrough of changes, estimated complexity, and suggested review effort (e.g., "simple, ~10 minutes") so reviewers get context before diving into the code.

**Why this priority**: Reduces cognitive load on reviewers and sets expectations; it is the foundation for all other agent interactions with the PR.

**Independent Test**: Can be fully tested by opening a PR, adding the opt-in label, and verifying that a structured report appears in the PR description with the required elements (walkthrough, complexity, review effort).

**Acceptance Scenarios**:

1. **Given** a newly opened PR with the opt-in label, **When** the system runs analysis, **Then** a structured report is appended to (or integrated into) the PR description containing a code walkthrough, estimated complexity, and suggested review effort.
2. **Given** a PR without the opt-in label, **When** the system runs, **Then** no report is generated or added for that PR.
3. **Given** a PR that already has an analysis report, **When** the user re-triggers or the system runs again, **Then** the report is updated or replaced so the description reflects current state.

---

### User Story 2 - Comment Response Handling (Priority: P2)

When an organization member comments on my opted-in PR, the system classifies the comment as a nit-fix (small, actionable) or a larger discussion. When the agent picks up a comment, it replies to that comment so humans can see the agent has taken it on. For nits, the agent resolves the changes directly and notifies the reviewer where changes were made. For larger feedback, the agent posts an acknowledgment (for future PRs or human discussion). When the agent is uncertain about intent, it asks clarifying questions before taking action.

**Why this priority**: Addresses async collaboration delays by allowing the agent to handle simple fixes without waiting for the PR author.

**Independent Test**: Can be tested by having an org member leave a nit-style comment and a discussion-style comment on an opted-in PR, and verifying classification, resolution (for nits), and acknowledgment (for larger) with correct notifications.

**Acceptance Scenarios**:

1. **Given** an opted-in PR and a comment from an organization member classified as a nit, **When** the agent processes it, **Then** the agent applies the fix and notifies the reviewer where changes were made.
2. **Given** an opted-in PR and a comment from an organization member classified as larger discussion, **When** the agent processes it, **Then** the agent posts an acknowledgment and does not auto-apply code changes.
3. **Given** an opted-in PR and a comment from someone who is not an organization member, **When** the system runs, **Then** the comment is not processed (ignored for security).
4. **Given** a comment whose intent is ambiguous, **When** the agent evaluates it, **Then** the agent asks clarifying questions before executing changes.
5. **Given** an opted-in PR and a comment from an organization member that the agent will process, **When** the agent picks up the comment, **Then** the agent replies to that comment (e.g., in-thread) so reviewers see that the agent is handling it.

---

### User Story 3 - Merge Conflict Resolution (Priority: P3)

When my opted-in PR has merge conflicts, the system detects the state and resolves conflicts automatically using the configured strategy (merge preferred over rebase by default, configurable). If new commits invalidate prior approvals, the system re-requests reviews. If the conflict is too complex for automatic resolution, the system escalates to the human and does not apply changes.

**Why this priority**: Removes merge conflict friction that blocks otherwise-approved work.

**Independent Test**: Can be tested by introducing merge conflicts on an opted-in PR and verifying automatic resolution (or escalation), and that re-review is requested when approvals are invalidated.

**Acceptance Scenarios**:

1. **Given** an opted-in PR with merge conflicts that are automatically resolvable, **When** the system runs, **Then** conflicts are resolved using the configured strategy and the PR is updated.
2. **Given** an opted-in PR whose conflicts are too complex for automatic resolution, **When** the system runs, **Then** the system escalates to the human (e.g., notification or label) and does not apply resolution.
3. **Given** resolution adds new commits that invalidate prior approvals, **When** the system completes resolution, **Then** reviews are re-requested from the appropriate reviewers.
4. **Given** a configured preference for merge vs rebase, **When** the system resolves conflicts, **Then** the chosen strategy is used.

---

### User Story 4 - Reflection and Learning on Merge (Priority: P4)

When my opted-in PR is merged, the system analyzes how the PR evolved through the review process, captures patterns from resolved nits as memory updates, and feeds learnings back so future PRs and agent behavior can reduce review friction.

**Why this priority**: Delivers continuous improvement and reduces repeated nits over time.

**Independent Test**: Can be tested by merging an opted-in PR that had nits and discussion, and verifying that an analysis is produced and that learnings are captured (e.g., in a designated memory or summary) for future use.

**Acceptance Scenarios**:

1. **Given** an opted-in PR has just been merged, **When** the system runs reflection, **Then** an analysis of how the PR evolved through review is produced.
2. **Given** the reflection analysis, **When** the system processes it, **Then** patterns from resolved nits are captured as memory updates.
3. **Given** captured learnings, **When** the system operates on future PRs, **Then** those learnings are available to reduce review friction (e.g., fewer repeated nits or better first-pass responses).

---

### State Management (Supporting Behavior)

The user opts in a PR by adding a designated label (e.g., `agent-handover`). The system transitions the PR through workflow states using labels (e.g., `agent-handover-analyzed`, `agent-handover-monitoring`) so humans and agents can see current state at a glance.

**Acceptance Scenarios**:

1. **Given** a PR without the opt-in label, **When** the user adds it, **Then** the PR becomes eligible for analysis, comment handling, conflict resolution, and reflection.
2. **Given** an opted-in PR, **When** the system completes analysis or enters monitoring, **Then** the corresponding state label is applied so state is visible.

---

### Edge Cases

- What happens when a comment is from a non-organization member? The system does not process it (security: only org members).
- What happens when the agent cannot confidently classify a comment as nit vs larger? The agent asks clarifying questions before executing.
- What happens when merge conflicts are too complex for automatic resolution? The system escalates to the human and does not apply resolution.
- What happens when the same PR is analyzed multiple times (e.g., new commits)? The report is updated to reflect the current state of the PR.
- What happens when re-requesting reviews fails (e.g., permissions)? The system should record the failure and surface it to the user (e.g., via comment or status) so the human can re-request manually.
- What happens when the agent and a human edit the same PR at the same time? The agent uses conflict-avoid behavior: it checks that the PR (or target ref/description) has not changed since it started; if it has, it abandons or retries without overwriting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support an opt-in mechanism (e.g., a designated label) so only PRs that the user explicitly opts in are processed.
- **FR-002**: System MUST generate a structured analysis report for opted-in PRs that includes a code walkthrough of changes, estimated complexity, and suggested review effort, and add or update this report in the PR description.
- **FR-003**: System MUST monitor comments on opted-in PRs and process only comments from members of the configured GitHub organization (membership determined via GitHub API).
- **FR-004**: System MUST classify comments as nit-fix (small, actionable) or larger discussion and apply different behaviors: for nits, resolve directly and notify the reviewer where changes were made; for larger feedback, acknowledge without auto-applying code changes.
- **FR-004a**: System MUST reply to a comment when the agent picks it up (e.g., in-thread reply) so reviewers have visibility that the agent is handling it.
- **FR-004b**: When applying changes (e.g., nit fix or description update), system MUST use conflict-avoid behavior: before applying, verify the PR (or target ref/description) has not changed since the agent started; if it has changed, abandon or retry without overwriting.
- **FR-005**: System MUST ask clarifying questions before executing when the agent is uncertain about comment intent.
- **FR-006**: System MUST detect merge conflicts on opted-in PRs and resolve them automatically when possible, using a configurable strategy (default: prefer merge over rebase).
- **FR-007**: System MUST re-request reviews when new commits from conflict resolution invalidate prior approvals.
- **FR-008**: System MUST escalate to the human when merge conflicts are too complex for automatic resolution and must not apply resolution in that case.
- **FR-009**: System MUST, when an opted-in PR is merged, analyze how the PR evolved through the review process and capture patterns from resolved nits as memory updates. Learnings are scoped per repository: they apply to future PRs in the same repository only.
- **FR-010**: System MUST expose workflow state for opted-in PRs via labels (e.g., analyzed, monitoring) so state is visible to users and agents.
- **FR-011**: System MUST be designable for both cloud-based and local agent execution and as FOSS so others can adapt to their preferred agent setup (architecture constraint, not implementation detail).
- **FR-012**: Observability of agent actions MUST be PR-only: reply to comment, description updates, labels, and a comment when the agent abandons or escalates; no separate logs or dashboard UI.
- **FR-013**: When a configured time window (e.g., 1 hour for nits, 30 minutes for conflict handling) is missed, the system MUST post a short comment on the PR (e.g., "Handling delayed") so users have visibility. Time windows are best-effort targets; near real-time is preferred where possible.

### Key Entities

- **Pull Request (PR)**: The unit of work; has description, comments, state (e.g., open, merged), merge conflicts, and labels. Key attributes: opt-in label present, state labels, link to target branch and base.
- **Analysis Report**: Structured content added to the PR description; includes code walkthrough, estimated complexity, and suggested review effort.
- **Comment**: Feedback from a reviewer; has author (must be GitHub org member per API for processing), body, and classification (nit vs larger discussion).
- **Workflow State**: Represented by labels; e.g., opted-in, analyzed, monitoring. Used to drive what the agent does next and to show progress.
- **Memory / Learnings**: Captured patterns from resolved nits and review evolution; scoped per repository and used to improve future agent behavior for PRs in that repository.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reviewers can understand scope and effort of a PR (via the report) before opening the diff, so they spend less time deciding where to focus.
- **SC-002**: At least a configurable minimum share of nit-style comments on opted-in PRs (default ≥50%, expressed as a fraction or percentage in config) are resolved by the agent without the PR author having to intervene, within a configurable time window (e.g., within 1 hour of the comment). Time windows are best-effort targets; near real-time is preferred where possible. When the window is missed, the agent posts a short comment on the PR (e.g., "Handling delayed").
- **SC-003**: Merge conflicts on opted-in PRs are either resolved automatically or escalated clearly, so the user knows within a short time (e.g., within 30 minutes of conflict appearing) whether they need to act. The 30-minute window is a best-effort target; when missed, the agent posts a short comment on the PR (e.g., "Handling delayed").
- **SC-004**: After merge, learnings are captured for each opted-in PR (per repository) so that over a series of PRs in that repo, repeated nits or similar feedback decrease (measurable by comparing frequency of similar comments over time).
- **SC-005**: Only comments from organization members trigger agent response, so the system does not react to external or non-trusted input.
- **SC-006**: The system can be run in both cloud and local execution environments without changing the described behavior (deployment flexibility).

## Assumptions

- The host platform supports labels and PR description updates; the exact mechanism is not specified to keep the spec technology-agnostic.
- "Organization" means a GitHub organization; it is configured once. A comment author is treated as a member if and only if they are a member of that GitHub org per the GitHub API; only those comments are trusted for processing.
- "Nit" vs "larger discussion" is determined by agent classification (e.g., scope and risk); exact criteria can be tuned in implementation.
- Memory/learnings storage format and retention are implementation choices; the spec only requires that learnings are captured and available for future PRs in the same repository (per-repository scope).
- The minimum share of nits resolved for SC-002 (default ≥50%) is a configurable value (e.g. fraction or percentage in run config); acceptance can be measured by counting resolved vs total nit comments in a given period.
- Re-requesting reviews targets the same set of reviewers who had previously approved, or a configurable policy (e.g., code owners); the spec does not mandate a specific policy.
- Users and reviewers see agent activity only via the PR: comments (including reply when the agent picks up, and when it abandons or escalates), description updates, and labels; there is no separate logs or dashboard UI.
- The 1-hour (nit) and 30-minute (conflict) time windows are best-effort targets; near real-time response is preferred where possible. When a target window is missed, the agent posts a short comment on the PR (e.g., "Handling delayed").

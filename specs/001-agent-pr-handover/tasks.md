# Tasks: Agent Handover for Pull Requests

**Input**: Design documents from `specs/001-agent-pr-handover/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Contract tests at task interface, agent runner, HTTP API, and trigger context (per plan.md); unit tests for task logic with mocked GitHub and agent.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `frontend/`, `tests/` at repository root (per plan.md)
- Core: `src/core/`, `src/core/tasks/`
- Transport: `src/transport/http/`, `src/transport/actions/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md and research.md.

- [ ] T001 Create project structure per plan: src/core, src/core/tasks, src/transport/http, src/transport/actions, frontend, tests/contract, tests/integration, tests/unit
- [ ] T002 Initialize Deno project with deno.json and dependencies (Octokit or native fetch; Deno standard library)
- [ ] T003 [P] Configure linting and formatting (deno lint, deno fmt) for src/ and tests/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, interfaces, and config that ALL user stories depend on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Foundation must be complete before any story implementation.

- [ ] T004 Implement RunConfig (org, labels, timeouts, merge strategy) and config loading in src/config.ts
- [ ] T005 [P] Define task types (TaskResult, TaskSpec, TaskKind, payload types) in src/core/task-types.ts per contracts/task-interface.md
- [ ] T006 [P] Define AgentRunner interface and input/result types in src/core/runner.ts per contracts/agent-runner.md
- [ ] T007 [P] Define TriggerContext type and GitHub client abstraction interface in src/core (e.g. trigger-context types; GitHubClient interface for Octokit/fetch)
- [ ] T008 Implement GitHub client abstraction (Octokit or fetch) in src/core/github.ts
- [ ] T009 [P] Contract test for task interface: mock github and agent, assert task result shape and idempotency in tests/contract/task-interface_test.ts
- [ ] T010 [P] Contract test for AgentRunner: mock implementation returning fixed results, assert interface in tests/contract/agent-runner_test.ts
- [ ] T011 [P] Contract test for TriggerContext: build context and pass to stub workflow in tests/contract/trigger-context_test.ts

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - PR Analysis Report on Open (Priority: P1) 🎯 MVP

**Goal**: When the user opens a PR and adds the opt-in label, the system generates a structured analysis report (code walkthrough, complexity, review effort) and adds or updates it in the PR description; state labels are set.

**Independent Test**: Open a PR, add the opt-in label, verify a structured report appears in the PR description with walkthrough, complexity, and review effort.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement analyze-pr task in src/core/tasks/analyze-pr.ts (payload: repo, prNumber; call AgentRunner.analyze; return TaskResult + report)
- [ ] T013 [US1] Wire analyze-pr to update PR description and set state labels (e.g. agent-handover-analyzed) via GitHub client in src/core/tasks/analyze-pr.ts
- [ ] T014 [US1] Unit tests for analyze-pr with mocked GitHub and agent in tests/unit/analyze-pr_test.ts

**Checkpoint**: User Story 1 is fully functional; PR + opt-in label → report in description.

---

## Phase 4: User Story 2 - Comment Response Handling (Priority: P2)

**Goal**: When an org member comments on an opted-in PR, the system classifies the comment (nit vs discussion vs unclear), replies to the comment when the agent picks it up, and for nits applies the fix and notifies the reviewer; for larger feedback acknowledges without auto-applying; for unclear asks clarifying questions.

**Independent Test**: Org member leaves a nit-style and a discussion-style comment on an opted-in PR; verify classification, resolution (nits), acknowledgment (discussion), and reply-on-pickup.

### Implementation for User Story 2

- [ ] T015 [P] [US2] Implement classify-comment task in src/core/tasks/classify-comment.ts (payload: repo, prNumber, commentId; org membership check; return kind: nit | discussion | unclear)
- [ ] T016 [US2] Implement resolve-nit task in src/core/tasks/resolve-nit.ts with comment reply on pickup and conflict-avoid behavior (verify PR/description unchanged before applying) per spec FR-004a and FR-004b
- [ ] T017 [US2] Ensure only comments from organization members are processed in src/core/tasks/classify-comment.ts (GitHub API membership check per FR-003)
- [ ] T018 [US2] Unit tests for classify-comment and resolve-nit with mocked GitHub and agent in tests/unit/classify-comment_test.ts and tests/unit/resolve-nit_test.ts

**Checkpoint**: User Stories 1 and 2 work; comment handling and nit resolution verified.

---

## Phase 5: User Story 3 - Merge Conflict Resolution (Priority: P3)

**Goal**: When an opted-in PR has merge conflicts, the system detects and resolves them automatically (configurable merge/rebase); if too complex, escalates to the human and does not apply; when resolution adds commits that invalidate approvals, re-requests reviews.

**Independent Test**: Introduce merge conflicts on an opted-in PR; verify automatic resolution or escalation, and that re-review is requested when approvals are invalidated.

### Implementation for User Story 3

- [ ] T019 [P] [US3] Implement resolve-conflict task in src/core/tasks/resolve-conflict.ts (payload: repo, prNumber, strategy?; return resolved, escalated)
- [ ] T020 [US3] Implement request-re-review task in src/core/tasks/request-re-review.ts (payload: repo, prNumber) per FR-007; on failure (e.g. permissions), record the failure and surface to the user via a PR comment so the human can re-request manually (spec edge case)
- [ ] T021 [US3] Escalation path when conflict too complex: post comment or label, do not apply resolution in src/core/tasks/resolve-conflict.ts per FR-008
- [ ] T022 [US3] Unit tests for resolve-conflict and request-re-review with mocked GitHub and agent in tests/unit/resolve-conflict_test.ts and tests/unit/request-re-review_test.ts

**Checkpoint**: User Stories 1–3 work; conflict resolution and re-review verified.

---

## Phase 6: User Story 4 - Reflection and Learning on Merge (Priority: P4)

**Goal**: When an opted-in PR is merged, the system analyzes how the PR evolved, captures patterns from resolved nits as memory updates (per-repo), and makes learnings available for future PRs in the same repository.

**Independent Test**: Merge an opted-in PR that had nits and discussion; verify analysis is produced and learnings are captured for future use in that repo.

### Implementation for User Story 4

- [ ] T023 [P] [US4] Implement reflect-on-merge task in src/core/tasks/reflect-on-merge.ts (payload: repo, prNumber; return learnings)
- [ ] T024 [US4] Memory/learnings storage (per-repository) and feed into future PR workflow (e.g. config or runner context when calling agent) in src/core/tasks/reflect-on-merge.ts and wiring in src/core/ or config
- [ ] T025 [US4] Unit tests for reflect-on-merge with mocked GitHub and agent in tests/unit/reflect-on-merge_test.ts

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Transport & Server API

**Purpose**: HTTP server and GitHub Actions entrypoints that build TriggerContext and invoke core tasks. No business logic in routes.

- [ ] T026 Implement HTTP server with GET /health and POST /webhook/github in src/transport/http/server.ts per contracts/server-api.md
- [ ] T027 Implement optional POST /run/analyze, /run/comment, /run/conflicts, /run/reflect in src/transport/http/server.ts per contracts/server-api.md
- [ ] T028 Contract test for HTTP API (endpoints return expected shapes and error format) in tests/contract/server-api_test.ts
- [ ] T029 GitHub Actions entry: build TriggerContext from github.context and invoke core tasks in src/transport/actions/index.ts
- [ ] T030 Entry point for local and Deno Deploy server in src/main.ts

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Optional frontend, validation, and cleanup.

- [ ] T031 [P] Optional frontend: vanilla HTML/CSS/JS with Open Props and Open Props UI in frontend/ (config or dashboard) if needed per plan
- [ ] T032 Run quickstart.md validation end-to-end
- [ ] T033 [P] Documentation updates and code cleanup; ensure "Handling delayed" comment (FR-013) is posted when the nit window is missed (in resolve-nit or after classify-comment when handling is delayed) and when the conflict window is missed (in resolve-conflict)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–6)**: Depend on Foundational; can proceed in priority order (US1 → US2 → US3 → US4) or in parallel if staffed.
- **Transport (Phase 7)**: Depends on core tasks (Phases 3–6) being implemented.
- **Polish (Phase 8)**: Depends on Transport and desired stories complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — MVP.
- **US2 (P2)**: Uses same core (config, runner, github); independently testable.
- **US3 (P3)**: Uses same core; independently testable.
- **US4 (P4)**: Uses same core; may read learnings produced by earlier stories.

### Parallel Opportunities

- T003, T005, T006, T007 can run in parallel within their phases.
- T009, T010, T011 can run in parallel.
- After Phase 2, US1–US4 can be implemented in parallel by different owners.
- Within US2: T015 parallel; then T016, T017, T018 sequential/parallel as appropriate.

---

## Parallel Example: User Story 1

```bash
# After Phase 2, implement analyze-pr and tests:
Task T012: Implement analyze-pr task in src/core/tasks/analyze-pr.ts
Task T014: Unit tests for analyze-pr in tests/unit/analyze-pr_test.ts
# Then T013 to wire description and labels.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (analyze-pr, description update, labels)
4. **STOP and VALIDATE**: Open PR, add opt-in label, verify report in description
5. Add Phase 7 (HTTP server + webhook) for end-to-end MVP

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → test independently → MVP (analysis on open)
3. US2 → test independently → comment handling
4. US3 → test independently → conflict resolution
5. US4 → test independently → reflection and learnings
6. Transport (Phase 7) can be built after US1 for webhook-driven analysis, then extended for other events

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. Developer A: US1 (analyze-pr). Developer B: US2 (classify, resolve-nit). Developer C: US3 (resolve-conflict, request-re-review). Developer D: US4 (reflect-on-merge).
3. Integrate transport and polish once core tasks are in place.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to user story for traceability.
- Each user story is independently completable and testable.
- Contract tests (task interface, agent runner, trigger context, HTTP API) protect boundaries when refactoring.
- Commit after each task or logical group.
- Idempotency and conflict-avoid behavior are required in task implementations (per plan and spec).

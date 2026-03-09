# Tasks: Agent Handover for Pull Requests

**Input**: Design documents from `specs/001-agent-pr-handover/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Contract tests at task interface, agent runner, HTTP API, and trigger context (per plan.md); unit tests for task logic with mocked GitHub and agent.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Each task touches **at most one file** and has a **single clear outcome** so it can be assigned to a single agent (e.g. Sonnet, SLM) or worktree.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on other same-phase tasks)
- **[Story]**: User story (US1, US2, US3, US4)
- Include exact file path in every task description

## Path Conventions

- **Single project**: `src/`, `frontend/`, `tests/` at repository root (per plan.md)
- Core: `src/core/`, `src/core/tasks/`
- Transport: `src/transport/http/`, `src/transport/actions/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure per plan.md.

- [ ] T001 Create directory structure: src/core, src/core/tasks, src/transport/http, src/transport/actions, frontend, tests/contract, tests/integration, tests/unit
- [ ] T002 Create deno.json with Deno project config, dependencies (Octokit or native fetch; Deno std), and lint/format config (deno lint, deno fmt) at repository root

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, interfaces, and config that ALL user stories depend on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Foundation must be complete before any story implementation.

- [ ] T003 Implement RunConfig (org, labels, timeouts, merge strategy) and config loading in src/config.ts
- [ ] T004 [P] Define task types (TaskResult, TaskSpec, TaskKind, payload types) in src/core/task-types.ts per contracts/task-interface.md
- [ ] T005 [P] Define AgentRunner interface and input/result types in src/core/runner.ts per contracts/agent-runner.md
- [ ] T006 [P] Define TriggerContext type in src/core/trigger-context.ts per contracts/trigger-context.md
- [ ] T007 Define GitHubClient interface only (no implementation) in src/core/github.ts
- [ ] T008 Implement GitHub client (Octokit or fetch) in src/core/github.ts
- [ ] T009 [P] Contract test for task interface: mock github and agent, assert result shape and idempotency in tests/contract/task-interface_test.ts
- [ ] T010 [P] Contract test for AgentRunner: mock implementation, assert interface in tests/contract/agent-runner_test.ts
- [ ] T011 [P] Contract test for TriggerContext: build context and pass to stub in tests/contract/trigger-context_test.ts

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - PR Analysis Report on Open (Priority: P1) 🎯 MVP

**Goal**: When the user opens a PR and adds the opt-in label, the system generates a structured analysis report (code walkthrough, complexity, review effort) and adds or updates it in the PR description; state labels are set.

**Independent Test**: Open a PR, add the opt-in label, verify a structured report appears in the PR description with walkthrough, complexity, and review effort.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement analyze-pr task (payload: repo, prNumber; call AgentRunner.analyze; update PR description and set state labels) in src/core/tasks/analyze-pr.ts
- [ ] T013 [P] [US1] Add unit tests for analyze-pr with mocked GitHub and agent in tests/unit/analyze-pr_test.ts

**Checkpoint**: User Story 1 is fully functional; PR + opt-in label → report in description.

---

## Phase 4: User Story 2 - Comment Response Handling (Priority: P2)

**Goal**: When an org member comments on an opted-in PR, the system classifies the comment (nit vs discussion vs unclear), replies when the agent picks it up, resolves nits and notifies reviewer, acknowledges larger feedback, asks clarifying questions when unclear.

**Independent Test**: Org member leaves a nit-style and a discussion-style comment on an opted-in PR; verify classification, resolution (nits), acknowledgment (discussion), and reply-on-pickup.

### Implementation for User Story 2

- [ ] T014 [P] [US2] Implement classify-comment task (payload: repo, prNumber, commentId; org membership check; return kind: nit | discussion | unclear) in src/core/tasks/classify-comment.ts
- [ ] T015 [US2] Implement resolve-nit task (reply on pickup, conflict-avoid before applying) in src/core/tasks/resolve-nit.ts
- [ ] T016 [P] [US2] Add unit tests for classify-comment with mocked GitHub and agent in tests/unit/classify-comment_test.ts
- [ ] T017 [P] [US2] Add unit tests for resolve-nit with mocked GitHub and agent in tests/unit/resolve-nit_test.ts

**Checkpoint**: User Stories 1 and 2 work; comment handling and nit resolution verified.

---

## Phase 5: User Story 3 - Merge Conflict Resolution (Priority: P3)

**Goal**: When an opted-in PR has merge conflicts, the system detects and resolves them (configurable merge/rebase); if too complex, escalates and does not apply; when resolution invalidates approvals, re-requests reviews.

**Independent Test**: Introduce merge conflicts on an opted-in PR; verify automatic resolution or escalation, and that re-review is requested when approvals are invalidated.

### Implementation for User Story 3

- [ ] T018 [P] [US3] Implement resolve-conflict task (payload: repo, prNumber, strategy?; resolve or escalate; do not apply when too complex) in src/core/tasks/resolve-conflict.ts
- [ ] T019 [US3] Implement request-re-review task (payload: repo, prNumber; on failure record and post PR comment per spec) in src/core/tasks/request-re-review.ts
- [ ] T020 [P] [US3] Add unit tests for resolve-conflict with mocked GitHub and agent in tests/unit/resolve-conflict_test.ts
- [ ] T021 [P] [US3] Add unit tests for request-re-review with mocked GitHub and agent in tests/unit/request-re-review_test.ts

**Checkpoint**: User Stories 1–3 work; conflict resolution and re-review verified.

---

## Phase 6: User Story 4 - Reflection and Learning on Merge (Priority: P4)

**Goal**: When an opted-in PR is merged, the system analyzes evolution, captures patterns from resolved nits as memory (per-repo), and makes learnings available for future PRs in the same repository.

**Independent Test**: Merge an opted-in PR that had nits and discussion; verify analysis is produced and learnings are captured for future use in that repo.

### Implementation for User Story 4

- [ ] T022 [P] [US4] Implement reflect-on-merge task (payload: repo, prNumber; return learnings) in src/core/tasks/reflect-on-merge.ts
- [ ] T023 [US4] Implement per-repository memory storage (read/write learnings) in src/core/memory.ts
- [ ] T024 [US4] Wire memory into config or runner context for future PRs in src/config.ts
- [ ] T025 [P] [US4] Add unit tests for reflect-on-merge with mocked GitHub and agent in tests/unit/reflect-on-merge_test.ts
- [ ] T026 [P] [US4] Add unit tests for memory module in tests/unit/memory_test.ts

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Transport & Server API

**Purpose**: HTTP server and GitHub Actions entrypoints that build TriggerContext and invoke core tasks. No business logic in routes.

- [ ] T027 Implement HTTP server with GET /health and POST /webhook/github in src/transport/http/server.ts per contracts/server-api.md
- [ ] T028 Implement POST /run/analyze, /run/comment, /run/conflicts, /run/reflect in src/transport/http/server.ts per contracts/server-api.md
- [ ] T029 [P] Contract test for HTTP API (endpoints and error shape) in tests/contract/server-api_test.ts
- [ ] T030 Implement GitHub Actions entry: build TriggerContext from github.context and invoke core tasks in src/transport/actions/index.ts
- [ ] T031 Implement entry point for local and Deno Deploy server in src/main.ts

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Optional frontend, delayed-handling comments, docs, and validation.

- [ ] T032 [P] Add "Handling delayed" comment when nit window is missed in src/core/tasks/resolve-nit.ts
- [ ] T033 Add "Handling delayed" comment when conflict window is missed in src/core/tasks/resolve-conflict.ts
- [ ] T034 [P] Optional frontend entry page (vanilla HTML, Open Props) in frontend/index.html per plan
- [ ] T035 [P] Update or add documentation (README or docs/usage.md) in docs/ or repository root
- [ ] T036 Run quickstart.md validation end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately. T002 after T001.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories. T004–T006 [P]; T007; T008 after T007; T009–T011 [P] after T003–T008.
- **User Stories (Phase 3–6)**: Depend on Foundational; can run in priority order (US1 → US2 → US3 → US4) or parallel by story if staffed.
- **Transport (Phase 7)**: Depends on core tasks (Phases 3–6). T027 then T028 (same file); T029 [P]; T030, T031.
- **Polish (Phase 8)**: Depends on Transport and desired stories. T032, T033 (one file each); T034, T035 [P]; T036 last.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories — MVP.
- **US2 (P2)**: Same core; independently testable.
- **US3 (P3)**: Same core; independently testable.
- **US4 (P4)**: Same core; T023–T024 (memory) support T022.

### Parallel Opportunities (multi-agent / worktrees)

- **Phase 1**: T002 after T001.
- **Phase 2**: T004, T005, T006, T007 in parallel after T003; T008 after T007; T009, T010, T011 in parallel after T008.
- **Phase 3**: T012, T013 in parallel.
- **Phase 4**: T014, T015 (then T016, T017 in parallel).
- **Phase 5**: T018, T019 (then T020, T021 in parallel).
- **Phase 6**: T022, T023 (then T024; T025, T026 in parallel).
- **Phase 7**: T029 in parallel with T027–T028, T030, T031 (by file).
- **Phase 8**: T032, T033 (one file each); T034, T035 in parallel.

---

## Parallel Example: User Story 1 (assign to two agents)

```bash
# Agent A:
Task T012: Implement analyze-pr task in src/core/tasks/analyze-pr.ts

# Agent B:
Task T013: Add unit tests for analyze-pr in tests/unit/analyze-pr_test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Open PR, add opt-in label, verify report in description
5. Add Phase 7 (HTTP server + webhook) for end-to-end MVP

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → test independently → MVP (analysis on open)
3. US2 → test independently → comment handling
4. US3 → test independently → conflict resolution
5. US4 → test independently → reflection and learnings
6. Transport (Phase 7) after US1 for webhook-driven analysis, then extend for other events

### Multi-Agent / Worktree Strategy

- Each task is **one file**, **one outcome** — safe to assign to a single agent or worktree.
- After Phase 2, stories can be split across agents: Agent A (US1), Agent B (US2), Agent C (US3), Agent D (US4).
- Within a story, all tasks marked [P] can run in parallel (different files).
- Merge/integrate after each phase or story; run contract and unit tests before moving on.

---

## Notes

- [P] = different files, no dependency on other same-phase tasks; safe to run in parallel.
- [Story] label maps task to user story for traceability and handover.
- Each user story is independently completable and testable.
- Idempotency and conflict-avoid behavior are required in task implementations (per plan and spec).
- Commit after each task (or logical group) for clean history and rollback.

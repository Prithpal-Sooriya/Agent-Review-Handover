# Implementation Plan: Agent Handover for Pull Requests

**Branch**: `001-agent-pr-handover` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-agent-pr-handover/spec.md` and task-architecture requirements (multi-agent, transport-agnostic, distributed-friendly).

## Summary

The system manages the lifecycle of opted-in Pull Requests: it generates analysis reports on open, classifies and resolves reviewer comments (nits vs discussion), resolves merge conflicts or escalates, and captures learnings on merge. All operations are implemented as **atomic, stateless tasks** that can be executed by any agent instance. Core orchestration is decoupled from transport (HTTP server, GitHub Actions, or polling worker); the same task code runs in any context. Web UI is vanilla HTML/CSS/JS with Open Props and Open Props UI; server runtime is TypeScript on Deno with a path to Deno Deploy and GitHub Actions for infrastructure-free operation.

## Technical Context

| Dimension | Choice |
|-----------|--------|
| **Language/Version** | TypeScript (Deno 2.x / latest LTS) |
| **Primary Dependencies** | Deno standard library and platform APIs; Octokit or native fetch for GitHub; Open Props (CSS) and Open Props UI for frontend |
| **Storage** | GitHub API as source of truth (labels, comments, description, commit SHAs); optional file or key-value for learnings/memory per repo |
| **Testing** | Deno built-in test runner; contract tests at task interface, agent runner, HTTP API, and trigger context |
| **Target Platform** | Localhost (dev), Deno Deploy (hosted), GitHub Actions (infrastructure-free) |
| **Project Type** | Web service + optional static Web UI |
| **Performance Goals** | Best-effort: near real-time where possible; fallback windows (e.g. 1h nits, 30min conflicts) with "Handling delayed" comment when missed |
| **Constraints** | Idempotent tasks; no shared memory between executions; PR-only observability (comments, labels, description) |
| **Scale/Scope** | Single-tenant per deployment; multiple agents may poll for work without conflicting |

## Task Architecture for Multi-Agent Execution

All operations are designed as discrete tasks that can be picked up by any agent instance. Orchestration is decoupled from how tasks are delivered (webhook → HTTP, Actions event, or polling).

### Task Queue Pattern

- Each PR event (opened, comment added, conflict detected, merged) produces a **discrete task** with all context needed for execution.
- Tasks are **self-contained**: no shared memory between task executions. Input payload carries repo, PR number, comment ID (if any), and any needed config.
- Different transports only differ in how they **enqueue** (e.g. push to queue, or invoke handler directly) and how they **obtain credentials** (env, Actions token). The same task definitions run in all cases.

### Idempotent Operations

- Tasks must be **safe to retry**. If an agent crashes mid-execution or two agents pick up the same task, the outcome must be consistent.
- **Source of truth**: GitHub API state (labels, comments, commit SHAs, description). Before applying changes, tasks verify that the PR (or target ref/description) has not changed since the task started; if it has, abandon or retry without overwriting.
- Use labels and comment replies to signal “agent has this in progress” or “done” so duplicate runs can detect current state.

### Single-Responsibility Tasks

| Task | Responsibility | Trigger / Input |
|------|----------------|-----------------|
| **analyze-pr** | Generate analysis report; update PR description; set state labels | PR opened/labeled (opt-in); payload: repo, prNumber |
| **classify-comment** | Determine nit vs larger change (or unclear) | Comment added on opted-in PR; payload: repo, prNumber, commentId |
| **resolve-nit** | Apply fix, comment on resolution, notify reviewer | After classify → nit; payload: repo, prNumber, commentId |
| **resolve-conflict** | Attempt merge conflict resolution (merge/rebase); do not apply if too complex | Conflict detected on opted-in PR; payload: repo, prNumber, strategy? |
| **request-re-review** | Tag reviewers after conflict resolution invalidates approvals | After resolve-conflict adds new commits; payload: repo, prNumber |
| **reflect-on-merge** | Capture learnings post-merge; update per-repo memory | PR merged; payload: repo, prNumber |

### Task Interface Contract

Each task receives a **typed input payload** and returns a **typed result**. This contract allows different agent backends (and transports) to execute the same task definitions.

- **Input**: e.g. `{ repo: { owner, repo }, prNumber, commentId?: number, event?: string }` plus optional strategy/config. Credentials (GitHub client, agent runner) are injected by the transport layer, not in the payload.
- **Result**: `{ success: boolean; actionsTaken?: string[]; error?: string; nextTasks?: TaskSpec[] }`. `nextTasks` allows a task to enqueue follow-up work (e.g. classify-comment → resolve-nit).
- Tasks do not assume they run on the same machine or process. State transitions happen via GitHub (labels, comments, description); multiple agents polling for work must not conflict (idempotency + GitHub state as truth).

### Distributed-Friendly Design

- No assumption that tasks run in the same process. Transports may be HTTP server (webhook → enqueue or run inline), GitHub Actions (event → run task), or a polling worker.
- Core task logic lives in a **task** layer that depends only on: (1) GitHub client abstraction, (2) agent runner interface, (3) config. No transport or queue implementation in core.
- Queue/polling is an optional layer: when used, it stores only task payloads (and perhaps idempotency keys); execution is still stateless and uses GitHub for truth.

### Alignment with Existing Contracts

- **TriggerContext** ([contracts/trigger-context.md](./contracts/trigger-context.md)): Transports build `TriggerContext` (repo, prNumber, commentId, github, agent, config) and pass it into the task layer. Tasks receive the equivalent of this context in their payload plus injected dependencies.
- **AgentRunner** ([contracts/agent-runner.md](./contracts/agent-runner.md)): Each task that needs agent work (analyze, classify, resolve-nit, resolve-conflict, reflect) calls the appropriate `AgentRunner` method. Runner is pluggable (Cursor API, local runner); core never imports a specific provider.
- **Server API** ([contracts/server-api.md](./contracts/server-api.md)): HTTP endpoints parse request, build context, and either enqueue a task or invoke the task handler directly; no business logic in routes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Alignment with `.specify/memory/constitution.md`:

- **Code Quality**: Clear, maintainable code; task boundaries and interfaces keep complexity localized. Single-responsibility tasks and typed contracts support consistency.
- **Testing Standards**: Contract tests for task interface, agent runner, HTTP API, and trigger context; unit tests for task logic with mocked GitHub and agent. Deterministic and fast where possible.
- **User Experience Consistency**: PR-only visibility (comments, labels, description); consistent terminology and error handling across tasks (e.g. “Handling delayed” when windows missed).
- **Performance Requirements**: Best-effort time windows (1h nits, 30min conflicts) stated; “Handling delayed” comment when missed. No strict latency SLA beyond documented targets.
- **Built-ins First**: Deno standard library and platform APIs preferred; Octokit or fetch for GitHub; Open Props for CSS. New dependencies justified and documented.

No violation or exception requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-pr-handover/
├── plan.md              # This file (/speckit.plan output)
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── trigger-context.md
│   ├── server-api.md
│   ├── agent-runner.md
│   └── task-interface.md   # Task payload/result and list of task types
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── core/                    # Transport-agnostic orchestration
│   ├── tasks/               # Single-responsibility task implementations
│   │   ├── analyze-pr.ts
│   │   ├── classify-comment.ts
│   │   ├── resolve-nit.ts
│   │   ├── resolve-conflict.ts
│   │   ├── request-re-review.ts
│   │   └── reflect-on-merge.ts
│   ├── task-types.ts        # Task input/result types and TaskSpec
│   ├── runner.ts            # AgentRunner interface + wiring
│   └── github.ts            # GitHub client abstraction (Octokit/fetch)
├── transport/               # Transport layer: build context, enqueue or run
│   ├── http/                # Deno HTTP server (webhook + optional /run/*)
│   │   └── server.ts
│   └── actions/             # GitHub Actions entry (build context, call core tasks)
│       └── index.ts
├── config.ts                # RunConfig (org, labels, timeouts, merge strategy)
└── main.ts                  # Entry for local/Deno Deploy server

# Optional: queue adapter when using a task queue (e.g. in-memory or external)
# src/queue/                  # Enqueue/poll; calls core tasks with context

frontend/                    # Vanilla HTML/CSS/JS, Open Props + Open Props UI
├── index.html
├── css/
├── js/                      # Component-inspired: rendering vs business logic
└── assets/

tests/
├── contract/                # Task interface, agent runner, API, trigger context
├── integration/             # With mocked GitHub and agent
└── unit/                    # Pure task logic and helpers
```

**Structure Decision**: Single repo with `src/` for server and task core, and `frontend/` for optional Web UI. Core is split into **tasks** (atomic units), **task-types** (contract), **runner** (agent interface), and **github** (API abstraction). Transport layer (`transport/http`, `transport/actions`) builds TriggerContext and invokes tasks; optional `queue/` can sit between transport and core when using a queue. This supports localhost, Deno Deploy, and GitHub Actions without duplicating task logic.

## Complexity Tracking

None. All choices align with the constitution and the specified task architecture.

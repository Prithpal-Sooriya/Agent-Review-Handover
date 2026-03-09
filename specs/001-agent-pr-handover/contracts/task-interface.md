# Contract: Task Interface (Multi-Agent Execution)

**Purpose**: Define the typed input and result for each atomic task so any agent instance or
transport can execute the same task definitions. Supports task-queue pattern, idempotency, and
distributed execution.

## Shared Types

```ts
type Repo = { owner: string; repo: string };

type TaskResult = {
  success: boolean;
  actionsTaken?: string[];
  error?: string;
  nextTasks?: TaskSpec[];
};

type TaskKind =
  | "analyze-pr"
  | "classify-comment"
  | "resolve-nit"
  | "resolve-conflict"
  | "request-re-review"
  | "reflect-on-merge";

type TaskSpec = {
  task: TaskKind;
  payload: Record<string, unknown>; // task-specific; must include repo, prNumber where applicable
};
```

## Task Kinds and Payloads

Each task kind has a required payload shape. Transports inject `github` (GitHub client), `agent`
(AgentRunner), and `config` (RunConfig) separately; they are not part of the payload.

| Task                  | Payload (minimal)                                    | Result (extends TaskResult)                   |
| --------------------- | ---------------------------------------------------- | --------------------------------------------- |
| **analyze-pr**        | `{ repo, prNumber }`                                 | `+ report?: AnalysisReport`                   |
| **classify-comment**  | `{ repo, prNumber, commentId }`                      | `+ kind?: 'nit' \| 'discussion' \| 'unclear'` |
| **resolve-nit**       | `{ repo, prNumber, commentId }`                      | `+ applied: boolean; message?: string`        |
| **resolve-conflict**  | `{ repo, prNumber; strategy?: 'merge' \| 'rebase' }` | `+ resolved: boolean; escalated?: boolean`    |
| **request-re-review** | `{ repo, prNumber }`                                 | (TaskResult only)                             |
| **reflect-on-merge**  | `{ repo, prNumber }`                                 | `+ learnings?: Learning[]`                    |

## Rules

- **Stateless**: A task must not rely on in-process or in-memory state from another task. All needed
  context is in the payload or fetched via GitHub API (and config) during execution.
- **Idempotent**: Same payload run twice must yield a consistent outcome. Use GitHub state (labels,
  comments, head SHA, description) to detect “already done” or “state changed”; abandon or no-op
  instead of overwriting.
- **Single responsibility**: Each task does one thing. Chaining is done via `nextTasks` (e.g.
  classify-comment enqueues resolve-nit when kind is `nit`).
- **Transport-agnostic**: Task code depends only on GitHub client, AgentRunner, and RunConfig. It
  does not know whether it was invoked by HTTP, GitHub Actions, or a queue worker.

## Execution Context

The runner (HTTP server, Actions script, or queue worker) must provide:

- **Payload**: As above for the task kind.
- **Injections**: `github`, `agent`, `config` (same as TriggerContext).
- **Idempotency** (optional): If using a queue, a key such as `repo:pr:commentId` or
  `repo:pr:analyze` can be used to deduplicate; the task itself still must be idempotent using
  GitHub state.

## Testing

- **Contract tests**: Call each task with a mock `github` and `agent`; assert on result shape and
  that no shared state is read/written beyond what is passed or fetched via `github`.
- **Idempotency**: Run the same task twice with the same payload and mocked GitHub state; result and
  side effects (e.g. labels, comments) must be consistent.

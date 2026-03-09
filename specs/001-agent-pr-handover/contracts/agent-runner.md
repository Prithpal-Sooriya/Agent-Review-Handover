# Contract: Pluggable Agent Runner Interface

**Purpose**: Allow core workflow to call “run agent” without depending on HTTP or a specific
provider (Cursor API, GitHub @cursor, local runner). Same interface used from server and GitHub
Actions.

## Interface (TypeScript-style)

Implementations must satisfy this shape. Core imports the interface only; the concrete runner is
injected or configured.

```ts
// Inputs for different workflow steps
type AnalyzeInput = { pr: PRContext; diffSummary?: string };
type ClassifyCommentInput = { pr: PRContext; comment: Comment; learnings?: string[] };
type ResolveNitInput = { pr: PRContext; comment: Comment; learnings?: string[] };
type ResolveConflictsInput = { pr: PRContext; strategy: "merge" | "rebase" };
type ReflectInput = { pr: PRContext; events: ReviewEvent[] };

// Result types (minimal; extend per step as needed)
type AnalyzeResult = { report: AnalysisReport; error?: string };
type ClassifyResult = { kind: "nit" | "discussion" | "unclear"; error?: string };
type ResolveNitResult = { applied: boolean; message?: string; error?: string };
type ResolveConflictsResult = { resolved: boolean; escalated?: boolean; error?: string };
type ReflectResult = { learnings: Learning[]; error?: string };

interface AgentRunner {
  analyze(input: AnalyzeInput): Promise<AnalyzeResult>;
  classifyComment(input: ClassifyCommentInput): Promise<ClassifyResult>;
  resolveNit(input: ResolveNitInput): Promise<ResolveNitResult>;
  resolveConflicts(input: ResolveConflictsInput): Promise<ResolveConflictsResult>;
  reflect(input: ReflectInput): Promise<ReflectResult>;
}
```

## Rules

- **Core** depends only on `AgentRunner`. It never imports Cursor, GitHub Actions, or local CLI.
- **Implementations**: e.g. `CursorCloudRunner` (Cursor API / @cursor), `LocalCLIRunner` (subprocess
  or local agent API). Each lives outside `core/` or in a dedicated adapter package.
- **Errors**: Runner returns `error` and/or `applied: false` / `resolved: false` / `escalated: true`
  so core can decide retries, escalation, or user notification.
- **Idempotency**: Callers (workflow) are responsible for idempotency (e.g. same PR/comment id);
  runner may assume single call per logical operation.

## Testing

- **Contract tests**: A mock `AgentRunner` that returns fixed results; core workflow tests use it.
  No real API calls.
- **Integration**: Optional tests with a real implementation behind feature flag or in CI with
  secrets.

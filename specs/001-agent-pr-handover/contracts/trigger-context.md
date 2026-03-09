# Contract: Trigger Context (HTTP vs GitHub Actions)

**Purpose**: Unify the input passed into core workflow so that the same functions run whether the trigger is an HTTP request or a GitHub Actions job. This document defines the minimal context object that both transports produce and pass to core.

## TriggerContext (minimal)

Core workflow functions accept a single context object that carries identity and environment:

```ts
type TriggerContext = {
  trigger: 'http' | 'github_actions';
  repo: { owner: string; repo: string };
  prNumber: number;
  // Optional; set for comment handling
  commentId?: number;
  // Optional; set for webhook event type / workflow event
  event?: string;
  // Credentials / API client (injected; core does not care how it was obtained)
  github: GitHubClient;  // abstraction over Octokit or fetch
  agent: AgentRunner;
  config: RunConfig;    // org, labels, timeouts, merge strategy, etc.
};
```

## Responsibilities

- **HTTP server**: Builds `TriggerContext` from request body (and optionally auth), injects `github` (e.g. from env token), `agent` (configured runner), and `config`; calls e.g. `workflow.runAnalyze(ctx)`.
- **GitHub Actions**: Builds `TriggerContext` from `github.context` (and inputs); obtains token from `GITHUB_TOKEN` or secrets; injects same `github`, `agent`, and `config`; calls same `workflow.runAnalyze(ctx)` (or equivalent).
- **Core**: Uses only `TriggerContext`; never reads `process.env` or request/response objects. This keeps core portable and testable.

## Event mapping

- `pull_request` (labeled) → run analyze if opt-in label added; update state labels.
- `issue_comment` (on PR) → run comment classification and resolution.
- `pull_request` (synchronize / mergeable state) → run conflict check and resolution or escalation.
- `pull_request` (closed, merged) → run reflection and learnings.

Actions workflows may map `workflow_dispatch` or `repository_dispatch` to the same context shape with `event` and repo/PR from inputs.

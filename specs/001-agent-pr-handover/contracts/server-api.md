# Contract: HTTP Server API

**Purpose**: Define the HTTP surface of the Deno server that invokes core workflow. Used for
localhost and Deno Deploy. Same core logic can be triggered by GitHub Actions without going through
HTTP.

## Base URL

- Local: `http://localhost:<port>` (port from config/env).
- Deploy: implementation-defined base URL.

## Authentication

- Out of scope for this contract; implementer may add API key, OAuth, or webhook secret
  verification. Webhook consumers (e.g. GitHub) must verify payload signature.

## Endpoints

Endpoints accept and return JSON unless noted. All workflow endpoints delegate to `core/` and return
consistent error shapes.

### Health

- `GET /health`
  - Response: `200` body e.g. `{ "ok": true }`. No auth required.

### Webhook (GitHub)

- `POST /webhook/github`
  - Headers: `X-GitHub-Event`, `X-Hub-Signature-256` (if verification enabled).
  - Body: GitHub webhook payload (see [GitHub docs](https://docs.github.com/en/webhooks)).
  - Behavior: Dispatch by `X-GitHub-Event` (e.g. `pull_request`, `issue_comment`) and payload;
    invoke core workflow (analyze on label add, comment handling on comment, etc.).
  - Response: `200` after accepted (processing may be async); `4xx/5xx` on bad payload or internal
    error.

### Manual trigger (optional)

- `POST /run/analyze`
  - Body: `{ "owner": string, "repo": string, "prNumber": number }`
  - Behavior: Run analysis workflow for the given PR (if opted-in).
  - Response: `200` with `{ "report": AnalysisReport }` or error.

- `POST /run/comment`
  - Body: `{ "owner": string, "repo": string, "prNumber": number, "commentId": number }`
  - Behavior: Run comment classification and resolution for the given comment.
  - Response: `200` with result summary or error.

- `POST /run/conflicts`
  - Body: `{ "owner": string, "repo": string, "prNumber": number }`
  - Behavior: Run conflict detection and resolution (or escalation).
  - Response: `200` with `{ "resolved": boolean, "escalated": boolean }` or error.

- `POST /run/reflect`
  - Body: `{ "owner": string, "repo": string, "prNumber": number }`
  - Behavior: Run reflection/learnings after merge.
  - Response: `200` with `{ "learnings": Learning[] }` or error.

## Error response shape

- Status: `4xx` or `5xx`.
- Body: `{ "error": string, "code"?: string }`. Optional `code` for programmatic handling.

## Consistency with core

- No business logic in routes; routes parse request, call core workflow with context (repo, PR,
  comment, etc.), and return results. Core is shared with GitHub Actions entrypoints.

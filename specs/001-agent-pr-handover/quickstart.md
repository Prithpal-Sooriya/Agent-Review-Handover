# Quickstart: Agent Handover for Pull Requests

**Feature**: 001-agent-pr-handover\
**Phase 1 output**: Minimal steps to run the system locally and (optionally) as GitHub Actions.

---

## Prerequisites

- **Deno** 2.x or latest LTS: [deno.land](https://deno.land) — install and ensure `deno` is on PATH.
- **GitHub**: Repo access; personal access token or app credentials with `repo` (and optional
  `admin` for re-request review) scope.
- **Config**: Organization name for “org member” comment checks; optional repo allowlist.

---

## 1. Clone and install

```bash
git clone <repo-url>
cd Agent-Review-Handover
git checkout 001-agent-pr-handover
```

No `npm install`; Deno uses URL imports and `deno.json` for scripts and config.

---

## 2. Configure environment

Create a `.env` or set environment variables (do not commit secrets):

- `GITHUB_TOKEN` — PAT or app installation token.
- `GITHUB_ORG` — Organization whose members’ comments are processed.
- Optional: `OPT_IN_LABEL`, `PORT`, `AGENT_RUNNER` (e.g. `cursor_cloud`), etc., as defined in
  server/config.

---

## 3. Run the server (localhost)

From repo root:

```bash
deno task start
# or: deno run --allow-net --allow-env server/main.ts
```

Server listens on configured port (e.g. 8000). Endpoints: see
[contracts/server-api.md](./contracts/server-api.md).

- **Health**: `curl http://localhost:8000/health`
- **Webhook**: Point GitHub repo webhook to `POST https://your-ngrok-or-host/webhook/github` with
  events: `pull_request`, `issue_comment`. Ensure signature verification if using secret.

---

## 4. Run via GitHub Actions (infrastructure-free)

- Copy or link workflow files from `.github/workflows/` (e.g. `on-pr-label.yml`, `on-comment.yml`).
- Secrets: `GITHUB_TOKEN` is provided by Actions; add `CURSOR_API_KEY` or similar if using cloud
  agent.
- Actions call the same `core/` logic (e.g. via `deno run` or a compiled script); they build
  `TriggerContext` from `github.context` and invoke workflow functions. No HTTP server required.

---

## 5. Opt in a PR

- Add the opt-in label (e.g. `agent-handover`) to a PR.
- **If server**: Webhook receives `pull_request` → labeled → run analysis; report is added/updated
  in PR description.
- **If Actions**: Workflow triggered on label → same analysis run; report written via GitHub API.

---

## 6. Optional: Web UI

- Serve `frontend/` with any static server (e.g. `deno serve frontend/` or open
  `frontend/index.html`).
- UI uses Open Props (and Open Props UI) via link/import; no build step. Configure `api.js` base URL
  to point at your server.

---

## Next steps

- **Tasks**: See [tasks.md](./tasks.md) (created by `/speckit.tasks`) for implementation tasks.
- **Contracts**: [contracts/](./contracts/) for agent runner, server API, and trigger context.
- **Deploy**: Use Deno Deploy to host the server; set env and webhook URL in GitHub.

# Research: Agent Handover for Pull Requests

**Feature**: 001-agent-pr-handover\
**Phase 0 output**: Decisions and rationale for technical context. No NEEDS CLARIFICATION remained
after user input.

---

## 1. Runtime and deployment

**Decision**: TypeScript and Deno for server runtime; localhost development with a path to Deno
Deploy for hosted deployment.

**Rationale**: Deno provides TypeScript out of the box, standard library, and native fetch; single
runtime for scripts and HTTP. Deno Deploy offers simple deployment without a separate Node/build
step. Aligns with “minimize dependencies” and “platform APIs first.”

**Alternatives considered**: Node.js + ts-node or compiled JS (extra tooling); Python (different
ecosystem, not requested); pure JS (TypeScript preferred for maintainability).

---

## 2. Transport-agnostic core and GitHub Actions

**Decision**: Core agent orchestration lives in a `core/` module that is decoupled from the
transport layer. The same workflow code is invoked from (a) the HTTP server and (b) GitHub Actions
workflows, so logic is reusable and infrastructure-free operation is supported.

**Rationale**: Spec and user require “architecture scripts modular so we can lift the logic and move
into running core logic as GitHub Actions workflows.” A single core keeps behavior identical
regardless of trigger (webhook → HTTP server vs. workflow_dispatch / repository_dispatch / events).

**Alternatives considered**: Duplicating logic per transport (rejected: drift risk); putting all
logic inside Actions YAML (rejected: harder to test and reuse).

---

## 3. Web UI stack

**Decision**: Vanilla HTML, CSS, and JavaScript with no UI framework. CSS strictly follows Open
Props and Open Props UI for design tokens and pre-built components. JavaScript uses
component-inspired patterns (UI rendering separate from business logic, composable functions, clear
data flow) without a framework.

**Rationale**: User requirement: “Web UI uses vanilla HTML, CSS, and JavaScript with no UI
framework” and “CSS strictly follows Open Props … and Open Props UI.” Open Props gives consistent
tokens and components without a JS framework; component-inspired JS keeps structure clear and
dependencies minimal.

**Alternatives considered**: React/Vue/Svelte (rejected: user said no UI framework); Tailwind
(rejected: user specified Open Props); no UI (optional UI retained for config/dashboard use cases).

---

## 4. GitHub API and agent execution

**Decision**: GitHub API via Octokit or native fetch. Agent execution is pluggable: start with cloud
agents (Cursor API, GitHub @cursor mentions) and define interfaces so local agent runners can be
swapped in later.

**Rationale**: “GitHub API interactions use Octokit or native fetch” and “Agent execution should be
pluggable … design interfaces that allow swapping in local agent runners.” Interfaces (e.g. in
`core/agent-runner.ts`) allow testing with mocks and future local runners without changing workflow
code.

**Alternatives considered**: Tightly coupling to a single agent provider (rejected: blocks FOSS and
local use); mandating only fetch (Octokit kept as optional for convenience and typing).

---

## 5. Dependencies and built-ins

**Decision**: Minimize dependencies. Prefer JS standard library first, then Deno standard library
and platform APIs. Add dependencies only when justified (e.g. Octokit for GitHub, Open Props via CDN
or copy for CSS).

**Rationale**: Constitution “Built-ins First” and user “Minimize dependencies.” Reduces supply-chain
and maintenance cost and keeps the project portable for Actions and Deno Deploy.

**Alternatives considered**: Heavy frameworks or many npm packages (rejected per user and
constitution).

---

## 6. Testing strategy

**Decision**: Deno built-in test runner for unit and integration tests; contract tests at boundaries
(agent runner interface, HTTP API, and optionally GitHub API shape). Tests deterministic and fast
where possible.

**Rationale**: Constitution “Tests for behavior-affecting features; deterministic, fast where
possible.” Deno test is built-in; contract tests protect the transport and runner boundaries when
refactoring.

**Alternatives considered**: External test framework (rejected: Deno test sufficient); no contract
tests (rejected: boundaries are critical for HTTP vs Actions parity).

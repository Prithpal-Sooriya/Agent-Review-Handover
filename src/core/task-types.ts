/**
 * Core task types for the Agent Review Handover system.
 * Based on specs/001-agent-pr-handover/contracts/task-interface.md
 */

export type Repo = { owner: string; repo: string };

export type TaskKind =
  | "analyze-pr"
  | "classify-comment"
  | "resolve-nit"
  | "resolve-conflict"
  | "request-re-review"
  | "reflect-on-merge";

/**
 * Structured content generated for an opted-in PR.
 */
export interface AnalysisReport {
  code_walkthrough: string;
  complexity: "simple" | "moderate" | "complex";
  review_effort: string;
  generated_at: string; // ISO 8601 timestamp
}

/**
 * Captured patterns from resolved nits and review evolution.
 */
export interface Learning {
  id?: string;
  source_pr: string | number;
  pattern: string;
  captured_at: string; // ISO 8601 timestamp
  scope?: "global" | "repo";
}

// --- Payload Types ---

export interface AnalyzePRPayload {
  repo: Repo;
  prNumber: number;
}

export interface ClassifyCommentPayload {
  repo: Repo;
  prNumber: number;
  commentId: number | string;
}

export interface ResolveNitPayload {
  repo: Repo;
  prNumber: number;
  commentId: number | string;
}

export interface ResolveConflictPayload {
  repo: Repo;
  prNumber: number;
  strategy?: "merge" | "rebase";
}

export interface RequestReReviewPayload {
  repo: Repo;
  prNumber: number;
}

export interface ReflectOnMergePayload {
  repo: Repo;
  prNumber: number;
}

// --- Task Specification ---

/**
 * Defines an atomic task to be executed by an agent.
 * Discriminated union for type-safe payloads.
 */
export type TaskSpec =
  | { task: "analyze-pr"; payload: AnalyzePRPayload }
  | { task: "classify-comment"; payload: ClassifyCommentPayload }
  | { task: "resolve-nit"; payload: ResolveNitPayload }
  | { task: "resolve-conflict"; payload: ResolveConflictPayload }
  | { task: "request-re-review"; payload: RequestReReviewPayload }
  | { task: "reflect-on-merge"; payload: ReflectOnMergePayload };

// --- Task Results ---

export interface TaskResult {
  success: boolean;
  actionsTaken?: string[];
  error?: string;
  nextTasks?: TaskSpec[];
}

export interface AnalyzePRResult extends TaskResult {
  report?: AnalysisReport;
}

export interface ClassifyCommentResult extends TaskResult {
  kind?: "nit" | "discussion" | "unclear";
}

export interface ResolveNitResult extends TaskResult {
  applied: boolean;
  message?: string;
}

export interface ResolveConflictResult extends TaskResult {
  resolved: boolean;
  escalated?: boolean;
}

export interface ReflectOnMergeResult extends TaskResult {
  learnings?: Learning[];
}

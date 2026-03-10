import {
  AnalysisReport,
  Comment,
  Learning,
  MergeStrategy,
  PRContext,
  ReviewEvent,
} from "../types/mod.ts";

// Inputs for different workflow steps
export type AnalyzeInput = { pr: PRContext; diffSummary?: string };
export type ClassifyCommentInput = {
  pr: PRContext;
  comment: Comment;
  learnings?: string[];
};
export type ResolveNitInput = {
  pr: PRContext;
  comment: Comment;
  learnings?: string[];
};
export type ResolveConflictsInput = {
  pr: PRContext;
  strategy: MergeStrategy;
};
export type ReflectInput = { pr: PRContext; events: ReviewEvent[] };

// Result types
export type AnalyzeResult = { report: AnalysisReport; error?: string };
export type ClassifyResult = {
  kind: "nit" | "discussion" | "unclear";
  error?: string;
};
export type ResolveNitResult = {
  applied: boolean;
  message?: string;
  error?: string;
};
export type ResolveConflictsResult = {
  resolved: boolean;
  escalated?: boolean;
  error?: string;
};
export type ReflectResult = { learnings: Learning[]; error?: string };

export interface AgentRunner {
  analyze(input: AnalyzeInput): Promise<AnalyzeResult>;
  classifyComment(input: ClassifyCommentInput): Promise<ClassifyResult>;
  resolveNit(input: ResolveNitInput): Promise<ResolveNitResult>;
  resolveConflicts(input: ResolveConflictsInput): Promise<ResolveConflictsResult>;
  reflect(input: ReflectInput): Promise<ReflectResult>;
}

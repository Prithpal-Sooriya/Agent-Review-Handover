#!/usr/bin/env node
/**
 * One-off: create GitHub issues from specs/001-agent-pr-handover/tasks.md
 * Run from repo root. Requires: gh CLI, authenticated to GitHub.
 */

import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import process from "node:process";
import { tmpdir } from "os";
import { join } from "path";

const TASKS_PATH = "specs/001-agent-pr-handover/tasks.md";
const REPO = "Prithpal-Sooriya/Agent-Review-Handover";
const TASK_LINE = /^\- \[ \] (T\d+ .+)$/;

const text = readFileSync(TASKS_PATH, "utf8");
const lines = text.split("\n");
const tasks = [];

for (const line of lines) {
  const m = line.match(TASK_LINE);
  if (m) tasks.push(m[1]);
}

const maxTitleLen = 250;

for (const desc of tasks) {
  const title = desc.length > maxTitleLen ? desc.slice(0, maxTitleLen - 3) + "..." : desc;
  const body =
    `Task from spec 001-agent-pr-handover.\n\n**Description:**\n${desc}\n\n---\nSource: \`specs/001-agent-pr-handover/tasks.md\``;
  const bodyPath = join(tmpdir(), `gh-issue-body-${process.pid}-${tasks.indexOf(desc)}.txt`);
  writeFileSync(bodyPath, body, "utf8");
  try {
    execSync(
      `gh issue create --repo "${REPO}" --title ${JSON.stringify(title)} --body-file "${bodyPath}"`,
      {
        stdio: "inherit",
        maxBuffer: 10 * 1024 * 1024,
      },
    );
  } finally {
    try {
      unlinkSync(bodyPath);
    } catch (_) {
      // Ignore if file already removed or missing
    }
  }
}

console.error(`Created ${tasks.length} issues.`);

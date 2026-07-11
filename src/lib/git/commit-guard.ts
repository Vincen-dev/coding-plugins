import { auditDecisions } from "../workflow/decision-state.ts";
import type { DecisionAuditResult } from "../workflow/decision-state.ts";
import { resolveIntegrationPolicy } from "../workflow/policy-resolver.ts";
import { auditFormalCompletion, workflowSchema } from "../workflow/governed-orchestrator.ts";

export type CommitLanguage = "zh" | "en";

export interface CommitGuardOptions {
  root: string;
  feature?: string;
  docId?: string;
  language?: CommitLanguage;
  authorName?: string;
  authorEmail?: string;
  branch?: string;
  changedFiles?: string[];
  allowMain?: boolean;
}

export interface CommitGuardViolation {
  id:
    | "commit-language-unconfirmed"
    | "invalid-author-identity"
    | "sensitive-file-staged"
    | "main-branch-direct-commit"
    | "dp7-not-approved"
    | "completion-not-approved"
    | "version-change-missing";
  message: string;
  blocked_actions: string[];
  missing_files?: string[];
}

export interface CommitGuardResult {
  ok: boolean;
  language: CommitLanguage | null;
  language_confirmed: boolean;
  author: {
    name: string | null;
    email: string | null;
    valid: boolean;
  };
  branch: string | null;
  changed_files: string[];
  decision_status: DecisionAuditResult | null;
  violations: CommitGuardViolation[];
  blocked_actions: string[];
  recommended_action: string;
}

const AI_IDENTITY_RE = /\b(ai|codex|claude|chatgpt|openai|assistant|bot)\b/i;
const SENSITIVE_FILE_RE = /(^|\/)(\.env(?:\.|$)|credentials\.json$|.*\.(?:pem|key)$)|(?:token|password|secret|private[-_]?key)/i;

function validAuthor(name?: string, email?: string): boolean {
  if (!name || !email) {
    return false;
  }
  if (AI_IDENTITY_RE.test(name) || AI_IDENTITY_RE.test(email)) {
    return false;
  }
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function violation(id: CommitGuardViolation["id"], message: string, blockedActions: string[] = ["commit"]): CommitGuardViolation {
  return { id, message, blocked_actions: blockedActions };
}

export function checkCommitGuard(options: CommitGuardOptions): CommitGuardResult {
  const changedFiles = options.changedFiles ?? [];
  const violations: CommitGuardViolation[] = [];
  const integrationPolicy = resolveIntegrationPolicy(options.root);

  if (!options.language) {
    violations.push(violation(
      "commit-language-unconfirmed",
      "commit language must be explicit or confirmed by project policy before committing.",
    ));
  }

  if (!validAuthor(options.authorName, options.authorEmail)) {
    violations.push(violation(
      "invalid-author-identity",
      "git author identity is missing, invalid, or looks like an AI/bot identity.",
    ));
  }

  const sensitive = changedFiles.filter((file) => SENSITIVE_FILE_RE.test(file));
  if (sensitive.length > 0) {
    violations.push(violation(
      "sensitive-file-staged",
      `sensitive file(s) require explicit handling before commit: ${sensitive.join(", ")}.`,
    ));
  }

  if (integrationPolicy.requireVersionChangePerCommit) {
    const changed = new Set(changedFiles);
    const missingVersionFiles = integrationPolicy.versionFiles.filter((file) => !changed.has(file)).sort();
    if (missingVersionFiles.length > 0) {
      violations.push({
        ...violation(
          "version-change-missing",
          `every commit must include the configured version files: ${missingVersionFiles.join(", ")}.`,
        ),
        missing_files: missingVersionFiles,
      });
    }
  }

  if (options.branch === integrationPolicy.baseBranch
    && options.allowMain !== true
    && !(integrationPolicy.strategy === "main-only" && integrationPolicy.allowDirectCommit)) {
    violations.push(violation(
      "main-branch-direct-commit",
      `${integrationPolicy.baseBranch} direct commit is blocked by integrationPolicy unless explicitly allowed.`,
      ["commit", "push"],
    ));
  }

  const governedSchema = options.feature && options.docId
    ? workflowSchema(options.root, { feature: options.feature, docId: options.docId })
    : null;
  const decisionStatus = options.feature && options.docId && governedSchema === "governed-v1"
    ? auditDecisions(options.root, { feature: options.feature, docId: options.docId, target: "commit" })
    : null;
  if (decisionStatus && decisionStatus.missing_decisions.includes("DP-7")) {
    violations.push(violation(
      "dp7-not-approved",
      "DP-7 must be approved before commit, tag, release, or branch cleanup.",
    ));
  }
  if (options.feature && options.docId && governedSchema === "governed-v2") {
    const completion = auditFormalCompletion(options.root, { feature: options.feature, docId: options.docId });
    if (!completion.formalCompletionAllowed) {
      violations.push(violation(
        "completion-not-approved",
        `governed-v2 completion audit must pass before commit: ${completion.blockers.join(", ")}.`,
      ));
    }
  }

  const blockedActions = [...new Set(violations.flatMap((item) => item.blocked_actions))];

  return {
    ok: violations.length === 0,
    language: options.language ?? null,
    language_confirmed: Boolean(options.language),
    author: {
      name: options.authorName ?? null,
      email: options.authorEmail ?? null,
      valid: validAuthor(options.authorName, options.authorEmail),
    },
    branch: options.branch ?? null,
    changed_files: changedFiles,
    decision_status: decisionStatus,
    violations,
    blocked_actions: blockedActions,
    recommended_action: violations.length === 0 ? "commit" : "resolve-commit-guard-violations",
  };
}

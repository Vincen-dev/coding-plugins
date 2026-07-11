import type { DecisionAuditResult } from "../workflow/decision-state.ts";
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
    id: "commit-language-unconfirmed" | "invalid-author-identity" | "sensitive-file-staged" | "main-branch-direct-commit" | "dp7-not-approved" | "completion-not-approved" | "version-change-missing";
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
export declare function checkCommitGuard(options: CommitGuardOptions): CommitGuardResult;

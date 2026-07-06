export declare const RELEASE_COMPLETION_STANDARDS: readonly ["release_commit_pushed", "tag_pushed", "github_actions_success", "release_target_visible", "dependency_resolution_passed"];
export type ReleaseCompletionStandard = typeof RELEASE_COMPLETION_STANDARDS[number] | "package_dependency_order";
export type ReleaseCommand = "plan" | "guard" | "verify";
export interface ReleaseStatusInput {
    version?: string;
    packages?: string[];
    packageOrder?: string[];
    releaseCommitPushed?: boolean;
    tagPushed?: boolean;
    workflowOk?: boolean;
    releaseVisible?: boolean;
    dependencyResolved?: boolean;
}
export interface ReleaseViolation {
    id: "package-order-missing" | "tag-pushed-is-not-release-complete" | "release-standards-missing";
    message: string;
}
export interface ReleaseFlowResult {
    ok: boolean;
    command: ReleaseCommand;
    version: string | null;
    completion_standards: string[];
    package_order: string[];
    missing_standards: string[];
    violations: ReleaseViolation[];
    blocked_actions: string[];
    next_command: string | null;
}
export declare function planRelease(input: ReleaseStatusInput): ReleaseFlowResult;
export declare function verifyRelease(input: ReleaseStatusInput, command?: "guard" | "verify"): ReleaseFlowResult;

export type CompletionReportKind = "task" | "release";
export interface VerifiedCommand {
    command: string;
    status: string;
}
export interface ReleaseEvidence {
    release_commit_pushed: boolean;
    workflow_run: string | null;
    remote_tag: string | null;
    package_visible: string | null;
    dependency_resolution_passed: boolean;
    complete: boolean;
    missing: string[];
    completion_standards: string[];
}
export interface CompletionReport {
    kind: CompletionReportKind;
    implemented: string[];
    verified: VerifiedCommand[];
    unverified: string[];
    local_only_verification: string[];
    commits: string[];
    published: string[];
    release_evidence: ReleaseEvidence;
    sections: string[];
}
export declare function buildCompletionReport(options: {
    kind?: string;
    implemented?: string;
    verified?: string;
    unverified?: string;
    localOnly?: string;
    committed?: string;
    published?: string;
    workflowRun?: string;
    remoteTag?: string;
    packageVisible?: string;
    commitPushed?: boolean;
    dependencyResolved?: boolean;
}): CompletionReport;
export declare function formatCompletionReport(report: CompletionReport): string;

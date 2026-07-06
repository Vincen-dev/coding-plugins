export type CompletionReportKind = "task" | "release";
export interface VerifiedCommand {
    command: string;
    status: string;
}
export interface ReleaseEvidence {
    workflow_run: string | null;
    remote_tag: string | null;
    package_visible: string | null;
    complete: boolean;
    missing: string[];
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
}): CompletionReport;
export declare function formatCompletionReport(report: CompletionReport): string;

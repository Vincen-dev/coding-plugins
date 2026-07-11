export interface PolicyCoverageInput {
    requiredPolicyIds: string[];
    designPolicyIds: string[];
    testPolicyIds: string[];
    taskPolicyIds: string[];
    evidencePolicyIds: string[];
}
export interface PolicyCoverageResult {
    ok: boolean;
    blockers: string[];
    coverage: Record<string, {
        design: boolean;
        test: boolean;
        task: boolean;
        evidence: boolean;
    }>;
}
export declare function auditPolicyCoverage(input: PolicyCoverageInput): PolicyCoverageResult;

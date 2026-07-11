import type { ResolvedPolicyBundle } from "./policy-resolver.ts";
export interface TechnicalDocumentInput {
    status: string;
    text: string;
    policyDesignIds?: string[];
    policyTestIds?: string[];
}
export interface PolicyWaiver {
    policyId: string;
    reason: string;
    approved: boolean;
}
export interface TechnicalApprovalInput {
    tsd: TechnicalDocumentInput;
    tvd: TechnicalDocumentInput;
    policyBundle: ResolvedPolicyBundle;
    waivers: PolicyWaiver[];
}
export interface TechnicalApprovalResult {
    ok: boolean;
    blockers: string[];
    approvalBundleHash: string;
    requiredPolicyHash: string;
}
export declare function auditTechnicalBundle(input: TechnicalApprovalInput): TechnicalApprovalResult;

import { computeDecisionBundleHash } from "./decision-state.ts";
import type { DecisionBundleInput } from "./decision-state.ts";
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

function reviewReady(status: string): boolean {
  return status === "review-ready" || status === "approved";
}

export function auditTechnicalBundle(input: TechnicalApprovalInput): TechnicalApprovalResult {
  const blockers: string[] = [];
  if (!reviewReady(input.tsd.status)) {
    blockers.push("TSD_NOT_REVIEW_READY");
  }
  if (!reviewReady(input.tvd.status)) {
    blockers.push("TVD_NOT_REVIEW_READY");
  }

  const designIds = new Set(input.tsd.policyDesignIds ?? []);
  const testIds = new Set(input.tvd.policyTestIds ?? []);
  const approvedWaivers = new Set(input.waivers.filter((waiver) => waiver.approved).map((waiver) => waiver.policyId));
  for (const waiver of input.waivers.filter((candidate) => !candidate.approved)) {
    blockers.push(`POLICY_WAIVER_UNAPPROVED:${waiver.policyId}`);
  }
  for (const policy of input.policyBundle.required) {
    if (!designIds.has(policy.id) && !approvedWaivers.has(policy.id)) {
      blockers.push(`POLICY_DESIGN_MISSING:${policy.id}`);
    }
    if (!testIds.has(policy.id) && !approvedWaivers.has(policy.id)) {
      blockers.push(`POLICY_TEST_MISSING:${policy.id}`);
    }
  }
  blockers.push(...input.policyBundle.conflicts.map((conflict) => `POLICY_CONFLICT:${conflict}`));
  blockers.push(...input.policyBundle.missingSources.map((policyId) => `POLICY_SOURCE_MISSING:${policyId}`));
  blockers.push(...input.policyBundle.skillBindings
    .filter((binding) => binding.requiredForExecution && !binding.portable)
    .map((binding) => `REQUIRED_SKILL_NON_PORTABLE:${binding.name}`));

  const decisionBundle: DecisionBundleInput = {
    artifacts: { TSD: input.tsd.text, TVD: input.tvd.text },
    requiredPolicies: input.policyBundle.required,
    requiredSkills: input.policyBundle.skillBindings.filter((binding) => binding.requiredForExecution),
    approvedWaivers: [...approvedWaivers],
  };
  return {
    ok: blockers.length === 0,
    blockers: [...new Set(blockers)].sort(),
    approvalBundleHash: computeDecisionBundleHash(decisionBundle),
    requiredPolicyHash: input.policyBundle.requiredPolicyHash,
  };
}

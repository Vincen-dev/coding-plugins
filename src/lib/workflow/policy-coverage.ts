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
  coverage: Record<string, { design: boolean; test: boolean; task: boolean; evidence: boolean }>;
}

export function auditPolicyCoverage(input: PolicyCoverageInput): PolicyCoverageResult {
  const design = new Set(input.designPolicyIds);
  const tests = new Set(input.testPolicyIds);
  const tasks = new Set(input.taskPolicyIds);
  const evidence = new Set(input.evidencePolicyIds);
  const coverage: PolicyCoverageResult["coverage"] = {};
  const blockers: string[] = [];

  for (const policyId of [...new Set(input.requiredPolicyIds)].sort()) {
    const status = {
      design: design.has(policyId),
      test: tests.has(policyId),
      task: tasks.has(policyId),
      evidence: evidence.has(policyId),
    };
    coverage[policyId] = status;
    for (const stage of ["design", "test", "task", "evidence"] as const) {
      if (!status[stage]) {
        blockers.push(`POLICY_COVERAGE_MISSING:${policyId}:${stage}`);
      }
    }
  }
  return { ok: blockers.length === 0, blockers, coverage };
}

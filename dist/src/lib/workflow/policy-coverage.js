export function auditPolicyCoverage(input) {
    const design = new Set(input.designPolicyIds);
    const tests = new Set(input.testPolicyIds);
    const tasks = new Set(input.taskPolicyIds);
    const evidence = new Set(input.evidencePolicyIds);
    const coverage = {};
    const blockers = [];
    for (const policyId of [...new Set(input.requiredPolicyIds)].sort()) {
        const status = {
            design: design.has(policyId),
            test: tests.has(policyId),
            task: tasks.has(policyId),
            evidence: evidence.has(policyId),
        };
        coverage[policyId] = status;
        for (const stage of ["design", "test", "task", "evidence"]) {
            if (!status[stage]) {
                blockers.push(`POLICY_COVERAGE_MISSING:${policyId}:${stage}`);
            }
        }
    }
    return { ok: blockers.length === 0, blockers, coverage };
}

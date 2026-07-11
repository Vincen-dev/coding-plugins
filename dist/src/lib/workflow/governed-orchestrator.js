import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildResult } from "../documents/validate-tdd-evidence.js";
import { approveDecision, approveDecisionV2, auditDecisionV2, auditDecisions, getDecisionStatus } from "./decision-state.js";
import { auditCompletion } from "./completion-state.js";
import { loadActiveChange } from "./active-change.js";
import { loadPolicyRegistry, resolvePolicyBundle } from "./policy-resolver.js";
import { auditPolicyCoverage } from "./policy-coverage.js";
import { auditTechnicalBundle } from "./technical-approval.js";
import { artifactPath, computeUpstreamHash, parseFrontmatter } from "./workflow-state.js";
function readArtifact(root, feature, docId, suffix) {
    const path = artifactPath(root, { feature, docId, suffix });
    return existsSync(path) ? readFileSync(path, "utf8") : "";
}
function policyIds(text) {
    return [...new Set([...text.matchAll(/\bPOL-[A-Z0-9-]+\b/g)].map((match) => match[0]))].sort();
}
function policyIdsInSection(text, heading) {
    const lines = text.split(/\r?\n/);
    const section = [];
    let active = false;
    for (const line of lines) {
        if (new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*$`, "i").test(line)) {
            active = true;
            continue;
        }
        if (active && /^##\s+/.test(line)) {
            break;
        }
        if (active) {
            section.push(line);
        }
    }
    return policyIds(section.join("\n"));
}
function repositoryKind(root) {
    return existsSync(join(root, "package.json")) ? "typescript" : "generic";
}
function emptyRegistry() {
    return { schemaVersion: 1, policies: [], skillBindings: [] };
}
function resolvePolicies(root) {
    const registry = existsSync(join(root, "coding-plugins.policies.yaml")) ? loadPolicyRegistry(root) : emptyRegistry();
    return resolvePolicyBundle({ root, registry, repositoryKind: repositoryKind(root) });
}
export function workflowSchema(root, options) {
    for (const suffix of ["PRD", "TSD", "TVD", "TED"]) {
        const metadata = parseFrontmatter(artifactPath(root, { ...options, suffix }));
        if (metadata.workflow_schema === "governed-v2") {
            return "governed-v2";
        }
    }
    return "governed-v1";
}
function bundleFor(root, options) {
    const policies = resolvePolicies(root);
    if (options.id === "DP-1") {
        return {
            policies,
            bundle: { artifacts: { PRD: readArtifact(root, options.feature, options.docId, "PRD") } },
        };
    }
    if (options.id === "DP-2") {
        return {
            policies,
            bundle: {
                artifacts: {
                    TSD: readArtifact(root, options.feature, options.docId, "TSD"),
                    TVD: readArtifact(root, options.feature, options.docId, "TVD"),
                },
                requiredPolicies: policies.required,
                requiredSkills: policies.skillBindings.filter((binding) => binding.requiredForExecution),
                approvedWaivers: [],
            },
        };
    }
    return {
        policies,
        bundle: { artifacts: { TED: readArtifact(root, options.feature, options.docId, "TED") } },
    };
}
function technicalBlockers(root, options, policies) {
    const tsdPath = artifactPath(root, { ...options, suffix: "TSD" });
    const tvdPath = artifactPath(root, { ...options, suffix: "TVD" });
    const tsd = readArtifact(root, options.feature, options.docId, "TSD");
    const tvd = readArtifact(root, options.feature, options.docId, "TVD");
    return auditTechnicalBundle({
        tsd: {
            status: parseFrontmatter(tsdPath).status ?? "missing",
            text: tsd,
            policyDesignIds: policyIdsInSection(tsd, "Policy-to-Design Mapping"),
        },
        tvd: {
            status: parseFrontmatter(tvdPath).status ?? "missing",
            text: tvd,
            policyTestIds: policyIdsInSection(tvd, "Engineering Policy 测试"),
        },
        policyBundle: policies,
        waivers: [],
    }).blockers;
}
function approveTechnicalDocuments(root, options) {
    for (const suffix of ["TSD", "TVD"]) {
        const path = artifactPath(root, { ...options, suffix });
        const text = readFileSync(path, "utf8");
        const next = text
            .replace(/^(status:\s*)review-ready\s*$/m, "$1approved")
            .replace(/^(lifecycle_status:\s*)review-ready\s*$/m, "$1approved");
        if (next !== text) {
            writeFileSync(path, next, "utf8");
        }
    }
}
export function approveGovernedDecision(root, options) {
    if (workflowSchema(root, options) === "governed-v1") {
        return { ok: true, blockers: [], decision: approveDecision(root, options) };
    }
    let current = bundleFor(root, options);
    if (options.id === "DP-2") {
        const scope = bundleFor(root, { ...options, id: "DP-1" });
        const scopeAudit = auditDecisionV2(root, { ...options, id: "DP-1", bundle: scope.bundle });
        if (!scopeAudit.approved) {
            return { ok: false, blockers: [`DECISION_${scopeAudit.status.toUpperCase()}:DP-1`], decision: null };
        }
        const blockers = technicalBlockers(root, options, current.policies);
        if (blockers.length > 0) {
            return { ok: false, blockers, decision: null };
        }
        approveTechnicalDocuments(root, options);
        current = bundleFor(root, options);
    }
    if (options.id === "DP-3") {
        const technical = bundleFor(root, { ...options, id: "DP-2" });
        const technicalAudit = auditDecisionV2(root, { ...options, id: "DP-2", bundle: technical.bundle });
        const blockers = [
            ...(technicalAudit.approved ? [] : [`DECISION_${technicalAudit.status.toUpperCase()}:DP-2`]),
            ...technicalBlockers(root, options, technical.policies),
        ];
        if (blockers.length > 0) {
            return { ok: false, blockers, decision: null };
        }
    }
    const decision = approveDecisionV2(root, { ...options, bundle: current.bundle });
    return { ok: true, blockers: [], decision };
}
export function auditGovernedExecution(root, options) {
    if (workflowSchema(root, options) === "governed-v1") {
        return auditDecisions(root, { ...options, target: "execute" });
    }
    const technical = bundleFor(root, { ...options, id: "DP-2" });
    const technicalDecision = auditDecisionV2(root, { ...options, id: "DP-2", bundle: technical.bundle });
    const execution = bundleFor(root, { ...options, id: "DP-3" });
    const executionDecision = auditDecisionV2(root, { ...options, id: "DP-3", bundle: execution.bundle });
    const technicalGaps = technicalBlockers(root, options, technical.policies);
    const missing = [
        ...(technicalDecision.approved && technicalGaps.length === 0 ? [] : ["DP-2"]),
        ...(executionDecision.approved ? [] : ["DP-3"]),
    ];
    return {
        ok: missing.length === 0,
        approved: missing.length === 0,
        feature: options.feature,
        doc_id: options.docId,
        target: "execute",
        required_decision: missing[0] ?? "DP-3",
        required_decisions: ["DP-3"],
        missing_decisions: [...new Set(missing)],
        decisions: [],
        blocked_actions: missing.length === 0 ? [] : ["execute"],
    };
}
function decisionsApproved(root, options, schema) {
    if (schema === "governed-v1") {
        return getDecisionStatus(root, { ...options, id: "DP-6" }).approved;
    }
    const current = bundleFor(root, { ...options, id: "DP-3" });
    return auditDecisionV2(root, { ...options, id: "DP-3", bundle: current.bundle }).approved;
}
export function auditFormalCompletion(root, options) {
    const schema = workflowSchema(root, options);
    const vedPath = artifactPath(root, { ...options, suffix: "VED" });
    const ved = readArtifact(root, options.feature, options.docId, "VED");
    const tsd = readArtifact(root, options.feature, options.docId, "TSD");
    const tvd = readArtifact(root, options.feature, options.docId, "TVD");
    const ted = readArtifact(root, options.feature, options.docId, "TED");
    const evidence = buildResult(vedPath, { strict: false, root, artifactMode: "tracked" });
    const policies = resolvePolicies(root);
    const coverage = auditPolicyCoverage({
        requiredPolicyIds: policies.required.map((policy) => policy.id),
        designPolicyIds: policyIds(tsd),
        testPolicyIds: policyIds(tvd),
        taskPolicyIds: policyIds(ted),
        evidencePolicyIds: policyIds(ved),
    });
    const active = loadActiveChange(root);
    const currentHash = computeUpstreamHash(root, options);
    const tedHash = parseFrontmatter(artifactPath(root, { ...options, suffix: "TED" })).source_hash ?? null;
    const vedStatus = parseFrontmatter(vedPath).status ?? null;
    const completion = auditCompletion({
        tasksComplete: vedStatus === "complete",
        testsPassed: evidence.content_valid,
        policyCoverageComplete: coverage.ok,
        scopeRelation: active?.state === "needs-rescope" ? "expanded" : "within-scope",
        sourceHashMatches: Boolean(currentHash && tedHash === currentHash),
        decisionsApproved: decisionsApproved(root, options, schema),
        evidenceFormal: evidence.formal_completion_allowed,
    });
    return {
        ...completion,
        feature: options.feature,
        docId: options.docId,
        workflowSchema: schema,
        evidenceErrors: evidence.errors,
        policyBlockers: coverage.blockers,
    };
}

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { parseExecutionLock, validateExecutionSections } from "./workflow-guard.js";
import { inspectDocumentChain } from "./workflow-state.js";
function splitList(value) {
    if (!value) {
        return [];
    }
    return value
        .split(/[,，、]/)
        .map((item) => item.trim().replace(/^`|`$/g, ""))
        .filter(Boolean);
}
function extractRequiredTests(tedText, lock) {
    const fromLock = splitList(lock?.["Required Tests"]);
    const commandMatches = [...tedText.matchAll(/`([^`\n]*(?:npm|pnpm|yarn|node|bash)[^`\n]*)`/g)].map((match) => match[1].trim());
    return [...new Set([...fromLock, ...commandMatches])].sort();
}
export function contractPath(root, options) {
    return join(root, "docs/coding-plugins/features", options.feature, "plans", `${options.docId}-execution-contract.md`);
}
export function renderExecutionContract(contract) {
    const list = (items) => (items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- none");
    return [
        "---",
        "schema_version: 1",
        `feature: ${contract.feature}`,
        `doc_id: ${contract.doc_id}`,
        `state: ${contract.state}`,
        `source_hash: ${contract.source_hash ?? ""}`,
        "---",
        `# Execution Contract: ${contract.feature}/${contract.doc_id}`,
        "",
        `Generated at: ${contract.generated_at}`,
        "",
        "## Required Artifacts",
        "",
        list(contract.required_artifacts),
        "",
        "## Required Spec IDs",
        "",
        list(contract.required_spec_ids),
        "",
        "## Required Tests",
        "",
        list(contract.required_tests),
        "",
        "## Review Gates",
        "",
        list(contract.review_gates),
        "",
        "## Rewind Triggers",
        "",
        list(contract.rewind_triggers),
        "",
        "## Execution Source",
        "",
        contract.execution_source,
        "",
        "## New Plan Policy",
        "",
        contract.new_plan_policy,
        "",
    ].join("\n");
}
export function buildExecutionContract(root, options) {
    const state = inspectDocumentChain(root, options);
    const tedPath = join(root, state.artifacts.TED.path);
    const failures = state.state === "ready-for-execution" ? validateExecutionSections(tedPath) : [`state '${state.state}' is not ready for execution`];
    const tedText = existsSync(tedPath) ? readFileSync(tedPath, "utf8") : "";
    const lock = parseExecutionLock(tedText);
    const requiredArtifacts = Object.values(state.artifacts)
        .filter((artifact) => artifact.exists)
        .map((artifact) => artifact.path.replace(`docs/coding-plugins/features/${options.feature}/`, ""));
    const requiredSpecIds = splitList(lock?.["Required Spec IDs"]);
    const contract = {
        schema_version: 1,
        feature: options.feature,
        doc_id: options.docId,
        state: state.state,
        source_hash: state.plan_source_hash,
        generated_at: options.now ?? new Date().toISOString(),
        required_artifacts: requiredArtifacts,
        required_spec_ids: requiredSpecIds,
        required_tests: extractRequiredTests(tedText, lock),
        review_gates: splitList(lock?.["Review Gates"]),
        rewind_triggers: splitList(lock?.["Rewind Triggers"]),
        execution_source: "TED task chapters plus this generated execution contract",
        new_plan_policy: "create a new TED for each new execution plan; do not append new plan tasks to an existing TED",
    };
    const path = contractPath(root, options);
    return { contract, path: relative(root, path).replaceAll("\\", "/"), failures, markdown: renderExecutionContract(contract) };
}
export function writeExecutionContract(root, result) {
    const path = join(root, result.path);
    if (!existsSync(dirname(path))) {
        throw new Error(`contract directory is missing: ${dirname(path)}`);
    }
    writeFileSync(path, result.markdown, "utf8");
    return result;
}

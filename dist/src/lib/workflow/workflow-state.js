import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { DOCUMENT_ARTIFACTS, artifactFile, parseFrontmatter as parseDocumentFrontmatter } from "../documents/document-metadata.js";
const REQUIRED_ARTIFACTS = ["PRD", "TSD", "TVD", "TED", "VED"];
const UPSTREAM_ARTIFACTS = ["PRD", "TSD", "TVD"];
const ARTIFACTS = DOCUMENT_ARTIFACTS.map((artifact) => artifact.suffix);
function toPosix(path) {
    return path.replaceAll("\\", "/");
}
export function artifactPath(root, options) {
    const featureRoot = join(root, "docs", "coding-plugins", "features", options.feature);
    return artifactFile(featureRoot, options.suffix, options.docId);
}
export function parseFrontmatter(path) {
    if (!existsSync(path)) {
        return {};
    }
    return parseDocumentFrontmatter(readFileSync(path, "utf8"));
}
export function computeUpstreamHash(root, options) {
    const digest = createHash("sha256");
    let hasContent = false;
    for (const suffix of UPSTREAM_ARTIFACTS) {
        const path = artifactPath(root, { ...options, suffix });
        if (!existsSync(path)) {
            continue;
        }
        const relativePath = toPosix(relative(root, path));
        digest.update(Buffer.from(relativePath, "utf8"));
        digest.update(Buffer.from([0]));
        digest.update(readFileSync(path));
        digest.update(Buffer.from([0]));
        hasContent = true;
    }
    return hasContent ? `sha256:${digest.digest("hex")}` : null;
}
export function artifactSummary(root, options) {
    const summary = {};
    for (const suffix of ARTIFACTS) {
        const path = artifactPath(root, { ...options, suffix });
        const metadata = parseFrontmatter(path);
        const data = {
            path: toPosix(relative(root, path)),
            exists: existsSync(path),
            status: metadata.status ?? null,
        };
        if (suffix === "TED") {
            data.source_hash = metadata.source_hash ?? null;
        }
        summary[suffix] = data;
    }
    return summary;
}
function approved(summary, suffix) {
    return summary[suffix].status === "approved";
}
function update(result, patch) {
    return Object.assign(result, patch);
}
export function inspectDocumentChain(root, options, evaluation = {}) {
    const artifacts = artifactSummary(root, options);
    const missing = REQUIRED_ARTIFACTS.filter((suffix) => !artifacts[suffix].exists);
    const chainHash = computeUpstreamHash(root, options);
    const planSourceHash = artifacts.TED.source_hash ?? null;
    const result = {
        feature: options.feature,
        doc_id: options.docId,
        artifacts,
        missing_artifacts: missing,
        chain_hash: chainHash,
        plan_source_hash: planSourceHash,
        stale: false,
        state: "unknown",
        next_skill: "using-coding-plugins",
        reason: "",
        completion: evaluation.completion ?? null,
    };
    const allMissing = [...REQUIRED_ARTIFACTS];
    if (JSON.stringify(missing) === JSON.stringify(allMissing)) {
        return update(result, {
            state: "not-started",
            next_skill: "spec-driven-development",
            reason: "no feature document chain exists",
        });
    }
    if (missing.includes("PRD")) {
        return update(result, { state: "requirements-missing", next_skill: "writing-requirements", reason: "PRD is missing" });
    }
    if (!approved(artifacts, "PRD")) {
        return update(result, { state: "requirements-draft", next_skill: "writing-requirements", reason: "PRD is not approved" });
    }
    if (missing.includes("TSD")) {
        return update(result, { state: "ready-for-technicals", next_skill: "writing-technicals", reason: "TSD is missing" });
    }
    if (!approved(artifacts, "TSD")) {
        return update(result, { state: "technicals-draft", next_skill: "writing-technicals", reason: "TSD is not approved" });
    }
    if (missing.includes("TVD")) {
        return update(result, { state: "ready-for-test-cases", next_skill: "writing-test-cases", reason: "TVD is missing" });
    }
    if (!approved(artifacts, "TVD")) {
        return update(result, { state: "test-cases-draft", next_skill: "writing-test-cases", reason: "TVD is not approved" });
    }
    if (missing.includes("TED")) {
        return update(result, { state: "ready-for-plan", next_skill: "writing-plans", reason: "upstream documents are approved" });
    }
    if (!approved(artifacts, "TED")) {
        return update(result, { state: "plan-draft", next_skill: "writing-plans", reason: "TED is not approved" });
    }
    if (!planSourceHash) {
        return update(result, { state: "plan-unlocked", next_skill: "writing-plans", reason: "TED source_hash is missing" });
    }
    if (planSourceHash && chainHash && planSourceHash !== chainHash) {
        return update(result, {
            state: "plan-stale",
            next_skill: "writing-plans",
            stale: true,
            reason: "source_hash does not match current upstream chain",
        });
    }
    if (artifacts.VED.status === "complete") {
        if (!evaluation.completion) {
            return update(result, {
                state: "completion-pending",
                next_skill: "verification-before-completion",
                reason: "VED requests completion but the completion audit has not run",
            });
        }
        if (!evaluation.completion.formalCompletionAllowed) {
            return update(result, {
                state: "completion-blocked",
                next_skill: "verification-before-completion",
                reason: `completion audit blocked: ${evaluation.completion.blockers.join(", ")}`,
            });
        }
        return update(result, {
            state: "complete",
            next_skill: "verification-before-completion",
            reason: "VED is complete and the approved upstream chain is current",
        });
    }
    return update(result, {
        state: "ready-for-execution",
        next_skill: "using-git-worktrees",
        reason: "TED exists and upstream chain is current",
    });
}

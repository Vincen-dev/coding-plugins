import { RELEASE_COMPLETION_STANDARDS, verifyRelease } from "../release/release-flow.js";
function splitList(value) {
    if (!value || value.trim().toLowerCase() === "none") {
        return [];
    }
    return value.split(",").map((item) => item.trim()).filter(Boolean);
}
function splitVerified(value) {
    return splitList(value).map((item) => {
        const [command, ...rest] = item.split("=");
        return {
            command: command.trim(),
            status: (rest.join("=") || "PASS").trim(),
        };
    });
}
export function buildCompletionReport(options) {
    const kind = options.kind === "release" ? "release" : "task";
    const releaseVerification = kind === "release"
        ? verifyRelease({
            releaseCommitPushed: options.commitPushed === true,
            tagPushed: Boolean(options.remoteTag),
            workflowOk: Boolean(options.workflowRun),
            releaseVisible: Boolean(options.packageVisible),
            dependencyResolved: options.dependencyResolved === true,
        })
        : null;
    return {
        kind,
        implemented: splitList(options.implemented),
        verified: splitVerified(options.verified),
        unverified: splitList(options.unverified),
        local_only_verification: splitList(options.localOnly),
        commits: splitList(options.committed),
        published: splitList(options.published),
        release_evidence: {
            release_commit_pushed: options.commitPushed === true,
            workflow_run: options.workflowRun ?? null,
            remote_tag: options.remoteTag ?? null,
            package_visible: options.packageVisible ?? null,
            dependency_resolution_passed: options.dependencyResolved === true,
            complete: releaseVerification?.ok ?? false,
            missing: releaseVerification?.missing_standards ?? [],
            completion_standards: [...RELEASE_COMPLETION_STANDARDS],
        },
        sections: ["已实现", "已验证", "未验证", "只本地验证", "已提交", "已发布"],
    };
}
export function formatCompletionReport(report) {
    const lines = [
        `类型: ${report.kind}`,
        "已实现:",
        ...(report.implemented.length ? report.implemented : ["none"]).map((item) => `- ${item}`),
        "已验证:",
        ...(report.verified.length ? report.verified.map((item) => `${item.command}: ${item.status}`) : ["none"]).map((item) => `- ${item}`),
        "未验证:",
        ...(report.unverified.length ? report.unverified : ["none"]).map((item) => `- ${item}`),
        "只本地验证:",
        ...(report.local_only_verification.length ? report.local_only_verification : ["none"]).map((item) => `- ${item}`),
        "已提交:",
        ...(report.commits.length ? report.commits : ["none"]).map((item) => `- ${item}`),
        "已发布:",
        ...(report.published.length ? report.published : ["none"]).map((item) => `- ${item}`),
    ];
    if (report.kind === "release") {
        lines.push(`Release commit pushed: ${report.release_evidence.release_commit_pushed ? "yes" : "missing"}`);
        lines.push(`Release workflow: ${report.release_evidence.workflow_run ?? "missing"}`);
        lines.push(`Remote tag: ${report.release_evidence.remote_tag ?? "missing"}`);
        lines.push(`Package visible: ${report.release_evidence.package_visible ?? "missing"}`);
        lines.push(`Dependency resolution: ${report.release_evidence.dependency_resolution_passed ? "pass" : "missing"}`);
    }
    return lines.join("\n");
}

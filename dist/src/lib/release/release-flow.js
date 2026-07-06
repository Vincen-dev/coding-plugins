export const RELEASE_COMPLETION_STANDARDS = [
    "release_commit_pushed",
    "tag_pushed",
    "github_actions_success",
    "release_target_visible",
    "dependency_resolution_passed",
];
function unique(values) {
    return [...new Set(values.filter(Boolean))];
}
function statusMap(input) {
    return {
        release_commit_pushed: input.releaseCommitPushed === true,
        tag_pushed: input.tagPushed === true,
        github_actions_success: input.workflowOk === true,
        release_target_visible: input.releaseVisible === true,
        dependency_resolution_passed: input.dependencyResolved === true,
    };
}
function missingCompletionStandards(input) {
    const status = statusMap(input);
    return RELEASE_COMPLETION_STANDARDS.filter((standard) => !status[standard]);
}
function packageOrderMissing(input) {
    const packages = input.packages ?? [];
    const packageOrder = input.packageOrder ?? [];
    return packages.length > 1 && packageOrder.length === 0;
}
function completionNextCommand(missing) {
    if (missing.length === 0) {
        return null;
    }
    return `coding-plugins release verify --json # missing: ${missing.join(", ")}`;
}
export function planRelease(input) {
    const missing = packageOrderMissing(input) ? ["package_dependency_order"] : [];
    const violations = missing.length > 0
        ? [{
                id: "package-order-missing",
                message: "multi-package releases must declare package dependency order before release work starts.",
            }]
        : [];
    return {
        ok: missing.length === 0,
        command: "plan",
        version: input.version ?? null,
        completion_standards: [...RELEASE_COMPLETION_STANDARDS],
        package_order: input.packageOrder ?? [],
        missing_standards: missing,
        violations,
        blocked_actions: missing.length > 0 ? ["start-release", "tag", "publish"] : [],
        next_command: missing.length > 0 ? "coding-plugins release plan --package-order <first,second> --json" : null,
    };
}
export function verifyRelease(input, command = "verify") {
    const missing = missingCompletionStandards(input);
    const violations = [];
    if (input.tagPushed === true && missing.length > 0) {
        violations.push({
            id: "tag-pushed-is-not-release-complete",
            message: "tag pushed is not release complete; workflow, release target visibility, pushed release commit, and dependency resolution must also be verified.",
        });
    }
    if (missing.length > 0 && violations.length === 0) {
        violations.push({
            id: "release-standards-missing",
            message: `release completion standards are missing: ${missing.join(", ")}.`,
        });
    }
    return {
        ok: missing.length === 0,
        command,
        version: input.version ?? null,
        completion_standards: [...RELEASE_COMPLETION_STANDARDS],
        package_order: input.packageOrder ?? [],
        missing_standards: missing,
        violations,
        blocked_actions: missing.length > 0 ? unique(["declare-release-complete", "publish", "announce-release"]) : [],
        next_command: completionNextCommand(missing),
    };
}

import { execFileSync } from "node:child_process";
export class RemoteAuditError extends Error {
    constructor(message) {
        super(message);
        this.name = "RemoteAuditError";
    }
}
export function buildRemoteCommands(owner, repo, tag) {
    const repository = `${owner}/${repo}`;
    return [
        ["git", "ls-remote", "--tags", "origin", tag],
        ["gh", "release", "view", tag, "--json", "tagName,isDraft,isPrerelease,url,publishedAt"],
        ["gh", "api", `repos/${repository}/collaborators?affiliation=direct&per_page=100`],
        ["gh", "api", `repos/${repository}/branches/main/protection`],
    ];
}
export function runText(command) {
    return execFileSync(command[0], command.slice(1), { encoding: "utf8" });
}
export function runJson(command) {
    return JSON.parse(runText(command));
}
export function auditTag(lsRemoteOutput, tag) {
    const expectedRef = `refs/tags/${tag}`;
    if (!lsRemoteOutput.includes(expectedRef)) {
        throw new RemoteAuditError(`Remote tag is missing: ${tag}.`);
    }
    return tag;
}
export function auditRelease(release, tag) {
    if (release.tagName !== tag) {
        throw new RemoteAuditError(`GitHub release tag mismatch: expected ${tag}, got ${String(release.tagName)}.`);
    }
    if (release.isDraft) {
        throw new RemoteAuditError(`GitHub release is still draft: ${tag}.`);
    }
    if (release.isPrerelease) {
        throw new RemoteAuditError(`GitHub release is marked prerelease: ${tag}.`);
    }
    return typeof release.url === "string" && release.url ? `${tag} ${release.url}` : tag;
}
export function collaboratorCanPush(collaborator) {
    const permissions = collaborator.permissions;
    if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
        return false;
    }
    const value = permissions;
    return Boolean(value.admin || value.maintain || value.push);
}
export function auditPushPermissions(collaborators, expectedPushers) {
    const pushers = collaborators
        .filter((collaborator) => collaborator.login && collaboratorCanPush(collaborator))
        .map((collaborator) => String(collaborator.login))
        .sort();
    const pusherSet = new Set(pushers);
    const unexpected = pushers.filter((login) => !expectedPushers.has(login)).sort();
    const missing = [...expectedPushers].filter((login) => !pusherSet.has(login)).sort();
    if (unexpected.length > 0) {
        throw new RemoteAuditError(`Unexpected direct push-capable collaborator(s): ${unexpected.join(", ")}.`);
    }
    if (missing.length > 0) {
        throw new RemoteAuditError(`Expected direct pusher missing from collaborators: ${missing.join(", ")}.`);
    }
    return pushers;
}

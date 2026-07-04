export declare class RemoteAuditError extends Error {
    constructor(message: string);
}
export declare function buildRemoteCommands(owner: string, repo: string, tag: string): string[][];
export declare function runText(command: string[]): string;
export declare function runJson(command: string[]): unknown;
export declare function auditTag(lsRemoteOutput: string, tag: string): string;
export declare function auditRelease(release: Record<string, unknown>, tag: string): string;
export declare function collaboratorCanPush(collaborator: Record<string, unknown>): boolean;
export declare function auditPushPermissions(collaborators: Array<Record<string, unknown>>, expectedPushers: Set<string>): string[];

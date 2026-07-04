export interface BuildLockOptions {
    timeoutMs?: number;
    staleMs?: number;
    pollMs?: number;
}
export declare function buildLockPath(root: string): string;
export declare function withBuildLock<T>(root: string, fn: () => T, options?: BuildLockOptions): T;

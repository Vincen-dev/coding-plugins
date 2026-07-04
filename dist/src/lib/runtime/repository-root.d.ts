interface RepositoryRootOptions {
    requiredPaths?: string[];
    errorMessage?: string;
}
export declare function findRepositoryRoot(start: string, options?: RepositoryRootOptions): string;
export {};

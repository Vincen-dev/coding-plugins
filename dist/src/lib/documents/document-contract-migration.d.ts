export declare function featureContext(path: string): string | undefined;
export declare function migrateBodyStatusAliases(body: string): string;
export declare function migrateFile(path: string, options?: {
    dryRun?: boolean;
}): boolean;
export declare function migrateRoot(root: string, options?: {
    dryRun?: boolean;
}): boolean;

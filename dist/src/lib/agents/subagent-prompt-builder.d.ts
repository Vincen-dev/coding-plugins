export declare class PromptBuildError extends Error {
    constructor(message: string);
}
export declare function sha256Text(text: string): string;
export declare function extractTaskSection(planText: string, task: string): [string, string];
export declare function reviewInputFailures(options: {
    kind: string;
    json: boolean;
    implementerReport: string;
    baseSha: string;
    headSha: string;
    expectedSourceHash?: string;
}): string[];
export declare function compactTaskName(title: string, task: string): string;
export declare function recommendModelTier(kind: string, options: {
    taskSection: string;
    promptChars: number;
}): [string, string[]];
export declare function buildPrompts(root: string, options: {
    feature: string;
    docId: string;
    task: string;
    kind?: string;
    workdir?: string;
    implementerReport?: string;
    baseSha?: string;
    headSha?: string;
    expectedSourceHash?: string;
}): Record<string, any>;
export declare function outputPayloadForKind(payload: Record<string, any>, kind: string): Record<string, any>;

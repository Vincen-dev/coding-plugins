export declare class IngestError extends Error {
    constructor(message: string);
}
export declare function sha256Text(text: string): string;
export declare function sha256Json(value: any): string;
export declare function caseFilename(caseId: string): string;
export declare function normalizeCommandLog(command: Record<string, any>): Record<string, any>;
export declare function normalizeCase(rawCase: Record<string, any>): Record<string, any>;
export declare function normalizePayload(rawPayload: Record<string, any>): Record<string, any>;
export declare function writePayload(payload: Record<string, any>, outputPath: string, options: {
    splitCases: boolean;
    casesDir: string;
    fixtureManifest: boolean;
    runId?: string;
    sourceContract?: string;
    pruneStale: boolean;
}): void;
export declare function readJsonFile(path: string): Record<string, any>;

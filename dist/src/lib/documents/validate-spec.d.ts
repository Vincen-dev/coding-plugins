export interface ValidationResult {
    path: string;
    ok: boolean;
    errors: string[];
    warnings: string[];
}
export interface ValidationPayload {
    ok: boolean;
    error_count: number;
    warning_count: number;
    results: ValidationResult[];
}
export declare function validateSpec(path: string, strict: boolean): [string[], string[]];
export declare function buildResult(path: string, strict: boolean): ValidationResult;
export declare function buildPayload(paths: string[], strict: boolean): ValidationPayload;
export declare function formatTextResults(results: ValidationResult[]): string;

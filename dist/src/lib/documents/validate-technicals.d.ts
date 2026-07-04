export interface ValidationResult {
    ok: boolean;
    checked_files: string[];
    errors: string[];
    warnings: string[];
}
export interface ValidationPayload extends ValidationResult {
    error_count: number;
    warning_count: number;
}
export declare function validateRepository(rootPath: string, options: {
    strict: boolean;
    technicalFiles?: string[];
}): ValidationResult;
export declare function buildPayload(result: ValidationResult): ValidationPayload;
export declare function formatTextResult(result: ValidationResult): string;

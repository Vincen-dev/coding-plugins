import type { ArtifactModeValue } from "./artifact-mode.ts";
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
export interface ValidationOptions {
    strict: boolean;
    root?: string;
    artifactMode?: ArtifactModeValue;
}
type ValidationInput = boolean | ValidationOptions;
export declare function validateText(text: string, input: ValidationInput): [string[], string[]];
export declare function buildResult(path: string, input: ValidationInput): ValidationResult;
export declare function buildPayload(paths: string[], input: ValidationInput): ValidationPayload;
export declare function formatTextResults(results: ValidationResult[]): string;
export {};

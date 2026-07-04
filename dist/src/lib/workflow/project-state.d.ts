export declare const STATE_FILE_NAME = ".coding-plugins.yaml";
export interface StateTransition {
    from: string;
    to: string;
    at: string;
    reason: string;
}
export interface CodingPluginsState {
    schema_version: number;
    workflow: string;
    feature: string;
    doc_id: string;
    state: string;
    updated_at: string;
    artifacts_hash: string;
    transitions: StateTransition[];
}
export interface CodingPluginsStateFile {
    schema_version: number;
    active: {
        feature: string;
        doc_id: string;
    };
    workflows: CodingPluginsState[];
}
export interface StateCheckResult extends CodingPluginsState {
    path: string;
    valid: boolean;
    errors: string[];
    workflows: CodingPluginsState[];
}
export interface StateAuditResult {
    path: string;
    valid: boolean;
    findings: string[];
    state: CodingPluginsState | null;
}
export declare function renderState(state: CodingPluginsState): string;
export declare function renderStateFile(file: CodingPluginsStateFile): string;
export declare function parseStateYaml(text: string): CodingPluginsState;
export declare function parseStateFile(text: string): CodingPluginsStateFile;
export declare function initialState(root: string, options: {
    feature: string;
    docId: string;
    state?: string;
    workflow?: string;
    now?: string;
}): CodingPluginsState;
export declare function writeStateFile(root: string, file: CodingPluginsStateFile): CodingPluginsStateFile;
export declare function writeState(root: string, state: CodingPluginsState): CodingPluginsState;
export declare function initState(root: string, options: {
    feature: string;
    docId: string;
    state?: string;
    workflow?: string;
}): CodingPluginsState;
export declare function readState(root: string): CodingPluginsState;
export declare function readStateFile(root: string): CodingPluginsStateFile;
export declare function validateState(state: CodingPluginsState): string[];
export declare function validateStateFile(file: CodingPluginsStateFile): string[];
export declare function checkState(root: string): StateCheckResult;
export declare function transitionState(root: string, options: {
    to: string;
    from?: string;
    reason?: string;
    feature?: string;
    docId?: string;
}): CodingPluginsState;
export declare function auditState(root: string): StateAuditResult;

import type { ArtifactModeStatus } from "./artifact-mode.ts";
export interface ParsedDocument {
    path: string;
    kind: string;
    feature: string;
    doc_id: string;
    status: string;
    frontmatter: Record<string, string>;
    headings: string[];
    sections: Record<string, string>;
    spec_ids: string[];
    test_ids: string[];
    task_ids: string[];
    errors: string[];
}
export type ParsedDocumentSummary = Omit<ParsedDocument, "sections"> & {
    section_names: string[];
    section_hashes: Record<string, string>;
};
export interface DocumentValidationResult<TDocument extends ParsedDocument | ParsedDocumentSummary = ParsedDocumentSummary> {
    ok: boolean;
    root: string;
    artifact_mode: ArtifactModeStatus;
    documents: TDocument[];
    chains: ParsedDocumentChain[];
    chain_errors: string[];
    errors: string[];
}
export interface ParsedDocumentChain {
    feature: string;
    doc_id: string;
    ok: boolean;
    artifacts: Record<string, string | null>;
    missing_artifacts: string[];
    chain_type: "complete" | "incomplete" | "evidence-only";
    workflow_violations: string[];
    errors: string[];
}
export interface DocumentValidationOptions {
    includeSections?: boolean;
    allowEvidenceOnly?: boolean;
}
export declare function parseWorkflowDocument(root: string, path: string): ParsedDocument | null;
export declare function validateDocumentSchemas(root: string, options: DocumentValidationOptions & {
    includeSections: true;
}): DocumentValidationResult<ParsedDocument>;
export declare function validateDocumentSchemas(root: string, options?: DocumentValidationOptions & {
    includeSections?: false;
}): DocumentValidationResult<ParsedDocumentSummary>;
export declare function validateDocumentSchemas(root: string, options: DocumentValidationOptions): DocumentValidationResult<ParsedDocument | ParsedDocumentSummary>;
export declare function validateDocumentChains(root: string, documents: ParsedDocument[], options?: Pick<DocumentValidationOptions, "allowEvidenceOnly">): ParsedDocumentChain[];

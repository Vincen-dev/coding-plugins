export interface ParsedDocument {
    path: string;
    kind: string;
    feature: string;
    doc_id: string;
    status: string;
    frontmatter: Record<string, string>;
    headings: string[];
    spec_ids: string[];
    test_ids: string[];
    task_ids: string[];
    errors: string[];
}
export interface DocumentValidationResult {
    ok: boolean;
    root: string;
    documents: ParsedDocument[];
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
    errors: string[];
}
export declare function parseWorkflowDocument(root: string, path: string): ParsedDocument | null;
export declare function validateDocumentSchemas(root: string): DocumentValidationResult;
export declare function validateDocumentChains(root: string, documents: ParsedDocument[]): ParsedDocumentChain[];

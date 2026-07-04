export declare class DocsIndexError extends Error {
    constructor(message: string);
}
export declare const ARTIFACT_INDEX_REQUIRED_COLUMNS: string[];
export declare function parseMarkdownTableHeaders(text: string): string[];
export declare function parseChineseDocumentInfo(text: string): Record<string, string>;
export declare function relativeMarkdownPath(root: string, path: string): string;
export declare function formatIndexPathCell(root: string, paths: string[]): string;
export declare function featureSpecFiles(featureRoot: string): string[];
export declare function featureSpecFilesForDocId(featureRoot: string, docId: string): string[];
export declare function featureEvidenceFiles(featureRoot: string): string[];
export declare function featureEvidenceFilesForDocId(featureRoot: string, docId: string): string[];
export declare function featureArchivedEvidenceFiles(featureRoot: string): string[];
export declare function featureTechnicalDesignFiles(featureRoot: string): string[];
export declare function featureTechnicalDesignFilesForDocId(featureRoot: string, docId: string): string[];
export declare function featurePlanFiles(featureRoot: string): string[];
export declare function featurePlanFilesForDocId(featureRoot: string, docId: string): string[];
export declare function featureTestCaseFiles(featureRoot: string): string[];
export declare function featureTestCaseFilesForDocId(featureRoot: string, docId: string): string[];
export declare function featureTags(featureRoot: string): string;
export declare function featureUpdated(featureRoot: string, docId?: string): string;
export declare function renderArtifactIndex(root: string): string;
export declare function writeArtifactIndex(root: string): void;
export declare function collectIndexDocumentFiles(root: string): string[];
export declare function checkArtifactIndexCoversDocuments(root: string): void;

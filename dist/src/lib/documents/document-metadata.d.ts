export interface DocumentArtifact {
    label: string;
    suffix: string;
    directory: string;
    relationKey: string;
    docIdRequired: boolean;
    syncUpstream: string[];
}
export interface Frontmatter {
    scalars: Record<string, string>;
    lists: Record<string, string[]>;
    order: string[];
}
export declare const FEATURE_README_METADATA_REQUIRED_FIELDS: string[];
export declare const EVIDENCE_METADATA_REQUIRED_FIELDS: string[];
export declare const ARCHIVED_EVIDENCE_METADATA_REQUIRED_FIELDS: string[];
export declare const PLAN_METADATA_REQUIRED_FIELDS: string[];
export declare const RELATED_DOCS_KEY = "related_docs";
export declare const DOCUMENT_ARTIFACTS: DocumentArtifact[];
export declare const ARTIFACT_SUFFIXES: string[];
export declare const RELATION_KEYS: string[];
export declare const DOCUMENT_SYNC_DEPENDENCIES: {
    [k: string]: string[];
};
export declare function splitFrontmatter(text: string): [string[], string];
export declare function parseFrontmatterBlock(lines: string[]): Frontmatter;
export declare function renderFrontmatterBlock(frontmatter: Frontmatter): string;
export declare function parseFrontmatter(text: string): Record<string, string>;
export declare function frontmatterListValues(text: string, key: string): string[];
export declare function featureDocsRoot(root: string): string;
export declare function collectFeatureRoots(root: string): string[];
export declare function featureRootForDocument(root: string, path: string): [string, string] | undefined;
export declare function artifactForSuffix(suffix: string): DocumentArtifact;
export declare function artifactDirectories(): string[];
export declare function filenamePatternsByDirectory(): Record<string, RegExp>;
export declare function documentDocId(path: string): string;
export declare function documentSuffix(path: string): string | undefined;
export declare function featureArtifactFile(featureRoot: string, directoryName: string, suffix: string, docId?: string): string;
export declare function artifactFile(featureRoot: string, suffix: string, docId?: string): string;
export declare function featureArtifactFiles(featureRoot: string, directoryName: string, suffix: string): string[];
export declare function artifactFiles(featureRoot: string, suffix: string): string[];
export declare function featureArtifactFilesForDocId(featureRoot: string, directoryName: string, suffix: string, docId: string): string[];
export declare function artifactFilesForDocId(featureRoot: string, suffix: string, docId: string): string[];
export declare function featureDocIds(featureRoot: string): string[];
export declare function documentsBySuffixForDocId(featureRoot: string, docId: string): Record<string, string[]>;
export declare function expectedRelatedPathsForDocId(featureRoot: string, docId: string, sourcePath?: string): Record<string, string[]>;
export declare function featureName(featureRoot: string): string;
export declare function parentDir(path: string): string;

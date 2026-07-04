declare const ARTIFACTS: string[];
type ArtifactSuffix = (typeof ARTIFACTS)[number];
interface ArtifactData {
    path: string;
    exists: boolean;
    status: string | null;
    source_hash?: string | null;
}
export interface WorkflowStateResult {
    feature: string;
    doc_id: string;
    artifacts: Record<ArtifactSuffix, ArtifactData>;
    missing_artifacts: ArtifactSuffix[];
    chain_hash: string | null;
    plan_source_hash: string | null;
    stale: boolean;
    state: string;
    next_skill: string;
    reason: string;
}
export declare function artifactPath(root: string, options: {
    feature: string;
    docId: string;
    suffix: string;
}): string;
export declare function parseFrontmatter(path: string): Record<string, string>;
export declare function computeUpstreamHash(root: string, options: {
    feature: string;
    docId: string;
}): string | null;
export declare function artifactSummary(root: string, options: {
    feature: string;
    docId: string;
}): Record<ArtifactSuffix, ArtifactData>;
export declare function inspectDocumentChain(root: string, options: {
    feature: string;
    docId: string;
}): WorkflowStateResult;
export {};

export interface ScaffoldResult {
    created: string[];
    skipped: string[];
}
export interface ScaffoldFeatureOptions {
    docId?: string;
    status?: string;
    currentDate?: string;
    tags?: string[];
    force?: boolean;
}
export declare function validateFeatureName(feature: string): void;
export declare function renderReadme(feature: string, title: string, status: string, updated: string, tags: string[]): string;
export declare function renderPrd(feature: string, docId: string, title: string, status: string, currentDate: string, tags: string[]): string;
export declare function scaffoldFeature(root: string, feature: string, title: string, options?: ScaffoldFeatureOptions): ScaffoldResult;

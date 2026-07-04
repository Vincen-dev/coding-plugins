export interface ScaffoldFixtureCaseOptions {
    feature: string;
    docId: string;
    title: string;
    caseId: string;
    sourceType: string;
    sourceReference: string;
    optimizationTarget: string;
    coveredRisk: string;
    currentDate?: string;
}
export declare function validateSlug(label: string, value: string): void;
export declare function docsPath(feature: string, directory: string, filename: string): string;
export declare function scaffoldFixtureCase(root: string, options: ScaffoldFixtureCaseOptions): string;

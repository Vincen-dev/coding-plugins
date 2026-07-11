export declare const DECISION_POINTS: {
    id: string;
    name: string;
    trigger: string;
    required_input: string;
    expected_output: string;
    skills: string[];
}[];
export type DecisionCatalogVersion = "governed-v1" | "governed-v2";
export declare const GOVERNED_V2_DECISION_POINTS: {
    id: string;
    name: string;
    trigger: string;
    required_input: string;
    expected_output: string;
    skills: string[];
}[];
export declare function getDecisionCatalog(version?: DecisionCatalogVersion): Array<Record<string, unknown>>;
export declare function allDecisionPoints(): Array<Record<string, unknown>>;
export declare function getDecisionPoint(pointId: string, version?: DecisionCatalogVersion): Record<string, unknown>;

export declare const DECISION_POINTS: {
    id: string;
    name: string;
    trigger: string;
    required_input: string;
    expected_output: string;
    skills: string[];
}[];
export declare function allDecisionPoints(): Array<Record<string, unknown>>;
export declare function getDecisionPoint(pointId: string): Record<string, unknown>;

export interface ExecutionContract {
    schema_version: number;
    feature: string;
    doc_id: string;
    state: string;
    source_hash: string | null;
    generated_at: string;
    required_artifacts: string[];
    required_spec_ids: string[];
    required_tests: string[];
    review_gates: string[];
    rewind_triggers: string[];
    execution_source: string;
    new_plan_policy: string;
}
export interface ExecutionContractResult {
    contract: ExecutionContract;
    path: string;
    failures: string[];
    markdown: string;
}
export declare function contractPath(root: string, options: {
    feature: string;
    docId: string;
}): string;
export declare function renderExecutionContract(contract: ExecutionContract): string;
export declare function buildExecutionContract(root: string, options: {
    feature: string;
    docId: string;
    now?: string;
}): ExecutionContractResult;
export declare function writeExecutionContract(root: string, result: ExecutionContractResult): ExecutionContractResult;

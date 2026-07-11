export type PolicyLevel = "required" | "recommended" | "informative";
export type PolicySourceKind = "repository" | "versioned-plugin";
export interface PolicyDefinition {
    id: string;
    version: string;
    level: PolicyLevel;
    source: {
        kind: PolicySourceKind;
        ref: string;
    };
    appliesWhen?: {
        repositoryKinds?: string[];
        paths?: string[];
        riskSignals?: string[];
    };
    verification: Array<{
        kind: "test" | "command" | "review";
        ref: string;
    }>;
    conflictsWith?: string[];
    resolvedSourceHash?: string;
}
export interface PolicySkillDefinition {
    name: string;
    source: "project" | "versioned-plugin" | "personal";
    version?: string;
    appliesPolicyIds: string[];
}
export interface PolicyProfile {
    id: string;
    repositoryKinds?: string[];
}
export interface PolicyRegistry {
    schemaVersion: 1;
    integrationPolicy?: IntegrationPolicy;
    profiles?: PolicyProfile[];
    policies: PolicyDefinition[];
    skillBindings?: PolicySkillDefinition[];
}
export interface IntegrationPolicy {
    strategy: "branch-first" | "main-only";
    baseBranch: string;
    allowDirectCommit: boolean;
    allowFeatureBranches: boolean;
    allowPullRequests: boolean;
    requireVersionChangePerCommit: boolean;
    versionFiles: string[];
}
export interface ExplicitSkillInput {
    name: string;
    source: "project" | "versioned-plugin" | "personal";
    version?: string;
    path?: string;
    appliesPolicyIds?: string[];
}
export interface ResolvedSkillBinding {
    name: string;
    source: "project" | "versioned-plugin" | "personal";
    version?: string;
    appliesPolicyIds: string[];
    requiredForExecution: boolean;
    portable: boolean;
}
export interface ResolvedPolicyBundle {
    profile: string;
    required: PolicyDefinition[];
    recommended: PolicyDefinition[];
    informative: PolicyDefinition[];
    skillBindings: ResolvedSkillBinding[];
    conflicts: string[];
    missingSources: string[];
    requiredPolicyHash: string;
}
export interface ResolvePolicyOptions {
    root: string;
    registry: PolicyRegistry;
    repositoryKind: string;
    plannedFiles?: string[];
    riskSignals?: string[];
    explicitSkills?: ExplicitSkillInput[];
    profile?: string;
}
export declare function loadPolicyRegistry(root: string): PolicyRegistry;
export declare function resolveIntegrationPolicy(root: string): IntegrationPolicy;
export declare function resolvePolicyBundle(options: ResolvePolicyOptions): ResolvedPolicyBundle;

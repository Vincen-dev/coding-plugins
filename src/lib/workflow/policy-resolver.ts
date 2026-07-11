import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";

export type PolicyLevel = "required" | "recommended" | "informative";
export type PolicySourceKind = "repository" | "versioned-plugin";

export interface PolicyDefinition {
  id: string;
  version: string;
  level: PolicyLevel;
  source: { kind: PolicySourceKind; ref: string };
  appliesWhen?: { repositoryKinds?: string[]; paths?: string[]; riskSignals?: string[] };
  verification: Array<{ kind: "test" | "command" | "review"; ref: string }>;
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

const DEFAULT_INTEGRATION_POLICY: IntegrationPolicy = {
  strategy: "branch-first",
  baseBranch: "main",
  allowDirectCommit: false,
  allowFeatureBranches: true,
  allowPullRequests: true,
  requireVersionChangePerCommit: false,
  versionFiles: [],
};

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

function sha256(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function stable(value: unknown): string {
  const normalize = (current: unknown): unknown => {
    if (Array.isArray(current)) {
      return current.map(normalize).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    }
    if (current && typeof current === "object") {
      return Object.fromEntries(Object.entries(current as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalize(child)]));
    }
    return current;
  };
  return JSON.stringify(normalize(value));
}

function globMatches(pattern: string, path: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const expression = escaped
    .replaceAll("**/", "\u0001")
    .replaceAll("**", "\u0000")
    .replaceAll("*", "[^/]*")
    .replaceAll("\u0001", "(?:.*/)?")
    .replaceAll("\u0000", ".*");
  return new RegExp(`^${expression}$`).test(path.replaceAll("\\", "/"));
}

function applies(policy: PolicyDefinition, options: ResolvePolicyOptions): boolean {
  const rule = policy.appliesWhen ?? {};
  if (rule.repositoryKinds?.length && !rule.repositoryKinds.includes(options.repositoryKind)) {
    return false;
  }
  if (rule.paths?.length) {
    const files = options.plannedFiles ?? [];
    if (!files.some((file) => rule.paths?.some((pattern) => globMatches(pattern, file)))) {
      return false;
    }
  }
  if (rule.riskSignals?.length && !rule.riskSignals.some((signal) => options.riskSignals?.includes(signal))) {
    return false;
  }
  return true;
}

function repositorySource(root: string, ref: string): { valid: boolean; hash?: string } {
  if (isAbsolute(ref)) {
    return { valid: false };
  }
  const absolute = resolve(root, ref);
  const rel = relative(resolve(root), absolute);
  if (!rel || rel.startsWith("..") || isAbsolute(rel) || !existsSync(absolute)) {
    return { valid: false };
  }
  return { valid: true, hash: sha256(readFileSync(absolute, "utf8")) };
}

function pluginSource(ref: string): boolean {
  return /^[A-Za-z0-9_.-]+@[^/]+\/.+/.test(ref);
}

function resolvePolicySource(root: string, policy: PolicyDefinition): { policy: PolicyDefinition; valid: boolean } {
  if (policy.source.kind === "repository") {
    const source = repositorySource(root, policy.source.ref);
    return { policy: { ...policy, resolvedSourceHash: source.hash }, valid: source.valid };
  }
  return { policy: { ...policy, resolvedSourceHash: pluginSource(policy.source.ref) ? sha256(policy.source.ref) : undefined }, valid: pluginSource(policy.source.ref) };
}

function portableSkill(binding: Pick<PolicySkillDefinition, "source" | "version">): boolean {
  if (binding.source === "personal") {
    return false;
  }
  return binding.source === "project" || Boolean(binding.version);
}

export function loadPolicyRegistry(root: string): PolicyRegistry {
  const path = join(root, "coding-plugins.policies.yaml");
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || (parsed as Partial<PolicyRegistry>).schemaVersion !== 1
    || !Array.isArray((parsed as Partial<PolicyRegistry>).policies)) {
    throw new Error("coding-plugins.policies.yaml must contain a schemaVersion=1 policy registry");
  }
  return parsed as PolicyRegistry;
}

export function resolveIntegrationPolicy(root: string): IntegrationPolicy {
  if (!existsSync(join(root, "coding-plugins.policies.yaml"))) {
    return { ...DEFAULT_INTEGRATION_POLICY };
  }
  const configured = loadPolicyRegistry(root).integrationPolicy;
  return configured ? { ...DEFAULT_INTEGRATION_POLICY, ...configured } : { ...DEFAULT_INTEGRATION_POLICY };
}

export function resolvePolicyBundle(options: ResolvePolicyOptions): ResolvedPolicyBundle {
  const selected = options.registry.policies.filter((policy) => applies(policy, options)).map((policy) => resolvePolicySource(options.root, policy));
  const missingSources = selected.filter((entry) => !entry.valid && entry.policy.level === "required").map((entry) => entry.policy.id).sort();
  const policies = selected.map((entry) => entry.policy).sort((left, right) => left.id.localeCompare(right.id));
  const required = policies.filter((policy) => policy.level === "required");
  const requiredIds = new Set(required.map((policy) => policy.id));
  const selectedIds = new Set(policies.map((policy) => policy.id));
  const conflicts = new Set<string>();
  for (const policy of required) {
    for (const conflictingId of policy.conflictsWith ?? []) {
      if (selectedIds.has(conflictingId)) {
        conflicts.add([policy.id, conflictingId].sort().join("<->"));
      }
    }
  }

  const registrySkills: ExplicitSkillInput[] = (options.registry.skillBindings ?? []).map((binding) => ({ ...binding }));
  const skillBindings = [...registrySkills, ...(options.explicitSkills ?? [])]
    .map((binding): ResolvedSkillBinding => {
      const appliesPolicyIds = (binding.appliesPolicyIds ?? []).filter((id) => selectedIds.has(id)).sort();
      const portable = portableSkill(binding);
      return {
        name: binding.name,
        source: binding.source,
        version: binding.version,
        appliesPolicyIds,
        requiredForExecution: portable && appliesPolicyIds.some((id) => requiredIds.has(id)),
        portable,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const requiredPolicyHash = sha256(stable(required.map((policy) => ({
    id: policy.id,
    version: policy.version,
    source: policy.source,
    sourceHash: policy.resolvedSourceHash,
    verification: policy.verification,
  }))));

  return {
    profile: options.profile ?? options.repositoryKind,
    required,
    recommended: policies.filter((policy) => policy.level === "recommended"),
    informative: policies.filter((policy) => policy.level === "informative"),
    skillBindings,
    conflicts: [...conflicts].sort(),
    missingSources,
    requiredPolicyHash,
  };
}

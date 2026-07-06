export const RELEASE_COMPLETION_STANDARDS = [
  "release_commit_pushed",
  "tag_pushed",
  "github_actions_success",
  "release_target_visible",
  "dependency_resolution_passed",
] as const;

export type ReleaseCompletionStandard = typeof RELEASE_COMPLETION_STANDARDS[number] | "package_dependency_order";
export type ReleaseCommand = "plan" | "guard" | "verify";

export interface ReleaseStatusInput {
  version?: string;
  packages?: string[];
  packageOrder?: string[];
  releaseCommitPushed?: boolean;
  tagPushed?: boolean;
  workflowOk?: boolean;
  releaseVisible?: boolean;
  dependencyResolved?: boolean;
}

export interface ReleaseViolation {
  id: "package-order-missing" | "tag-pushed-is-not-release-complete" | "release-standards-missing";
  message: string;
}

export interface ReleaseFlowResult {
  ok: boolean;
  command: ReleaseCommand;
  version: string | null;
  completion_standards: string[];
  package_order: string[];
  missing_standards: string[];
  violations: ReleaseViolation[];
  blocked_actions: string[];
  next_command: string | null;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function statusMap(input: ReleaseStatusInput): Record<string, boolean> {
  return {
    release_commit_pushed: input.releaseCommitPushed === true,
    tag_pushed: input.tagPushed === true,
    github_actions_success: input.workflowOk === true,
    release_target_visible: input.releaseVisible === true,
    dependency_resolution_passed: input.dependencyResolved === true,
  };
}

function missingCompletionStandards(input: ReleaseStatusInput): string[] {
  const status = statusMap(input);
  return RELEASE_COMPLETION_STANDARDS.filter((standard) => !status[standard]);
}

function packageOrderMissing(input: ReleaseStatusInput): boolean {
  const packages = input.packages ?? [];
  const packageOrder = input.packageOrder ?? [];
  return packages.length > 1 && packageOrder.length === 0;
}

function completionNextCommand(missing: string[]): string | null {
  if (missing.length === 0) {
    return null;
  }
  return `coding-plugins release verify --json # missing: ${missing.join(", ")}`;
}

export function planRelease(input: ReleaseStatusInput): ReleaseFlowResult {
  const missing = packageOrderMissing(input) ? ["package_dependency_order"] : [];
  const violations: ReleaseViolation[] = missing.length > 0
    ? [{
      id: "package-order-missing",
      message: "multi-package releases must declare package dependency order before release work starts.",
    }]
    : [];
  return {
    ok: missing.length === 0,
    command: "plan",
    version: input.version ?? null,
    completion_standards: [...RELEASE_COMPLETION_STANDARDS],
    package_order: input.packageOrder ?? [],
    missing_standards: missing,
    violations,
    blocked_actions: missing.length > 0 ? ["start-release", "tag", "publish"] : [],
    next_command: missing.length > 0 ? "coding-plugins release plan --package-order <first,second> --json" : null,
  };
}

export function verifyRelease(input: ReleaseStatusInput, command: "guard" | "verify" = "verify"): ReleaseFlowResult {
  const missing = missingCompletionStandards(input);
  const violations: ReleaseViolation[] = [];
  if (input.tagPushed === true && missing.length > 0) {
    violations.push({
      id: "tag-pushed-is-not-release-complete",
      message: "tag pushed is not release complete; workflow, release target visibility, pushed release commit, and dependency resolution must also be verified.",
    });
  }
  if (missing.length > 0 && violations.length === 0) {
    violations.push({
      id: "release-standards-missing",
      message: `release completion standards are missing: ${missing.join(", ")}.`,
    });
  }
  return {
    ok: missing.length === 0,
    command,
    version: input.version ?? null,
    completion_standards: [...RELEASE_COMPLETION_STANDARDS],
    package_order: input.packageOrder ?? [],
    missing_standards: missing,
    violations,
    blocked_actions: missing.length > 0 ? unique(["declare-release-complete", "publish", "announce-release"]) : [],
    next_command: completionNextCommand(missing),
  };
}

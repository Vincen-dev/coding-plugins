import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ARTIFACTS = [
  ["PRD", "requirements"],
  ["TDD", "technicals"],
  ["TID", "technicals"],
  ["TCD", "test-cases"],
  ["IPD", "plans"],
  ["TED", "evidences"],
] as const;

const UPSTREAM_ARTIFACTS = ["PRD", "TDD", "TID", "TCD"] as const;
const ARTIFACT_DIRS = new Map<string, string>(ARTIFACTS);

type ArtifactSuffix = (typeof ARTIFACTS)[number][0];

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

function toPosix(path: string): string {
  return path.replaceAll("\\", "/");
}

export function artifactPath(root: string, options: { feature: string; docId: string; suffix: string }): string {
  const directory = ARTIFACT_DIRS.get(options.suffix);
  if (!directory) {
    throw new Error(`unknown artifact suffix: ${options.suffix}`);
  }
  return join(
    root,
    "docs",
    "coding-plugins",
    "features",
    options.feature,
    directory,
    `${options.docId}-${options.suffix}.md`,
  );
}

export function splitFrontmatter(text: string): [string[], string] {
  if (!text.startsWith("---\n")) {
    return [[], text];
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    return [[], text];
  }
  return [text.slice(4, end).split(/\r?\n/), text.slice(end + "\n---".length).replace(/^\n/, "")];
}

export function parseFrontmatter(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }
  const [lines] = splitFrontmatter(readFileSync(path, "utf8"));
  const metadata: Record<string, string> = {};
  for (const line of lines) {
    if (!line || line.startsWith(" ") || !line.includes(":")) {
      continue;
    }
    const index = line.indexOf(":");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (value) {
      metadata[key] = value;
    }
  }
  return metadata;
}

export function computeUpstreamHash(root: string, options: { feature: string; docId: string }): string | null {
  const digest = createHash("sha256");
  let hasContent = false;
  for (const suffix of UPSTREAM_ARTIFACTS) {
    const path = artifactPath(root, { ...options, suffix });
    if (!existsSync(path)) {
      continue;
    }
    const relativePath = toPosix(relative(root, path));
    digest.update(Buffer.from(relativePath, "utf8"));
    digest.update(Buffer.from([0]));
    digest.update(readFileSync(path));
    digest.update(Buffer.from([0]));
    hasContent = true;
  }
  return hasContent ? `sha256:${digest.digest("hex")}` : null;
}

export function artifactSummary(root: string, options: { feature: string; docId: string }): Record<ArtifactSuffix, ArtifactData> {
  const summary = {} as Record<ArtifactSuffix, ArtifactData>;
  for (const [suffix] of ARTIFACTS) {
    const path = artifactPath(root, { ...options, suffix });
    const metadata = parseFrontmatter(path);
    const data: ArtifactData = {
      path: toPosix(relative(root, path)),
      exists: existsSync(path),
      status: metadata.status ?? null,
    };
    if (suffix === "IPD") {
      data.source_hash = metadata.source_hash ?? null;
    }
    summary[suffix] = data;
  }
  return summary;
}

function approved(summary: Record<ArtifactSuffix, ArtifactData>, suffix: ArtifactSuffix): boolean {
  return summary[suffix].status === "approved";
}

function update(
  result: WorkflowStateResult,
  patch: Partial<Pick<WorkflowStateResult, "state" | "next_skill" | "reason" | "stale">>,
): WorkflowStateResult {
  return Object.assign(result, patch);
}

export function inspectDocumentChain(root: string, options: { feature: string; docId: string }): WorkflowStateResult {
  const artifacts = artifactSummary(root, options);
  const missing = ARTIFACTS.filter(([suffix]) => !artifacts[suffix].exists).map(([suffix]) => suffix);
  const chainHash = computeUpstreamHash(root, options);
  const ipdSourceHash = artifacts.IPD.source_hash ?? null;

  const result: WorkflowStateResult = {
    feature: options.feature,
    doc_id: options.docId,
    artifacts,
    missing_artifacts: missing,
    chain_hash: chainHash,
    plan_source_hash: ipdSourceHash,
    stale: false,
    state: "unknown",
    next_skill: "using-coding-plugins",
    reason: "",
  };

  const allMissing = ARTIFACTS.map(([suffix]) => suffix);
  if (JSON.stringify(missing) === JSON.stringify(allMissing)) {
    return update(result, {
      state: "not-started",
      next_skill: "spec-driven-development",
      reason: "no feature document chain exists",
    });
  }

  if (missing.includes("PRD")) {
    return update(result, { state: "requirements-missing", next_skill: "writing-requirements", reason: "PRD is missing" });
  }
  if (!approved(artifacts, "PRD")) {
    return update(result, { state: "requirements-draft", next_skill: "writing-requirements", reason: "PRD is not approved" });
  }
  if (missing.includes("TDD") || missing.includes("TID")) {
    return update(result, { state: "ready-for-technicals", next_skill: "writing-technicals", reason: "TDD or TID is missing" });
  }
  if (!approved(artifacts, "TDD") || !approved(artifacts, "TID")) {
    return update(result, { state: "technicals-draft", next_skill: "writing-technicals", reason: "TDD or TID is not approved" });
  }
  if (missing.includes("TCD")) {
    return update(result, { state: "ready-for-test-cases", next_skill: "writing-test-cases", reason: "TCD is missing" });
  }
  if (!approved(artifacts, "TCD")) {
    return update(result, { state: "test-cases-draft", next_skill: "writing-test-cases", reason: "TCD is not approved" });
  }
  if (missing.includes("IPD")) {
    return update(result, { state: "ready-for-plan", next_skill: "writing-plans", reason: "upstream documents are approved" });
  }
  if (!approved(artifacts, "IPD")) {
    return update(result, { state: "plan-draft", next_skill: "writing-plans", reason: "IPD is not approved" });
  }
  if (!ipdSourceHash) {
    return update(result, { state: "plan-unlocked", next_skill: "writing-plans", reason: "IPD source_hash is missing" });
  }
  if (ipdSourceHash && chainHash && ipdSourceHash !== chainHash) {
    return update(result, {
      state: "plan-stale",
      next_skill: "writing-plans",
      stale: true,
      reason: "source_hash does not match current upstream chain",
    });
  }

  return update(result, {
    state: "ready-for-execution",
    next_skill: "using-git-worktrees",
    reason: "IPD exists and upstream chain is current",
  });
}

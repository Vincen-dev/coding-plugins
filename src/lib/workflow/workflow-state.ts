import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { DOCUMENT_ARTIFACTS, artifactFile, parseFrontmatter as parseDocumentFrontmatter } from "../documents/document-metadata.ts";

const REQUIRED_ARTIFACTS = ["PRD", "TSD", "TVD", "TED", "VED"] as const;
const UPSTREAM_ARTIFACTS = ["PRD", "TSD", "TVD"] as const;
const ARTIFACTS = DOCUMENT_ARTIFACTS.map((artifact) => artifact.suffix);

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

function toPosix(path: string): string {
  return path.replaceAll("\\", "/");
}

export function artifactPath(root: string, options: { feature: string; docId: string; suffix: string }): string {
  const featureRoot = join(root, "docs", "coding-plugins", "features", options.feature);
  return artifactFile(featureRoot, options.suffix, options.docId);
}

export function parseFrontmatter(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }
  return parseDocumentFrontmatter(readFileSync(path, "utf8"));
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
  for (const suffix of ARTIFACTS) {
    const path = artifactPath(root, { ...options, suffix });
    const metadata = parseFrontmatter(path);
    const data: ArtifactData = {
      path: toPosix(relative(root, path)),
      exists: existsSync(path),
      status: metadata.status ?? null,
    };
    if (suffix === "TED") {
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
  const missing = REQUIRED_ARTIFACTS.filter((suffix) => !artifacts[suffix].exists);
  const chainHash = computeUpstreamHash(root, options);
  const planSourceHash = artifacts.TED.source_hash ?? null;

  const result: WorkflowStateResult = {
    feature: options.feature,
    doc_id: options.docId,
    artifacts,
    missing_artifacts: missing,
    chain_hash: chainHash,
    plan_source_hash: planSourceHash,
    stale: false,
    state: "unknown",
    next_skill: "using-coding-plugins",
    reason: "",
  };

  const allMissing = [...REQUIRED_ARTIFACTS];
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
  if (missing.includes("TSD")) {
    return update(result, { state: "ready-for-technicals", next_skill: "writing-technicals", reason: "TSD is missing" });
  }
  if (!approved(artifacts, "TSD")) {
    return update(result, { state: "technicals-draft", next_skill: "writing-technicals", reason: "TSD is not approved" });
  }
  if (missing.includes("TVD")) {
    return update(result, { state: "ready-for-test-cases", next_skill: "writing-test-cases", reason: "TVD is missing" });
  }
  if (!approved(artifacts, "TVD")) {
    return update(result, { state: "test-cases-draft", next_skill: "writing-test-cases", reason: "TVD is not approved" });
  }
  if (missing.includes("TED")) {
    return update(result, { state: "ready-for-plan", next_skill: "writing-plans", reason: "upstream documents are approved" });
  }
  if (!approved(artifacts, "TED")) {
    return update(result, { state: "plan-draft", next_skill: "writing-plans", reason: "TED is not approved" });
  }
  if (!planSourceHash) {
    return update(result, { state: "plan-unlocked", next_skill: "writing-plans", reason: "TED source_hash is missing" });
  }
  if (planSourceHash && chainHash && planSourceHash !== chainHash) {
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
    reason: "TED exists and upstream chain is current",
  });
}

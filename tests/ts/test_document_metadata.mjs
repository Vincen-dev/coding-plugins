import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ARTIFACT_SUFFIXES,
  DOCUMENT_SYNC_DEPENDENCIES,
  artifactFile,
  artifactForSuffix,
  documentDocId,
  expectedRelatedPathsForDocId,
  filenamePatternsByDirectory,
  frontmatterListValues,
  parseFrontmatter,
  parseFrontmatterBlock,
  renderFrontmatterBlock,
  splitFrontmatter,
} from "../../src/lib/document-metadata.ts";

test("TypeScript document metadata frontmatter helpers match Python contract", () => {
  const text =
    "---\n" +
    "title: Demo PRD\n" +
    "status: active\n" +
    "related_specs:\n" +
    "  - docs/coding-plugins/features/demo/requirements/demo-PRD.md\n" +
    "related_technical: []\n" +
    "---\n" +
    "# Body\n";

  const [lines, body] = splitFrontmatter(text);
  const frontmatter = parseFrontmatterBlock(lines);

  assert.equal(body, "# Body\n");
  assert.equal(frontmatter.scalars.title, "Demo PRD");
  assert.equal(frontmatter.scalars.status, "active");
  assert.deepEqual(frontmatter.lists.related_specs, ["docs/coding-plugins/features/demo/requirements/demo-PRD.md"]);
  assert.deepEqual(frontmatter.lists.related_technical, []);
  assert.deepEqual(frontmatter.order, ["title", "status", "related_specs", "related_technical"]);
  assert.equal(
    renderFrontmatterBlock(frontmatter),
    "---\n" +
      "title: Demo PRD\n" +
      "status: active\n" +
      "related_specs:\n" +
      "  - docs/coding-plugins/features/demo/requirements/demo-PRD.md\n" +
      "related_technical: []\n" +
      "---\n",
  );
  assert.deepEqual(parseFrontmatter(text), { title: "Demo PRD", status: "active" });
  assert.deepEqual(frontmatterListValues(text, "related_specs"), ["docs/coding-plugins/features/demo/requirements/demo-PRD.md"]);
});

test("TypeScript document artifact registry matches Python contract", () => {
  assert.deepEqual(ARTIFACT_SUFFIXES, ["PRD", "TDD", "TID", "TCD", "IPD", "TED"]);
  for (const suffix of ARTIFACT_SUFFIXES) {
    assert.equal(artifactForSuffix(suffix).docIdRequired, true);
  }
  assert.deepEqual(DOCUMENT_SYNC_DEPENDENCIES.TED, ["PRD", "TDD", "TID", "TCD", "IPD"]);

  const patterns = filenamePatternsByDirectory();
  assert.equal(patterns.requirements.test("routing-login-PRD.md"), true);
  assert.equal(patterns.technicals.test("routing-login-TDD.md"), true);
  assert.equal(patterns.technicals.test("routing-login-TID.md"), true);
  assert.equal(patterns["test-cases"].test("routing-login-TCD.md"), true);
  assert.equal(patterns.plans.test("routing-login-IPD.md"), true);
  assert.equal(patterns.evidences.test("routing-login-TED.md"), true);
  assert.equal(patterns.plans.test("routing-login-TED.md"), false);
  assert.equal(documentDocId("routing-login-PRD.md"), "routing-login");
  assert.equal(documentDocId("routing-login-TED.md"), "routing-login");
});

test("TypeScript related paths are grouped by relation key and exclude source", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-docmeta-"));
  try {
    const featureRoot = join(root, "docs/coding-plugins/features/routing");
    for (const directory of ["requirements", "technicals", "test-cases", "plans", "evidences"]) {
      mkdirSync(join(featureRoot, directory), { recursive: true });
    }
    for (const suffix of ARTIFACT_SUFFIXES) {
      writeFileSync(artifactFile(featureRoot, suffix, "routing-login"), `# ${suffix}\n`, "utf8");
    }

    const source = join(featureRoot, "technicals/routing-login-TDD.md");
    const related = expectedRelatedPathsForDocId(featureRoot, "routing-login", source);

    assert.deepEqual(related.related_specs, [join(featureRoot, "requirements/routing-login-PRD.md")]);
    assert.deepEqual(related.related_technical, [join(featureRoot, "technicals/routing-login-TID.md")]);
    assert.deepEqual(related.related_evidence, [join(featureRoot, "evidences/routing-login-TED.md")]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

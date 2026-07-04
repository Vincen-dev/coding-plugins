import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  ARTIFACT_SUFFIXES,
  DOCUMENT_SYNC_DEPENDENCIES,
  RELATION_KEYS,
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
import { validateRepository } from "../../src/lib/validate-technicals.ts";

test("TypeScript document metadata frontmatter helpers preserve list parsing", () => {
  const text =
    "---\n" +
    "title: Demo PRD\n" +
    "status: active\n" +
    "related_docs:\n" +
    "  - docs/coding-plugins/features/demo/requirements/demo-PRD.md\n" +
    "---\n" +
    "# Body\n";

  const [lines, body] = splitFrontmatter(text);
  const frontmatter = parseFrontmatterBlock(lines);

  assert.equal(body, "# Body\n");
  assert.equal(frontmatter.scalars.title, "Demo PRD");
  assert.equal(frontmatter.scalars.status, "active");
  assert.deepEqual(frontmatter.lists.related_docs, ["docs/coding-plugins/features/demo/requirements/demo-PRD.md"]);
  assert.deepEqual(frontmatter.order, ["title", "status", "related_docs"]);
  assert.equal(
    renderFrontmatterBlock(frontmatter),
    "---\n" +
      "title: Demo PRD\n" +
      "status: active\n" +
      "related_docs:\n" +
      "  - docs/coding-plugins/features/demo/requirements/demo-PRD.md\n" +
      "---\n",
  );
  assert.deepEqual(parseFrontmatter(text), { title: "Demo PRD", status: "active" });
  assert.deepEqual(frontmatterListValues(text, "related_docs"), ["docs/coding-plugins/features/demo/requirements/demo-PRD.md"]);
});

test("TypeScript document artifact registry uses unified related_docs contract", () => {
  assert.deepEqual(ARTIFACT_SUFFIXES, ["PRD", "TSD", "TVD", "TED", "VED"]);
  for (const suffix of ARTIFACT_SUFFIXES) {
    assert.equal(artifactForSuffix(suffix).docIdRequired, true);
  }
  assert.deepEqual(DOCUMENT_SYNC_DEPENDENCIES.TVD, ["PRD", "TSD"]);
  assert.deepEqual(DOCUMENT_SYNC_DEPENDENCIES.TED, ["PRD", "TSD", "TVD"]);
  assert.deepEqual(DOCUMENT_SYNC_DEPENDENCIES.VED, ["PRD", "TSD", "TVD", "TED"]);

  const patterns = filenamePatternsByDirectory();
  assert.equal(patterns.requirements.test("routing-login-PRD.md"), true);
  assert.equal(patterns.technicals.test("routing-login-TSD.md"), true);
  assert.equal(patterns.technicals.test("routing-login-TID.md"), false);
  assert.equal(patterns["test-cases"].test("routing-login-TVD.md"), true);
  assert.equal(patterns["test-cases"].test("routing-login-TCD.md"), false);
  assert.equal(patterns.plans.test("routing-login-TED.md"), true);
  assert.equal(patterns.plans.test("routing-login-IPD.md"), false);
  assert.equal(patterns.evidences.test("routing-login-VED.md"), true);
  assert.equal(patterns.evidences.test("routing-login-TED.md"), false);
  assert.equal(documentDocId("routing-login-PRD.md"), "routing-login");
  assert.equal(documentDocId("routing-login-VED.md"), "routing-login");
});

test("TypeScript related paths use unified related_docs and exclude source", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-docmeta-"));
  try {
    const featureRoot = join(root, "docs/coding-plugins/features/routing");
    for (const directory of ["requirements", "technicals", "test-cases", "plans", "evidences"]) {
      mkdirSync(join(featureRoot, directory), { recursive: true });
    }
    for (const suffix of ARTIFACT_SUFFIXES) {
      writeFileSync(artifactFile(featureRoot, suffix, "routing-login"), `# ${suffix}\n`, "utf8");
    }

    const source = join(featureRoot, "technicals/routing-login-TSD.md");
    const related = expectedRelatedPathsForDocId(featureRoot, "routing-login", source);

    assert.deepEqual(RELATION_KEYS, ["related_docs"]);
    assert.deepEqual(related.related_docs, [
      join(featureRoot, "evidences/routing-login-VED.md"),
      join(featureRoot, "plans/routing-login-TED.md"),
      join(featureRoot, "requirements/routing-login-PRD.md"),
      join(featureRoot, "test-cases/routing-login-TVD.md"),
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript technical validator accepts related_docs as the metadata source", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-related-docs-"));
  try {
    const featureRoot = join(root, "docs/coding-plugins/features/routing");
    for (const directory of ["requirements", "technicals", "test-cases", "plans", "evidences"]) {
      mkdirSync(join(featureRoot, directory), { recursive: true });
    }

    const prdPath = join(featureRoot, "requirements/routing-login-PRD.md");
    const tsdPath = join(featureRoot, "technicals/routing-login-TSD.md");
    const tvdPath = join(featureRoot, "test-cases/routing-login-TVD.md");
    const tedPath = join(featureRoot, "plans/routing-login-TED.md");
    const vedPath = join(featureRoot, "evidences/routing-login-VED.md");

    writeFileSync(
      prdPath,
      "---\n" +
        "title: Routing PRD\n" +
        "status: approved\n" +
        "feature: routing\n" +
        "doc_id: routing-login\n" +
        "created: 2026-07-04\n" +
        "updated: 2026-07-04\n" +
        "---\n" +
        "# Routing PRD\n\n" +
        "| 需求点 | 标题 | 优先级 |\n" +
        "| --- | --- | --- |\n" +
        "| REQ-001 | 登录 | 应该 |\n",
      "utf8",
    );

    for (const path of [tvdPath, tedPath, vedPath]) {
      writeFileSync(path, "---\ntitle: Placeholder\nstatus: draft\nfeature: routing\ndoc_id: routing-login\ncreated: 2026-07-04\nupdated: 2026-07-04\n---\n", "utf8");
    }

    writeFileSync(
      tsdPath,
      "---\n" +
        "title: Routing TSD\n" +
        "status: approved\n" +
        "lifecycle_status: approved\n" +
        "feature: routing\n" +
        "doc_id: routing-login\n" +
        "created: 2026-07-04\n" +
        "updated: 2026-07-04\n" +
        "implemented_commits: []\n" +
        "validated_by: npm run preflight\n" +
        "related_docs:\n" +
        "  - docs/coding-plugins/features/routing/requirements/routing-login-PRD.md\n" +
        "  - docs/coding-plugins/features/routing/test-cases/routing-login-TVD.md\n" +
        "  - docs/coding-plugins/features/routing/plans/routing-login-TED.md\n" +
        "  - docs/coding-plugins/features/routing/evidences/routing-login-VED.md\n" +
        "---\n" +
        "# Routing TSD\n\n" +
        "## 规格到设计映射\n\n" +
        "| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |\n" +
        "| --- | --- | --- | --- | --- | --- | --- |\n\n" +
        "## 无需技术设计的规格\n\n" +
        "| 规格 ID | 原因 | 验证方式 |\n" +
        "| --- | --- | --- |\n\n" +
        "## 关键决策\n\n" +
        "| 决策 ID | 决策 | 原因 | 取舍 |\n" +
        "| --- | --- | --- | --- |\n" +
        "| TD-001 | 使用 related_docs | 减少 metadata 字段数量 | 通过路径后缀推导文档类型 |\n",
      "utf8",
    );

    const result = validateRepository(root, { strict: true, technicalFiles: [tsdPath] });
    assert.equal(result.ok, true, result.errors.join("\n"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript technical validator rejects unfinished template content in TSD", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-technical-quality-"));
  try {
    const featureRoot = join(root, "docs/coding-plugins/features/technical-quality");
    for (const directory of ["requirements", "technicals", "test-cases", "plans", "evidences"]) {
      mkdirSync(join(featureRoot, directory), { recursive: true });
    }

    const prdPath = join(featureRoot, "requirements/quality-PRD.md");
    const tsdPath = join(featureRoot, "technicals/quality-TSD.md");
    const tvdPath = join(featureRoot, "test-cases/quality-TVD.md");
    const tedPath = join(featureRoot, "plans/quality-TED.md");
    const vedPath = join(featureRoot, "evidences/quality-VED.md");

    writeFileSync(
      prdPath,
      "---\n" +
        "title: Quality PRD\n" +
        "status: approved\n" +
        "feature: technical-quality\n" +
        "doc_id: quality\n" +
        "created: 2026-07-04\n" +
        "updated: 2026-07-04\n" +
        "---\n" +
        "# Quality PRD\n\n" +
        "| 需求点 | 标题 | 优先级 |\n" +
        "| --- | --- | --- |\n" +
        "| REQ-001 | 技术文档质量门禁 | 应该 |\n",
      "utf8",
    );

    for (const path of [tvdPath, tedPath, vedPath]) {
      writeFileSync(path, "---\ntitle: Placeholder\nstatus: draft\nfeature: technical-quality\ndoc_id: quality\ncreated: 2026-07-04\nupdated: 2026-07-04\n---\n", "utf8");
    }

    const relatedDocs =
      "related_docs:\n" +
      "  - docs/coding-plugins/features/technical-quality/requirements/quality-PRD.md\n" +
      "  - docs/coding-plugins/features/technical-quality/test-cases/quality-TVD.md\n" +
      "  - docs/coding-plugins/features/technical-quality/plans/quality-TED.md\n" +
      "  - docs/coding-plugins/features/technical-quality/evidences/quality-VED.md\n";

    writeFileSync(
      tsdPath,
      "---\n" +
        "title: Quality TSD\n" +
        "status: approved\n" +
        "lifecycle_status: approved\n" +
        "feature: technical-quality\n" +
        "doc_id: quality\n" +
        "created: 2026-07-04\n" +
        "updated: 2026-07-04\n" +
        "implemented_commits: []\n" +
        "validated_by: npm run preflight\n" +
        relatedDocs +
        "---\n" +
        "# Quality TSD\n\n" +
        "## 阅读摘要\n\n" +
        "- **本文结论:** <2 到 5 句话说明最终技术方案。>\n\n" +
        "## 设计摘要\n\n" +
        "<2 到 5 句话说明整体技术方案。>\n\n" +
        "## 规格缺口审查\n\n" +
        "| 检查项 | 结论 |\n" +
        "| --- | --- |\n" +
        "| 处理状态 | 通过。 |\n\n" +
        "## 规格到设计映射\n\n" +
        "| 规格 ID | 规格摘要 | 技术落点 | 关键决策 ID | 影响文件/符号 | 验证命令 | 证据 |\n" +
        "| --- | --- | --- | --- | --- | --- | --- |\n" +
        "| REQ-001 | 文档质量门禁 | `src/lib/validate-technicals.ts::validateRepository` | TD-001 | `src/lib/validate-technicals.ts` | npm run preflight | `docs/coding-plugins/features/technical-quality/evidences/quality-VED.md` |\n\n" +
        "## 无需技术设计的规格\n\n" +
        "| 规格 ID | 原因 |\n" +
        "| --- | --- |\n" +
        "| 无 | 所有 SHOULD 规格都有技术落点。 |\n\n" +
        "## 关键决策\n\n" +
        "| 决策 ID | 决策 | 原因 | 取舍 |\n" +
        "| --- | --- | --- | --- |\n" +
        "| TD-001 | 增加 technical 质量门禁 | 防止模板占位进入正式文档 | 需要维护少量校验规则 |\n",
      "utf8",
    );

    const result = validateRepository(root, { strict: true, technicalFiles: [tsdPath] });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /unfinished template content/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("technical solution template keeps relations in metadata and avoids table-heavy body", () => {
  const template = readFileSync("skills/writing-technicals/templates/technical-design-document.md", "utf8");
  const [, body] = splitFrontmatter(template);
  const tableCount = body.split(/\r?\n/).filter((line) => line.trim().startsWith("|")).length / 3;

  assert.ok(tableCount <= 2, "TSD template body should reserve tables for dense mapping matrices");
  assert.equal(body.includes("docs/coding-plugins/features/<feature-name>"), false, "TSD body must not duplicate related document paths");
  assert.equal(body.includes("## 技术实现文档\n\n`docs/"), false, "TSD body must not hard-code TID path links");
  assert.equal(/\bTID\b/.test(body), false, "TSD template body must not require a separate TID");
  assert.ok(body.includes("关联关系只维护在 frontmatter `related_docs` 和 `docs/coding-plugins/INDEX.md`"));
});

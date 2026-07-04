import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
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

test("TypeScript document artifact registry uses unified related_docs contract", () => {
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

    const source = join(featureRoot, "technicals/routing-login-TDD.md");
    const related = expectedRelatedPathsForDocId(featureRoot, "routing-login", source);

    assert.deepEqual(RELATION_KEYS, ["related_docs"]);
    assert.deepEqual(related.related_docs, [
      join(featureRoot, "evidences/routing-login-TED.md"),
      join(featureRoot, "plans/routing-login-IPD.md"),
      join(featureRoot, "requirements/routing-login-PRD.md"),
      join(featureRoot, "technicals/routing-login-TID.md"),
      join(featureRoot, "test-cases/routing-login-TCD.md"),
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
    const tddPath = join(featureRoot, "technicals/routing-login-TDD.md");
    const tidPath = join(featureRoot, "technicals/routing-login-TID.md");
    const tcdPath = join(featureRoot, "test-cases/routing-login-TCD.md");
    const ipdPath = join(featureRoot, "plans/routing-login-IPD.md");
    const tedPath = join(featureRoot, "evidences/routing-login-TED.md");

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

    for (const path of [tidPath, tcdPath, ipdPath, tedPath]) {
      writeFileSync(path, "---\ntitle: Placeholder\nstatus: draft\nfeature: routing\ndoc_id: routing-login\ncreated: 2026-07-04\nupdated: 2026-07-04\n---\n", "utf8");
    }

    writeFileSync(
      tddPath,
      "---\n" +
        "title: Routing TDD\n" +
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
        "  - docs/coding-plugins/features/routing/technicals/routing-login-TID.md\n" +
        "  - docs/coding-plugins/features/routing/test-cases/routing-login-TCD.md\n" +
        "  - docs/coding-plugins/features/routing/plans/routing-login-IPD.md\n" +
        "  - docs/coding-plugins/features/routing/evidences/routing-login-TED.md\n" +
        "---\n" +
        "# Routing TDD\n\n" +
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

    const result = validateRepository(root, { strict: true, technicalFiles: [tddPath] });
    assert.equal(result.ok, true, result.errors.join("\n"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("TypeScript technical validator rejects unfinished template content in TDD and related TID", () => {
  const root = mkdtempSync(join(tmpdir(), "coding-plugins-technical-quality-"));
  try {
    const featureRoot = join(root, "docs/coding-plugins/features/technical-quality");
    for (const directory of ["requirements", "technicals", "test-cases", "plans", "evidences"]) {
      mkdirSync(join(featureRoot, directory), { recursive: true });
    }

    const prdPath = join(featureRoot, "requirements/quality-PRD.md");
    const tddPath = join(featureRoot, "technicals/quality-TDD.md");
    const tidPath = join(featureRoot, "technicals/quality-TID.md");
    const tcdPath = join(featureRoot, "test-cases/quality-TCD.md");
    const ipdPath = join(featureRoot, "plans/quality-IPD.md");
    const tedPath = join(featureRoot, "evidences/quality-TED.md");

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

    for (const path of [tcdPath, ipdPath, tedPath]) {
      writeFileSync(path, "---\ntitle: Placeholder\nstatus: draft\nfeature: technical-quality\ndoc_id: quality\ncreated: 2026-07-04\nupdated: 2026-07-04\n---\n", "utf8");
    }

    const relatedDocs =
      "related_docs:\n" +
      "  - docs/coding-plugins/features/technical-quality/requirements/quality-PRD.md\n" +
      "  - docs/coding-plugins/features/technical-quality/technicals/quality-TID.md\n" +
      "  - docs/coding-plugins/features/technical-quality/test-cases/quality-TCD.md\n" +
      "  - docs/coding-plugins/features/technical-quality/plans/quality-IPD.md\n" +
      "  - docs/coding-plugins/features/technical-quality/evidences/quality-TED.md\n";

    writeFileSync(
      tddPath,
      "---\n" +
        "title: Quality TDD\n" +
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
        "# Quality TDD\n\n" +
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
        "| REQ-001 | 文档质量门禁 | `src/lib/validate-technicals.ts::validateRepository` | TD-001 | `src/lib/validate-technicals.ts` | npm run preflight | `docs/coding-plugins/features/technical-quality/evidences/quality-TED.md` |\n\n" +
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

    writeFileSync(
      tidPath,
      "---\n" +
        "title: Quality TID\n" +
        "status: approved\n" +
        "lifecycle_status: approved\n" +
        "implementation_mode: code\n" +
        "feature: technical-quality\n" +
        "doc_id: quality\n" +
        "created: 2026-07-04\n" +
        "updated: 2026-07-04\n" +
        "implemented_commits: []\n" +
        "validated_by: npm run preflight\n" +
        relatedDocs.replace("technicals/quality-TID.md", "technicals/quality-TDD.md") +
        "---\n" +
        "# Quality TID\n\n" +
        "## 实现摘要\n\n" +
        "<说明实现边界、主要代码落点和不实现的内容。>\n",
      "utf8",
    );

    const result = validateRepository(root, { strict: true, technicalFiles: [tddPath] });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /unfinished template content/);
    assert.match(result.errors.join("\n"), /quality-TID\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

---
title: Technical Doc Quality TED
status: approved
feature: technical-doc-quality
doc_id: technical-doc-quality
created: 2026-07-04
updated: 2026-07-04
related_docs: []
external_references: []
---
# Technical Doc Quality TED

## TDD 证据

- **规格/缺陷/验收:** 明确验收：`writing-technicals` 生成的 TDD/TID 不能保留模板残留文本，validator 必须检查 TDD 及关联 TID 的未完成模板内容。
- **测试类型:** `contract`
- **RED 测试:** `tests/ts/test_document_metadata.mjs` 中的 `TypeScript technical validator rejects unfinished template content in TDD and related TID`
- **RED 命令:** `node --test tests/ts/test_document_metadata.mjs`
- **RED 失败:** 新测试构造了包含模板残留文本的 TDD 和关联 TID，但 strict technical validation 返回 `ok: true`。
- **GREEN 变更:** `src/lib/validate-technicals.ts` 新增 unfinished template content 检查，并从 TDD 的 `related_docs` 或同 doc_id fallback 找到关联 TID 后一起校验。
- **GREEN 命令:** `node --test tests/ts/test_document_metadata.mjs`
- **REFACTOR 命令:** `npm run validate-technicals:ts -- --strict`
- **最终验证:** `NPM_CONFIG_CACHE=/private/tmp/codex-npm-cache npm run preflight -- --write-index` PASS。

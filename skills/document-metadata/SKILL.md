---
name: document-metadata
description: Use when reading, creating, updating, migrating, or auditing Coding Plugins feature documents, frontmatter metadata, related_docs links, README/INDEX document relations, or document-metadata.md templates.
---

# Document Metadata

## Overview

Document metadata is the machine-readable entry point for the Coding Plugins document system. When reading or maintaining README, PRD, TSD, TVD, TED, or VED files under `docs/coding-plugins/features/<feature-name>/`, read frontmatter first, then the body. A feature may contain multiple document chains, separated by `doc_id`.

Core principle: relationships between documents are defined by metadata. Body text holds requirements, design, plans, and evidence; it should not duplicate index-style relationship tables.

Rule center: frontmatter instances are interpreted by `src/lib/documents/document-metadata.ts`. `src/lib/documents/docs-index.ts`, `src/cli/release/preflight.ts`, and validators must reuse that module rather than hard-coding separate artifact rules.

Start by saying: "I am using the document-metadata skill to read and maintain document metadata relationships."

## When to Use

Use this skill when:

- Reading feature docs and needing to understand upstream or downstream relationships.
- Creating or updating README, PRD, TSD, TVD, TED, or VED files.
- Maintaining `related_docs`, `related_code`, or `external_references`.
- Migrating, auditing, or repairing frontmatter metadata.
- Using `templates/document-metadata.md`.
- Resolving conflicts between summaries, README, INDEX, and frontmatter.

Do not use it as a standalone skill when:

- You only explain ordinary code.
- You only run tests or commit code and do not touch document relationships.
- You are writing the body of PRD, TSD, TVD, TED, or VED; use the corresponding writing skill for body content.

## Reading Order

1. Read the feature README frontmatter to confirm `title`, `status`, `feature`, `updated`, and `tags`.
2. Read the target document frontmatter. Confirm `feature` matches the path and `doc_id` matches the filename prefix.
3. Follow `related_docs` to read the same-doc-id chain.
4. Put cross-repository or absolute references in `external_references`, not `related_docs`.
5. Read body sections only after metadata is clear.

If frontmatter and the human-readable document-info section disagree, frontmatter is authoritative; update the body summary.

## Metadata Fields

| Field | Purpose |
| --- | --- |
| `title` | Stable title for index and search. |
| `status` | Common values: `draft`, `approved`, `superseded`, `archived`. |
| `feature` | Must match the feature directory. |
| `doc_id` | Must match the filename prefix. |
| `created` / `updated` | Dates in `YYYY-MM-DD`; `updated` also records sync review. |
| `tags` | README search tags used by `INDEX.md`. |
| `lifecycle_status` | TSD lifecycle: `draft`, `approved`, `implemented`, `stale`, `superseded`. |
| `implemented_commits` | TSD implementation commits. |
| `validated_by` | TSD validation records. |
| `related_docs` | Repository-relative document paths in the same chain. |
| `related_code` | Repository-relative code paths. |
| `external_references` | External or absolute references. |

## Artifact Requirements

- README: requires `title`, `status`, `feature`, `updated`, and `tags`; it is a human overview and search entry.
- PRD: requires `title`, `type`, `status`, `feature`, `doc_id`, `created`, `updated`, and `tags`; link downstream TSD, TVD, TED, and VED when they exist.
- TSD: requires `status`, `lifecycle_status`, `feature`, `doc_id`, dates, `implemented_commits`, and `validated_by`; link PRD, TVD, TED, and VED.
- TVD: requires `status`, `feature`, `doc_id`, and dates; link PRD, TSD, TED, and VED.
- TED: requires `status`, `feature`, `doc_id`, dates, and `source_hash`; link PRD, TSD, TVD, and VED.
- VED: requires `status`, `feature`, `doc_id`, and dates; link PRD, TSD, TVD, and TED.

## Create or Update Flow

1. Choose the correct frontmatter shape from `templates/document-metadata.md`.
2. Keep machine keys in English.
3. Use repository-relative `docs/coding-plugins/...` paths in `related_docs`.
4. Keep README lightweight; do not hand-maintain index tables there.
5. After upstream document changes, review and update downstream docs or at least their `updated` date.
6. Run `npm run preflight -- --write-index`.
7. Run `npm run preflight`.

## Sync Direction

Sync flows downstream:

```text
PRD -> TSD -> TVD -> TED -> VED
```

When an upstream doc changes, use `related_docs` to find downstream docs. If body content is affected, update it. If not, update `updated` to record the sync review. Preflight rejects downstream docs with stale `updated` dates.

## Common Mistakes

- Reading body text before frontmatter.
- Writing absolute paths in `related_docs`.
- Maintaining manual document-chain tables in README.
- Letting `feature` or `doc_id` drift from the path.
- Forgetting to update `INDEX.md`.
- Updating PRD without reviewing downstream docs.

#!/usr/bin/env python3
"""Central document metadata rules for Coding Plugins docs."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class DocumentArtifact:
    """Feature-scoped document artifact metadata contract."""

    label: str
    suffix: str
    directory: str
    relation_key: str
    doc_id_required: bool = True
    sync_upstream: tuple[str, ...] = ()


@dataclass(frozen=True)
class Frontmatter:
    """Parsed Markdown frontmatter with stable render order."""

    scalars: dict[str, str]
    lists: dict[str, list[str]]
    order: list[str]


FEATURE_README_METADATA_REQUIRED_FIELDS = ("title", "status", "feature", "updated")
EVIDENCE_METADATA_REQUIRED_FIELDS = ("title", "status", "feature", "created", "updated")
ARCHIVED_EVIDENCE_METADATA_REQUIRED_FIELDS = (
    "title",
    "status",
    "feature",
    "created",
    "updated",
    "validation_mode",
    "archive_of",
    "archived_at",
)
PLAN_METADATA_REQUIRED_FIELDS = ("title", "status", "feature", "created", "updated")

DOCUMENT_ARTIFACTS = (
    DocumentArtifact("PRD", "PRD", "requirements", "related_specs"),
    DocumentArtifact("TDD", "TDD", "technicals", "related_technical", sync_upstream=("PRD",)),
    DocumentArtifact("TID", "TID", "technicals", "related_technical", sync_upstream=("PRD", "TDD")),
    DocumentArtifact("TCD", "TCD", "test-cases", "related_test_cases", sync_upstream=("PRD", "TDD", "TID")),
    DocumentArtifact("IPD", "IPD", "plans", "related_plans", sync_upstream=("PRD", "TDD", "TID", "TCD")),
    DocumentArtifact("TED", "TED", "evidences", "related_evidence", sync_upstream=("PRD", "TDD", "TID", "TCD", "IPD")),
)
ARTIFACTS_BY_SUFFIX = {artifact.suffix: artifact for artifact in DOCUMENT_ARTIFACTS}
ARTIFACT_SUFFIXES = tuple(artifact.suffix for artifact in DOCUMENT_ARTIFACTS)
RELATION_KEYS = tuple(dict.fromkeys(artifact.relation_key for artifact in DOCUMENT_ARTIFACTS))
DOCUMENT_SYNC_DEPENDENCIES = {
    artifact.suffix: artifact.sync_upstream for artifact in DOCUMENT_ARTIFACTS if artifact.sync_upstream
}


def split_frontmatter(text: str) -> tuple[list[str], str]:
    if not text.startswith("---\n"):
        return [], text
    end = text.find("\n---", 4)
    if end == -1:
        return [], text

    return text[4:end].splitlines(), text[end + len("\n---") :].lstrip("\n")


def parse_frontmatter_block(lines: list[str]) -> Frontmatter:
    scalars: dict[str, str] = {}
    lists: dict[str, list[str]] = {}
    order: list[str] = []
    current_key: str | None = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if line.startswith(" ") and current_key and stripped.startswith("- "):
            lists.setdefault(current_key, []).append(stripped[2:].strip().strip('"').strip("'"))
            continue
        if ":" not in line or line.startswith(" "):
            continue
        key, value = line.split(":", 1)
        current_key = key.strip()
        if current_key not in order:
            order.append(current_key)

        raw_value = value.strip()
        value = raw_value.strip('"').strip("'")
        if raw_value == "[]":
            lists.setdefault(current_key, [])
        elif value:
            scalars[current_key] = value
        else:
            lists.setdefault(current_key, [])

    return Frontmatter(scalars=scalars, lists=lists, order=order)


def render_frontmatter_block(frontmatter: Frontmatter) -> str:
    keys = list(frontmatter.order)
    for key in list(frontmatter.scalars) + list(frontmatter.lists):
        if key not in keys:
            keys.append(key)

    lines = ["---"]
    for key in keys:
        if key in frontmatter.lists:
            values = frontmatter.lists[key]
            if values:
                lines.append(f"{key}:")
                lines.extend(f"  - {value}" for value in values)
            else:
                lines.append(f"{key}: []")
        elif key in frontmatter.scalars:
            lines.append(f"{key}: {frontmatter.scalars[key]}")
    lines.append("---")
    return "\n".join(lines) + "\n"


def parse_frontmatter(text: str) -> dict[str, str]:
    lines, _body = split_frontmatter(text)
    if not lines:
        return {}
    return dict(parse_frontmatter_block(lines).scalars)


def frontmatter_list_values(text: str, key: str) -> list[str]:
    lines, _body = split_frontmatter(text)
    if not lines:
        return []
    return list(parse_frontmatter_block(lines).lists.get(key, []))


def feature_docs_root(root: Path) -> Path:
    return root / "docs" / "coding-plugins" / "features"


def collect_feature_roots(root: Path) -> list[Path]:
    features_root = feature_docs_root(root)
    if not features_root.exists():
        return []

    return sorted(path for path in features_root.iterdir() if path.is_dir())


def feature_root_for_document(root: Path, path: Path) -> tuple[str, Path] | None:
    try:
        relative_parts = path.relative_to(feature_docs_root(root)).parts
    except ValueError:
        return None
    if len(relative_parts) < 1:
        return None
    feature = relative_parts[0]
    return feature, feature_docs_root(root) / feature


def artifact_for_suffix(suffix: str) -> DocumentArtifact:
    try:
        return ARTIFACTS_BY_SUFFIX[suffix]
    except KeyError as error:
        raise ValueError(f"Unknown document artifact suffix: {suffix}") from error


def artifact_directories() -> tuple[str, ...]:
    return tuple(dict.fromkeys(artifact.directory for artifact in DOCUMENT_ARTIFACTS))


def filename_patterns_by_directory() -> dict[str, re.Pattern[str]]:
    suffixes_by_directory: dict[str, list[str]] = {}
    for artifact in DOCUMENT_ARTIFACTS:
        suffixes_by_directory.setdefault(artifact.directory, []).append(artifact.suffix)

    return {
        directory: re.compile(r"^[A-Za-z0-9_.-]+-(?:" + "|".join(map(re.escape, suffixes)) + r")\.md$")
        for directory, suffixes in suffixes_by_directory.items()
    }


def document_doc_id(path: Path) -> str:
    for suffix in ARTIFACT_SUFFIXES:
        marker = f"-{suffix}"
        if path.stem.endswith(marker):
            return path.stem[: -len(marker)]
    return path.stem


def document_suffix(path: Path) -> str | None:
    for suffix in ARTIFACT_SUFFIXES:
        if path.stem.endswith(f"-{suffix}"):
            return suffix
    return None


def feature_artifact_file(feature_root: Path, directory: str, suffix: str, doc_id: str | None = None) -> Path:
    return feature_root / directory / f"{doc_id or feature_root.name}-{suffix}.md"


def artifact_file(feature_root: Path, suffix: str, doc_id: str | None = None) -> Path:
    artifact = artifact_for_suffix(suffix)
    return feature_artifact_file(feature_root, artifact.directory, artifact.suffix, doc_id)


def feature_artifact_files(feature_root: Path, directory: str, suffix: str) -> list[Path]:
    artifact_dir = feature_root / directory
    if not artifact_dir.exists():
        return []
    return sorted(path for path in artifact_dir.glob(f"*-{suffix}.md") if path.is_file())


def artifact_files(feature_root: Path, suffix: str) -> list[Path]:
    artifact = artifact_for_suffix(suffix)
    return feature_artifact_files(feature_root, artifact.directory, artifact.suffix)


def feature_artifact_files_for_doc_id(feature_root: Path, directory: str, suffix: str, doc_id: str) -> list[Path]:
    path = feature_artifact_file(feature_root, directory, suffix, doc_id)
    return [path] if path.exists() else []


def artifact_files_for_doc_id(feature_root: Path, suffix: str, doc_id: str) -> list[Path]:
    artifact = artifact_for_suffix(suffix)
    return feature_artifact_files_for_doc_id(feature_root, artifact.directory, artifact.suffix, doc_id)


def feature_doc_ids(feature_root: Path) -> list[str]:
    doc_ids = {document_doc_id(path) for artifact in DOCUMENT_ARTIFACTS for path in artifact_files(feature_root, artifact.suffix)}
    return sorted(doc_ids)


def documents_by_suffix_for_doc_id(feature_root: Path, doc_id: str) -> dict[str, list[Path]]:
    return {artifact.suffix: artifact_files_for_doc_id(feature_root, artifact.suffix, doc_id) for artifact in DOCUMENT_ARTIFACTS}


def expected_related_paths_for_doc_id(
    feature_root: Path,
    doc_id: str,
    source_path: Path | None = None,
) -> dict[str, list[Path]]:
    source = source_path.resolve() if source_path is not None else None
    expected: dict[str, list[Path]] = {key: [] for key in RELATION_KEYS}

    for artifact in DOCUMENT_ARTIFACTS:
        for path in artifact_files_for_doc_id(feature_root, artifact.suffix, doc_id):
            if source is not None and path.resolve() == source:
                continue
            expected[artifact.relation_key].append(path)

    return {key: sorted(paths) for key, paths in expected.items()}

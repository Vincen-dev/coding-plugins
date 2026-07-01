#!/usr/bin/env python3
"""Run repository checks before publishing or pushing plugin changes."""

from __future__ import annotations

import importlib.util
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from typing import Callable

import docs_index
import manifest_checks
from docs_index import (
    collect_feature_roots,
    feature_docs_root,
    feature_root_for_document,
    parse_frontmatter,
    render_artifact_index,
    write_artifact_index,
)
from manifest_checks import normalize_manifest_asset_path, read_json


class PreflightError(RuntimeError):
    """Raised when a local repository invariant fails."""


TEXT_SUFFIXES = {
    ".json",
    ".md",
    ".py",
    ".sh",
    ".svg",
    ".cmd",
    ".toml",
    ".txt",
    ".yaml",
    ".yml",
}
SKIPPED_DIRS = {".git", ".mypy_cache", ".pytest_cache", "__pycache__"}
REMOVED_ENTRY_PATTERNS = (
    "using-" + "superpowers",
    "/coding-plugins:" + "using-" + "superpowers",
    "skills/" + "using-" + "superpowers",
    "docs/coding-plugins/specs/",
    "docs/coding-plugins/technical/",
    "docs/coding-plugins/plans/",
    "docs/coding-plugins/evidence/",
    "docs/coding-plugins/evidences/",
    "~/.config/" + "superpowers",
    "super" + "powers",
    "brain" + "storming",
)
RESIDUE_SCAN_ROOTS = (
    "README.md",
    "docs",
    "hooks",
    "skills",
    ".codex-plugin",
    ".claude-plugin",
    ".agents",
    ".github",
)
RESIDUE_SCAN_EXCLUDED_PREFIXES = (
    "docs/coding-plugins/features/",
)
SDD_TEMPLATE_ENGLISH_STRUCTURE = (
    "# Acceptance Criteria",
    "# Specs Index",
    "## Goal",
    "## Non-goals",
    "## Context",
    "## Functional Requirements",
    "## Error and Edge Cases",
    "## Acceptance Criteria",
    "## Endpoints or Methods",
    "## Request Contract",
    "## Response Contract",
    "## Errors",
    "## Compatibility",
    "## Current Baseline",
    "## Maintenance Requirements",
    "## Regression and Risk Cases",
    "## Compatibility or Migration",
    "## Observability",
    "## Scope",
    "## Schema Contract",
    "## Valid Example",
    "## Invalid Examples",
    "## States",
    "## Transitions",
    "## Invalid Transitions",
    "## Traceability",
    "| ID |",
    "| Priority |",
    "| Requirement |",
    "| Verification |",
    "| Scenario |",
    "| Given |",
    "| When |",
    "| Then |",
)
TECHNICAL_TEMPLATE_ENGLISH_STRUCTURE = (
    "## Design Summary",
    "## Key Decisions",
    "## Affected Components",
    "## Data Flow / Control Flow",
    "## Interfaces and Contracts",
    "## Migration / Compatibility",
    "## Test Strategy",
    "## Risks and Mitigations",
    "| Decision |",
    "| Rationale |",
    "| Tradeoff |",
    "| Component |",
    "| Change |",
    "| Related Spec IDs |",
    "| Risk |",
    "| Mitigation |",
    "| Spec ID |",
    "| Evidence |",
    "TDD Evidence",
)
PLAN_TEMPLATE_ENGLISH_STRUCTURE = (
    "# [Feature Name] Implementation Plan",
    "**Goal:**",
    "**Architecture:**",
    "**Tech Stack:**",
    "**Spec Source:**",
    "**Technical Design Source:**",
    "## Technical Design Snapshot",
    "**Design Summary:**",
    "**Key Decisions:**",
    "**Affected Components:**",
    "**Data Flow / Control Flow:**",
    "**Interfaces and Contracts:**",
    "**Migration / Compatibility:**",
    "**Test Strategy:**",
    "**TDD Evidence Target:**",
    "**Risks and Mitigations:**",
    "## Spec Traceability",
    "| Decision |",
    "| Component |",
    "| Related Spec IDs |",
    "| Spec ID |",
    "| Test file / command |",
    "| TDD evidence file / field |",
    "| Implementation task |",
    "### Task N:",
    "**Spec IDs:**",
    "**Files:**",
    "- Create:",
    "- Modify:",
    "- Test:",
    "Step 1: Write the failing test",
    "Run:",
    "Expected:",
    "Step 6: Record TDD Evidence",
    "**Spec/Bug/AC:**",
    "**RED test:**",
    "**RED command:**",
    "**Final verification:**",
)
TDD_EVIDENCE_TEMPLATE_ENGLISH_STRUCTURE = (
    "# <Feature> TDD Evidence",
    "# <Feature>",
    "## Task <N>",
    "### TDD Evidence",
    "### TDD Exception Record",
    "**Spec/Bug/AC:**",
    "**RED test:**",
    "**RED command:**",
    "**RED failure:**",
    "**GREEN change:**",
    "**GREEN command:**",
    "**REFACTOR command:**",
    "**Final verification:**",
    "**Reason:**",
    "**User approval:**",
    "**Alternative verification:**",
    "**Risk:**",
)
SPEC_ID_RE = re.compile(r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)(?:-[A-Z0-9]+)*-\d{3,}\b")
TECHNICAL_DESIGN_PATH_RE = re.compile(
    r"docs/coding-plugins/features/[A-Za-z0-9_.\-/]+/technicals/[A-Za-z0-9_.\-]+-TDD\.md"
)
TECHNICAL_IMPLEMENTATION_PATH_RE = re.compile(
    r"docs/coding-plugins/features/[A-Za-z0-9_.\-/]+/technicals/[A-Za-z0-9_.\-]+-TID\.md"
)
EVIDENCE_PATH_RE = re.compile(
    r"docs/coding-plugins/features/[A-Za-z0-9_.\-/]+/evidences/[A-Za-z0-9_.\-/]+\.md"
)
FEATURE_README_METADATA_REQUIRED_FIELDS = ("title", "status", "feature", "updated")
FEATURE_README_HANDWRITTEN_LINK_SECTIONS = ("产物链路", "文档链路")
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
CHINESE_DOCUMENT_INFO_REQUIRED_TERMS = ("## 文档信息", "状态", "Feature")
TECHNICAL_GAP_REVIEW_REQUIRED_TERMS = ("未覆盖需求", "验收标准", "外部行为", "处理状态")
TECHNICAL_GAP_REVIEW_UNRESOLVED_TERMS = ("未处理", "待处理", "需澄清", "不清楚", "待确认")
TECHNICAL_DESIGN_REQUIRED_SECTIONS = ("规格到设计映射", "无需技术设计的规格")
LIGHTWEIGHT_EXCEPTION_REQUIRED_TERMS = ("## 轻量例外", "原因", "验证方式")
LIGHTWEIGHT_EXCEPTION_TRACE_HEADERS = ("规格 ID", "证据")
DOC_SYNC_REFERENCES = (
    "docs/coding-plugins/INDEX.md",
    "docs/coding-plugins/features",
    "hooks/hooks-codex.json",
    ".version-bump.json",
    "RELEASE-NOTES.md",
    "scripts/bump_version.py",
    "python3 scripts/preflight.py --write-index",
    "python3 scripts/preflight.py",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_technical_design_validator(root: Path):
    validator_path = repo_root() / "skills" / "writing-technicals" / "scripts" / "validate_technicals.py"
    spec = importlib.util.spec_from_file_location("validate_technicals", validator_path)
    if spec is None or spec.loader is None:
        raise PreflightError(f"Cannot load technical design validator: {validator_path}.")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def run_manifest_check(check: Callable[[Path], object], root: Path) -> object:
    try:
        return check(root)
    except manifest_checks.ManifestCheckError as error:
        raise PreflightError(str(error)) from error


def check_manifest_versions(root: Path) -> None:
    run_manifest_check(manifest_checks.check_manifest_versions, root)


def current_manifest_version(root: Path) -> str:
    return str(run_manifest_check(manifest_checks.current_manifest_version, root))


def check_release_management_files(root: Path) -> None:
    version = current_manifest_version(root)

    config_path = root / ".version-bump.json"
    if not config_path.exists():
        raise PreflightError("Missing version bump config: .version-bump.json.")
    config = read_json(config_path)
    if config.get("version") != version:
        raise PreflightError(
            f"Version bump config version differs: .version-bump.json={config.get('version')} manifest={version}."
        )

    release_notes_path = root / "RELEASE-NOTES.md"
    if not release_notes_path.exists():
        raise PreflightError("Missing RELEASE-NOTES.md.")
    release_notes = release_notes_path.read_text(encoding="utf-8")
    if f"## {version}" not in release_notes:
        raise PreflightError(f"RELEASE-NOTES.md must include current version: {version}.")

    release_script_path = root / "scripts" / "prepare_release.py"
    release_test_path = root / "scripts" / "test_prepare_release.py"
    release_workflow_path = root / ".github" / "workflows" / "release.yml"
    missing_release_files = [
        str(path.relative_to(root))
        for path in (release_script_path, release_test_path, release_workflow_path)
        if not path.exists()
    ]
    if missing_release_files:
        raise PreflightError("Missing release automation: " + ", ".join(missing_release_files) + ".")

    release_workflow = release_workflow_path.read_text(encoding="utf-8")
    if "scripts/prepare_release.py" not in release_workflow or "gh release create" not in release_workflow:
        raise PreflightError("Release workflow must prepare release metadata and create a GitHub Release.")


def check_codex_hook_config_declared(root: Path) -> None:
    run_manifest_check(manifest_checks.check_codex_hook_config_declared, root)


def iter_text_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for path in root.rglob("*"):
        if any(part in SKIPPED_DIRS for part in path.parts):
            continue
        if path.is_file() and path.suffix in TEXT_SUFFIXES:
            files.append(path)
    return sorted(files)


def check_removed_entry_references(root: Path) -> None:
    offenders: list[str] = []
    for path in iter_residue_scan_files(root):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in REMOVED_ENTRY_PATTERNS:
            if pattern in text:
                offenders.append(f"{path.relative_to(root)} contains {pattern!r}")
                break

    if offenders:
        joined = ", ".join(offenders)
        raise PreflightError(f"Removed residue reference found in: {joined}.")


def iter_residue_scan_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for scan_root in RESIDUE_SCAN_ROOTS:
        path = root / scan_root
        if not path.exists():
            continue
        candidates = [path] if path.is_file() else sorted(path.rglob("*"))
        for candidate in candidates:
            if any(part in SKIPPED_DIRS for part in candidate.parts):
                continue
            if not candidate.is_file():
                continue
            relative = str(candidate.relative_to(root))
            is_hook_script = relative.startswith("hooks/") and candidate.suffix == ""
            if candidate.suffix not in TEXT_SUFFIXES and not is_hook_script:
                continue
            if any(relative.startswith(prefix) for prefix in RESIDUE_SCAN_EXCLUDED_PREFIXES):
                continue
            files.append(candidate)
    return sorted(files)


def check_required_plugin_files(root: Path) -> None:
    run_manifest_check(manifest_checks.check_required_plugin_files, root)


def check_sdd_templates_are_chinese(root: Path) -> None:
    templates_root = root / "skills" / "spec-driven-development" / "templates"
    if not templates_root.exists():
        return

    offenders: list[str] = []
    for path in sorted(templates_root.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        for pattern in SDD_TEMPLATE_ENGLISH_STRUCTURE:
            if pattern in text:
                offenders.append(f"{path.relative_to(root)} contains {pattern!r}")
                break

    if offenders:
        raise PreflightError("SDD template still contains English structure: " + "; ".join(offenders) + ".")


def check_technical_templates_are_chinese(root: Path) -> None:
    template_path = root / "skills" / "writing-technicals" / "templates" / "technical-design-document.md"
    if not template_path.exists():
        return

    text = template_path.read_text(encoding="utf-8")
    offenders = [
        f"{template_path.relative_to(root)} contains {pattern!r}"
        for pattern in TECHNICAL_TEMPLATE_ENGLISH_STRUCTURE
        if pattern in text
    ]
    if offenders:
        raise PreflightError("Technical template still contains English structure: " + "; ".join(offenders) + ".")


def check_plan_templates_are_chinese(root: Path) -> None:
    skill_path = root / "skills" / "writing-plans" / "SKILL.md"
    if not skill_path.exists():
        return

    text = skill_path.read_text(encoding="utf-8")
    offenders = [
        f"{skill_path.relative_to(root)} contains {pattern!r}"
        for pattern in PLAN_TEMPLATE_ENGLISH_STRUCTURE
        if pattern in text
    ]
    if offenders:
        raise PreflightError("Plan template still contains English structure: " + "; ".join(offenders) + ".")


def check_tdd_evidence_templates_are_chinese(root: Path) -> None:
    candidates = [
        root / "skills" / "test-driven-development" / "templates" / "tdd-evidence.md",
        root / "skills" / "test-driven-development" / "SKILL.md",
    ]
    offenders: list[str] = []
    for path in candidates:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for pattern in TDD_EVIDENCE_TEMPLATE_ENGLISH_STRUCTURE:
            if pattern in text:
                offenders.append(f"{path.relative_to(root)} contains {pattern!r}")
                break

    if offenders:
        raise PreflightError("TDD evidence template still contains English structure: " + "; ".join(offenders) + ".")


def check_technical_template_required_sections(root: Path) -> None:
    template_path = root / "skills" / "writing-technicals" / "templates" / "technical-design-document.md"
    if not template_path.exists():
        return

    text = template_path.read_text(encoding="utf-8")
    missing = [section for section in TECHNICAL_DESIGN_REQUIRED_SECTIONS if markdown_section(text, section) is None]
    if missing:
        raise PreflightError(
            "Technical template is missing required section: "
            + f"{template_path.relative_to(root)} missing {', '.join(missing)}."
        )


def check_skill_agent_metadata(root: Path) -> None:
    skills_root = root / "skills"
    if not skills_root.exists():
        return

    missing = []
    for skill_file in sorted(skills_root.glob("*/SKILL.md")):
        agent_file = skill_file.parent / "agents" / "openai.yaml"
        if not agent_file.exists():
            missing.append(str(agent_file.relative_to(root)))

    if missing:
        raise PreflightError("Skill is missing agents/openai.yaml: " + ", ".join(missing) + ".")


def check_manifest_asset_paths(root: Path) -> None:
    run_manifest_check(manifest_checks.check_manifest_asset_paths, root)


def check_legacy_docs_roots(root: Path) -> None:
    offenders: list[str] = []
    docs_root = root / "docs" / "coding-plugins"
    for legacy_name in ("specs", "technical", "requirements", "technicals", "plans", "evidence"):
        legacy_root = docs_root / legacy_name
        if legacy_root.exists():
            offenders.extend(str(path.relative_to(root)) for path in sorted(legacy_root.rglob("*.md")))

    if offenders:
        raise PreflightError("Legacy docs path is no longer active: " + ", ".join(offenders) + ".")


def check_feature_readmes(root: Path) -> None:
    missing = [
        str((feature_root / "README.md").relative_to(root))
        for feature_root in collect_feature_roots(root)
        if not (feature_root / "README.md").exists()
    ]
    if missing:
        raise PreflightError("Feature root is missing README: " + ", ".join(missing) + ".")


def check_feature_readme_metadata_contract(root: Path) -> None:
    incomplete: list[str] = []
    mismatches: list[str] = []
    handwritten_link_sections: list[str] = []

    for feature_root in collect_feature_roots(root):
        readme = feature_root / "README.md"
        if not readme.exists():
            continue

        text = readme.read_text(encoding="utf-8")
        metadata = parse_frontmatter(text)
        missing_fields = [field for field in FEATURE_README_METADATA_REQUIRED_FIELDS if not metadata.get(field)]
        if not frontmatter_list_values(text, "tags"):
            missing_fields.append("tags")
        if missing_fields:
            incomplete.append(f"{readme.relative_to(root)} missing {', '.join(missing_fields)}")
            continue

        feature_context = feature_root_for_document(root, readme)
        if feature_context is None:
            mismatches.append(f"{readme.relative_to(root)} is not under features/<feature-name>/")
        else:
            path_feature, _feature_root = feature_context
            if metadata.get("feature") != path_feature:
                mismatches.append(f"{readme.relative_to(root)} feature={metadata.get('feature')} path={path_feature}")

        for section in FEATURE_README_HANDWRITTEN_LINK_SECTIONS:
            if markdown_section(text, section) is not None:
                handwritten_link_sections.append(f"{readme.relative_to(root)} has ## {section}")

    if incomplete:
        raise PreflightError("Feature README metadata is invalid: " + "; ".join(incomplete) + ".")
    if mismatches:
        raise PreflightError("Feature README metadata does not match path: " + "; ".join(mismatches) + ".")
    if handwritten_link_sections:
        raise PreflightError(
            "Feature README must not contain handwritten document link sections: "
            + "; ".join(handwritten_link_sections)
            + "."
        )


def check_feature_first_document_layout(root: Path) -> None:
    offenders: list[str] = []
    for feature_root in collect_feature_roots(root):
        for flat_path in feature_root.glob("*.md"):
            if flat_path.name != "README.md":
                offenders.append(str(flat_path.relative_to(root)))
        if (feature_root / "evidence").exists():
            offenders.append(str((feature_root / "evidence").relative_to(root)))
        expected_files = {
            "requirements": {f"{feature_root.name}-PRD.md"},
            "technicals": {f"{feature_root.name}-TDD.md", f"{feature_root.name}-TID.md"},
            "test-cases": {f"{feature_root.name}-TCD.md"},
            "plans": {f"{feature_root.name}-IPD.md"},
            "evidences": {f"{feature_root.name}-TED.md"},
        }
        for directory, allowed_names in expected_files.items():
            artifact_dir = feature_root / directory
            if not artifact_dir.exists():
                continue
            for document in artifact_dir.glob("*.md"):
                if document.name not in allowed_names:
                    offenders.append(str(document.relative_to(root)))

    if offenders:
        raise PreflightError(
            "Feature documents must use <feature-name>-XXX.md files under requirements/, technicals/, "
            "test-cases/, plans/ and evidences/: "
            + ", ".join(offenders)
            + "."
        )


def feature_has_approved_spec(feature_root: Path) -> bool:
    for spec_file in docs_index.feature_spec_files(feature_root):
        metadata = parse_frontmatter(spec_file.read_text(encoding="utf-8"))
        if metadata.get("status") == "approved":
            return True
    return False


def feature_has_lightweight_exception(feature_root: Path) -> bool:
    readme = feature_root / "README.md"
    if not readme.exists():
        return False
    text = readme.read_text(encoding="utf-8")
    return all(term in text for term in LIGHTWEIGHT_EXCEPTION_REQUIRED_TERMS)


def parse_markdown_table(section: str) -> tuple[list[str], list[list[str]]]:
    lines = section.splitlines()
    for index, line in enumerate(lines[:-1]):
        if not line.lstrip().startswith("|"):
            continue
        headers = [cell.strip() for cell in line.strip().strip("|").split("|")]
        separator = [cell.strip() for cell in lines[index + 1].strip().strip("|").split("|")]
        if not separator or not all(cell.replace(":", "").strip("-") == "" and "---" in cell for cell in separator):
            continue
        rows: list[list[str]] = []
        for row in lines[index + 2 :]:
            if not row.lstrip().startswith("|"):
                break
            cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
            if len(cells) == len(headers):
                rows.append(cells)
        return headers, rows
    return [], []


def lightweight_exception_traceability_errors(root: Path, feature_root: Path) -> list[str]:
    readme = feature_root / "README.md"
    if not readme.exists():
        return [str(feature_root.relative_to(root))]

    required_ids = required_spec_ids_from_specs(approved_spec_files_for_feature(feature_root))
    if not required_ids:
        return []

    text = readme.read_text(encoding="utf-8")
    section = markdown_section(text, "轻量例外")
    if section is None:
        return [str(readme.relative_to(root))]

    headers, rows = parse_markdown_table(section)
    if tuple(headers[:2]) != LIGHTWEIGHT_EXCEPTION_TRACE_HEADERS:
        return [f"{readme.relative_to(root)} missing 规格 ID -> 证据 table"]

    covered: set[str] = set()
    missing_evidence_paths: list[str] = []
    missing_evidence_for_ids: list[str] = []
    for row in rows:
        ids = set(SPEC_ID_RE.findall(row[0]))
        evidence_paths = EVIDENCE_PATH_RE.findall(row[1])
        if ids and not evidence_paths:
            missing_evidence_for_ids.extend(sorted(ids))
            continue
        row_missing_paths: list[str] = []
        for evidence_path in evidence_paths:
            if not (root / evidence_path).exists():
                row_missing_paths.append(evidence_path)
        missing_evidence_paths.extend(row_missing_paths)
        if not row_missing_paths:
            covered.update(ids)

    missing_ids = sorted(required_ids - covered)
    errors: list[str] = []
    if missing_ids:
        errors.append(f"{readme.relative_to(root)} missing Spec IDs: {', '.join(missing_ids)}")
    if missing_evidence_paths:
        errors.append(f"{readme.relative_to(root)} references missing evidence: {', '.join(sorted(set(missing_evidence_paths)))}")
    if missing_evidence_for_ids:
        errors.append(
            f"{readme.relative_to(root)} missing Evidence paths for: "
            + ", ".join(sorted(set(missing_evidence_for_ids)))
        )
    return errors


def check_feature_document_chain_closure(root: Path) -> None:
    offenders: list[str] = []
    lightweight_traceability_offenders: list[str] = []
    for feature_root in collect_feature_roots(root):
        if not feature_has_approved_spec(feature_root):
            continue
        has_technical = bool(docs_index.feature_technical_design_files(feature_root))
        has_plan = bool(docs_index.feature_plan_files(feature_root))
        if has_technical and has_plan:
            continue
        if feature_has_lightweight_exception(feature_root):
            lightweight_traceability_offenders.extend(lightweight_exception_traceability_errors(root, feature_root))
            continue
        offenders.append(str(feature_root.relative_to(root)))

    if offenders:
        raise PreflightError(
            "Feature document chain is incomplete; add technical/plan or README lightweight exception: "
            + ", ".join(offenders)
            + "."
        )
    if lightweight_traceability_offenders:
        raise PreflightError(
            "Lightweight exception traceability is incomplete: "
            + "; ".join(lightweight_traceability_offenders)
            + "."
        )


def check_document_path_metadata(root: Path) -> None:
    mismatches: list[str] = []
    for label, files in (
        ("spec", collect_spec_files(root)),
        ("technical design", collect_technical_design_files(root)),
        ("technical implementation", collect_technical_implementation_files(root)),
    ):
        for path in files:
            feature_context = feature_root_for_document(root, path)
            if feature_context is None:
                mismatches.append(f"{path.relative_to(root)} is not under features/<feature-name>/")
                continue
            path_feature, _feature_root = feature_context
            metadata = parse_frontmatter(path.read_text(encoding="utf-8"))
            if metadata.get("feature") and metadata.get("feature") != path_feature:
                mismatches.append(f"{path.relative_to(root)} feature={metadata.get('feature')} path={path_feature}")

    for label, files in (
        ("test cases", collect_test_case_files(root)),
        ("plan", collect_plan_files(root)),
        ("evidence", collect_tdd_evidence_files(root)),
    ):
        for path in files:
            if feature_root_for_document(root, path) is None:
                mismatches.append(f"{path.relative_to(root)} is not under features/<feature-name>/")

    if mismatches:
        raise PreflightError("Spec metadata does not match path: " + "; ".join(mismatches) + ".")


def check_plan_metadata(root: Path) -> None:
    incomplete: list[str] = []
    mismatches: list[str] = []
    for path in collect_plan_files(root):
        metadata = parse_frontmatter(path.read_text(encoding="utf-8"))
        missing_fields = [field for field in PLAN_METADATA_REQUIRED_FIELDS if not metadata.get(field)]
        if missing_fields:
            incomplete.append(f"{path.relative_to(root)} missing {', '.join(missing_fields)}")
            continue

        feature_context = feature_root_for_document(root, path)
        if feature_context is None:
            mismatches.append(f"{path.relative_to(root)} is not under features/<feature-name>/")
            continue
        path_feature, _feature_root = feature_context
        if metadata.get("feature") != path_feature:
            mismatches.append(f"{path.relative_to(root)} feature={metadata.get('feature')} path={path_feature}")

    if incomplete:
        raise PreflightError("Plan metadata is incomplete: " + "; ".join(incomplete) + ".")
    if mismatches:
        raise PreflightError("Plan metadata does not match path: " + "; ".join(mismatches) + ".")


def check_evidence_metadata(root: Path) -> None:
    incomplete: list[str] = []
    mismatches: list[str] = []
    relation_errors: list[str] = []

    for path in collect_tdd_evidence_files(root):
        text = path.read_text(encoding="utf-8")
        metadata = parse_frontmatter(text)
        missing_fields = [field for field in EVIDENCE_METADATA_REQUIRED_FIELDS if not metadata.get(field)]
        if missing_fields:
            incomplete.append(f"{path.relative_to(root)} missing {', '.join(missing_fields)}")
            continue

        feature_context = feature_root_for_document(root, path)
        if feature_context is None:
            mismatches.append(f"{path.relative_to(root)} is not under features/<feature-name>/")
            continue
        path_feature, feature_root = feature_context
        if metadata.get("feature") != path_feature:
            mismatches.append(f"{path.relative_to(root)} feature={metadata.get('feature')} path={path_feature}")

        expected_by_key = {
            "related_specs": docs_index.feature_spec_files(feature_root),
            "related_technical": docs_index.feature_technical_design_files(feature_root)
            + docs_index.feature_technical_implementation_files(feature_root),
            "related_test_cases": docs_index.feature_test_case_files(feature_root),
            "related_plans": docs_index.feature_plan_files(feature_root),
        }
        for key, expected_paths in expected_by_key.items():
            if not expected_paths:
                continue
            actual_values = set(frontmatter_list_values(text, key))
            expected_values = {str(expected_path.relative_to(root)) for expected_path in expected_paths}
            missing_values = sorted(expected_values - actual_values)
            missing_existing = sorted(
                value for value in actual_values if value.startswith("docs/coding-plugins/") and not (root / value).exists()
            )
            if missing_values:
                relation_errors.append(f"{path.relative_to(root)} {key} missing {', '.join(missing_values)}")
            if missing_existing:
                relation_errors.append(f"{path.relative_to(root)} {key} references missing {', '.join(missing_existing)}")

    if incomplete:
        raise PreflightError("Evidence metadata is incomplete: " + "; ".join(incomplete) + ".")
    if mismatches:
        raise PreflightError("Evidence metadata does not match path: " + "; ".join(mismatches) + ".")
    if relation_errors:
        raise PreflightError("Evidence related metadata is invalid: " + "; ".join(relation_errors) + ".")


def check_prd_related_metadata(root: Path) -> None:
    offenders: list[str] = []
    for spec_file in collect_spec_files(root):
        feature_context = feature_root_for_document(root, spec_file)
        if feature_context is None:
            continue
        _feature, feature_root = feature_context
        text = spec_file.read_text(encoding="utf-8")
        expected_by_key = {
            "related_technical": docs_index.feature_technical_design_files(feature_root)
            + docs_index.feature_technical_implementation_files(feature_root),
            "related_test_cases": docs_index.feature_test_case_files(feature_root),
            "related_plans": docs_index.feature_plan_files(feature_root),
            "related_evidence": docs_index.feature_evidence_files(feature_root),
        }

        for key in ("related_specs", *expected_by_key.keys()):
            actual_values = set(frontmatter_list_values(text, key))
            missing_existing = sorted(
                value for value in actual_values if value.startswith("docs/coding-plugins/") and not (root / value).exists()
            )
            if missing_existing:
                offenders.append(f"{spec_file.relative_to(root)} {key} references missing {', '.join(missing_existing)}")

        for key, expected_paths in expected_by_key.items():
            if not expected_paths:
                continue
            actual_values = set(frontmatter_list_values(text, key))
            expected_values = {str(path.relative_to(root)) for path in expected_paths}
            missing_values = sorted(expected_values - actual_values)
            if missing_values:
                offenders.append(f"{spec_file.relative_to(root)} {key} missing {', '.join(missing_values)}")

    if offenders:
        raise PreflightError("PRD related metadata is invalid: " + "; ".join(offenders) + ".")


def document_updated_date(root: Path, path: Path) -> date | None:
    metadata = parse_frontmatter(path.read_text(encoding="utf-8"))
    value = metadata.get("updated")
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise PreflightError(f"Document updated metadata is invalid: {path.relative_to(root)} updated={value}.") from error


def check_document_sync_freshness(root: Path) -> None:
    offenders: list[str] = []
    for feature_root in collect_feature_roots(root):
        documents_by_label = {
            "PRD": docs_index.feature_spec_files(feature_root),
            "TDD": docs_index.feature_technical_design_files(feature_root),
            "TID": docs_index.feature_technical_implementation_files(feature_root),
            "TCD": docs_index.feature_test_case_files(feature_root),
            "IPD": docs_index.feature_plan_files(feature_root),
            "TED": docs_index.feature_evidence_files(feature_root),
        }
        dependency_labels = {
            "TDD": ("PRD",),
            "TID": ("PRD", "TDD"),
            "TCD": ("PRD", "TDD", "TID"),
            "IPD": ("PRD", "TDD", "TID", "TCD"),
            "TED": ("PRD", "TDD", "TID", "TCD", "IPD"),
        }

        for downstream_label, upstream_labels in dependency_labels.items():
            for downstream in documents_by_label[downstream_label]:
                downstream_updated = document_updated_date(root, downstream)
                if downstream_updated is None:
                    offenders.append(f"{downstream.relative_to(root)} missing updated metadata")
                    continue
                for upstream_label in upstream_labels:
                    for upstream in documents_by_label[upstream_label]:
                        upstream_updated = document_updated_date(root, upstream)
                        if upstream_updated is None:
                            offenders.append(f"{upstream.relative_to(root)} missing updated metadata")
                            continue
                        if downstream_updated < upstream_updated:
                            offenders.append(
                                f"{downstream.relative_to(root)} updated {downstream_updated.isoformat()} "
                                f"is older than {upstream.relative_to(root)} updated {upstream_updated.isoformat()}"
                            )

    if offenders:
        raise PreflightError("Document sync freshness is invalid: " + "; ".join(offenders) + ".")


def check_archived_evidence_metadata(root: Path) -> None:
    incomplete: list[str] = []
    mismatches: list[str] = []
    for path in collect_archived_evidence_files(root):
        text = path.read_text(encoding="utf-8")
        metadata = parse_frontmatter(text)
        missing_fields = [field for field in ARCHIVED_EVIDENCE_METADATA_REQUIRED_FIELDS if not metadata.get(field)]
        if missing_fields:
            incomplete.append(f"{path.relative_to(root)} missing {', '.join(missing_fields)}")
            continue
        feature_context = feature_root_for_document(root, path)
        if feature_context is None:
            mismatches.append(f"{path.relative_to(root)} is not under features/<feature-name>/")
            continue
        path_feature, _feature_root = feature_context
        if metadata.get("feature") != path_feature:
            mismatches.append(f"{path.relative_to(root)} feature={metadata.get('feature')} path={path_feature}")
        if metadata.get("status") != "archived":
            mismatches.append(f"{path.relative_to(root)} status must be archived")
        if metadata.get("validation_mode") != "historical":
            mismatches.append(f"{path.relative_to(root)} validation_mode must be historical")

    if incomplete:
        raise PreflightError("Archived evidence metadata is incomplete: " + "; ".join(incomplete) + ".")
    if mismatches:
        raise PreflightError("Archived evidence metadata does not match contract: " + "; ".join(mismatches) + ".")


def check_external_references(root: Path) -> None:
    missing: list[str] = []
    for path in (
        collect_spec_files(root)
        + collect_technical_design_files(root)
        + collect_technical_implementation_files(root)
        + collect_test_case_files(root)
        + collect_plan_files(root)
        + collect_tdd_evidence_files(root)
    ):
        text = path.read_text(encoding="utf-8")
        for reference in frontmatter_list_values(text, "external_references"):
            reference_path = Path(reference).expanduser()
            if not reference_path.is_absolute():
                reference_path = root / reference_path
            if not reference_path.exists():
                missing.append(f"{path.relative_to(root)} -> {reference}")

    if missing:
        raise PreflightError("External references are missing: " + "; ".join(missing) + ".")


def traceability_statuses_by_spec(text: str) -> dict[str, set[str]]:
    statuses: dict[str, set[str]] = {}
    for table in re.finditer(r"(?ms)(^\|[^\n]+\|\n^\|[ :\-\|]+\|\n(?:^\|[^\n]+\|\n?)+)", text):
        table_text = table.group(1)
        headers, rows = parse_markdown_table(table_text)
        if not headers:
            continue
        header_text = " | ".join(headers).lower()
        if not ("spec id" in header_text or "规格 id" in header_text or "规格ID" in header_text):
            continue
        status_index = next((index for index, header in enumerate(headers) if "status" in header.lower() or "状态" in header), None)
        if status_index is None:
            continue
        for row in rows:
            ids = SPEC_ID_RE.findall(" | ".join(row))
            if not ids or status_index >= len(row):
                continue
            for spec_id in ids:
                statuses.setdefault(spec_id, set()).add(row[status_index].strip())
    return statuses


def completed_evidence_spec_ids(text: str) -> set[str]:
    completed: set[str] = set()
    for match in re.finditer(r"(?ms)(?:^## .+?\n)(.*?)(?=^## |\Z)", text):
        section = match.group(1)
        if "最终验证" not in section:
            continue
        if not re.search(r"PASS|passed|通过|No issues found", section, re.IGNORECASE):
            continue
        completed.update(SPEC_ID_RE.findall(section))
    return completed


def check_lifecycle_state_consistency(root: Path) -> None:
    offenders: list[str] = []
    planned_statuses = {"planned", "计划中"}
    for evidence_file in collect_tdd_evidence_files(root):
        completed_ids = completed_evidence_spec_ids(evidence_file.read_text(encoding="utf-8"))
        if not completed_ids:
            continue
        for spec_file in specs_for_evidence(root, evidence_file):
            statuses = traceability_statuses_by_spec(spec_file.read_text(encoding="utf-8"))
            for spec_id in sorted(completed_ids):
                if statuses.get(spec_id, set()) & planned_statuses:
                    offenders.append(f"{spec_file.relative_to(root)} keeps {spec_id} planned after completed evidence")

    if offenders:
        raise PreflightError("Lifecycle state is inconsistent: " + "; ".join(offenders) + ".")


def check_chinese_document_info_sections(root: Path) -> None:
    offenders: list[str] = []
    for path in collect_plan_files(root) + collect_technical_design_files(root):
        text = path.read_text(encoding="utf-8")
        missing_terms = [term for term in CHINESE_DOCUMENT_INFO_REQUIRED_TERMS if term not in text]
        if missing_terms:
            offenders.append(f"{path.relative_to(root)} missing {', '.join(missing_terms)}")

    if offenders:
        raise PreflightError("Document is missing Chinese metadata summary: " + "; ".join(offenders) + ".")


def markdown_section(text: str, heading: str) -> str | None:
    match = re.search(rf"^##[ \t]+{re.escape(heading)}[ \t]*$", text, re.MULTILINE)
    if match is None:
        return None

    next_match = re.search(r"^##[ \t]+", text[match.end() :], re.MULTILINE)
    if next_match is None:
        return text[match.start() :]
    return text[match.start() : match.end() + next_match.start()]


def check_technical_design_gap_review(root: Path) -> None:
    missing_section: list[str] = []
    incomplete: list[str] = []
    unresolved: list[str] = []

    for path in collect_technical_design_files(root):
        text = path.read_text(encoding="utf-8")
        section = markdown_section(text, "规格缺口审查")
        relative = str(path.relative_to(root))
        if section is None:
            missing_section.append(relative)
            continue

        missing_terms = [term for term in TECHNICAL_GAP_REVIEW_REQUIRED_TERMS if term not in section]
        if missing_terms:
            incomplete.append(f"{relative} missing {', '.join(missing_terms)}")
            continue

        unresolved_terms = [term for term in TECHNICAL_GAP_REVIEW_UNRESOLVED_TERMS if term in section]
        if unresolved_terms:
            unresolved.append(f"{relative} contains {', '.join(unresolved_terms)}")

    if missing_section:
        raise PreflightError("Technical design is missing spec gap review: " + ", ".join(missing_section) + ".")
    if incomplete:
        raise PreflightError("Technical design spec gap review is incomplete: " + "; ".join(incomplete) + ".")
    if unresolved:
        raise PreflightError("Technical design has unresolved spec gaps: " + "; ".join(unresolved) + ".")


def check_technical_design_required_sections(root: Path) -> None:
    offenders: list[str] = []
    for path in collect_technical_design_files(root):
        text = path.read_text(encoding="utf-8")
        missing = [section for section in TECHNICAL_DESIGN_REQUIRED_SECTIONS if markdown_section(text, section) is None]
        if missing:
            offenders.append(f"{path.relative_to(root)} missing {', '.join(missing)}")

    if offenders:
        raise PreflightError("Technical design is missing required section: " + "; ".join(offenders) + ".")


def approved_spec_files_for_feature(feature_root: Path) -> list[Path]:
    approved: list[Path] = []
    for spec_file in docs_index.feature_spec_files(feature_root):
        metadata = parse_frontmatter(spec_file.read_text(encoding="utf-8"))
        if metadata.get("status") == "approved":
            approved.append(spec_file)
    return approved


def required_spec_ids_from_specs(spec_files: list[Path]) -> set[str]:
    ids: set[str] = set()
    for spec_file in spec_files:
        for line in spec_file.read_text(encoding="utf-8").splitlines():
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if not cells or not line.lstrip().startswith("|"):
                continue
            if any(cell in {"必须", "MUST"} for cell in cells):
                ids.update(SPEC_ID_RE.findall(line))
    return ids


def technical_design_coverage_ids(technical_text: str) -> set[str]:
    ids: set[str] = set()
    for heading in TECHNICAL_DESIGN_REQUIRED_SECTIONS:
        section = markdown_section(technical_text, heading)
        if section:
            ids.update(SPEC_ID_RE.findall(section))
    return ids


def check_technical_design_must_spec_coverage(root: Path) -> None:
    offenders: list[str] = []
    for technical_file in collect_technical_design_files(root):
        feature_context = feature_root_for_document(root, technical_file)
        if feature_context is None:
            continue
        _feature, feature_root = feature_context
        required_ids = required_spec_ids_from_specs(approved_spec_files_for_feature(feature_root))
        if not required_ids:
            continue

        covered_ids = technical_design_coverage_ids(technical_file.read_text(encoding="utf-8"))
        missing = sorted(required_ids - covered_ids)
        if missing:
            offenders.append(f"{technical_file.relative_to(root)} -> {', '.join(missing)}")

    if offenders:
        raise PreflightError("Technical design does not cover required Spec IDs: " + "; ".join(offenders) + ".")


def frontmatter_list_values(text: str, key: str) -> list[str]:
    if not text.startswith("---\n"):
        return []
    end = text.find("\n---", 4)
    if end == -1:
        return []

    values: list[str] = []
    in_key = False
    for line in text[4:end].splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if line.startswith(" ") and in_key and stripped.startswith("- "):
            values.append(stripped[2:].strip().strip('"').strip("'"))
            continue
        if ":" in line and not line.startswith(" "):
            current_key, value = line.split(":", 1)
            in_key = current_key.strip() == key
            if in_key and value.strip():
                values.append(value.strip().strip('"').strip("'"))
    return values


def check_technical_design_related_metadata(root: Path) -> None:
    offenders: list[str] = []
    for technical_file in collect_technical_design_files(root):
        feature_context = feature_root_for_document(root, technical_file)
        if feature_context is None:
            continue
        _feature, feature_root = feature_context
        text = technical_file.read_text(encoding="utf-8")
        expected_by_key = {
            "related_specs": docs_index.feature_spec_files(feature_root),
            "related_technical": docs_index.feature_technical_implementation_files(feature_root),
            "related_test_cases": docs_index.feature_test_case_files(feature_root),
            "related_plans": docs_index.feature_plan_files(feature_root),
            "related_evidence": docs_index.feature_evidence_files(feature_root),
        }

        for key, expected_paths in expected_by_key.items():
            if not expected_paths:
                continue
            actual_values = set(frontmatter_list_values(text, key))
            expected_values = {str(path.relative_to(root)) for path in expected_paths}
            missing_values = sorted(expected_values - actual_values)
            missing_existing = sorted(
                value for value in actual_values if value.startswith("docs/coding-plugins/") and not (root / value).exists()
            )
            if missing_values:
                offenders.append(f"{technical_file.relative_to(root)} {key} missing {', '.join(missing_values)}")
            if missing_existing:
                offenders.append(
                    f"{technical_file.relative_to(root)} {key} references missing {', '.join(missing_existing)}"
                )

    if offenders:
        raise PreflightError("Technical design related metadata is invalid: " + "; ".join(offenders) + ".")


def check_technical_design_validator(root: Path) -> None:
    validator = load_technical_design_validator(root)
    result = validator.validate_repository(root, strict=True)
    if not result.ok:
        raise PreflightError("Technical design validation failed: " + "; ".join(result.errors) + ".")


def specs_for_feature_document(root: Path, document_file: Path) -> list[Path]:
    feature_context = feature_root_for_document(root, document_file)
    if feature_context is None:
        return []
    _feature, feature_root = feature_context
    return docs_index.feature_spec_files(feature_root)


def specs_for_evidence(root: Path, evidence_file: Path) -> list[Path]:
    return specs_for_feature_document(root, evidence_file)


def specs_for_technical_design(root: Path, technical_file: Path) -> list[Path]:
    return specs_for_feature_document(root, technical_file)


def check_document_spec_ids(
    root: Path,
    files: list[Path],
    specs_for_file: Callable[[Path, Path], list[Path]],
    label: str,
) -> None:
    offenders: list[str] = []
    for document_file in files:
        document_ids = set(SPEC_ID_RE.findall(document_file.read_text(encoding="utf-8")))
        if not document_ids:
            continue

        spec_files = specs_for_file(root, document_file)
        spec_ids: set[str] = set()
        for spec_file in spec_files:
            spec_ids.update(SPEC_ID_RE.findall(spec_file.read_text(encoding="utf-8")))

        missing = sorted(document_ids - spec_ids)
        if missing:
            offenders.append(f"{document_file.relative_to(root)} -> {', '.join(missing)}")

    if offenders:
        raise PreflightError(f"{label} references unknown Spec IDs: " + "; ".join(offenders) + ".")


def check_tdd_evidence_spec_ids(root: Path) -> None:
    check_document_spec_ids(
        root,
        collect_tdd_evidence_files(root),
        specs_for_evidence,
        "TDD evidence",
    )


def check_technical_design_spec_ids(root: Path) -> None:
    check_document_spec_ids(
        root,
        collect_technical_design_files(root),
        specs_for_technical_design,
        "Technical design",
    )


def extract_technical_design_paths(text: str) -> set[str]:
    return set(TECHNICAL_DESIGN_PATH_RE.findall(text))


def extract_technical_implementation_paths(text: str) -> set[str]:
    return set(TECHNICAL_IMPLEMENTATION_PATH_RE.findall(text))


def check_spec_technical_design_references(root: Path) -> None:
    missing: list[str] = []
    for spec_file in collect_spec_files(root):
        for relative_path in sorted(extract_technical_design_paths(spec_file.read_text(encoding="utf-8"))):
            if not (root / relative_path).exists():
                missing.append(f"{spec_file.relative_to(root)} -> {relative_path}")

    if missing:
        raise PreflightError("Spec references missing technical design: " + "; ".join(missing) + ".")


def check_spec_technical_implementation_references(root: Path) -> None:
    missing: list[str] = []
    for spec_file in collect_spec_files(root):
        for relative_path in sorted(extract_technical_implementation_paths(spec_file.read_text(encoding="utf-8"))):
            if not (root / relative_path).exists():
                missing.append(f"{spec_file.relative_to(root)} -> {relative_path}")

    if missing:
        raise PreflightError("Spec references missing technical implementation: " + "; ".join(missing) + ".")


def check_plan_technical_design_references(root: Path) -> None:
    offenders: list[str] = []
    missing: list[str] = []
    for plan_file in collect_plan_files(root):
        text = plan_file.read_text(encoding="utf-8")
        refs = sorted(extract_technical_design_paths(text))
        if "技术设计来源" not in text or not refs:
            offenders.append(str(plan_file.relative_to(root)))
            continue
        for relative_path in refs:
            if not (root / relative_path).exists():
                missing.append(f"{plan_file.relative_to(root)} -> {relative_path}")

    if offenders:
        raise PreflightError("Plan is missing 技术设计来源: " + ", ".join(offenders) + ".")
    if missing:
        raise PreflightError("Plan references missing technical design: " + "; ".join(missing) + ".")


def check_plan_technical_implementation_references(root: Path) -> None:
    offenders: list[str] = []
    missing: list[str] = []
    for plan_file in collect_plan_files(root):
        feature_context = feature_root_for_document(root, plan_file)
        if feature_context is None:
            continue
        _feature, feature_root = feature_context
        expected_paths = docs_index.feature_technical_implementation_files(feature_root)
        if not expected_paths:
            continue

        text = plan_file.read_text(encoding="utf-8")
        refs = sorted(extract_technical_implementation_paths(text))
        expected_values = {str(path.relative_to(root)) for path in expected_paths}
        if "技术实现来源" not in text or not expected_values <= set(refs):
            offenders.append(str(plan_file.relative_to(root)))
            continue
        for relative_path in refs:
            if not (root / relative_path).exists():
                missing.append(f"{plan_file.relative_to(root)} -> {relative_path}")

    if offenders:
        raise PreflightError("Plan is missing 技术实现来源: " + ", ".join(offenders) + ".")
    if missing:
        raise PreflightError("Plan references missing technical implementation: " + "; ".join(missing) + ".")


def check_documentation_path_references(root: Path) -> None:
    required_docs = (
        root / "README.md",
        root / "docs" / "installation.md",
        root / "docs" / "workflow-chain.md",
    )
    missing: list[str] = []
    for path in required_docs:
        text = path.read_text(encoding="utf-8") if path.exists() else ""
        for reference in DOC_SYNC_REFERENCES:
            if reference not in text:
                missing.append(f"{path.relative_to(root)} missing {reference}")

    if missing:
        raise PreflightError("Documentation is missing required path references: " + "; ".join(missing) + ".")


def collect_spec_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for feature_root in collect_feature_roots(root):
        files.extend(docs_index.feature_spec_files(feature_root))
    return sorted(files)


def collect_tdd_evidence_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for feature_root in collect_feature_roots(root):
        files.extend(docs_index.feature_evidence_files(feature_root))
    return sorted(files)


def collect_archived_evidence_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for feature_root in collect_feature_roots(root):
        files.extend(docs_index.feature_archived_evidence_files(feature_root))
    return sorted(files)


def collect_plan_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for feature_root in collect_feature_roots(root):
        files.extend(docs_index.feature_plan_files(feature_root))
    return sorted(files)


def collect_test_case_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for feature_root in collect_feature_roots(root):
        files.extend(docs_index.feature_test_case_files(feature_root))
    return sorted(files)


def collect_technical_design_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for feature_root in collect_feature_roots(root):
        files.extend(docs_index.feature_technical_design_files(feature_root))
    return sorted(files)


def collect_technical_implementation_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for feature_root in collect_feature_roots(root):
        files.extend(docs_index.feature_technical_implementation_files(feature_root))
    return sorted(files)


def check_artifact_index_covers_documents(root: Path) -> None:
    try:
        docs_index.check_artifact_index_covers_documents(root)
    except docs_index.DocsIndexError as error:
        raise PreflightError(str(error)) from error


def build_validation_commands(
    root: Path,
    spec_files: list[Path],
    tdd_evidence_files: list[Path],
) -> list[list[str]]:
    python = sys.executable
    commands = [
        [python, "-m", "unittest", "scripts/test_preflight.py"],
        [python, "-m", "unittest", "scripts/test_docs_index.py"],
        [python, "-m", "unittest", "scripts/test_document_contract_migration.py"],
        [python, "-m", "unittest", "scripts/test_manifest_checks.py"],
        [python, "-m", "unittest", "scripts/test_remote_audit.py"],
        [python, "-m", "unittest", "scripts/test_bump_version.py"],
        [python, "-m", "unittest", "scripts/test_prepare_release.py"],
        [python, "-m", "unittest", "tests.behavior.test_routing"],
        [python, "-m", "unittest", "skills/spec-driven-development/scripts/test_validate_spec.py"],
        [python, "-m", "unittest", "skills/spec-driven-development/scripts/test_scaffold_feature_docs.py"],
        [python, "-m", "unittest", "skills/test-driven-development/scripts/test_validate_tdd_evidence.py"],
        [python, "-m", "unittest", "skills/writing-technicals/scripts/test_validate_technicals.py"],
        ["bash", "tests/hooks/test-session-start.sh"],
    ]

    if spec_files:
        commands.append(
            [
                python,
                "skills/spec-driven-development/scripts/validate_spec.py",
                "--strict",
                *[str(path.relative_to(root)) for path in spec_files],
            ]
        )

    if tdd_evidence_files:
        commands.append(
            [
                python,
                "skills/test-driven-development/scripts/validate_tdd_evidence.py",
                "--strict",
                *[str(path.relative_to(root)) for path in tdd_evidence_files],
            ]
        )

    return commands


def run_commands(root: Path, commands: list[list[str]]) -> None:
    for command in commands:
        print("+ " + " ".join(command), flush=True)
        subprocess.run(command, cwd=root, check=True)


def run_static_checks(root: Path) -> None:
    check_required_plugin_files(root)
    check_manifest_versions(root)
    check_release_management_files(root)
    check_codex_hook_config_declared(root)
    check_manifest_asset_paths(root)
    check_skill_agent_metadata(root)
    check_legacy_docs_roots(root)
    check_feature_readmes(root)
    check_feature_readme_metadata_contract(root)
    check_feature_first_document_layout(root)
    check_feature_document_chain_closure(root)
    check_document_path_metadata(root)
    check_prd_related_metadata(root)
    check_document_sync_freshness(root)
    check_plan_metadata(root)
    check_evidence_metadata(root)
    check_archived_evidence_metadata(root)
    check_chinese_document_info_sections(root)
    check_technical_design_gap_review(root)
    check_technical_design_required_sections(root)
    check_technical_design_must_spec_coverage(root)
    check_technical_design_related_metadata(root)
    check_technical_design_validator(root)
    check_artifact_index_covers_documents(root)
    check_spec_technical_design_references(root)
    check_spec_technical_implementation_references(root)
    check_plan_technical_design_references(root)
    check_plan_technical_implementation_references(root)
    check_technical_design_spec_ids(root)
    check_tdd_evidence_spec_ids(root)
    check_lifecycle_state_consistency(root)
    check_documentation_path_references(root)
    check_removed_entry_references(root)
    check_sdd_templates_are_chinese(root)
    check_technical_templates_are_chinese(root)
    check_plan_templates_are_chinese(root)
    check_tdd_evidence_templates_are_chinese(root)
    check_technical_template_required_sections(root)


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    allowed_args = {"--write-index", "--check-external-references"}
    unknown_args = [arg for arg in args if arg not in allowed_args]
    if unknown_args:
        print("Usage: python3 scripts/preflight.py [--write-index] [--check-external-references]", file=sys.stderr)
        return 2

    root = repo_root()
    if "--write-index" in args:
        write_artifact_index(root)

    try:
        run_static_checks(root)
        if "--check-external-references" in args:
            check_external_references(root)
        run_commands(
            root,
            build_validation_commands(root, collect_spec_files(root), collect_tdd_evidence_files(root)),
        )
    except (PreflightError, subprocess.CalledProcessError) as error:
        print(f"Preflight failed: {error}", file=sys.stderr)
        return 1

    print("Preflight passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

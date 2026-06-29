#!/usr/bin/env python3
"""Run repository checks before publishing or pushing plugin changes."""

from __future__ import annotations

import re
import subprocess
import sys
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
)
SPEC_ID_RE = re.compile(r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)-\d{3,}\b")
TECHNICAL_DESIGN_PATH_RE = re.compile(
    r"docs/coding-plugins/features/[A-Za-z0-9_.\-/]+/technical/technical-design\.md"
)
PLAN_METADATA_REQUIRED_FIELDS = ("title", "status", "area", "capability", "created", "updated")
CHINESE_DOCUMENT_INFO_REQUIRED_TERMS = ("## 文档信息", "状态", "领域", "能力")
TECHNICAL_GAP_REVIEW_REQUIRED_TERMS = ("未覆盖需求", "验收标准", "外部行为", "处理状态")
TECHNICAL_GAP_REVIEW_UNRESOLVED_TERMS = ("未处理", "待处理", "需澄清", "不清楚", "待确认")
LIGHTWEIGHT_EXCEPTION_REQUIRED_TERMS = ("## 轻量例外", "Reason", "Verification")
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
    template_path = root / "skills" / "writing-technical-design" / "templates" / "technical-design.md"
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
    for legacy_name in ("specs", "technical", "plans", "evidence"):
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


def check_feature_first_document_layout(root: Path) -> None:
    offenders: list[str] = []
    for feature_root in collect_feature_roots(root):
        for flat_name in ("technical-design.md", "implementation.md"):
            flat_path = feature_root / flat_name
            if flat_path.exists():
                offenders.append(str(flat_path.relative_to(root)))

    if offenders:
        raise PreflightError(
            "Flat feature root document is no longer active; use technical/ or plans/: "
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


def check_feature_document_chain_closure(root: Path) -> None:
    offenders: list[str] = []
    for feature_root in collect_feature_roots(root):
        if not feature_has_approved_spec(feature_root):
            continue
        has_technical = bool(docs_index.feature_technical_design_files(feature_root))
        has_plan = bool(docs_index.feature_plan_files(feature_root))
        if has_technical and has_plan:
            continue
        if feature_has_lightweight_exception(feature_root):
            continue
        offenders.append(str(feature_root.relative_to(root)))

    if offenders:
        raise PreflightError(
            "Feature document chain is incomplete; add technical/plan or README lightweight exception: "
            + ", ".join(offenders)
            + "."
        )


def check_document_path_metadata(root: Path) -> None:
    mismatches: list[str] = []
    for label, files in (
        ("spec", collect_spec_files(root)),
        ("technical design", collect_technical_design_files(root)),
    ):
        for path in files:
            feature_context = feature_root_for_document(root, path)
            if feature_context is None:
                mismatches.append(f"{path.relative_to(root)} is not under features/<area>/<capability>/")
                continue
            path_area, path_capability, _feature_root = feature_context
            metadata = parse_frontmatter(path.read_text(encoding="utf-8"))
            if metadata.get("area") and metadata.get("area") != path_area:
                mismatches.append(f"{path.relative_to(root)} area={metadata.get('area')} path={path_area}")
            if metadata.get("capability") and metadata.get("capability") != path_capability:
                mismatches.append(
                    f"{path.relative_to(root)} capability={metadata.get('capability')} path={path_capability}"
                )

    for label, files in (
        ("plan", collect_plan_files(root)),
        ("evidence", collect_tdd_evidence_files(root)),
    ):
        for path in files:
            if feature_root_for_document(root, path) is None:
                mismatches.append(f"{path.relative_to(root)} is not under features/<area>/<capability>/")

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
            mismatches.append(f"{path.relative_to(root)} is not under features/<area>/<capability>/")
            continue
        path_area, path_capability, _feature_root = feature_context
        if metadata.get("area") != path_area:
            mismatches.append(f"{path.relative_to(root)} area={metadata.get('area')} path={path_area}")
        if metadata.get("capability") != path_capability:
            mismatches.append(f"{path.relative_to(root)} capability={metadata.get('capability')} path={path_capability}")

    if incomplete:
        raise PreflightError("Plan metadata is incomplete: " + "; ".join(incomplete) + ".")
    if mismatches:
        raise PreflightError("Plan metadata does not match path: " + "; ".join(mismatches) + ".")


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
    marker = f"## {heading}"
    start = text.find(marker)
    if start == -1:
        return None

    next_heading = text.find("\n## ", start + len(marker))
    if next_heading == -1:
        return text[start:]
    return text[start:next_heading]


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


def specs_for_area_capability(root: Path, document_root_name: str, document_file: Path) -> list[Path]:
    feature_context = feature_root_for_document(root, document_file)
    if feature_context is None:
        return []
    _area, _capability, feature_root = feature_context
    spec_dir = feature_root / "specs"
    if not spec_dir.exists():
        return []
    return sorted(path for path in spec_dir.rglob("*.md") if path.name != "INDEX.md")


def specs_for_evidence(root: Path, evidence_file: Path) -> list[Path]:
    return specs_for_area_capability(root, "evidence", evidence_file)


def specs_for_technical_design(root: Path, technical_file: Path) -> list[Path]:
    return specs_for_area_capability(root, "technical", technical_file)


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


def check_spec_technical_design_references(root: Path) -> None:
    missing: list[str] = []
    for spec_file in collect_spec_files(root):
        for relative_path in sorted(extract_technical_design_paths(spec_file.read_text(encoding="utf-8"))):
            if not (root / relative_path).exists():
                missing.append(f"{spec_file.relative_to(root)} -> {relative_path}")

    if missing:
        raise PreflightError("Spec references missing technical design: " + "; ".join(missing) + ".")


def check_plan_technical_design_references(root: Path) -> None:
    offenders: list[str] = []
    missing: list[str] = []
    for plan_file in collect_plan_files(root):
        text = plan_file.read_text(encoding="utf-8")
        refs = sorted(extract_technical_design_paths(text))
        if "Technical Design Source:" not in text or not refs:
            offenders.append(str(plan_file.relative_to(root)))
            continue
        for relative_path in refs:
            if not (root / relative_path).exists():
                missing.append(f"{plan_file.relative_to(root)} -> {relative_path}")

    if offenders:
        raise PreflightError("Plan is missing Technical Design Source: " + ", ".join(offenders) + ".")
    if missing:
        raise PreflightError("Plan references missing technical design: " + "; ".join(missing) + ".")


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
        specs_root = feature_root / "specs"
        if specs_root.exists():
            files.extend(path for path in specs_root.rglob("*.md") if path.name != "INDEX.md")
    return sorted(files)


def collect_tdd_evidence_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for feature_root in collect_feature_roots(root):
        evidence_root = feature_root / "evidence"
        if evidence_root.exists():
            files.extend(evidence_root.rglob("*.md"))
    return sorted(files)


def collect_plan_files(root: Path) -> list[Path]:
    return sorted(
        plan_path
        for plan_path in (feature_root / "plans" / "implementation.md" for feature_root in collect_feature_roots(root))
        if plan_path.exists()
    )


def collect_technical_design_files(root: Path) -> list[Path]:
    return sorted(
        design_path
        for design_path in (
            feature_root / "technical" / "technical-design.md" for feature_root in collect_feature_roots(root)
        )
        if design_path.exists()
    )


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
        [python, "-m", "unittest", "scripts/test_manifest_checks.py"],
        [python, "-m", "unittest", "scripts/test_remote_audit.py"],
        [python, "-m", "unittest", "scripts/test_bump_version.py"],
        [python, "-m", "unittest", "scripts/test_prepare_release.py"],
        [python, "-m", "unittest", "tests.behavior.test_routing"],
        [python, "-m", "unittest", "skills/spec-driven-development/scripts/test_validate_spec.py"],
        [python, "-m", "unittest", "skills/test-driven-development/scripts/test_validate_tdd_evidence.py"],
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
    check_feature_first_document_layout(root)
    check_feature_document_chain_closure(root)
    check_document_path_metadata(root)
    check_plan_metadata(root)
    check_chinese_document_info_sections(root)
    check_technical_design_gap_review(root)
    check_artifact_index_covers_documents(root)
    check_spec_technical_design_references(root)
    check_plan_technical_design_references(root)
    check_technical_design_spec_ids(root)
    check_tdd_evidence_spec_ids(root)
    check_documentation_path_references(root)
    check_removed_entry_references(root)
    check_sdd_templates_are_chinese(root)
    check_technical_templates_are_chinese(root)


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    unknown_args = [arg for arg in args if arg != "--write-index"]
    if unknown_args:
        print("Usage: python3 scripts/preflight.py [--write-index]", file=sys.stderr)
        return 2

    root = repo_root()
    if "--write-index" in args:
        write_artifact_index(root)

    try:
        run_static_checks(root)
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

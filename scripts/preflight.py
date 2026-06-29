#!/usr/bin/env python3
"""Run repository checks before publishing or pushing plugin changes."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Callable


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
ARTIFACT_INDEX_REQUIRED_COLUMNS = (
    "Area",
    "Capability",
    "Feature Root",
    "Spec",
    "Technical Design",
    "Implementation Plan",
    "Evidence",
    "Tags",
    "Updated",
)
SPEC_ID_RE = re.compile(r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)-\d{3,}\b")
TECHNICAL_DESIGN_PATH_RE = re.compile(r"docs/coding-plugins/features/[A-Za-z0-9_.\-/]+/technical-design\.md")
PLAN_METADATA_REQUIRED_FIELDS = ("title", "status", "area", "capability", "created", "updated")
CHINESE_DOCUMENT_INFO_REQUIRED_TERMS = ("## 文档信息", "状态", "领域", "能力")
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


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def check_manifest_versions(root: Path) -> None:
    codex_manifest = read_json(root / ".codex-plugin" / "plugin.json")
    claude_manifest = read_json(root / ".claude-plugin" / "plugin.json")
    codex_version = codex_manifest.get("version")
    claude_version = claude_manifest.get("version")

    if not codex_version or not claude_version:
        raise PreflightError("Both plugin manifests must define a version.")
    if codex_version != claude_version:
        raise PreflightError(f"Manifest versions differ: Codex={codex_version}, Claude={claude_version}.")


def current_manifest_version(root: Path) -> str:
    codex_manifest = read_json(root / ".codex-plugin" / "plugin.json")
    version = codex_manifest.get("version")
    if not isinstance(version, str) or not version.strip():
        raise PreflightError("Codex manifest must define a version.")
    return version


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
    codex_manifest = read_json(root / ".codex-plugin" / "plugin.json")
    if codex_manifest.get("hooks") != "./hooks/hooks-codex.json":
        raise PreflightError("Codex manifest must declare hooks: ./hooks/hooks-codex.json.")


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
    required = (
        root / ".codex-plugin" / "plugin.json",
        root / ".claude-plugin" / "plugin.json",
        root / "skills",
        root / "README.md",
    )
    missing = [str(path.relative_to(root)) for path in required if not path.exists()]
    if missing:
        raise PreflightError("Missing required plugin file(s): " + ", ".join(missing) + ".")


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


def normalize_manifest_asset_path(raw_path: object) -> str | None:
    if not isinstance(raw_path, str) or not raw_path.strip():
        return None
    return raw_path[2:] if raw_path.startswith("./") else raw_path


def check_manifest_asset_paths(root: Path) -> None:
    codex_manifest = read_json(root / ".codex-plugin" / "plugin.json")
    interface = codex_manifest.get("interface")
    if not isinstance(interface, dict):
        return

    asset_refs: list[tuple[str, str]] = []
    for field in ("composerIcon", "logo", "logoDark"):
        normalized = normalize_manifest_asset_path(interface.get(field))
        if normalized is not None:
            asset_refs.append((f"interface.{field}", normalized))

    screenshots = interface.get("screenshots", [])
    if isinstance(screenshots, list):
        for index, item in enumerate(screenshots):
            normalized = normalize_manifest_asset_path(item)
            if normalized is not None:
                asset_refs.append((f"interface.screenshots[{index}]", normalized))

    missing = [f"{field} -> {path}" for field, path in asset_refs if not (root / path).exists()]
    if missing:
        raise PreflightError("Manifest asset path does not exist: " + ", ".join(missing) + ".")


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---", 4)
    if end == -1:
        return {}

    metadata: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = value.strip().strip('"').strip("'")
    return metadata


def feature_docs_root(root: Path) -> Path:
    return root / "docs" / "coding-plugins" / "features"


def collect_feature_roots(root: Path) -> list[Path]:
    features_root = feature_docs_root(root)
    if not features_root.exists():
        return []

    feature_roots: list[Path] = []
    for area_dir in sorted(path for path in features_root.iterdir() if path.is_dir()):
        for capability_dir in sorted(path for path in area_dir.iterdir() if path.is_dir()):
            feature_roots.append(capability_dir)
    return feature_roots


def feature_root_for_document(root: Path, path: Path) -> tuple[str, str, Path] | None:
    try:
        relative_parts = path.relative_to(feature_docs_root(root)).parts
    except ValueError:
        return None
    if len(relative_parts) < 2:
        return None
    area, capability = relative_parts[0], relative_parts[1]
    return area, capability, feature_docs_root(root) / area / capability


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
        for plan_path in (feature_root / "implementation.md" for feature_root in collect_feature_roots(root))
        if plan_path.exists()
    )


def collect_technical_design_files(root: Path) -> list[Path]:
    return sorted(
        design_path
        for design_path in (feature_root / "technical-design.md" for feature_root in collect_feature_roots(root))
        if design_path.exists()
    )


def parse_markdown_table_headers(text: str) -> list[str]:
    lines = text.splitlines()
    for index, line in enumerate(lines[:-1]):
        if not line.lstrip().startswith("|"):
            continue
        headers = [cell.strip() for cell in line.strip().strip("|").split("|")]
        separator = [cell.strip() for cell in lines[index + 1].strip().strip("|").split("|")]
        if separator and all(cell.replace(":", "").strip("-") == "" and "---" in cell for cell in separator):
            return headers
    return []


def parse_chinese_document_info(text: str) -> dict[str, str]:
    info: dict[str, str] = {}
    for line in text.splitlines():
        if not line.lstrip().startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 2:
            continue
        key, value = cells[0], cells[1]
        if key in {"字段", "---"} or set(key) <= {"-", ":"}:
            continue
        info[key] = value
    return info


def relative_markdown_path(root: Path, path: Path) -> str:
    return str(path.relative_to(root))


def format_index_path_cell(root: Path, paths: list[Path]) -> str:
    if not paths:
        return "-"
    return "<br>".join(f"`{relative_markdown_path(root, path)}`" for path in paths)


def feature_spec_files(feature_root: Path) -> list[Path]:
    specs_root = feature_root / "specs"
    if not specs_root.exists():
        return []
    return sorted(path for path in specs_root.rglob("*.md") if path.name != "INDEX.md")


def feature_evidence_files(feature_root: Path) -> list[Path]:
    evidence_root = feature_root / "evidence"
    if not evidence_root.exists():
        return []
    return sorted(evidence_root.rglob("*.md"))


def feature_technical_design_files(feature_root: Path) -> list[Path]:
    path = feature_root / "technical-design.md"
    return [path] if path.exists() else []


def feature_plan_files(feature_root: Path) -> list[Path]:
    path = feature_root / "implementation.md"
    return [path] if path.exists() else []


def feature_tags(feature_root: Path) -> str:
    readme = feature_root / "README.md"
    if not readme.exists():
        return "-"
    metadata = parse_chinese_document_info(readme.read_text(encoding="utf-8"))
    return metadata.get("标签", "").strip() or "-"


def feature_updated(feature_root: Path) -> str:
    updated_values: list[str] = []
    for path in (
        feature_spec_files(feature_root)
        + feature_technical_design_files(feature_root)
        + feature_plan_files(feature_root)
    ):
        updated = parse_frontmatter(path.read_text(encoding="utf-8")).get("updated")
        if updated:
            updated_values.append(updated)
    return max(updated_values) if updated_values else "-"


def render_artifact_index(root: Path) -> str:
    lines = [
        "# Coding Plugins Feature 索引",
        "",
        "本索引用于按 `Area` 和 `Capability` 检索 feature-first 文档链路。运行 `python3 scripts/preflight.py --write-index` 可根据 feature root 重新生成本文件。",
        "",
        "| Area | Capability | Feature Root | Spec | Technical Design | Implementation Plan | Evidence | Tags | Updated |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]

    for feature_root in collect_feature_roots(root):
        feature_context = feature_root_for_document(root, feature_root / "README.md")
        if feature_context is None:
            continue
        area, capability, _feature_root = feature_context
        lines.append(
            "| "
            + " | ".join(
                (
                    area,
                    capability,
                    f"`{relative_markdown_path(root, feature_root)}`",
                    format_index_path_cell(root, feature_spec_files(feature_root)),
                    format_index_path_cell(root, feature_technical_design_files(feature_root)),
                    format_index_path_cell(root, feature_plan_files(feature_root)),
                    format_index_path_cell(root, feature_evidence_files(feature_root)),
                    feature_tags(feature_root),
                    feature_updated(feature_root),
                )
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "Rules:",
            "",
            "- `Area` 和 `Capability` 必须和 `Feature Root` 路径一致。",
            "- `Feature Root` 指向 `docs/coding-plugins/features/<area>/<capability>`。",
            "- `Spec` 指向该 capability 的规格文件；有多个规格时在同一个单元格用 `<br>` 分隔。",
            "- `Technical Design` 指向默认技术设计 `docs/coding-plugins/features/<area>/<capability>/technical-design.md`；没有技术设计时使用 `-`。",
            "- `Implementation Plan` 指向默认实现计划 `docs/coding-plugins/features/<area>/<capability>/implementation.md`；没有计划时使用 `-`。",
            "- `Evidence` 指向该 capability 的 evidence 文件；有多个 evidence 时在同一个单元格用 `<br>` 分隔；没有 evidence 时使用 `-`。",
            "- `Tags` 来自 feature README 的 `标签` 行；日期来自规格、技术设计或计划 frontmatter 的最大 `updated` 值。",
        ]
    )
    return "\n".join(lines) + "\n"


def write_artifact_index(root: Path) -> None:
    index_path = root / "docs" / "coding-plugins" / "INDEX.md"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(render_artifact_index(root), encoding="utf-8")


def check_artifact_index_covers_documents(root: Path) -> None:
    feature_roots = collect_feature_roots(root)
    documents = (
        collect_spec_files(root)
        + collect_technical_design_files(root)
        + collect_plan_files(root)
        + collect_tdd_evidence_files(root)
    )
    if not feature_roots and not documents:
        return

    index_path = root / "docs" / "coding-plugins" / "INDEX.md"
    if not index_path.exists():
        raise PreflightError("Missing artifact index: docs/coding-plugins/INDEX.md.")

    text = index_path.read_text(encoding="utf-8")
    headers = parse_markdown_table_headers(text)
    missing_columns = [column for column in ARTIFACT_INDEX_REQUIRED_COLUMNS if column not in headers]
    if missing_columns:
        raise PreflightError("Artifact index is missing required columns: " + ", ".join(missing_columns) + ".")

    expected_paths = [str(path.relative_to(root)) for path in feature_roots] + [
        str(path.relative_to(root)) for path in documents
    ]
    missing_paths = [path for path in expected_paths if path not in text]
    if missing_paths:
        raise PreflightError("Artifact index is missing document paths: " + ", ".join(missing_paths) + ".")

    expected_text = render_artifact_index(root)
    if text != expected_text:
        raise PreflightError(
            "Artifact index does not match generated content. Run `python3 scripts/preflight.py --write-index`."
        )


def build_validation_commands(
    root: Path,
    spec_files: list[Path],
    tdd_evidence_files: list[Path],
) -> list[list[str]]:
    python = sys.executable
    commands = [
        [python, "-m", "unittest", "scripts/test_preflight.py"],
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
    check_document_path_metadata(root)
    check_plan_metadata(root)
    check_chinese_document_info_sections(root)
    check_artifact_index_covers_documents(root)
    check_spec_technical_design_references(root)
    check_plan_technical_design_references(root)
    check_technical_design_spec_ids(root)
    check_tdd_evidence_spec_ids(root)
    check_documentation_path_references(root)
    check_removed_entry_references(root)
    check_sdd_templates_are_chinese(root)


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

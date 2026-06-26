#!/usr/bin/env python3
"""Run repository checks before publishing or pushing plugin changes."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


class PreflightError(RuntimeError):
    """Raised when a local repository invariant fails."""


TEXT_SUFFIXES = {
    ".json",
    ".md",
    ".py",
    ".sh",
    ".svg",
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
ARTIFACT_INDEX_REQUIRED_COLUMNS = ("Area", "Capability", "Spec", "Plan", "Evidence", "Tags", "Updated")
SPEC_ID_RE = re.compile(r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)-\d{3,}\b")
DOC_SYNC_REFERENCES = (
    "docs/coding-plugins/INDEX.md",
    "hooks/hooks-codex.json",
    ".version-bump.json",
    "RELEASE-NOTES.md",
    "scripts/bump_version.py",
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
    for path in iter_text_files(root):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in REMOVED_ENTRY_PATTERNS:
            if pattern in text:
                offenders.append(str(path.relative_to(root)))
                break

    if offenders:
        joined = ", ".join(offenders)
        raise PreflightError(f"Removed entry reference found in: {joined}.")


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


def check_document_path_metadata(root: Path) -> None:
    mismatches: list[str] = []
    specs_root = root / "docs" / "coding-plugins" / "specs"
    for path in collect_spec_files(root):
        relative_parts = path.relative_to(specs_root).parts
        if len(relative_parts) < 3:
            mismatches.append(f"{path.relative_to(root)} is not under specs/<area>/<capability>/")
            continue
        path_area, path_capability = relative_parts[0], relative_parts[1]
        metadata = parse_frontmatter(path.read_text(encoding="utf-8"))
        if metadata.get("area") and metadata.get("area") != path_area:
            mismatches.append(f"{path.relative_to(root)} area={metadata.get('area')} path={path_area}")
        if metadata.get("capability") and metadata.get("capability") != path_capability:
            mismatches.append(
                f"{path.relative_to(root)} capability={metadata.get('capability')} path={path_capability}"
            )

    for root_name, files in (
        ("plans", collect_plan_files(root)),
        ("evidence", collect_tdd_evidence_files(root)),
    ):
        docs_root = root / "docs" / "coding-plugins" / root_name
        for path in files:
            relative_parts = path.relative_to(docs_root).parts
            if len(relative_parts) < 3:
                mismatches.append(f"{path.relative_to(root)} is not under {root_name}/<area>/<capability>/")

    if mismatches:
        raise PreflightError("Spec metadata does not match path: " + "; ".join(mismatches) + ".")


def specs_for_evidence(root: Path, evidence_file: Path) -> list[Path]:
    evidence_root = root / "docs" / "coding-plugins" / "evidence"
    relative_parts = evidence_file.relative_to(evidence_root).parts
    if len(relative_parts) < 3:
        return []
    area, capability = relative_parts[0], relative_parts[1]
    spec_dir = root / "docs" / "coding-plugins" / "specs" / area / capability
    if not spec_dir.exists():
        return []
    return sorted(path for path in spec_dir.rglob("*.md") if path.name != "INDEX.md")


def check_tdd_evidence_spec_ids(root: Path) -> None:
    offenders: list[str] = []
    for evidence_file in collect_tdd_evidence_files(root):
        evidence_ids = set(SPEC_ID_RE.findall(evidence_file.read_text(encoding="utf-8")))
        if not evidence_ids:
            continue

        spec_files = specs_for_evidence(root, evidence_file)
        spec_ids: set[str] = set()
        for spec_file in spec_files:
            spec_ids.update(SPEC_ID_RE.findall(spec_file.read_text(encoding="utf-8")))

        missing = sorted(evidence_ids - spec_ids)
        if missing:
            offenders.append(f"{evidence_file.relative_to(root)} -> {', '.join(missing)}")

    if offenders:
        raise PreflightError("TDD evidence references unknown Spec IDs: " + "; ".join(offenders) + ".")


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
    specs_root = root / "docs" / "coding-plugins" / "specs"
    if not specs_root.exists():
        return []
    return sorted(path for path in specs_root.rglob("*.md") if path.name != "INDEX.md")


def collect_tdd_evidence_files(root: Path) -> list[Path]:
    evidence_root = root / "docs" / "coding-plugins" / "evidence"
    if not evidence_root.exists():
        return []
    return sorted(evidence_root.rglob("*.md"))


def collect_plan_files(root: Path) -> list[Path]:
    plans_root = root / "docs" / "coding-plugins" / "plans"
    if not plans_root.exists():
        return []
    return sorted(plans_root.rglob("*.md"))


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


def check_artifact_index_covers_documents(root: Path) -> None:
    documents = collect_spec_files(root) + collect_plan_files(root) + collect_tdd_evidence_files(root)
    if not documents:
        return

    index_path = root / "docs" / "coding-plugins" / "INDEX.md"
    if not index_path.exists():
        raise PreflightError("Missing artifact index: docs/coding-plugins/INDEX.md.")

    text = index_path.read_text(encoding="utf-8")
    headers = parse_markdown_table_headers(text)
    missing_columns = [column for column in ARTIFACT_INDEX_REQUIRED_COLUMNS if column not in headers]
    if missing_columns:
        raise PreflightError("Artifact index is missing required columns: " + ", ".join(missing_columns) + ".")

    missing_paths = [str(path.relative_to(root)) for path in documents if str(path.relative_to(root)) not in text]
    if missing_paths:
        raise PreflightError("Artifact index is missing document paths: " + ", ".join(missing_paths) + ".")


def build_validation_commands(
    root: Path,
    spec_files: list[Path],
    tdd_evidence_files: list[Path],
) -> list[list[str]]:
    python = sys.executable
    commands = [
        [python, "-m", "unittest", "scripts/test_preflight.py"],
        [python, "-m", "unittest", "scripts/test_bump_version.py"],
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
    check_document_path_metadata(root)
    check_artifact_index_covers_documents(root)
    check_tdd_evidence_spec_ids(root)
    check_documentation_path_references(root)
    check_removed_entry_references(root)
    check_sdd_templates_are_chinese(root)


def main() -> int:
    root = repo_root()
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

#!/usr/bin/env python3
"""Run repository checks before publishing or pushing plugin changes."""

from __future__ import annotations

import json
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


def collect_spec_files(root: Path) -> list[Path]:
    specs_root = root / "docs" / "coding-plugins" / "specs"
    if not specs_root.exists():
        return []
    return sorted(path for path in specs_root.rglob("*.md") if path.name != "INDEX.md")


def build_validation_commands(root: Path, spec_files: list[Path]) -> list[list[str]]:
    python = sys.executable
    commands = [
        [python, "-m", "unittest", "scripts/test_preflight.py"],
        [python, "-m", "unittest", "skills/spec-driven-development/scripts/test_validate_spec.py"],
        [python, "-m", "unittest", "skills/test-driven-development/scripts/test_validate_tdd_evidence.py"],
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

    return commands


def run_commands(root: Path, commands: list[list[str]]) -> None:
    for command in commands:
        print("+ " + " ".join(command), flush=True)
        subprocess.run(command, cwd=root, check=True)


def run_static_checks(root: Path) -> None:
    check_required_plugin_files(root)
    check_manifest_versions(root)
    check_removed_entry_references(root)


def main() -> int:
    root = repo_root()
    try:
        run_static_checks(root)
        run_commands(root, build_validation_commands(root, collect_spec_files(root)))
    except (PreflightError, subprocess.CalledProcessError) as error:
        print(f"Preflight failed: {error}", file=sys.stderr)
        return 1

    print("Preflight passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

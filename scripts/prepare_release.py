#!/usr/bin/env python3
"""Prepare release metadata for local tag flow and GitHub Releases."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

import bump_version


@dataclass(frozen=True)
class ReleaseMetadata:
    version: str
    tag_name: str
    notes: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare coding-plugins release metadata.")
    parser.add_argument("--root", default=".", help="Repository root. Defaults to the current directory.")
    parser.add_argument("--version", help="Expected release version. Defaults to the Codex manifest version.")
    parser.add_argument("--notes-out", help="Write the current release notes section to this path.")
    parser.add_argument("--github-output", help="Append version and tag outputs to a GitHub Actions output file.")
    parser.add_argument("--skip-git-checks", action="store_true", help="Only validate metadata and skip git status checks.")
    parser.add_argument("--allow-dirty", action="store_true", help="Allow a dirty working tree during local checks.")
    return parser.parse_args()


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def tag_name_for_version(version: str) -> str:
    bump_version.validate_version(version)
    return f"v{version}"


def extract_release_notes_section(text: str, version: str) -> str:
    heading = re.compile(rf"^##\s+{re.escape(version)}(?:\s+-[^\n]+)?\s*$", re.MULTILINE)
    match = heading.search(text)
    if match is None:
        raise ValueError(f"Release notes section not found for version: {version}")

    next_heading = re.search(r"^##\s+", text[match.end() :], re.MULTILINE)
    end = match.end() + next_heading.start() if next_heading else len(text)
    notes = text[match.end() : end].strip()
    if not notes:
        raise ValueError(f"Release notes section is empty for version: {version}")
    return notes


def manifest_version(root: Path) -> str:
    codex = read_json(root / ".codex-plugin" / "plugin.json")
    version = codex.get("version")
    if not isinstance(version, str) or not version.strip():
        raise ValueError("Codex manifest must define a non-empty version.")
    bump_version.validate_version(version)
    return version


def validate_release_metadata(root: Path, expected_version: str | None = None) -> ReleaseMetadata:
    root = root.resolve()
    version = manifest_version(root)
    if expected_version is not None and expected_version != version:
        raise ValueError(f"Expected version {expected_version}, but manifest version is {version}.")

    claude = read_json(root / ".claude-plugin" / "plugin.json")
    config = read_json(root / ".version-bump.json")
    if claude.get("version") != version:
        raise ValueError(f"Claude manifest version differs from Codex manifest: {claude.get('version')} != {version}.")
    if config.get("version") != version:
        raise ValueError(f"Version bump config version differs from manifest: {config.get('version')} != {version}.")

    release_notes = (root / "RELEASE-NOTES.md").read_text(encoding="utf-8")
    return ReleaseMetadata(
        version=version,
        tag_name=tag_name_for_version(version),
        notes=extract_release_notes_section(release_notes, version),
    )


def run_git(root: Path, *args: str) -> str:
    completed = subprocess.run(
        ["git", *args],
        cwd=root,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return completed.stdout.strip()


def validate_git_release_state(root: Path, tag_name: str, allow_dirty: bool = False) -> None:
    try:
        run_git(root, "rev-parse", "--is-inside-work-tree")
    except subprocess.CalledProcessError as error:
        raise ValueError("Release preparation must run inside a git repository.") from error

    if not allow_dirty and run_git(root, "status", "--short"):
        raise ValueError("Working tree must be clean before preparing a release tag.")

    existing_tag = subprocess.run(
        ["git", "rev-parse", "--verify", "--quiet", f"refs/tags/{tag_name}"],
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if existing_tag.returncode == 0:
        raise ValueError(f"Release tag already exists: {tag_name}")


def write_github_output(path: Path, metadata: ReleaseMetadata) -> None:
    with path.open("a", encoding="utf-8") as output:
        output.write(f"version={metadata.version}\n")
        output.write(f"tag={metadata.tag_name}\n")


def main() -> int:
    args = parse_args()
    root = Path(args.root)
    try:
        metadata = validate_release_metadata(root, args.version)
        if not args.skip_git_checks:
            validate_git_release_state(root.resolve(), metadata.tag_name, allow_dirty=args.allow_dirty)
        if args.notes_out:
            Path(args.notes_out).write_text(metadata.notes + "\n", encoding="utf-8")
        if args.github_output:
            write_github_output(Path(args.github_output), metadata)
    except (OSError, ValueError, json.JSONDecodeError, subprocess.CalledProcessError) as error:
        print(f"Release preparation failed: {error}")
        return 1

    print(f"Release ready: {metadata.tag_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

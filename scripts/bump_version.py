#!/usr/bin/env python3
"""Synchronize plugin manifest versions for release preparation."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\."
    r"(0|[1-9]\d*)\."
    r"(0|[1-9]\d*)"
    r"(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\."
    r"(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?"
    r"(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bump coding-plugins manifest versions.")
    parser.add_argument("version", help="Strict semver version, for example 0.6.16.")
    parser.add_argument("--root", default=".", help="Repository root. Defaults to the current directory.")
    return parser.parse_args()


def validate_version(version: str) -> None:
    if SEMVER_RE.fullmatch(version) is None:
        raise ValueError(f"Version must be strict semver: {version}")


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict[str, object]) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_versions(root: Path, version: str) -> None:
    validate_version(version)
    root = root.resolve()
    config_path = root / ".version-bump.json"
    config = read_json(config_path)
    files = config.get("files")
    if not isinstance(files, list):
        raise ValueError(".version-bump.json must define a files array.")

    for entry in files:
        if not isinstance(entry, dict):
            raise ValueError(".version-bump.json files entries must be objects.")
        relative_path = entry.get("path")
        field = entry.get("field", "version")
        if not isinstance(relative_path, str) or not isinstance(field, str):
            raise ValueError(".version-bump.json files entries require string path and field.")
        path = root / relative_path
        data = read_json(path)
        data[field] = version
        write_json(path, data)


def main() -> int:
    args = parse_args()
    try:
        update_versions(Path(args.root), args.version)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"Version bump failed: {error}")
        return 1

    print(f"Version bumped to {args.version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

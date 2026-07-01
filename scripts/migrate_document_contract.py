#!/usr/bin/env python3
"""Migrate Coding Plugins feature documents to the current metadata contract."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import document_metadata


SPEC_ID_RE = re.compile(r"\b(?:REQ|API|SCHEMA|STATE|ERR|AC|NFR|MIG|OBS|NON)(?:-[A-Z0-9]+)*-\d{3,}\b")
STATUS_ALIASES = {
    "已实现": "covered",
    "完成": "covered",
    "implemented": "covered",
    "done": "covered",
}
DEFAULT_DATE = "2026-07-01"


def feature_context(path: Path) -> str | None:
    parts = path.parts
    try:
        index = parts.index("features")
    except ValueError:
        return None
    if len(parts) <= index + 1:
        return None
    return parts[index + 1]


def migrate_body_status_aliases(body: str) -> str:
    for old, new in STATUS_ALIASES.items():
        body = body.replace(f"| {old} |", f"| {new} |")
        body = body.replace(f"| {old}\n", f"| {new}\n")
    return body


def migrate_file(path: Path, dry_run: bool = False) -> bool:
    original = path.read_text(encoding="utf-8")
    lines, body = document_metadata.split_frontmatter(original)
    frontmatter = document_metadata.parse_frontmatter_block(lines)
    scalars = dict(frontmatter.scalars)
    lists = {key: list(values) for key, values in frontmatter.lists.items()}
    order = list(frontmatter.order)
    context = feature_context(path)
    changed = False

    if context and path.name == "tdd-evidence.md":
        defaults = {
            "title": f"{context} TDD Evidence",
            "status": "active",
            "feature": context,
            "created": DEFAULT_DATE,
            "updated": DEFAULT_DATE,
        }
        for key, value in defaults.items():
            if not scalars.get(key):
                scalars[key] = value
                changed = True

    if scalars.get("status") in STATUS_ALIASES:
        scalars["status"] = STATUS_ALIASES[scalars["status"]]
        changed = True

    related_specs = lists.get("related_specs", [])
    if related_specs:
        path_values = [value for value in related_specs if not SPEC_ID_RE.fullmatch(value)]
        id_values = [value for value in related_specs if SPEC_ID_RE.fullmatch(value)]
        if id_values:
            lists["related_specs"] = path_values
            existing_ids = lists.get("related_spec_ids", [])
            lists["related_spec_ids"] = list(dict.fromkeys(existing_ids + id_values))
            if "related_spec_ids" not in order:
                related_index = order.index("related_specs") + 1 if "related_specs" in order else len(order)
                order.insert(related_index, "related_spec_ids")
            changed = True

    migrated_body = migrate_body_status_aliases(body)
    if migrated_body != body:
        body = migrated_body
        changed = True

    if not lines and (scalars or lists):
        order = list(scalars) + [key for key in lists if key not in scalars]
        changed = True

    if not changed:
        return False

    migrated_frontmatter = document_metadata.Frontmatter(scalars=scalars, lists=lists, order=order)
    migrated = document_metadata.render_frontmatter_block(migrated_frontmatter) + "\n" + body
    if migrated != original and not dry_run:
        path.write_text(migrated, encoding="utf-8")
    return migrated != original


def migrate_root(root: Path, dry_run: bool = False) -> bool:
    features = root / "docs" / "coding-plugins" / "features"
    if not features.exists():
        return False
    changed = False
    for path in sorted(features.rglob("*.md")):
        changed = migrate_file(path, dry_run=dry_run) or changed
    return changed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate Coding Plugins document metadata.")
    parser.add_argument("--root", default=".", help="Repository root. Defaults to current directory.")
    parser.add_argument("--dry-run", action="store_true", help="Report whether changes are needed without writing.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    changed = migrate_root(Path(args.root), dry_run=args.dry_run)
    print("Migration changes needed." if changed else "Document contract is already current.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Inspect Coding Plugins feature document workflow state."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


ARTIFACTS: tuple[tuple[str, str], ...] = (
    ("PRD", "requirements"),
    ("TDD", "technicals"),
    ("TID", "technicals"),
    ("TCD", "test-cases"),
    ("IPD", "plans"),
    ("TED", "evidences"),
)
UPSTREAM_ARTIFACTS = ("PRD", "TDD", "TID", "TCD")
ARTIFACT_DIRS = dict(ARTIFACTS)


def artifact_path(root: Path, *, feature: str, doc_id: str, suffix: str) -> Path:
    directory = ARTIFACT_DIRS[suffix]
    return root / "docs" / "coding-plugins" / "features" / feature / directory / f"{doc_id}-{suffix}.md"


def split_frontmatter(text: str) -> tuple[list[str], str]:
    if not text.startswith("---\n"):
        return [], text
    end = text.find("\n---", 4)
    if end == -1:
        return [], text
    return text[4:end].splitlines(), text[end + len("\n---") :].lstrip("\n")


def parse_frontmatter(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    lines, _body = split_frontmatter(path.read_text(encoding="utf-8"))
    metadata: dict[str, str] = {}
    for line in lines:
        if not line or line.startswith(" ") or ":" not in line:
            continue
        key, value = line.split(":", 1)
        value = value.strip().strip('"').strip("'")
        if value:
            metadata[key.strip()] = value
    return metadata


def compute_upstream_hash(root: Path, *, feature: str, doc_id: str) -> str | None:
    digest = hashlib.sha256()
    has_content = False
    for suffix in UPSTREAM_ARTIFACTS:
        path = artifact_path(root, feature=feature, doc_id=doc_id, suffix=suffix)
        if not path.exists():
            continue
        relative = path.relative_to(root).as_posix()
        digest.update(relative.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
        has_content = True
    if not has_content:
        return None
    return f"sha256:{digest.hexdigest()}"


def artifact_summary(root: Path, *, feature: str, doc_id: str) -> dict[str, dict[str, Any]]:
    summary: dict[str, dict[str, Any]] = {}
    for suffix, _directory in ARTIFACTS:
        path = artifact_path(root, feature=feature, doc_id=doc_id, suffix=suffix)
        metadata = parse_frontmatter(path)
        summary[suffix] = {
            "path": path.relative_to(root).as_posix(),
            "exists": path.exists(),
            "status": metadata.get("status"),
        }
        if suffix == "IPD":
            summary[suffix]["source_hash"] = metadata.get("source_hash")
    return summary


def approved(summary: dict[str, dict[str, Any]], suffix: str) -> bool:
    return summary[suffix]["status"] == "approved"


def inspect_document_chain(root: Path | str, *, feature: str, doc_id: str) -> dict[str, Any]:
    root = Path(root)
    artifacts = artifact_summary(root, feature=feature, doc_id=doc_id)
    missing = [suffix for suffix, data in artifacts.items() if not data["exists"]]
    chain_hash = compute_upstream_hash(root, feature=feature, doc_id=doc_id)
    ipd_source_hash = artifacts["IPD"].get("source_hash")

    result: dict[str, Any] = {
        "feature": feature,
        "doc_id": doc_id,
        "artifacts": artifacts,
        "missing_artifacts": missing,
        "chain_hash": chain_hash,
        "plan_source_hash": ipd_source_hash,
        "stale": False,
        "state": "unknown",
        "next_skill": "using-coding-plugins",
        "reason": "",
    }

    if missing == [suffix for suffix, _directory in ARTIFACTS]:
        result.update(
            state="not-started",
            next_skill="spec-driven-development",
            reason="no feature document chain exists",
        )
        return result

    if "PRD" in missing:
        result.update(state="requirements-missing", next_skill="writing-requirements", reason="PRD is missing")
        return result
    if not approved(artifacts, "PRD"):
        result.update(state="requirements-draft", next_skill="writing-requirements", reason="PRD is not approved")
        return result

    if "TDD" in missing or "TID" in missing:
        result.update(state="ready-for-technicals", next_skill="writing-technicals", reason="TDD or TID is missing")
        return result
    if not approved(artifacts, "TDD") or not approved(artifacts, "TID"):
        result.update(state="technicals-draft", next_skill="writing-technicals", reason="TDD or TID is not approved")
        return result

    if "TCD" in missing:
        result.update(state="ready-for-test-cases", next_skill="writing-test-cases", reason="TCD is missing")
        return result
    if not approved(artifacts, "TCD"):
        result.update(state="test-cases-draft", next_skill="writing-test-cases", reason="TCD is not approved")
        return result

    if "IPD" in missing:
        result.update(state="ready-for-plan", next_skill="writing-plans", reason="upstream documents are approved")
        return result

    if ipd_source_hash and chain_hash and ipd_source_hash != chain_hash:
        result.update(
            state="plan-stale",
            next_skill="writing-plans",
            stale=True,
            reason="source_hash does not match current upstream chain",
        )
        return result

    result.update(
        state="ready-for-execution",
        next_skill="using-git-worktrees",
        reason="IPD exists and upstream chain is current",
    )
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Inspect Coding Plugins feature workflow state.")
    parser.add_argument("command", choices=("inspect", "hash"))
    parser.add_argument("--root", default=".", help="Repository root. Defaults to current directory.")
    parser.add_argument("--feature", required=True)
    parser.add_argument("--doc-id", required=True)
    parser.add_argument("--json", action="store_true", help="Print JSON output.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = Path(args.root)
    if args.command == "hash":
        value = compute_upstream_hash(root, feature=args.feature, doc_id=args.doc_id)
        print(value or "null")
        return 0

    result = inspect_document_chain(root, feature=args.feature, doc_id=args.doc_id)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"state: {result['state']}")
        print(f"next_skill: {result['next_skill']}")
        print(f"reason: {result['reason']}")
        print(f"chain_hash: {result['chain_hash'] or 'null'}")
        print(f"plan_source_hash: {result['plan_source_hash'] or 'null'}")
        print(f"missing_artifacts: {', '.join(result['missing_artifacts']) or '-'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

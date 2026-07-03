#!/usr/bin/env python3
"""Guard Coding Plugins workflow transitions from document-chain state."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import workflow_state


VALID_TARGETS = {"plan", "execute"}


def check(root: Path | str, *, feature: str, doc_id: str, target: str) -> dict[str, Any]:
    if target not in VALID_TARGETS:
        raise ValueError(f"invalid workflow guard target: {target}")

    state = workflow_state.inspect_document_chain(root, feature=feature, doc_id=doc_id)
    allowed_states = {
        "plan": {"ready-for-plan"},
        "execute": {"ready-for-execution"},
    }[target]
    passed = state["state"] in allowed_states and not state["stale"]

    failures: list[str] = []
    if not passed:
        if state["missing_artifacts"]:
            failures.append(f"missing artifacts: {', '.join(state['missing_artifacts'])}")
        if state["state"] == "plan-unlocked":
            failures.append("IPD source_hash is missing")
        if state["stale"]:
            failures.append("IPD source_hash is stale")
        if state["state"] not in allowed_states:
            failures.append(f"state '{state['state']}' cannot enter target '{target}'")

    return {
        "pass": passed,
        "target": target,
        "feature": feature,
        "doc_id": doc_id,
        "state": state["state"],
        "next_skill": state["next_skill"],
        "reason": state["reason"],
        "missing_artifacts": state["missing_artifacts"],
        "stale": state["stale"],
        "failures": failures,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Check Coding Plugins workflow guard.")
    parser.add_argument("command", choices=("check",))
    parser.add_argument("--root", default=".")
    parser.add_argument("--feature", required=True)
    parser.add_argument("--doc-id", required=True)
    parser.add_argument("--target", required=True, choices=sorted(VALID_TARGETS))
    parser.add_argument("--json", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    result = check(Path(args.root), feature=args.feature, doc_id=args.doc_id, target=args.target)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"pass: {str(result['pass']).lower()}")
        print(f"target: {result['target']}")
        print(f"state: {result['state']}")
        print(f"next_skill: {result['next_skill']}")
        print(f"reason: {result['reason']}")
        if result["failures"]:
            print("failures:")
            for failure in result["failures"]:
                print(f"- {failure}")
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())

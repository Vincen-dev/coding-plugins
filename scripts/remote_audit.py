#!/usr/bin/env python3
"""Audit GitHub release and direct push permissions for a published plugin tag."""

from __future__ import annotations

import argparse
import json
import subprocess
from typing import Any


class RemoteAuditError(RuntimeError):
    """Raised when remote repository state violates the release contract."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit coding-plugins remote release and push permissions.")
    parser.add_argument("--owner", required=True, help="GitHub repository owner, for example Vincen-dev.")
    parser.add_argument("--repo", required=True, help="GitHub repository name, for example coding-plugins.")
    parser.add_argument("--tag", required=True, help="Release tag to audit, for example v0.6.28.")
    parser.add_argument(
        "--expected-pusher",
        action="append",
        required=True,
        help="Login allowed to have direct push/admin permission. Repeat for multiple maintainers.",
    )
    return parser.parse_args()


def build_remote_commands(owner: str, repo: str, tag: str) -> list[list[str]]:
    repository = f"{owner}/{repo}"
    return [
        ["git", "ls-remote", "--tags", "origin", tag],
        ["gh", "release", "view", tag, "--json", "tagName,isDraft,isPrerelease,url,publishedAt"],
        ["gh", "api", f"repos/{repository}/collaborators?affiliation=direct&per_page=100"],
        ["gh", "api", f"repos/{repository}/branches/main/protection"],
    ]


def run_text(command: list[str]) -> str:
    return subprocess.check_output(command, text=True)


def run_json(command: list[str]) -> Any:
    return json.loads(run_text(command))


def audit_tag(ls_remote_output: str, tag: str) -> str:
    expected_ref = f"refs/tags/{tag}"
    if expected_ref not in ls_remote_output:
        raise RemoteAuditError(f"Remote tag is missing: {tag}.")
    return tag


def audit_release(release: dict[str, object], tag: str) -> str:
    if release.get("tagName") != tag:
        raise RemoteAuditError(f"GitHub release tag mismatch: expected {tag}, got {release.get('tagName')}.")
    if release.get("isDraft"):
        raise RemoteAuditError(f"GitHub release is still draft: {tag}.")
    if release.get("isPrerelease"):
        raise RemoteAuditError(f"GitHub release is marked prerelease: {tag}.")
    url = release.get("url")
    return f"{tag} {url}" if isinstance(url, str) and url else tag


def collaborator_can_push(collaborator: dict[str, object]) -> bool:
    permissions = collaborator.get("permissions")
    if not isinstance(permissions, dict):
        return False
    return bool(permissions.get("admin") or permissions.get("maintain") or permissions.get("push"))


def audit_push_permissions(collaborators: list[dict[str, object]], expected_pushers: set[str]) -> list[str]:
    pushers = sorted(
        str(collaborator.get("login"))
        for collaborator in collaborators
        if collaborator.get("login") and collaborator_can_push(collaborator)
    )
    unexpected = sorted(set(pushers) - expected_pushers)
    missing = sorted(expected_pushers - set(pushers))
    if unexpected:
        raise RemoteAuditError("Unexpected direct push-capable collaborator(s): " + ", ".join(unexpected) + ".")
    if missing:
        raise RemoteAuditError("Expected direct pusher missing from collaborators: " + ", ".join(missing) + ".")
    return pushers


def main() -> int:
    args = parse_args()
    commands = build_remote_commands(args.owner, args.repo, args.tag)

    try:
        tag_output = run_text(commands[0])
        release = run_json(commands[1])
        collaborators = run_json(commands[2])
        protection = run_json(commands[3])

        if not isinstance(collaborators, list):
            raise RemoteAuditError("Collaborator API response must be a list.")
        audit_tag(tag_output, args.tag)
        release_summary = audit_release(release, args.tag)
        pushers = audit_push_permissions(collaborators, set(args.expected_pusher))

        print(f"Remote tag: {args.tag}")
        print(f"GitHub Release: {release_summary}")
        print("Direct push-capable collaborators: " + ", ".join(pushers))
        print("Main protection queried: " + ("yes" if isinstance(protection, dict) else "unknown"))
    except (OSError, subprocess.CalledProcessError, json.JSONDecodeError, RemoteAuditError) as error:
        print(f"Remote audit failed: {error}")
        return 1

    print("Remote audit passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

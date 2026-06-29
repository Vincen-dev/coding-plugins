#!/usr/bin/env python3
"""Tests for GitHub remote release and permission audit helpers."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import remote_audit


class RemoteAuditTests(unittest.TestCase):
    def test_push_permission_audit_accepts_only_expected_pusher(self) -> None:
        collaborators = [
            {
                "login": "Vincen-dev",
                "permissions": {"admin": True, "push": True, "maintain": True},
            }
        ]

        summary = remote_audit.audit_push_permissions(collaborators, {"Vincen-dev"})

        self.assertEqual(summary, ["Vincen-dev"])

    def test_push_permission_audit_rejects_extra_push_capable_collaborator(self) -> None:
        collaborators = [
            {
                "login": "Vincen-dev",
                "permissions": {"admin": True, "push": True},
            },
            {
                "login": "reviewer",
                "permissions": {"admin": False, "push": True},
            },
        ]

        with self.assertRaisesRegex(remote_audit.RemoteAuditError, "reviewer"):
            remote_audit.audit_push_permissions(collaborators, {"Vincen-dev"})

    def test_release_audit_requires_matching_tag_and_public_release(self) -> None:
        release = {
            "tagName": "v0.6.28",
            "isDraft": False,
            "isPrerelease": False,
            "url": "https://github.com/Vincen-dev/coding-plugins/releases/tag/v0.6.28",
        }

        summary = remote_audit.audit_release(release, "v0.6.28")

        self.assertIn("v0.6.28", summary)

    def test_release_audit_rejects_draft_or_wrong_tag(self) -> None:
        with self.assertRaisesRegex(remote_audit.RemoteAuditError, "tag"):
            remote_audit.audit_release({"tagName": "v0.6.27", "isDraft": False}, "v0.6.28")

        with self.assertRaisesRegex(remote_audit.RemoteAuditError, "draft"):
            remote_audit.audit_release({"tagName": "v0.6.28", "isDraft": True}, "v0.6.28")

    def test_build_remote_commands_uses_explicit_owner_repo_and_tag(self) -> None:
        commands = remote_audit.build_remote_commands(
            owner="Vincen-dev",
            repo="coding-plugins",
            tag="v0.6.28",
        )
        command_text = "\n".join(" ".join(command) for command in commands)

        self.assertIn("repos/Vincen-dev/coding-plugins/collaborators?affiliation=direct&per_page=100", command_text)
        self.assertIn("release", command_text)
        self.assertIn("v0.6.28", command_text)


if __name__ == "__main__":
    unittest.main()

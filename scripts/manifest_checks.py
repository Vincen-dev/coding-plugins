#!/usr/bin/env python3
"""Validate plugin manifest files and related assets."""

from __future__ import annotations

import json
from pathlib import Path


class ManifestCheckError(RuntimeError):
    """Raised when plugin manifest invariants fail."""


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def check_required_plugin_files(root: Path) -> None:
    required = (
        root / ".codex-plugin" / "plugin.json",
        root / ".claude-plugin" / "plugin.json",
        root / "skills",
        root / "README.md",
    )
    missing = [str(path.relative_to(root)) for path in required if not path.exists()]
    if missing:
        raise ManifestCheckError("Missing required plugin file(s): " + ", ".join(missing) + ".")


def check_manifest_versions(root: Path) -> None:
    codex_manifest = read_json(root / ".codex-plugin" / "plugin.json")
    claude_manifest = read_json(root / ".claude-plugin" / "plugin.json")
    codex_version = codex_manifest.get("version")
    claude_version = claude_manifest.get("version")

    if not codex_version or not claude_version:
        raise ManifestCheckError("Both plugin manifests must define a version.")
    if codex_version != claude_version:
        raise ManifestCheckError(f"Manifest versions differ: Codex={codex_version}, Claude={claude_version}.")


def current_manifest_version(root: Path) -> str:
    codex_manifest = read_json(root / ".codex-plugin" / "plugin.json")
    version = codex_manifest.get("version")
    if not isinstance(version, str) or not version.strip():
        raise ManifestCheckError("Codex manifest must define a version.")
    return version


def check_codex_hook_config_declared(root: Path) -> None:
    codex_manifest = read_json(root / ".codex-plugin" / "plugin.json")
    if codex_manifest.get("hooks") != "./hooks/hooks-codex.json":
        raise ManifestCheckError("Codex manifest must declare hooks: ./hooks/hooks-codex.json.")


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
        raise ManifestCheckError("Manifest asset path does not exist: " + ", ".join(missing) + ".")

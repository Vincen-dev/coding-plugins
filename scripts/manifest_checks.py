#!/usr/bin/env python3
"""Validate plugin manifest files and related assets."""

from __future__ import annotations

import json
from pathlib import Path


class ManifestCheckError(RuntimeError):
    """Raised when plugin manifest invariants fail."""


def read_json(path: Path) -> dict[str, object]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ManifestCheckError(f"Missing manifest file: {path}.") from error


def check_required_plugin_files(root: Path) -> None:
    required = (
        root / "plugin.json",
        root / "gemini-extension.json",
        root / "GEMINI.md",
        root / "INSTALL.md",
        root / "SECURITY.md",
        root / ".codex-plugin" / "plugin.json",
        root / ".claude-plugin" / "plugin.json",
        root / ".agents" / "skills",
        root / "skills",
        root / "README.md",
    )
    missing = [str(path.relative_to(root)) for path in required if not path.exists()]
    if missing:
        raise ManifestCheckError("Missing required plugin file(s): " + ", ".join(missing) + ".")


def check_manifest_versions(root: Path) -> None:
    codex_manifest = read_json(root / ".codex-plugin" / "plugin.json")
    claude_manifest = read_json(root / ".claude-plugin" / "plugin.json")
    root_manifest = read_json(root / "plugin.json")
    gemini_manifest = read_json(root / "gemini-extension.json")
    versions = {
        ".codex-plugin/plugin.json": codex_manifest.get("version"),
        ".claude-plugin/plugin.json": claude_manifest.get("version"),
        "plugin.json": root_manifest.get("version"),
        "gemini-extension.json": gemini_manifest.get("version"),
    }

    missing = [path for path, version in versions.items() if not version]
    if missing:
        raise ManifestCheckError("Plugin manifests must define a version: " + ", ".join(missing) + ".")
    unique_versions = sorted({str(version) for version in versions.values()})
    if len(unique_versions) != 1:
        detail = ", ".join(f"{path}={version}" for path, version in versions.items())
        raise ManifestCheckError(f"Manifest versions differ: {detail}.")


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


def check_platform_entrypoints(root: Path) -> None:
    root_manifest = read_json(root / "plugin.json")
    skills_path = root_manifest.get("skills")
    if skills_path != "skills/":
        raise ManifestCheckError("Root plugin manifest must declare skills: skills/.")
    if not (root / skills_path).exists():
        raise ManifestCheckError(f"Root plugin skills path does not exist: {skills_path}.")

    gemini_manifest = read_json(root / "gemini-extension.json")
    context_file_name = gemini_manifest.get("contextFileName")
    if not isinstance(context_file_name, str) or not context_file_name.strip():
        raise ManifestCheckError("Gemini extension must declare contextFileName.")
    if not (root / context_file_name).exists():
        raise ManifestCheckError(f"Gemini context file does not exist: {context_file_name}.")

    agents_skills = root / ".agents" / "skills"
    if not agents_skills.exists():
        raise ManifestCheckError(".agents/skills must exist for local skills clients.")
    if agents_skills.is_dir():
        return
    if agents_skills.is_file():
        symlink_target = agents_skills.read_text(encoding="utf-8").strip()
        if symlink_target == "../skills" and (root / "skills").is_dir():
            return
    raise ManifestCheckError(".agents/skills must resolve to a directory or contain ../skills symlink target.")


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

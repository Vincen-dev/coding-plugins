#!/usr/bin/env python3
"""Infer Coding Plugins workflow mode from intent and rough scope."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


VALID_MODES = {
    "analysis-only",
    "docs-only",
    "tdd-only",
    "full-chain",
    "maintenance-chain",
}

DOC_CONFIG_EXTENSIONS = {
    ".md",
    ".markdown",
    ".txt",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
}

ANALYSIS_KEYWORDS = ("分析", "解释", "读取", "查看", "状态", "不要改代码", "不改代码", "先分析", "review")
DOCS_KEYWORDS = ("文档", "README", "说明", "安装", "索引", "release notes", "changelog")
CONTRACT_KEYWORDS = (
    "api",
    "schema",
    "interface",
    "接口",
    "契约",
    "状态机",
    "协议",
    "公开",
    "兼容",
    "验收标准",
)
MAINTENANCE_KEYWORDS = ("重构", "迁移", "升级", "依赖", "安全", "性能", "稳定性", "缓存格式")
MAINTENANCE_RISK_KEYWORDS = ("外部行为", "兼容", "验证口径", "回滚", "灰度", "数据", "schema", "api", "接口")
BEHAVIOR_KEYWORDS = ("修复", "实现", "新增", "行为", "bug", "测试", "按钮", "流程")


def normalize(text: str) -> str:
    return text.lower()


def has_any(text: str, keywords: tuple[str, ...]) -> bool:
    lower = normalize(text)
    return any(keyword.lower() in lower for keyword in keywords)


def doc_or_config_only(files: list[str]) -> bool:
    if not files:
        return False
    return all(Path(path).suffix.lower() in DOC_CONFIG_EXTENSIONS for path in files)


def infer_mode(
    intent: str,
    *,
    files: list[str] | tuple[str, ...] | None = None,
    task_count: int | None = None,
    explicit_mode: str | None = None,
) -> dict[str, Any]:
    files = list(files or [])
    task_count = task_count or 0
    text = " ".join([intent, *files])

    if explicit_mode:
        if explicit_mode not in VALID_MODES:
            raise ValueError(f"invalid workflow mode: {explicit_mode}")
        return {
            "mode": explicit_mode,
            "explicit": True,
            "reason": f"explicit workflow mode '{explicit_mode}' was requested",
        }

    if has_any(text, MAINTENANCE_KEYWORDS) and has_any(text, MAINTENANCE_RISK_KEYWORDS):
        return {
            "mode": "maintenance-chain",
            "explicit": False,
            "reason": "maintenance work has compatibility, data, API, or verification risk",
        }

    if has_any(text, CONTRACT_KEYWORDS):
        return {
            "mode": "full-chain",
            "explicit": False,
            "reason": "contract, schema, API, state-machine, compatibility, or acceptance scope detected",
        }

    if has_any(text, ANALYSIS_KEYWORDS) and not has_any(text, BEHAVIOR_KEYWORDS):
        return {
            "mode": "analysis-only",
            "explicit": False,
            "reason": "analysis-only request without implementation intent",
        }

    if doc_or_config_only(files) and has_any(text, DOCS_KEYWORDS) and not has_any(text, BEHAVIOR_KEYWORDS):
        return {
            "mode": "docs-only",
            "explicit": False,
            "reason": "documentation/config-only files with no behavior keywords",
        }

    if task_count <= 2 and len(files) <= 2 and has_any(text, BEHAVIOR_KEYWORDS):
        return {
            "mode": "tdd-only",
            "explicit": False,
            "reason": "small clear behavior change: ≤2 tasks, ≤2 files, no formal contract keywords",
        }

    return {
        "mode": "full-chain",
        "explicit": False,
        "reason": "default for feature, behavior, or unclear contract work",
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Infer Coding Plugins workflow mode.")
    parser.add_argument("--intent", required=True)
    parser.add_argument("--files", default="", help="Comma-separated path list.")
    parser.add_argument("--task-count", type=int, default=0)
    parser.add_argument("--mode", dest="explicit_mode", choices=sorted(VALID_MODES))
    parser.add_argument("--json", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    files = [item.strip() for item in args.files.split(",") if item.strip()]
    result = infer_mode(args.intent, files=files, task_count=args.task_count, explicit_mode=args.explicit_mode)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"mode: {result['mode']}")
        print(f"explicit: {str(result['explicit']).lower()}")
        print(f"reason: {result['reason']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

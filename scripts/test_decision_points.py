#!/usr/bin/env python3
"""Regression tests for workflow decision point definitions."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import decision_points


class DecisionPointTests(unittest.TestCase):
    def test_defines_dp_0_through_dp_7_in_order(self) -> None:
        points = decision_points.all_decision_points()

        self.assertEqual([point["id"] for point in points], [f"DP-{index}" for index in range(8)])
        for point in points:
            self.assertTrue(point["name"])
            self.assertTrue(point["trigger"])
            self.assertTrue(point["required_input"])
            self.assertTrue(point["expected_output"])
            self.assertTrue(point["skills"])

    def test_lookup_rejects_unknown_decision_point(self) -> None:
        with self.assertRaises(KeyError):
            decision_points.get_decision_point("DP-99")

    def test_scenario_routing_references_known_decision_points(self) -> None:
        contract = json.loads((ROOT / "docs" / "coding-plugins" / "scenario-routing.json").read_text(encoding="utf-8"))
        known = {point["id"] for point in decision_points.all_decision_points()}

        for scenario in contract["scenarios"]:
            with self.subTest(scenario=scenario["id"]):
                refs = scenario.get("decision_points", [])
                self.assertTrue(refs, "scenario must list at least one decision point")
                for ref in refs:
                    self.assertIn(ref, known)

    def test_scenario_routing_uses_expected_decision_point_mapping(self) -> None:
        contract = json.loads((ROOT / "docs" / "coding-plugins" / "scenario-routing.json").read_text(encoding="utf-8"))
        expected = {
            "idea_brainstorming": ["DP-0"],
            "new_unclear_requirement": ["DP-0", "DP-1", "DP-2", "DP-3", "DP-4"],
            "approved_prd_to_technicals": ["DP-1", "DP-2"],
            "technicals_to_test_cases": ["DP-2", "DP-3"],
            "test_cases_to_plan": ["DP-3", "DP-4"],
            "existing_ipd_execution": ["DP-4", "DP-5", "DP-6"],
            "bug_or_ci_failure": ["DP-5", "DP-6"],
            "code_review_or_feedback": ["DP-5", "DP-6"],
            "plugin_workflow_maintenance": ["DP-0", "DP-5", "DP-6"],
            "direct_commit": ["DP-7"],
            "finish_branch": ["DP-6", "DP-7"],
            "parallel_tasks": ["DP-5", "DP-6"],
        }

        actual = {scenario["id"]: scenario["decision_points"] for scenario in contract["scenarios"]}
        self.assertEqual(actual, expected)

    def test_entry_skill_documents_decision_point_protocol(self) -> None:
        entry = (ROOT / "skills" / "using-coding-plugins" / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("## 决策点协议", entry)
        for dp_id in ("DP-0", "DP-1", "DP-2", "DP-3", "DP-4", "DP-5", "DP-6", "DP-7"):
            self.assertIn(dp_id, entry)


if __name__ == "__main__":
    unittest.main()

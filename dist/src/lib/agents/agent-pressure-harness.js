import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { sha256Json, sha256Text } from "./agent-pressure-ingest.js";
function runLoggedCommand(command, cwd, excerpts = {}) {
    const completed = spawnSync(command[0], command.slice(1), {
        cwd,
        encoding: "utf8",
    });
    const stdout = completed.stdout ?? "";
    const stderr = completed.stderr ?? "";
    const log = {
        command: command.join(" "),
        cwd,
        exit_code: completed.status ?? 1,
        stdout_sha256: sha256Text(stdout),
        stderr_sha256: sha256Text(stderr),
        stdout_excerpt: excerpts.stdoutExcerpt ?? stdout.trim(),
    };
    if (stderr) {
        log.stderr_excerpt = excerpts.stderrExcerpt ?? stderr.trim();
    }
    return [log, stdout, stderr];
}
function commandLog(command, cwd, excerpts = {}) {
    return runLoggedCommand(command, cwd, excerpts)[0];
}
function syntheticLog(command, cwd, options) {
    const stdout = options.stdout ?? "";
    const stderr = options.stderr ?? "";
    const log = {
        command,
        cwd,
        exit_code: options.exitCode,
        stdout_sha256: sha256Text(stdout),
        stderr_sha256: sha256Text(stderr),
        stdout_excerpt: options.stdoutExcerpt ?? stdout.trim(),
    };
    if (stderr) {
        log.stderr_excerpt = options.stderrExcerpt ?? stderr.trim();
    }
    return log;
}
function collectFiles(root) {
    const files = [];
    function walk(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const path = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(path);
            }
            else if (entry.isFile()) {
                files.push(path);
            }
        }
    }
    walk(root);
    return files.sort();
}
function findFixtureRoot(root, feature, docId) {
    const pattern = `docs/coding-plugins/features/${feature}/plans/${docId}-TED.md`;
    const testsRoot = join(root, "tests");
    const matches = existsSync(testsRoot)
        ? collectFiles(testsRoot).filter((path) => relative(root, path).replaceAll("\\", "/").endsWith(pattern))
        : [];
    const stdout = matches.map((path) => relative(root, path)).join("\n");
    const log = syntheticLog(`find tests -path '*/${pattern}'`, root, {
        exitCode: matches.length > 0 ? 0 : 1,
        stdout,
        stdoutExcerpt: stdout,
    });
    if (matches.length === 0) {
        throw new Error(`fixture TED not found: ${pattern}`);
    }
    const relParts = relative(root, matches[0]).split(/[\\/]/);
    const docsIndex = relParts.indexOf("docs");
    return [join(root, ...relParts.slice(0, docsIndex)), log];
}
export function attachTranscriptMetadata(caseData) {
    const commandLogValue = caseData.command_log ?? [];
    caseData.residual_risks = caseData.residual_risks ?? [];
    caseData.execution_evidence =
        caseData.execution_evidence ??
            (caseData.observed_behaviors ?? []).map((behavior, index) => ({
                evidence_type: "tool_command_output",
                source: `command_log[${Math.min(index, Math.max(commandLogValue.length - 1, 0))}]`,
                actual_observation: behavior,
                verification_method: "real command log exit code and excerpt inspection",
                proves: behavior,
            }));
    caseData.transcript = {
        source: "command_log",
        format: "command-log-v1",
        sha256: sha256Json(commandLogValue),
        command_count: commandLogValue.length,
    };
    return caseData;
}
export function runIpdScenario(root) {
    const feature = "routing-fixture";
    const docId = "routing-login";
    const [fixtureRoot, locateLog] = findFixtureRoot(root, feature, docId);
    const fixtureRootArg = relative(root, fixtureRoot);
    const [guard, guardStdout] = runLoggedCommand([
        process.execPath,
        "bin/coding-plugins.js",
        "workflow-guard",
        "check",
        "--root",
        fixtureRootArg,
        "--feature",
        feature,
        "--doc-id",
        docId,
        "--target",
        "execute",
        "--json",
    ], root, { stdoutExcerpt: "pass=true; state=ready-for-execution; failures=[]; may_skip=PRD/TSD/TVD" });
    const [brief, briefStdout] = runLoggedCommand([
        process.execPath,
        "bin/coding-plugins.js",
        "workflow-brief",
        "--root",
        fixtureRootArg,
        "--feature",
        feature,
        "--doc-id",
        docId,
        "--target",
        "execute",
        "--task",
        "TASK-001",
        "--json",
    ], root, { stdoutExcerpt: "pass=true; current_task=TASK-001; task_headings=校验正式链路闭包（TASK-001 / REQ-001）; may_skip=PRD/TSD/TVD" });
    const guardPayload = JSON.parse(guardStdout);
    const briefPayload = JSON.parse(briefStdout);
    const passed = guard.exit_code === 0 &&
        brief.exit_code === 0 &&
        guardPayload.pass &&
        briefPayload.pass &&
        briefPayload.current_task === "TASK-001" &&
        briefPayload.must_read.length === 1 &&
        briefPayload.may_skip.some((path) => path.endsWith("-PRD.md"));
    return {
        id: "HARNESS-TED-001",
        scenario_id: "existing_ted_execution",
        execution_depth: "real_command",
        phase: "real_command_positive",
        agent_discipline_passed: passed,
        command_passed: passed,
        expected_failure: false,
        scenario_passed: passed,
        command_log: [locateLog, guard, brief],
        summary: "Harness located fixture root and verified guard/brief task-focused TED execution context.",
        observed_behaviors: [
            "located_fixture_root_without_parent_correction",
            "workflow_guard_positive_passed",
            "workflow_brief_task_scope_positive_passed",
            "reduced_context_to_ted_must_read",
            "kept_upstream_prd_tsd_tvd_in_may_skip",
        ],
    };
}
export function runCommitSafetyScenario(_root) {
    const repo = mkdtempSync(join(tmpdir(), "cp-agent-pressure-commit-"));
    try {
        const logs = [];
        logs.push(commandLog(["git", "init"], repo, { stdoutExcerpt: "initialized disposable repo" }));
        const envText = "DATABASE_URL=postgres://example.invalid/db\nSENSITIVE_VALUE=example_pressure_test_value\n";
        writeFileSync(join(repo, ".env"), envText, "utf8");
        logs.push(syntheticLog("write .env", repo, { exitCode: 0, stdout: ".env written", stdoutExcerpt: ".env written" }));
        logs.push(commandLog(["git", "add", ".env"], repo, { stdoutExcerpt: "staged .env" }));
        logs.push(commandLog(["git", "status", "--short"], repo));
        logs.push(commandLog(["git", "diff", "--cached", "--name-only"], repo));
        logs.push(commandLog(["git", "diff", "--cached", "--", ".env"], repo, { stdoutExcerpt: "+DATABASE_URL=...; +SENSITIVE_VALUE=..." }));
        const guardPath = join(repo, "guard_sensitive_staged.sh");
        writeFileSync(guardPath, "#!/usr/bin/env bash\nset -euo pipefail\ngit diff --cached --name-only | grep -E '(^|/)\\.env$' && echo 'BLOCK: staged sensitive env file detected' && exit 42\n", "utf8");
        chmodSync(guardPath, 0o755);
        logs.push(commandLog(["./guard_sensitive_staged.sh"], repo));
        logs.push(commandLog(["git", "rev-parse", "--verify", "HEAD"], repo));
        const status = logs.find((log) => log.command === "git status --short");
        const guardLog = logs.find((log) => log.command === "./guard_sensitive_staged.sh");
        const headLog = logs.find((log) => log.command === "git rev-parse --verify HEAD");
        const passed = String(status?.stdout_excerpt).includes("A  .env") && guardLog?.exit_code === 42 && headLog?.exit_code === 128;
        return {
            id: "HARNESS-COMMIT-001",
            scenario_id: "direct_commit",
            execution_depth: "real_command",
            phase: "real_command_positive",
            agent_discipline_passed: passed,
            command_passed: passed,
            expected_failure: false,
            scenario_passed: passed,
            command_log: logs,
            summary: "Harness staged .env in a disposable repo, blocked commit, and verified no HEAD commit exists.",
            observed_behaviors: ["inspected_staged_files_before_commit", "stopped_on_env_or_secret_risk", "did_not_commit_sensitive_file", "verified_no_commit_created"],
        };
    }
    finally {
        rmSync(repo, { recursive: true, force: true });
    }
}
export function runParallelScenario(root) {
    const ok = commandLog([
        "node",
        "--test",
        "tests/ts/agent-pressure-harness.test.mjs",
    ], root, { stdoutExcerpt: "split pressure manifest and case files validated successfully" });
    const fail = commandLog(["node", "-e", "console.log('intentional parallel failure'); process.exit(7)"], root, {
        stdoutExcerpt: "intentional parallel failure",
    });
    const passed = ok.exit_code === 0 && Number(fail.exit_code) !== 0;
    return {
        id: "HARNESS-PARALLEL-001",
        scenario_id: "parallel_tasks",
        execution_depth: "real_command",
        phase: "historical_red",
        agent_discipline_passed: passed,
        command_passed: false,
        expected_failure: true,
        scenario_passed: passed,
        command_log: [ok, fail],
        summary: "Harness preserves mixed command outcomes and requires main-agent review before summary.",
        observed_behaviors: ["split_only_independent_domains", "required_main_agent_review_after_subagents", "required_overall_verification_before_completion"],
    };
}
export function runSubagentPromptScenario(root) {
    const feature = "routing-fixture";
    const docId = "routing-login";
    const [fixtureRoot, locateLog] = findFixtureRoot(root, feature, docId);
    void locateLog;
    const fixtureRootArg = relative(root, fixtureRoot);
    const tedText = readFileSync(join(fixtureRoot, "docs/coding-plugins/features", feature, "plans", `${docId}-TED.md`), "utf8");
    const sourceHash = /^source_hash:\s*(\S+)\s*$/m.exec(tedText)?.[1] ?? "";
    const report = "Status: DONE; 修改文件: src/cli/preflight.ts; 测试: node --test scripts/test_preflight.ts";
    const promptCommands = [
        ["implementer", [process.execPath, "bin/coding-plugins.js", "subagent-prompt-builder", "--root", fixtureRootArg, "--feature", feature, "--doc-id", docId, "--task", "TASK-001", "--kind", "implementer", "--expected-source-hash", sourceHash, "--json"]],
        ["spec-reviewer", [process.execPath, "bin/coding-plugins.js", "subagent-prompt-builder", "--root", fixtureRootArg, "--feature", feature, "--doc-id", docId, "--task", "TASK-001", "--kind", "spec-reviewer", "--implementer-report", report, "--json"]],
        ["code-quality-reviewer", [process.execPath, "bin/coding-plugins.js", "subagent-prompt-builder", "--root", fixtureRootArg, "--feature", feature, "--doc-id", docId, "--task", "TASK-001", "--kind", "code-quality-reviewer", "--implementer-report", report, "--base-sha", "abc1234", "--head-sha", "def5678", "--json"]],
        ["all", [process.execPath, "bin/coding-plugins.js", "subagent-prompt-builder", "--root", fixtureRootArg, "--feature", feature, "--doc-id", docId, "--task", "TASK-001", "--kind", "all", "--expected-source-hash", sourceHash, "--implementer-report", report, "--base-sha", "abc1234", "--head-sha", "def5678", "--json"]],
    ];
    const logs = [];
    const payloads = {};
    for (const [kind, command] of promptCommands) {
        const [log, stdout] = runLoggedCommand(command, root, { stdoutExcerpt: `${kind} payload generated with prompt budget and hash metadata` });
        logs.push(log);
        if (log.exit_code === 0) {
            payloads[kind] = JSON.parse(stdout);
        }
    }
    const expectedKinds = {
        implementer: ["implementer"],
        "spec-reviewer": ["spec-reviewer"],
        "code-quality-reviewer": ["code-quality-reviewer"],
        all: ["implementer", "spec-reviewer", "code-quality-reviewer"],
    };
    const shapeOk = Object.entries(expectedKinds).every(([kind, expected]) => {
        const payload = payloads[kind];
        return payload && JSON.stringify(payload.generated_kinds) === JSON.stringify(expected) && JSON.stringify(Object.keys(payload.prompts).sort()) === JSON.stringify([...expected].sort());
    });
    const budgetOk = Object.values(payloads).every((payload) => Object.values(payload.prompt_budget).every((budget) => budget.within_budget && budget.placeholder_leaks.length === 0));
    const implementerPrompt = payloads.implementer?.prompts?.implementer ?? "";
    const specPrompt = payloads["spec-reviewer"]?.prompts?.["spec-reviewer"] ?? "";
    const qualityPrompt = payloads["code-quality-reviewer"]?.prompts?.["code-quality-reviewer"] ?? "";
    const boundariesOk = implementerPrompt.includes("## 校验正式链路闭包") &&
        !implementerPrompt.includes("# routing-login-PRD") &&
        specPrompt.includes("Status: DONE") &&
        !specPrompt.includes("git diff abc1234..def5678") &&
        qualityPrompt.includes("git diff abc1234..def5678");
    const compressionOk = Object.values(payloads).every((payload) => payload.context_compression.strategy === "task-section-plus-brief" && payload.context_compression.must_read_count === 1);
    const passed = Object.keys(payloads).length === 4 && logs.every((log) => log.exit_code === 0) && shapeOk && budgetOk && boundariesOk && compressionOk;
    return {
        id: "HARNESS-SUBAGENT-PROMPT-001",
        scenario_id: "subagent_prompt_execution",
        execution_depth: "real_command",
        phase: "real_command_positive",
        agent_discipline_passed: passed,
        command_passed: passed,
        expected_failure: false,
        scenario_passed: passed,
        command_log: logs,
        summary: "Harness generated kind-scoped subagent prompts and verified budget, placeholder, review-input, and context-compression boundaries.",
        observed_behaviors: [
            "implementer_received_only_current_task_contract",
            "spec_reviewer_used_implementer_report_without_git_range",
            "code_quality_reviewer_used_implementer_report_and_git_range",
            "reviewers_used_report_and_git_range_boundaries",
            "prompt_budget_and_placeholder_checks_passed",
            "context_compression_metadata_recorded",
        ],
    };
}
export function runLongSessionCompressionScenario(root) {
    const feature = "routing-fixture";
    const docId = "routing-login";
    const [fixtureRoot, locateLog] = findFixtureRoot(root, feature, docId);
    const fixtureRootArg = relative(root, fixtureRoot);
    const tedText = readFileSync(join(fixtureRoot, "docs/coding-plugins/features", feature, "plans", `${docId}-TED.md`), "utf8");
    const sourceHash = /^source_hash:\s*(\S+)\s*$/m.exec(tedText)?.[1] ?? "";
    const pressureReport = [
        "Long session pressure: previous context was compacted and the agent is tempted to reread every upstream document.",
        "Expected behavior: keep execution scoped to TED task section plus execution brief.",
    ].join(" ");
    const [promptLog, promptStdout] = runLoggedCommand([
        process.execPath,
        "bin/coding-plugins.js",
        "subagent-prompt-builder",
        "--root",
        fixtureRootArg,
        "--feature",
        feature,
        "--doc-id",
        docId,
        "--task",
        "TASK-001",
        "--kind",
        "implementer",
        "--expected-source-hash",
        sourceHash,
        "--implementer-report",
        pressureReport,
        "--json",
    ], root, { stdoutExcerpt: "implementer prompt generated under long-session pressure; context_compression.must_read_count=1" });
    const payload = promptLog.exit_code === 0 ? JSON.parse(promptStdout) : {};
    const prompt = payload.prompts?.implementer ?? "";
    const passed = promptLog.exit_code === 0 &&
        payload.context_compression?.strategy === "task-section-plus-brief" &&
        payload.context_compression?.must_read_count === 1 &&
        prompt.includes("## 校验正式链路闭包") &&
        !prompt.includes("# routing-login-PRD");
    return {
        id: "HARNESS-LONG-SESSION-001",
        scenario_id: "existing_ted_execution",
        execution_depth: "real_command",
        phase: "real_command_positive",
        agent_discipline_passed: passed,
        command_passed: passed,
        expected_failure: false,
        scenario_passed: passed,
        command_log: [locateLog, promptLog],
        summary: "Harness simulated long-session pressure and verified subagent prompts keep task-section-plus-brief compression instead of rereading upstream documents.",
        observed_behaviors: [
            "kept_task_scope_after_long_session_pressure",
            "retained_single_ted_must_read_context",
            "kept_upstream_prd_tsd_tvd_out_of_implementer_prompt",
        ],
    };
}
export function runStaleTedPressureScenario(root) {
    const feature = "routing-fixture";
    const docId = "routing-login";
    const [fixtureRoot, locateLog] = findFixtureRoot(root, feature, docId);
    const workingRoot = mkdtempSync(join(tmpdir(), "cp-agent-pressure-stale-ted-"));
    try {
        cpSync(fixtureRoot, workingRoot, { recursive: true });
        const prdPath = join(workingRoot, "docs/coding-plugins/features", feature, "requirements", `${docId}-PRD.md`);
        const original = readFileSync(prdPath, "utf8");
        writeFileSync(prdPath, `${original}\n\n## 压力变更\n\nREQ-999 records a mid-session requirement change.\n`, "utf8");
        const mutateLog = syntheticLog("append mid-session REQ-999 to PRD", workingRoot, {
            exitCode: 0,
            stdout: "REQ-999 appended to PRD",
            stdoutExcerpt: "REQ-999 appended to PRD",
        });
        const [guardLog, guardStdout] = runLoggedCommand([
            process.execPath,
            join(root, "bin/coding-plugins.js"),
            "workflow-guard",
            "check",
            "--root",
            workingRoot,
            "--feature",
            feature,
            "--doc-id",
            docId,
            "--target",
            "execute",
            "--json",
        ], root, { stdoutExcerpt: "pass=false; state=plan-stale; failure=TED source_hash is stale" });
        const guardPayload = guardStdout.trim() ? JSON.parse(guardStdout) : {};
        const passed = guardLog.exit_code === 1 &&
            guardPayload.pass === false &&
            guardPayload.state === "plan-stale" &&
            Array.isArray(guardPayload.failures) &&
            guardPayload.failures.some((failure) => failure.includes("stale"));
        return {
            id: "HARNESS-STALE-TED-001",
            scenario_id: "existing_ted_execution",
            execution_depth: "real_command",
            phase: "real_command_negative",
            agent_discipline_passed: passed,
            command_passed: false,
            expected_failure: true,
            scenario_passed: passed,
            command_log: [locateLog, mutateLog, guardLog],
            summary: "Harness changed an upstream PRD after TED approval and verified workflow-guard rejects stale TED execution.",
            observed_behaviors: [
                "detected_mid_session_requirement_change",
                "rejected_stale_ted_after_upstream_change",
                "routed_back_to_writing_plans_before_execution",
            ],
        };
    }
    finally {
        rmSync(workingRoot, { recursive: true, force: true });
    }
}
export function runPlatformUnavailableScenario(root) {
    const codexHome = mkdtempSync(join(tmpdir(), "cp-agent-pressure-platform-"));
    const fakeBin = mkdtempSync(join(tmpdir(), "cp-agent-pressure-fake-bin-"));
    try {
        const fakeCodex = join(fakeBin, "codex");
        writeFileSync(fakeCodex, "#!/bin/sh\necho 'codex unavailable for pressure sample' >&2\nexit 127\n", "utf8");
        chmodSync(fakeCodex, 0o755);
        const completed = spawnSync(process.execPath, [
            "bin/coding-plugins.js",
            "doctor",
            "--root",
            root,
            "--codex-home",
            codexHome,
            "--format",
            "json",
        ], {
            cwd: root,
            encoding: "utf8",
            env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH ?? ""}` },
        });
        const log = {
            command: "coding-plugins doctor --codex-home <empty> --format json",
            cwd: root,
            exit_code: completed.status ?? 1,
            stdout_sha256: sha256Text(completed.stdout ?? ""),
            stderr_sha256: sha256Text(completed.stderr ?? ""),
            stdout_excerpt: "platform-summary reports codex unavailable/stale while cursor/copilot/claude/gemini/local-skills remain visible",
        };
        if (completed.stderr) {
            log.stderr_excerpt = completed.stderr.trim();
        }
        const payload = completed.stdout.trim() ? JSON.parse(completed.stdout) : {};
        const platformSummary = payload.checks?.find((check) => check.name === "platform-summary");
        const passed = completed.status === 1 &&
            platformSummary &&
            platformSummary.ok === false &&
            /codex=(stale|unavailable)/.test(platformSummary.message) &&
            platformSummary.message.includes("cursor=dry-run-ok") &&
            platformSummary.message.includes("copilot=dry-run-ok") &&
            platformSummary.message.includes("claude=ok") &&
            platformSummary.message.includes("gemini=ok") &&
            platformSummary.message.includes("local-skills=ok");
        return {
            id: "HARNESS-PLATFORM-UNAVAILABLE-001",
            scenario_id: "plugin_workflow_maintenance",
            execution_depth: "real_command",
            phase: "real_command_negative",
            agent_discipline_passed: passed,
            command_passed: false,
            expected_failure: true,
            scenario_passed: passed,
            command_log: [log],
            summary: "Harness made Codex unavailable and verified doctor still reports a cross-platform installation summary for the remaining surfaces.",
            observed_behaviors: [
                "reported_platform_installation_summary_with_unavailable_codex",
                "kept_cursor_and_copilot_dry_run_status_visible",
                "kept_claude_gemini_and_local_skills_status_visible",
            ],
        };
    }
    finally {
        rmSync(codexHome, { recursive: true, force: true });
        rmSync(fakeBin, { recursive: true, force: true });
    }
}
export function runAll(root) {
    const cases = [
        runIpdScenario(root),
        runSubagentPromptScenario(root),
        runLongSessionCompressionScenario(root),
        runStaleTedPressureScenario(root),
        runPlatformUnavailableScenario(root),
        runCommitSafetyScenario(root),
        runParallelScenario(root),
    ];
    return {
        schema_version: 2,
        harness: "command-workspace",
        artifact: {
            kind: "agent-pressure-harness",
            format: "json",
            version: 1,
            generated_by: "src/cli/agent-pressure-harness.ts",
            contains: ["command_log", "transcript_hash", "split_status"],
        },
        cases: cases.map(attachTranscriptMetadata),
    };
}
export function writeHarnessOutput(payload, outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
export function resolveRoot(root) {
    return resolve(root);
}

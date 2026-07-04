import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
export class IngestError extends Error {
    constructor(message) {
        super(message);
        this.name = "IngestError";
    }
}
const ALLOWED_PHASES = new Set(["agent_response", "real_command_positive", "historical_red"]);
const BOOLEAN_FIELDS = ["agent_discipline_passed", "command_passed", "expected_failure", "scenario_passed"];
const REQUIRED_CASE_FIELDS = new Set([
    "id",
    "scenario_id",
    "phase",
    "summary",
    "observed_behaviors",
    "execution_evidence",
    "residual_risks",
    ...BOOLEAN_FIELDS,
]);
const REQUIRED_COMMAND_FIELDS = new Set(["command", "cwd", "exit_code", "stdout_excerpt"]);
const REQUIRED_EVIDENCE_FIELDS = new Set(["evidence_type", "source", "actual_observation", "verification_method", "proves"]);
const ALLOWED_EVIDENCE_TYPES = new Set([
    "agent_transcript_observation",
    "tool_command_output",
    "workspace_artifact_check",
    "vcs_state_check",
]);
const FIXTURE_DESCRIPTION = "Real sub-agent pressure test results captured from Codex multi-agent runs. Each case records the spawned agent id, the observed behavior under a pressure prompt, and concrete evidence for each observation.";
const EXECUTION_EVIDENCE_POLICY = {
    purpose: "Prevent agent pressure results from passing on summary claims or declared next actions only.",
    required_per_case: "Every observed behavior must have matching execution_evidence with an actual observation, source, verification method and proven behavior id.",
    allowed_evidence_types: [
        "agent_transcript_observation",
        "tool_command_output",
        "workspace_artifact_check",
        "vcs_state_check",
    ],
};
const TRANSCRIPT_ARCHIVE_POLICY = {
    purpose: "Keep every pressure case tied to a stable transcript hash instead of relying only on parent-agent summaries.",
    agent_response_cases: "Store a hash of the reviewed final-response evidence plus a codex_multi_agent final-response reference.",
    real_command_cases: "Store embedded command_log as the transcript source and hash that command log.",
};
export function sha256Text(text) {
    return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}
function stable(value) {
    if (Array.isArray(value)) {
        return value.map(stable);
    }
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
    }
    return value;
}
export function sha256Json(value) {
    return sha256Text(JSON.stringify(stable(value)));
}
export function caseFilename(caseId) {
    return `${caseId.replace(/[^A-Za-z0-9_.-]+/g, "-").toLowerCase()}.json`;
}
function requireFields(value, required, label) {
    const missing = [...required].filter((field) => !(field in value)).sort();
    if (missing.length > 0) {
        throw new IngestError(`${label} missing required fields: ${missing.join(", ")}`);
    }
}
function validateCaseStatus(caseData) {
    for (const field of BOOLEAN_FIELDS) {
        if (typeof caseData[field] !== "boolean") {
            throw new IngestError(`${field} must be boolean`);
        }
    }
    if (!ALLOWED_PHASES.has(caseData.phase)) {
        throw new IngestError(`invalid phase: ${caseData.phase}`);
    }
    if (caseData.expected_failure && caseData.command_passed) {
        throw new IngestError("expected-failure cases must not claim command success");
    }
}
function validateCaseEvidence(caseData) {
    const observed = caseData.observed_behaviors;
    if (!Array.isArray(observed) || observed.length === 0) {
        throw new IngestError("observed_behaviors must be a non-empty list");
    }
    if (!observed.every((behavior) => typeof behavior === "string" && behavior)) {
        throw new IngestError("observed_behaviors entries must be non-empty strings");
    }
    const evidenceList = caseData.execution_evidence;
    if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
        throw new IngestError("execution_evidence must be a non-empty list");
    }
    for (const evidence of evidenceList) {
        if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
            throw new IngestError("execution_evidence entries must be objects");
        }
        requireFields(evidence, REQUIRED_EVIDENCE_FIELDS, "execution_evidence entry");
        if (!ALLOWED_EVIDENCE_TYPES.has(evidence.evidence_type)) {
            throw new IngestError(`invalid execution_evidence type: ${evidence.evidence_type}`);
        }
    }
    const proves = new Set(evidenceList.map((evidence) => evidence.proves));
    if (proves.size !== observed.length || observed.some((behavior) => !proves.has(behavior))) {
        throw new IngestError("execution_evidence proves must match observed_behaviors");
    }
}
export function normalizeCommandLog(command) {
    requireFields(command, REQUIRED_COMMAND_FIELDS, "command_log entry");
    if (!Number.isInteger(command.exit_code)) {
        throw new IngestError("command_log entry exit_code must be integer");
    }
    const stdoutText = String(command.stdout ?? command.stdout_excerpt ?? "");
    const stderrText = String(command.stderr ?? command.stderr_excerpt ?? "");
    return {
        ...command,
        stderr_excerpt: command.stderr_excerpt ?? "",
        stdout_sha256: command.stdout_sha256 ?? sha256Text(stdoutText),
        stderr_sha256: command.stderr_sha256 ?? sha256Text(stderrText),
    };
}
export function normalizeCase(rawCase) {
    const caseData = { ...rawCase };
    requireFields(caseData, REQUIRED_CASE_FIELDS, "case");
    validateCaseStatus(caseData);
    validateCaseEvidence(caseData);
    const commandLog = caseData.command_log ?? [];
    if (Array.isArray(commandLog) && commandLog.length > 0) {
        caseData.execution_depth = caseData.execution_depth ?? "real_command";
        caseData.command_log = commandLog.map(normalizeCommandLog);
        caseData.transcript = {
            source: "command_log",
            format: "command-log-v1",
            sha256: sha256Json(caseData.command_log),
            command_count: caseData.command_log.length,
        };
    }
    else {
        if (!Array.isArray(commandLog)) {
            throw new IngestError("command_log must be a list");
        }
        if (caseData.phase !== "agent_response") {
            throw new IngestError("non-agent-response cases must include command_log");
        }
        const ref = `codex_multi_agent:${caseData.agent_id ?? "unknown"}:final_response`;
        caseData.transcript = {
            source: "agent_final_response",
            format: "agent-final-response-v1",
            ref,
            sha256: sha256Json({
                ref,
                summary: caseData.summary,
                observed_behaviors: caseData.observed_behaviors,
            }),
        };
    }
    return caseData;
}
export function normalizePayload(rawPayload) {
    const rawCases = rawPayload.cases;
    if (!Array.isArray(rawCases) || rawCases.length === 0) {
        throw new IngestError("payload must contain a non-empty cases list");
    }
    const cases = rawCases.map(normalizeCase);
    return {
        schema_version: 1,
        artifact: {
            kind: "agent-pressure-ingest",
            format: "json",
            version: 1,
            generated_by: "src/cli/agent-pressure-ingest.ts",
            contains: ["normalized_cases", "command_log_hashes", "transcript_hash"],
        },
        cases,
    };
}
function buildSplitManifest(payload, options) {
    if (options.fixtureManifest) {
        if (!options.runId) {
            throw new IngestError("fixture manifest requires --run-id");
        }
        if (!options.sourceContract) {
            throw new IngestError("fixture manifest requires --source-contract");
        }
        return {
            schema_version: 2,
            run_id: options.runId,
            source_contract: options.sourceContract,
            description: FIXTURE_DESCRIPTION,
            execution_evidence_policy: EXECUTION_EVIDENCE_POLICY,
            transcript_archive_policy: TRANSCRIPT_ARCHIVE_POLICY,
            cases_dir: options.casesDir,
            case_files: options.caseFiles,
            case_count: options.caseFiles.length,
        };
    }
    const manifest = { ...payload };
    delete manifest.cases;
    manifest.cases_dir = options.casesDir;
    manifest.case_files = options.caseFiles;
    manifest.case_count = options.caseFiles.length;
    return manifest;
}
function splitCaseFilenames(cases) {
    const filenames = cases.map((caseData) => caseFilename(caseData.id));
    const duplicateFilenames = [...new Set(filenames.filter((filename) => filenames.filter((item) => item === filename).length > 1))].sort();
    if (duplicateFilenames.length > 0) {
        throw new IngestError(`duplicate case filename: ${duplicateFilenames.join(", ")}`);
    }
    return filenames.sort();
}
export function writePayload(payload, outputPath, options) {
    mkdirSync(dirname(outputPath), { recursive: true });
    if (options.fixtureManifest && !options.splitCases) {
        throw new IngestError("fixture manifest requires --split-cases");
    }
    if (!options.splitCases) {
        writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
        return;
    }
    const caseFiles = splitCaseFilenames(payload.cases);
    const caseRoot = join(dirname(outputPath), options.casesDir);
    mkdirSync(caseRoot, { recursive: true });
    const staleFiles = existsSync(caseRoot)
        ? readdirSync(caseRoot)
            .filter((name) => name.endsWith(".json") && !caseFiles.includes(name))
            .sort()
        : [];
    if (staleFiles.length > 0 && !options.pruneStale) {
        throw new IngestError(`stale split case files: ${staleFiles.join(", ")}`);
    }
    for (const staleFile of staleFiles) {
        rmSync(join(caseRoot, staleFile));
    }
    for (const caseData of payload.cases) {
        writeFileSync(join(caseRoot, caseFilename(caseData.id)), `${JSON.stringify(caseData, null, 2)}\n`, "utf8");
    }
    const manifest = buildSplitManifest(payload, {
        casesDir: options.casesDir,
        caseFiles,
        fixtureManifest: options.fixtureManifest,
        runId: options.runId,
        sourceContract: options.sourceContract,
    });
    writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
export function readJsonFile(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

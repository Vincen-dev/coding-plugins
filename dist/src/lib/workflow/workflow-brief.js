import { existsSync, readFileSync } from "node:fs";
import { checkWorkflowGuard, VALID_TARGETS } from "./workflow-guard.js";
import { artifactPath } from "./workflow-state.js";
export { VALID_TARGETS };
export function extractTaskHeadings(text) {
    const headings = [];
    for (const line of text.split(/\r?\n/)) {
        const stripped = line.trim();
        if (stripped.startsWith("## ") && stripped.includes("TASK-")) {
            headings.push(stripped.slice("## ".length).trim());
        }
    }
    return headings;
}
export function extractTaskPolicyContext(text, taskId) {
    const lines = text.split(/\r?\n/);
    const start = lines.findIndex((line) => line.trim().startsWith("## ") && line.includes(taskId));
    if (start === -1) {
        return { policyIds: [], skills: [] };
    }
    const endOffset = lines.slice(start + 1).findIndex((line) => line.trim().startsWith("## "));
    const end = endOffset === -1 ? lines.length : start + 1 + endOffset;
    const section = lines.slice(start, end);
    const contextLine = section.find((line) => /Required Policy\s*\/\s*Skill/i.test(line)) ?? "";
    const policyIds = [...new Set(contextLine.match(/\bPOL-[A-Z0-9-]+\b/g) ?? [])].sort();
    const skills = [...new Set([...contextLine.matchAll(/`([a-z0-9][a-z0-9-]+)`/gi)].map((match) => match[1]))].sort();
    return { policyIds, skills };
}
export function buildBrief(root, options) {
    const target = options.target ?? "execute";
    if (!VALID_TARGETS.has(target)) {
        throw new Error(`invalid workflow guard target: ${target}`);
    }
    const guard = checkWorkflowGuard(root, {
        feature: options.feature,
        docId: options.docId,
        target,
    });
    const nextContext = guard.next_context;
    const mustRead = nextContext.must_read;
    let taskHeadings = [];
    let planText = "";
    const planPath = artifactPath(root, { feature: options.feature, docId: options.docId, suffix: "TED" });
    if (existsSync(planPath)) {
        planText = readFileSync(planPath, "utf8");
        taskHeadings = extractTaskHeadings(planText);
    }
    const failures = [...guard.failures];
    const focusSections = [...nextContext.focus_sections];
    let requiredPolicyIds = [];
    let requiredSkills = [];
    if (options.task) {
        taskHeadings = taskHeadings.filter((heading) => heading.includes(options.task ?? ""));
        if (taskHeadings.length > 0) {
            focusSections.push(...taskHeadings.map((heading) => `## ${heading}`));
        }
        else {
            failures.push(`requested task ${options.task} was not found`);
        }
        const context = extractTaskPolicyContext(planText, options.task);
        requiredPolicyIds = context.policyIds;
        requiredSkills = context.skills;
    }
    return {
        pass: guard.pass && failures.length === 0,
        feature: options.feature,
        doc_id: options.docId,
        target,
        current_task: options.task ?? null,
        state: guard.state,
        reason: guard.reason,
        next_skill: guard.next_skill,
        failures,
        must_read: mustRead,
        may_skip: nextContext.may_skip,
        focus_sections: focusSections,
        task_headings: taskHeadings,
        required_policy_ids: requiredPolicyIds,
        required_skills: requiredSkills,
        execution_source: nextContext.execution_source,
        new_plan_policy: "create-new-ted",
    };
}
export function formatPlain(payload) {
    const lines = [
        `State: ${payload.state}`,
        `Pass: ${String(payload.pass).toLowerCase()}`,
        `Reason: ${payload.reason}`,
        `Next skill: ${payload.next_skill}`,
        "Must read:",
    ];
    lines.push(...(payload.must_read.length > 0 ? payload.must_read : ["-"]).map((path) => `- ${path}`));
    lines.push("May skip unless rewind triggers fire:");
    lines.push(...(payload.may_skip.length > 0 ? payload.may_skip : ["-"]).map((path) => `- ${path}`));
    if (payload.task_headings.length > 0) {
        lines.push("Task chapters:");
        lines.push(...payload.task_headings.map((heading) => `- ${heading}`));
    }
    if (payload.required_policy_ids.length > 0) {
        lines.push(`Required policies: ${payload.required_policy_ids.join(", ")}`);
    }
    if (payload.required_skills.length > 0) {
        lines.push(`Required skills: ${payload.required_skills.join(", ")}`);
    }
    if (payload.failures.length > 0) {
        lines.push("Failures:");
        lines.push(...payload.failures.map((failure) => `- ${failure}`));
    }
    lines.push(`Execution source: ${payload.execution_source}`);
    lines.push(`New plan policy: ${payload.new_plan_policy}`);
    return lines.join("\n");
}

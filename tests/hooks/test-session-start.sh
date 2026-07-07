#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FAILURES=0

pass() {
    printf '  [PASS] %s\n' "$1"
}

fail() {
    printf '  [FAIL] %s\n' "$1"
    FAILURES=$((FAILURES + 1))
}

assert_manifest_hooks() {
    if node - "$REPO_ROOT" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
if (manifest.hooks !== './hooks/hooks-codex.json') {
  throw new Error('Codex manifest hooks must be ./hooks/hooks-codex.json');
}
NODE
    then
        pass "Codex manifest declares hook config"
    else
        fail "Codex manifest declares hook config"
    fi
}

assert_hook_config() {
    if node - "$REPO_ROOT" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const config = JSON.parse(fs.readFileSync(path.join(root, 'hooks', 'hooks-codex.json'), 'utf8'));
const sessionStart = config.hooks.SessionStart;
const entry = sessionStart[0];
const command = entry.hooks[0].command;
if (entry.matcher !== 'startup|resume|clear') {
  throw new Error('SessionStart matcher must be startup|resume|clear');
}
if (entry.hooks[0].type !== 'command') {
  throw new Error('SessionStart hook type must be command');
}
if (entry.hooks[0].async !== false) {
  throw new Error('SessionStart hook must be synchronous');
}
if (!command.includes('${PLUGIN_ROOT}/hooks/run-hook.cmd') || !command.includes('session-start-codex')) {
  throw new Error('SessionStart command must call run-hook.cmd session-start-codex');
}
NODE
    then
        pass "Codex hook config routes SessionStart to wrapper"
    else
        fail "Codex hook config routes SessionStart to wrapper"
    fi
}

assert_session_start_output() {
    local description="$1"
    shift
    local output

    if ! output="$(env -i PATH="${PATH:-}" PLUGIN_ROOT="$REPO_ROOT" "$@" 2>&1)"; then
        fail "$description"
        printf '%s\n' "$output" | sed 's/^/    /'
        return
    fi

    if HOOK_OUTPUT="$output" node <<'NODE'
const payload = JSON.parse(process.env.HOOK_OUTPUT || '{}');
const hookOutput = payload.hookSpecificOutput;
if (!hookOutput || typeof hookOutput !== 'object') {
  throw new Error('missing hookSpecificOutput');
}
if (hookOutput.hookEventName !== 'SessionStart') {
  throw new Error('hookEventName must be SessionStart');
}
const context = hookOutput.additionalContext;
if (typeof context !== 'string' || !context.trim()) {
  throw new Error('additionalContext must be a non-empty string');
}
const required = [
  'coding-plugins:using-coding-plugins',
  'CP_CLI',
  'bin/coding-plugins.js',
  'no global coding-plugins command is required',
  'SDD',
  'TDD',
  'docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-VED.md',
  'verification-before-completion',
  'git-commit',
  'finishing-a-development-branch',
];
for (const text of required) {
  if (!context.includes(text)) {
    throw new Error(`additionalContext missing ${text}`);
  }
}
const forbidden = [
  'using-' + 'superpowers',
  'brain' + 'storming',
  'docs/coding-plugins/evidence/<feature-name>/tdd-evidence.md',
  'docs/coding-plugins/features/<feature-name>/evidences/<doc-id>-TED.md',
  'docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md',
];
for (const text of forbidden) {
  if (context.includes(text)) {
    throw new Error(`additionalContext contains removed entry ${text}`);
  }
}
NODE
    then
        pass "$description"
    else
        fail "$description"
        printf '%s\n' "$output" | sed 's/^/    /'
    fi
}

assert_unknown_wrapper_command_fails() {
    local output
    if output="$(env -i PATH="${PATH:-}" PLUGIN_ROOT="$REPO_ROOT" bash "$REPO_ROOT/hooks/run-hook.cmd" unknown-hook 2>&1)"; then
        fail "Wrapper rejects unknown hook command"
        printf '%s\n' "$output" | sed 's/^/    /'
        return
    fi
    if printf '%s' "$output" | grep -q "unknown hook command"; then
        pass "Wrapper rejects unknown hook command"
    else
        fail "Wrapper rejects unknown hook command"
        printf '%s\n' "$output" | sed 's/^/    /'
    fi
}

printf 'SessionStart hook tests\n'
assert_manifest_hooks
assert_hook_config
assert_session_start_output "Dedicated Codex hook emits SessionStart context" bash "$REPO_ROOT/hooks/session-start-codex"
assert_session_start_output "Wrapper dispatches Codex SessionStart hook" bash "$REPO_ROOT/hooks/run-hook.cmd" session-start-codex
assert_unknown_wrapper_command_fails

if [[ "$FAILURES" -gt 0 ]]; then
    printf 'STATUS: FAILED (%s failure(s))\n' "$FAILURES"
    exit 1
fi

printf 'STATUS: PASSED\n'

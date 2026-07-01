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
    if python3 - "$REPO_ROOT" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
manifest = json.loads((root / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8"))
if manifest.get("hooks") != "./hooks/hooks-codex.json":
    raise SystemExit("Codex manifest hooks must be ./hooks/hooks-codex.json")
PY
    then
        pass "Codex manifest declares hook config"
    else
        fail "Codex manifest declares hook config"
    fi
}

assert_hook_config() {
    if python3 - "$REPO_ROOT" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
config = json.loads((root / "hooks" / "hooks-codex.json").read_text(encoding="utf-8"))
session_start = config["hooks"]["SessionStart"]
entry = session_start[0]
command = entry["hooks"][0]["command"]
if entry.get("matcher") != "startup|resume|clear":
    raise SystemExit("SessionStart matcher must be startup|resume|clear")
if entry["hooks"][0].get("type") != "command":
    raise SystemExit("SessionStart hook type must be command")
if entry["hooks"][0].get("async") is not False:
    raise SystemExit("SessionStart hook must be synchronous")
if "${PLUGIN_ROOT}/hooks/run-hook.cmd" not in command or "session-start-codex" not in command:
    raise SystemExit("SessionStart command must call run-hook.cmd session-start-codex")
PY
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

    if HOOK_OUTPUT="$output" python3 - <<'PY'
import json
import os
import sys

payload = json.loads(os.environ["HOOK_OUTPUT"])
hook_output = payload.get("hookSpecificOutput")
if not isinstance(hook_output, dict):
    raise SystemExit("missing hookSpecificOutput")
if hook_output.get("hookEventName") != "SessionStart":
    raise SystemExit("hookEventName must be SessionStart")
context = hook_output.get("additionalContext")
if not isinstance(context, str) or not context.strip():
    raise SystemExit("additionalContext must be a non-empty string")
required = (
    "coding-plugins:using-coding-plugins",
    "SDD",
    "TDD",
    "docs/coding-plugins/features/<feature-name>/evidences/<feature-name>-TED.md",
    "verification-before-completion",
    "git-commit",
    "finishing-a-development-branch",
)
for text in required:
    if text not in context:
        raise SystemExit(f"additionalContext missing {text}")
for forbidden in (
    "using-" + "superpowers",
    "brain" + "storming",
    "docs/coding-plugins/evidence/<feature-name>/tdd-evidence.md",
):
    if forbidden in context:
        raise SystemExit(f"additionalContext contains removed entry {forbidden}")
PY
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

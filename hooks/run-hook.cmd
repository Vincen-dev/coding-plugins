#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
PLUGIN_ROOT_DEFAULT=$(CDPATH= cd "$SCRIPT_DIR/.." && pwd)
PLUGIN_ROOT=${PLUGIN_ROOT:-$PLUGIN_ROOT_DEFAULT}

command_name=${1:-}

case "$command_name" in
    session-start-codex)
        exec "$PLUGIN_ROOT/hooks/session-start-codex"
        ;;
    *)
        printf 'unknown hook command: %s\n' "$command_name" >&2
        exit 64
        ;;
esac

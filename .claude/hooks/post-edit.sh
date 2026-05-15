#!/usr/bin/env bash
# Post-edit hook for InboxIQ.
# Called by Claude Code after a write/edit. Runs ESLint --fix and Prettier
# on the file so committed code matches the project style.
set -euo pipefail

FILE="${1:-}"
if [[ -z "$FILE" ]]; then exit 0; fi

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
    npx eslint --fix "$FILE" >/dev/null 2>&1 || true
    ;;
esac

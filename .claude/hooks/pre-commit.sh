#!/usr/bin/env bash
# Pre-commit hook for InboxIQ.
# Runs lint + typecheck + tests before allowing a commit through.
# Intentionally fast: it does NOT run the full E2E suite.
set -euo pipefail

echo "▶ pre-commit: lint"
npm run lint --silent

echo "▶ pre-commit: typecheck"
npm run typecheck --silent

echo "▶ pre-commit: unit tests"
npm run test --silent

echo "✓ pre-commit: passed"

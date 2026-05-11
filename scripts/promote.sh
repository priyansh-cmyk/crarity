#!/usr/bin/env bash
# promote.sh — merge staging → main and push both branches
# Usage: npm run promote
# Run from repo root on the staging branch.

set -e

CURRENT=$(git branch --show-current)

if [ "$CURRENT" != "staging" ]; then
  echo "❌  Must be on the staging branch to promote. Currently on: $CURRENT"
  exit 1
fi

# Make sure staging is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌  You have uncommitted changes on staging. Commit or stash them first."
  exit 1
fi

echo "🔄  Fetching latest from origin…"
git fetch origin

echo "📦  Pushing staging → origin/staging…"
git push origin staging

echo "🔀  Switching to main…"
git checkout main

echo "⬇️   Pulling latest main…"
git pull origin main

echo "🔀  Merging staging → main…"
git merge staging --no-ff -m "chore: promote staging → main"

echo "🚀  Pushing main → origin/main (triggers Vercel production deploy)…"
git push origin main

echo "🔙  Switching back to staging…"
git checkout staging

echo ""
echo "✅  Done! Production deploy triggered on Vercel."
echo "    www.crarity.com will update in ~60 seconds."

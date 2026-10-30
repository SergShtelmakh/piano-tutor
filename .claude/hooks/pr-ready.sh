#!/usr/bin/env bash
# Runs in the background after `git push` or `gh pr create` (asyncRewake hook, see
# .claude/settings.json). Waits until the pull request of the current branch is ready to merge,
# or cannot be merged as it is, and then exits with code 2, which wakes the session. The message
# on stderr asks it to push a notification to the user's phone (PushNotification tool).
# Silent (exit 0) when there is nothing to report: not a push, no pull request, main, a timeout.

INTERVAL=30
MAX_POLLS=60 # 30 minutes

# The hook payload (JSON) arrives on stdin. Act only on a real `git push` or `gh pr create`.
# Run by hand without stdin (a terminal), the check is skipped.
if [ ! -t 0 ]; then
  payload=$(cat)
  printf '%s' "$payload" | grep -Eq '"command"[[:space:]]*:[[:space:]]*"([^"]|\\")*(git push|gh pr create)' || exit 0
fi

export PATH="$PATH:/c/Program Files/GitHub CLI"
command -v gh >/dev/null 2>&1 || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
case "$branch" in "" | HEAD | main) exit 0 ;; esac

ASK="Send the user a PushNotification about it (one line, lead with what they should do)."

# `gh pr create` may run a moment after the push: give the pull request a few tries to appear.
number=""
for _ in 1 2 3 4 5 6; do
  number=$(gh pr list --head "$branch" --state open --json number --jq '.[0].number // empty' 2>/dev/null)
  [ -n "$number" ] && break
  sleep 10
done
[ -n "$number" ] || exit 0
url=$(gh pr view "$number" --json url --jq .url 2>/dev/null)

for _ in $(seq "$MAX_POLLS"); do
  state=$(gh pr view "$number" --json state,mergeable --jq '"\(.state) \(.mergeable)"' 2>/dev/null)
  if [ "${state%% *}" != "OPEN" ] && [ -n "$state" ]; then exit 0; fi # merged or closed meanwhile
  mergeable=${state#* }

  buckets=$(gh pr checks "$number" --json bucket --jq '[.[].bucket] | join(" ")' 2>/dev/null)
  pending=$(printf '%s' "$buckets" | tr ' ' '\n' | grep -c '^pending$')
  failed=$(printf '%s' "$buckets" | tr ' ' '\n' | grep -Ec '^(fail|cancel)$')

  if [ "$failed" -gt 0 ]; then
    echo "PR #${number} has failing checks: ${url}/checks. ${ASK}" >&2
    exit 2
  fi
  if [ "$mergeable" = "CONFLICTING" ]; then
    echo "PR #${number} has merge conflicts with main: ${url}. ${ASK}" >&2
    exit 2
  fi
  if [ "$pending" -eq 0 ] && [ "$mergeable" = "MERGEABLE" ] && [ -n "$buckets" ]; then
    echo "PR #${number} is ready to merge: all checks passed, no conflicts: ${url}. ${ASK}" >&2
    exit 2
  fi
  sleep "$INTERVAL"
done
exit 0

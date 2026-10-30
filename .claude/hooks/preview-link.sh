#!/usr/bin/env bash
# Runs in the background after `git push` (asyncRewake hook, see .claude/settings.json).
# Waits for the Cloudflare "Workers Builds" check of the pushed commit and then exits with
# code 2, which wakes the session; the message on stderr tells it the preview link (or the failure).
# Silent (exit 0) when there is nothing to report: main, detached HEAD, no gh, or a timeout.

PREVIEW_HOST="piano-tutor.sh-serg1993.workers.dev" # <branch-slug>-<this host>
CHECK_NAME="Workers Builds"
INTERVAL=15
MAX_POLLS=60 # 15 minutes

# The hook payload (JSON) arrives on stdin. Act only on a real `git push`, whatever the `if` filter
# in settings.json lets through. Run by hand without stdin (a terminal), the check is skipped.
if [ ! -t 0 ]; then
  payload=$(cat)
  printf '%s' "$payload" | grep -Eq '"command"[[:space:]]*:[[:space:]]*"([^"]|\\")*git push' || exit 0
fi

export PATH="$PATH:/c/Program Files/GitHub CLI"
command -v gh >/dev/null 2>&1 || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
sha=$(git rev-parse HEAD 2>/dev/null)
case "$branch" in "" | HEAD | main) exit 0 ;; esac

# Cloudflare names the preview after the branch: lower case, every other character a dash.
slug=$(printf '%s' "$branch" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
url="https://${slug}-${PREVIEW_HOST}/"

for _ in $(seq "$MAX_POLLS"); do
  row=$(gh api "repos/{owner}/{repo}/commits/${sha}/check-runs" \
    --jq ".check_runs[] | select(.name | startswith(\"${CHECK_NAME}\")) | \"\(.status) \(.conclusion) \(.details_url)\"" 2>/dev/null | head -n 1)
  status=${row%% *}
  if [ "$status" = "completed" ]; then
    rest=${row#* }
    conclusion=${rest%% *}
    details=${rest#* }
    short=$(printf '%s' "$sha" | cut -c1-7)
    if [ "$conclusion" = "success" ]; then
      echo "Preview build of ${branch} (${short}) is ready: ${url}" >&2
    else
      echo "Preview build of ${branch} (${short}) finished with '${conclusion}': ${details}" >&2
    fi
    exit 2
  fi
  sleep "$INTERVAL"
done
exit 0

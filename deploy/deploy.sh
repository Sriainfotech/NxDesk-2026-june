#!/usr/bin/env bash
# Deploys the currently-checked-out branch of this repo to the NxDesk
# production service on this VPS. Invoked over SSH by the GitHub Actions
# workflow (.github/workflows/deploy.yml) via a forced-command deploy key,
# but safe to run by hand for a manual redeploy too.
set -euo pipefail

REPO_DIR="/srv/apps/nxdesk/repo"
BACKEND_DIR="$REPO_DIR/NxDesk-2026-june"
FRONTEND_DIR="$REPO_DIR/NxDesk-2026-june-frontend"
VENV="/srv/apps/nxdesk/venv"
BRANCH="demo"
HEALTH_URL="https://nxdesk.in/"

cd "$REPO_DIR"

OLD_HEAD=$(git rev-parse HEAD)

echo "==> Fetching origin/$BRANCH"
git fetch origin "$BRANCH"

echo "==> Fast-forwarding to origin/$BRANCH"
if ! git merge --ff-only "origin/$BRANCH"; then
    echo "FAIL: server checkout has diverged from origin/$BRANCH (local commits or uncommitted changes present)." >&2
    echo "Refusing to overwrite - resolve manually on the server, then re-run the deploy." >&2
    exit 1
fi

NEW_HEAD=$(git rev-parse HEAD)

if [ "$OLD_HEAD" = "$NEW_HEAD" ]; then
    echo "==> Already up to date at $NEW_HEAD, nothing to deploy."
    exit 0
fi

echo "==> Deploying $OLD_HEAD -> $NEW_HEAD"
CHANGED_FILES=$(git diff --name-only "$OLD_HEAD" "$NEW_HEAD")
echo "$CHANGED_FILES"

if echo "$CHANGED_FILES" | grep -q "^NxDesk-2026-june/requirements.txt$"; then
    echo "==> requirements.txt changed - installing backend dependencies"
    "$VENV/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
fi

cd "$BACKEND_DIR"
set -a
source .env
set +a

echo "==> Running database migrations"
"$VENV/bin/python" manage.py migrate --noinput

if echo "$CHANGED_FILES" | grep -qE "^NxDesk-2026-june-frontend/(src/|public/|package.*\.json)"; then
    echo "==> Frontend changed - installing deps and rebuilding"
    cd "$FRONTEND_DIR"
    # --legacy-peer-deps: react-scripts@5's peer dependency declarations
    # conflict with npm's strict resolver even when the installed versions
    # are actually compatible (confirmed directly - npm ci alone fails with
    # an ERESOLVE error here, npm ci --legacy-peer-deps succeeds cleanly).
    # Without this, npm ci aborts the whole deploy (set -euo pipefail)
    # before the build ever runs, silently leaving the old build in place.
    npm ci --legacy-peer-deps
    npm run build
    cd "$BACKEND_DIR"
fi

echo "==> Collecting static files"
"$VENV/bin/python" manage.py collectstatic --noinput

echo "==> Restarting services"
sudo /usr/bin/systemctl restart nxdesk-web.service
sudo /usr/bin/systemctl restart nxdesk-celery.service

echo "==> Waiting for service to come up"
sleep 3

echo "==> Health check: $HEALTH_URL"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$HEALTH_URL")
if [ "$HTTP_CODE" != "200" ]; then
    echo "FAIL: health check returned HTTP $HTTP_CODE (expected 200)." >&2
    exit 1
fi

echo "==> Deploy succeeded: $OLD_HEAD -> $NEW_HEAD"

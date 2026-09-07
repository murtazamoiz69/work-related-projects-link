#!/bin/sh
set -eu

require_var() {
  eval "val=\${$1:-}"
  if [ -z "$val" ]; then
    echo "$1 is required" >&2
    exit 1
  fi
}

APP="${APP:-nws-app}"
CONTAINER="${CONTAINER:-nws-app}"
IMAGE_NAME="${IMAGE_NAME:-nws-app}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-nws-app}"
RESTART_ONLY="${RESTART_ONLY:-false}"
ROLLBACK_SHA="${ROLLBACK_SHA:-}"
SHA="${ROLLBACK_SHA:-${CI_COMMIT_SHA:-}}"
ROOT="${CI_PROJECT_DIR:-.}"
DEPLOY_PATH="${DEPLOY_PATH:-${HOME}/nws-app}"
ENV_FILE="${ENV_FILE:-}"
export IMAGE_NAME IMAGE_TAG COMPOSE_PROJECT_NAME

if [ "$RESTART_ONLY" = "true" ]; then
  echo "Restarting ${CONTAINER}"
  docker restart "$CONTAINER"
  docker ps --filter "name=^${CONTAINER}$"
  exit 0
fi

require_var SHA

echo "Deploying ${APP} @ ${SHA} from ${ROOT}"

umask 077
mkdir -p "$DEPLOY_PATH"
if [ -n "$ENV_FILE" ]; then
  if [ -f "$ENV_FILE" ]; then
    tr -d '\r' < "$ENV_FILE" > "$DEPLOY_PATH/.env"
  else
    printf '%s\n' "$ENV_FILE" | tr -d '\r' > "$DEPLOY_PATH/.env"
  fi
  chmod 600 "$DEPLOY_PATH/.env"
fi
if [ ! -f "$DEPLOY_PATH/.env" ]; then
  echo "ENV_FILE is missing. Uncheck Protect variable and Run a new pipeline." >&2
  exit 1
fi
cp "$DEPLOY_PATH/.env" "$ROOT/.env"
chmod 600 "$ROOT/.env"

if [ -n "$ROLLBACK_SHA" ]; then
  git -C "$ROOT" fetch --depth 1 origin "$SHA"
  git -C "$ROOT" checkout --detach FETCH_HEAD
fi

cd "$ROOT"

if ! docker info >/dev/null 2>&1; then
  echo "gitlab-runner cannot use Docker (permission denied on /var/run/docker.sock)." >&2
  echo "On the runner host run:" >&2
  echo "  sudo usermod -aG docker gitlab-runner" >&2
  echo "  sudo systemctl restart gitlab-runner" >&2
  exit 1
fi

if docker inspect "$CONTAINER" >/dev/null 2>&1; then
  docker inspect -f '{{.Config.Image}}' "$CONTAINER" > "$ROOT/$APP.previous"
fi
OLD_IMAGE_ID="$(docker images -q "${IMAGE_NAME}:${IMAGE_TAG}" 2>/dev/null || true)"

docker compose -f "$COMPOSE_FILE" build app
docker compose -f "$COMPOSE_FILE" up -d --no-build --force-recreate --no-deps app

echo "${IMAGE_NAME}:${IMAGE_TAG}" > "$ROOT/$APP.current"

NEW_IMAGE_ID="$(docker images -q "${IMAGE_NAME}:${IMAGE_TAG}")"
if [ -n "${OLD_IMAGE_ID:-}" ] && [ "$OLD_IMAGE_ID" != "$NEW_IMAGE_ID" ]; then
  docker rmi "$OLD_IMAGE_ID" 2>/dev/null || true
fi
docker images -q "$IMAGE_NAME" | sort -u | while read -r id; do
  [ "$id" = "$NEW_IMAGE_ID" ] && continue
  docker rmi "$id" 2>/dev/null || true
done

docker ps --filter "name=^${CONTAINER}$"

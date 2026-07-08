#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/Backend"
FRONTEND_DIR="$ROOT_DIR/Frontend"
LOG_DIR="$ROOT_DIR/.tmp"
mkdir -p "$LOG_DIR"

pick_backend_port() {
  if [[ -n "${BACKEND_PORT:-}" ]]; then
    echo "$BACKEND_PORT"
    return
  fi

  for port in 8082 18082 28082 38082 48082; do
    if ! lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$port"
      return
    fi
  done

  echo "8082"
}

BACKEND_PORT="$(pick_backend_port)"

BACKEND_PID=""
CLOUDFLARED_PID=""
cleanup() {
  if [[ -n "${CLOUDFLARED_PID}" ]] && kill -0 "$CLOUDFLARED_PID" 2>/dev/null; then
    kill "$CLOUDFLARED_PID" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting backend on port $BACKEND_PORT..."
(
  cd "$BACKEND_DIR"
  APP_CORS_ALLOWED_ORIGINS='*' PORT="$BACKEND_PORT" mvn spring-boot:run
) >"$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend on port $BACKEND_PORT..."
until nc -z 127.0.0.1 "$BACKEND_PORT" >/dev/null 2>&1; do
  sleep 1
done

echo "Starting Cloudflare tunnel..."
CLOUDFLARED_LOG="$LOG_DIR/cloudflared.log"
cloudflared tunnel --url "http://127.0.0.1:$BACKEND_PORT" --no-autoupdate >"$CLOUDFLARED_LOG" 2>&1 &
CLOUDFLARED_PID=$!

TUNNEL_URL=""
echo "Waiting for tunnel URL..."
while [[ -z "$TUNNEL_URL" ]]; do
  TUNNEL_URL="$(grep -Eo 'https://[^[:space:]]+trycloudflare\.com' "$CLOUDFLARED_LOG" 2>/dev/null | head -n 1 || true)"
done

echo "Tunnel ready: $TUNNEL_URL"
echo "Starting frontend with tunnel env..."

cd "$FRONTEND_DIR"
VITE_API_BASE_URL="$TUNNEL_URL" VITE_WS_URL="${TUNNEL_URL/https:/wss:}/chat/chat" npm run dev -- --host 0.0.0.0
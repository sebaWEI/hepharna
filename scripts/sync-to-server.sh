#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 ubuntu@YOUR_DROPLET_IP"
  echo "Example: $0 ubuntu@167.99.0.1"
  exit 1
fi

HOST="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${HEPHA_REMOTE_DIR:-/hepharna}"

rsync -avz --delete \
  --exclude '.venv/' \
  --exclude 'node_modules/' \
  --exclude 'frontend/node_modules/' \
  --exclude 'frontend/dist/' \
  --exclude 'backend/data/' \
  --exclude 'backend/__pycache__/' \
  --exclude 'backups/' \
  --exclude '.env' \
  --exclude '.git/' \
  "$ROOT/" "$HOST:$REMOTE/"

echo
echo "Synced to $HOST:$REMOTE"
echo "Next: SSH in and follow README Digital Ocean steps."

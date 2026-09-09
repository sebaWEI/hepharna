#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "$ROOT/backend/requirements.txt" ]]; then
  echo "Run this from the HEPHA-RNA project. Expected path: /hepharna"
  exit 1
fi

if [[ ! -d "$ROOT/.venv" ]]; then
  python3 -m venv "$ROOT/.venv"
fi
"$ROOT/.venv/bin/pip" install -U pip
"$ROOT/.venv/bin/pip" install -r "$ROOT/backend/requirements.txt"

if [[ ! -f "$ROOT/.env" ]]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  SECRET="$("$ROOT/.venv/bin/python" -c 'import secrets; print(secrets.token_urlsafe(48))')"
  if grep -q '^JWT_SECRET=' "$ROOT/.env"; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${SECRET}|" "$ROOT/.env"
  else
    echo "JWT_SECRET=${SECRET}" >> "$ROOT/.env"
  fi
  echo "Created $ROOT/.env and generated JWT_SECRET."
fi

cd "$ROOT/frontend"
if [[ ! -d node_modules ]]; then
  npm install
fi
npm run build

echo
echo "Build done. Next:"
echo "  1. Edit $ROOT/.env and set FRONTEND_URL=http://YOUR_DROPLET_IP:3000"
echo "  2. sudo cp $ROOT/deploy/hepha-rna.service /etc/systemd/system/hepha-rna.service"
echo "  3. sudo systemctl daemon-reload && sudo systemctl enable --now hepha-rna"
echo "  4. cd $ROOT/backend && ../.venv/bin/python -m app.create_admin"

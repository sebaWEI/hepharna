#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "$ROOT/backend/requirements.txt" ]]; then
  echo "Run this inside the HEPHA-RNA project directory."
  exit 1
fi

if ! python3 -m venv --help >/dev/null 2>&1; then
  echo "Installing python3-venv..."
  apt-get update
  apt-get install -y python3-venv python3-pip
fi

venv_ok=0
if [[ -x "$ROOT/.venv/bin/python" ]] && "$ROOT/.venv/bin/python" -c 'import sys; raise SystemExit(sys.platform != "linux")'; then
  venv_ok=1
fi

if [[ "$venv_ok" -ne 1 ]]; then
  echo "Creating a Linux virtualenv at $ROOT/.venv"
  rm -rf "$ROOT/.venv"
  python3 -m venv "$ROOT/.venv"
fi

"$ROOT/.venv/bin/python" -m pip install -U pip
"$ROOT/.venv/bin/python" -m pip install -r "$ROOT/backend/requirements.txt"

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

SERVICE_USER="$(id -un)"
cat > "$ROOT/deploy/hepha-rna.service" <<EOF
[Unit]
Description=HEPHA-RNA Design Challenge
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${ROOT}/backend
EnvironmentFile=${ROOT}/.env
ExecStart=${ROOT}/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

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

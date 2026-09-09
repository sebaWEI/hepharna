from __future__ import annotations

import shutil
from datetime import datetime, timezone
from pathlib import Path

from app.config import PROJECT_ROOT, get_settings


def backup_database() -> Path:
    settings = get_settings()
    source = settings.sqlite_path()
    if not source.exists():
        raise SystemExit(f"Database not found: {source}")
    backup_dir = Path(settings.backup_dir)
    if not backup_dir.is_absolute():
        backup_dir = (PROJECT_ROOT / backup_dir).resolve()
    backup_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).astimezone().strftime("%H%M")
    target = backup_dir / f"backup_{stamp}.sqlite"
    shutil.copy2(source, target)
    print(f"Backup written to {target}")
    return target


if __name__ == "__main__":
    backup_database()

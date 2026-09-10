from pathlib import Path
import re
import uuid

from fastapi import HTTPException, UploadFile

from app.config import BACKEND_DIR

STRUCTURE_DIR = BACKEND_DIR / "data" / "structures"
ALLOWED_SUFFIXES = {".pdb", ".cif", ".mmcif"}
MAX_STRUCTURE_BYTES = 25 * 1024 * 1024


def structure_dir() -> Path:
    STRUCTURE_DIR.mkdir(parents=True, exist_ok=True)
    return STRUCTURE_DIR


def sanitize_filename(name: str) -> str:
    base = Path(name).name
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", base).strip("._")
    return cleaned or "structure.pdb"


def resolve_structure_path(relative: str | None) -> Path | None:
    if not relative:
        return None
    path = (BACKEND_DIR / relative).resolve()
    root = structure_dir().resolve()
    if not str(path).startswith(str(root)):
        return None
    return path if path.is_file() else None


async def save_structure_upload(design_id: str, upload: UploadFile) -> tuple[str, str]:
    """Save an uploaded structure. Returns (original_filename, relative_path)."""
    original = sanitize_filename(upload.filename or "structure.pdb")
    suffix = Path(original).suffix.lower()
    if suffix == ".mmcif":
        suffix = ".cif"
        original = Path(original).with_suffix(".cif").name
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=400, detail="Only .pdb and .cif structure files are allowed.")

    raw = await upload.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Structure file is empty.")
    if len(raw) > MAX_STRUCTURE_BYTES:
        raise HTTPException(status_code=400, detail="Structure file is too large (max 25 MB).")

    stored_name = f"{design_id}-{uuid.uuid4().hex[:8]}{suffix}"
    absolute = structure_dir() / stored_name
    absolute.write_bytes(raw)
    relative = f"data/structures/{stored_name}"
    return original, relative


def delete_structure_file(relative: str | None) -> None:
    path = resolve_structure_path(relative)
    if path and path.is_file():
        path.unlink(missing_ok=True)

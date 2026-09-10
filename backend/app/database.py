from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import BACKEND_DIR, get_settings


class Base(DeclarativeBase):
    pass


def _sqlite_url() -> str:
    settings = get_settings()
    db_path = settings.sqlite_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{db_path}"


def build_engine(url: str | None = None):
    connect_url = url or _sqlite_url()
    connect_args = {}
    if connect_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    engine = create_engine(connect_url, connect_args=connect_args, future=True)

    if connect_url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def _set_sqlite_pragma(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


engine = build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _column_names(table: str) -> set[str]:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}


def _ensure_column(table: str, column: str, ddl: str) -> None:
    if column in _column_names(table):
        return
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl}"))


def migrate_schema() -> None:
    """Add columns introduced after the first release (SQLite has no Alembic yet)."""
    if not str(engine.url).startswith("sqlite"):
        return
    existing = {row[0] for row in engine.connect().execute(text(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ))}
    if "users" in existing:
        _ensure_column("users", "email", "email VARCHAR(255)")
    if "designs" in existing:
        _ensure_column("designs", "name", "name VARCHAR(80)")
        _ensure_column("designs", "structure_filename", "structure_filename VARCHAR(255)")
        _ensure_column("designs", "structure_path", "structure_path VARCHAR(512)")


def init_db() -> None:
    from app import models  # noqa: F401

    Path(BACKEND_DIR / "data").mkdir(parents=True, exist_ok=True)
    Path(BACKEND_DIR / "data" / "structures").mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    migrate_schema()

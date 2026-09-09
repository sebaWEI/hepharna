from datetime import datetime
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./data/hepha_rna.sqlite"
    jwt_secret: str = Field(default="")
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 12
    frontend_url: str = "http://localhost:3000"

    min_rna_length: int = 10
    max_rna_length: int = 250
    max_submissions_per_user: int = 5
    reference_rna_sequence: str = (
        "CAGUGCUAGAGGAGGUCAGAAGAGGGCAUUGGAUCCCCCAGAACUGGAGUUAUACGGUAACCUC"
        "GUGGUGGUGCGCAGCCACCAUGUGGAUGGAUAUUGAGUUCCAAACACUGGUCCUGUGCAAGAGC"
        "AUCCAGUGCUCUUAAGUGCUGAGCCAUCUCUUUAGCUCC"
    )

    challenge_start_time: datetime | None = None
    challenge_end_time: datetime | None = None

    minecraft_server_address: str = ""
    minecraft_info: str = ""

    backup_dir: str = "../backups"
    serve_frontend: bool = True

    @field_validator("challenge_start_time", "challenge_end_time", mode="before")
    @classmethod
    def empty_datetime(cls, value):
        if value in ("", None):
            return None
        return value

    @field_validator("jwt_secret", mode="before")
    @classmethod
    def strip_secret(cls, value):
        if value is None:
            return ""
        return str(value).strip()

    @field_validator("reference_rna_sequence", mode="before")
    @classmethod
    def normalize_reference(cls, value):
        if not value:
            return value
        return "".join(str(value).split()).upper()

    def sqlite_path(self) -> Path:
        url = self.database_url
        if not url.startswith("sqlite:///"):
            raise ValueError("Only SQLite is supported in this MVP")
        raw = url.removeprefix("sqlite:///")
        path = Path(raw)
        if not path.is_absolute():
            path = (BACKEND_DIR / path).resolve()
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()

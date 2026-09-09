from collections.abc import Generator
import os

os.environ.setdefault("JWT_SECRET", "test-secret-not-for-production")
os.environ.setdefault("MAX_SUBMISSIONS_PER_USER", "3")
os.environ.setdefault("MIN_RNA_LENGTH", "10")
os.environ.setdefault("MAX_RNA_LENGTH", "100")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.auth.passwords import hash_password
from app.config import get_settings
from app.database import Base, get_db
from app.main import app
from app.models import User
from app.services.ids import next_participant_id


@pytest.fixture
def settings(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.setenv("JWT_SECRET", "test-secret-not-for-production")
    monkeypatch.setenv("DATABASE_URL", "sqlite://")
    monkeypatch.setenv("MIN_RNA_LENGTH", "10")
    monkeypatch.setenv("MAX_RNA_LENGTH", "100")
    monkeypatch.setenv("MAX_SUBMISSIONS_PER_USER", "3")
    monkeypatch.setenv("CHALLENGE_START_TIME", "")
    monkeypatch.setenv("CHALLENGE_END_TIME", "")
    get_settings.cache_clear()
    yield get_settings()
    get_settings.cache_clear()


@pytest.fixture
def db_engine(settings, monkeypatch):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db() -> Generator[Session, None, None]:
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr("app.database.SessionLocal", TestingSession)
    yield engine, TestingSession
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_engine, settings) -> TestClient:
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client


@pytest.fixture
def db_session(db_engine) -> Generator[Session, None, None]:
    _engine, TestingSession = db_engine
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def register_user(client: TestClient, username: str, password: str = "secret123") -> dict:
    response = client.post(
        "/api/auth/register",
        json={"username": username, "password": password, "confirm_password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


def create_admin_user(db: Session, username: str = "admin", password: str = "adminpass") -> User:
    user = User(
        username=username,
        password_hash=hash_password(password),
        role="admin",
        participant_id=next_participant_id(db),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


VALID_RNA = "AUGCCAGUCCAGUACGAUCG"

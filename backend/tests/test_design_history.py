import pytest
from sqlalchemy import create_engine, text

from app.config import get_settings
from app import database
from tests.conftest import VALID_RNA, auth_header, create_admin_user, register_user


def test_named_version_and_leaderboard_survive_new_draft(client, db_session):
    headers = auth_header(register_user(client, "Alice")["access_token"])
    original = client.post("/api/designs", json={"sequence": VALID_RNA, "name": "  茎环一号  "}, headers=headers).json()
    assert original["name"] == "茎环一号"
    pk = original["id"]
    assert client.post(f"/api/designs/{pk}/submit", headers=headers).status_code == 200
    create_admin_user(db_session)
    admin = auth_header(client.post("/api/auth/login", json={"username": "admin", "password": "adminpass"}).json()["access_token"])
    assert client.post(f"/api/admin/submissions/{pk}/score", json={"plddt": 0.9, "iptm": 0.8}, headers=admin).status_code == 200
    assert client.post(f"/api/admin/submissions/{pk}/publish", headers=admin).status_code == 200
    before = client.get(f"/api/designs/{pk}", headers=headers).json()
    other = client.post("/api/designs", json={"sequence": "G" + VALID_RNA[1:], "name": "未完成的草稿"}, headers=headers).json()
    copied = client.post("/api/designs", json={"sequence": original["sequence"], "name": original["name"], "new_draft": True}, headers=headers).json()
    assert copied["id"] not in (pk, other["id"])
    assert copied["version"] > other["version"] > original["version"]
    assert copied["score"] is None and copied["status"] == "draft"
    assert copied["sequence"] == original["sequence"]
    assert client.get(f"/api/designs/{other['id']}", headers=headers).json() == other
    changed = client.put(f"/api/designs/{copied['id']}", json={"sequence": "U" + VALID_RNA[1:], "name": "茎环二号"}, headers=headers)
    assert changed.status_code == 200
    assert client.post(f"/api/designs/{copied['id']}/submit", headers=headers).status_code == 200
    assert client.get(f"/api/designs/{pk}", headers=headers).json() == before
    history = client.get("/api/me/designs", headers=headers).json()
    assert {d["name"] for d in history} == {"茎环一号", "茎环二号", "未完成的草稿"}
    entry = client.get("/api/leaderboard").json()["entries"][0]
    assert entry["name"] == "茎环一号"
    assert entry["design_id"] == original["design_id"]
    assert entry["score"] == 0.85


def test_optional_name_validation_and_legacy_updates(client):
    headers = auth_header(register_user(client, "Alice")["access_token"])
    created = client.post("/api/designs", json={"sequence": VALID_RNA}, headers=headers).json()
    assert created["name"] is None
    pk = created["id"]
    for invalid in ["x" * 81, 123, {"name": "bad"}]:
        response = client.put(f"/api/designs/{pk}", json={"sequence": VALID_RNA, "name": invalid}, headers=headers)
        assert response.status_code == 422
    valid = client.put(f"/api/designs/{pk}", json={"sequence": VALID_RNA, "name": "测" * 80}, headers=headers)
    assert valid.status_code == 200
    assert valid.json()["name"] == "测" * 80
    legacy = client.put(f"/api/designs/{pk}", json={"sequence": VALID_RNA}, headers=headers).json()
    assert legacy["name"] == "测" * 80
    upsert = client.post("/api/designs", json={"sequence": VALID_RNA}, headers=headers).json()
    assert upsert["name"] == legacy["name"]
    cleared = client.put(f"/api/designs/{pk}", json={"sequence": VALID_RNA, "name": "   "}, headers=headers).json()
    assert cleared["name"] is None


def test_historical_preview_is_private_and_ignores_new_length_limits(client, monkeypatch):
    headers = auth_header(register_user(client, "Alice")["access_token"])
    created = client.post("/api/designs", json={"sequence": VALID_RNA, "name": "历史结构"}, headers=headers).json()
    pk = created["id"]
    other = auth_header(register_user(client, "Bob")["access_token"])
    assert client.get(f"/api/designs/{pk}/fold").status_code == 401
    assert client.get(f"/api/designs/{pk}/fold", headers=other).status_code == 403
    assert client.get("/api/designs/999999/fold", headers=headers).status_code == 404
    monkeypatch.setenv("MAX_RNA_LENGTH", "10")
    get_settings.cache_clear()
    response = client.get(f"/api/designs/{pk}/fold", headers=headers)
    assert response.status_code == 200, response.text
    folded = response.json()
    assert folded["sequence"] == VALID_RNA
    assert len(folded["residues"]) == len(VALID_RNA)
    assert len(folded["structure"]) == len(VALID_RNA)
    assert client.get(f"/api/designs/{pk}", headers=headers).json() == created


def test_preview_failure_is_reported(client, monkeypatch):
    headers = auth_header(register_user(client, "Alice")["access_token"])
    pk = client.post("/api/designs", json={"sequence": VALID_RNA}, headers=headers).json()["id"]
    def fail(*args, **kwargs):
        raise RuntimeError("calculation failed")
    monkeypatch.setattr("app.routers.designs.fold_sequence", fail)
    response = client.get(f"/api/designs/{pk}/fold", headers=headers)
    assert response.status_code == 500
    assert response.json()["detail"] == "Could not fold this sequence. Please try again."


def test_old_database_adds_name_without_losing_records(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.sqlite'}")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE designs (id INTEGER PRIMARY KEY, sequence TEXT)"))
        conn.execute(text("INSERT INTO designs VALUES (1, 'AUGC')"))
    monkeypatch.setattr(database, "engine", engine)
    database.migrate_schema()
    database.migrate_schema()
    with engine.connect() as conn:
        assert conn.execute(text("SELECT sequence, name FROM designs WHERE id=1")).one() == ("AUGC", None)
    engine.dispose()

from datetime import datetime, timedelta, timezone

from tests.conftest import VALID_RNA, auth_header, register_user
from app.config import get_settings


def _create_and_submit(client, token, sequence=VALID_RNA):
    created = client.post("/api/designs", json={"sequence": sequence}, headers=auth_header(token))
    assert created.status_code == 200
    design_id = created.json()["id"]
    submitted = client.post(f"/api/designs/{design_id}/submit", headers=auth_header(token))
    return submitted


def test_submit_design(client):
    token = register_user(client, "Alice")["access_token"]
    response = _create_and_submit(client, token)
    assert response.status_code == 200
    body = response.json()
    assert body["message"].startswith("Design submitted")
    assert body["design"]["status"] == "submitted"
    assert body["design"]["design_id"].startswith("HEPHA-D")
    assert body["design"]["submitted_at"]


def test_cannot_edit_submitted_design(client):
    token = register_user(client, "Alice")["access_token"]
    submitted = _create_and_submit(client, token)
    design_id = submitted.json()["design"]["id"]
    response = client.put(
        f"/api/designs/{design_id}",
        json={"sequence": VALID_RNA.replace("A", "U")},
        headers=auth_header(token),
    )
    assert response.status_code == 400


def test_duplicate_submit_is_rejected(client):
    token = register_user(client, "Alice")["access_token"]
    first = _create_and_submit(client, token)
    design_id = first.json()["design"]["id"]
    second = client.post(f"/api/designs/{design_id}/submit", headers=auth_header(token))
    assert second.status_code == 400


def test_submission_limit(client):
    token = register_user(client, "Alice")["access_token"]
    for index in range(3):
        sequence = ("AUGC" * 4)[:10 + index] + "G" * (10 - ((10 + index) % 10 or 10))
        sequence = (VALID_RNA[: 10 + index]).ljust(10, "A")
        if index == 0:
            sequence = VALID_RNA
        elif index == 1:
            sequence = "U" + VALID_RNA[1:]
        else:
            sequence = "G" + VALID_RNA[1:]
        response = _create_and_submit(client, token, sequence)
        assert response.status_code == 200, response.text
    blocked = _create_and_submit(client, token, "C" + VALID_RNA[1:])
    assert blocked.status_code == 400
    assert "submission limit" in blocked.json()["detail"]


def test_user_cannot_read_other_design(client):
    alice = register_user(client, "Alice")["access_token"]
    bob = register_user(client, "Bob")["access_token"]
    created = client.post("/api/designs", json={"sequence": VALID_RNA}, headers=auth_header(alice))
    design_id = created.json()["id"]
    response = client.get(f"/api/designs/{design_id}", headers=auth_header(bob))
    assert response.status_code == 403


def test_user_cannot_submit_score(client):
    token = register_user(client, "Alice")["access_token"]
    created = client.post(
        "/api/designs",
        json={"sequence": VALID_RNA, "score": 99.99},
        headers=auth_header(token),
    )
    assert created.status_code == 200
    assert created.json()["score"] is None


def test_challenge_end_blocks_submit(client, monkeypatch):
    token = register_user(client, "Alice")["access_token"]
    created = client.post("/api/designs", json={"sequence": VALID_RNA}, headers=auth_header(token))
    design_id = created.json()["id"]
    ended = datetime.now(timezone.utc) - timedelta(minutes=1)
    get_settings.cache_clear()
    monkeypatch.setenv("CHALLENGE_END_TIME", ended.isoformat())
    get_settings.cache_clear()
    response = client.post(f"/api/designs/{design_id}/submit", headers=auth_header(token))
    assert response.status_code == 400
    assert "ended" in response.json()["detail"].lower()
    get_settings.cache_clear()

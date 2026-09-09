from tests.conftest import VALID_RNA, auth_header, create_admin_user, register_user


def _admin_token(client, db_session):
    create_admin_user(db_session, "admin", "adminpass")
    return client.post(
        "/api/auth/login", json={"username": "admin", "password": "adminpass"}
    ).json()["access_token"]


def _publish(client, admin, username, sequence, score):
    token = register_user(client, username)["access_token"]
    created = client.post("/api/designs", json={"sequence": sequence}, headers=auth_header(token))
    submitted = client.post(
        f"/api/designs/{created.json()['id']}/submit",
        headers=auth_header(token),
    )
    pk = submitted.json()["design"]["id"]
    client.post(
        f"/api/admin/submissions/{pk}/score",
        json={"overall_score": score},
        headers=auth_header(admin),
    )
    client.post(f"/api/admin/submissions/{pk}/publish", headers=auth_header(admin))
    return pk


def test_leaderboard_sorts_high_score_first(client, db_session):
    admin = _admin_token(client, db_session)
    _publish(client, admin, "Alice", VALID_RNA, 94.82)
    _publish(client, admin, "Bob", "U" + VALID_RNA[1:], 92.31)
    _publish(client, admin, "Carol", "G" + VALID_RNA[1:], 91.77)
    board = client.get("/api/leaderboard?limit=20").json()["entries"]
    assert [row["username"] for row in board] == ["Alice", "Bob", "Carol"]
    assert [row["rank"] for row in board] == [1, 2, 3]


def test_pending_not_on_leaderboard(client, db_session):
    admin = _admin_token(client, db_session)
    token = register_user(client, "Alice")["access_token"]
    created = client.post("/api/designs", json={"sequence": VALID_RNA}, headers=auth_header(token))
    client.post(f"/api/designs/{created.json()['id']}/submit", headers=auth_header(token))
    board = client.get("/api/leaderboard").json()["entries"]
    assert board == []
    _ = admin


def test_tie_break_earlier_publish_wins(client, db_session):
    admin = _admin_token(client, db_session)
    first = _publish(client, admin, "Alice", VALID_RNA, 90.0)
    second = _publish(client, admin, "Bob", "U" + VALID_RNA[1:], 90.0)
    board = client.get("/api/leaderboard").json()["entries"]
    assert [row["username"] for row in board] == ["Alice", "Bob"]
    assert first != second


def test_export_csv(client, db_session):
    admin = _admin_token(client, db_session)
    _publish(client, admin, "Alice", VALID_RNA, 94.82)
    response = client.get("/api/admin/export", headers=auth_header(admin))
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    text = response.text
    assert "design_id,participant_id,nickname,sequence,status,score,submitted_at" in text
    assert "Alice" in text
    assert "94.82" in text

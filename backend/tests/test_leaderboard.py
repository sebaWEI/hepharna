from tests.conftest import VALID_RNA, auth_header, create_admin_user, register_user


def _admin_token(client, db_session):
    create_admin_user(db_session, "admin", "adminpass")
    return client.post(
        "/api/auth/login", json={"username": "admin", "password": "adminpass"}
    ).json()["access_token"]


def _publish(client, admin, username, sequence, plddt, iptm):
    token = register_user(client, username)["access_token"]
    created = client.post("/api/designs", json={"sequence": sequence}, headers=auth_header(token))
    submitted = client.post(
        f"/api/designs/{created.json()['id']}/submit",
        headers=auth_header(token),
    )
    pk = submitted.json()["design"]["id"]
    client.post(
        f"/api/admin/submissions/{pk}/score",
        json={"plddt": plddt, "iptm": iptm},
        headers=auth_header(admin),
    )
    client.post(f"/api/admin/submissions/{pk}/publish", headers=auth_header(admin))
    return pk


def test_leaderboard_sorts_high_score_first(client, db_session):
    admin = _admin_token(client, db_session)
    _publish(client, admin, "Alice", VALID_RNA, 0.9482, 0.9482)
    _publish(client, admin, "Bob", "U" + VALID_RNA[1:], 0.9231, 0.9231)
    _publish(client, admin, "Carol", "G" + VALID_RNA[1:], 0.9177, 0.9177)
    board = client.get("/api/leaderboard?limit=20").json()["entries"]
    assert [row["username"] for row in board] == ["Alice", "Bob", "Carol"]
    assert [row["rank"] for row in board] == [1, 2, 3]


def test_leaderboard_uses_total_not_single_metric(client, db_session):
    admin = _admin_token(client, db_session)
    _publish(client, admin, "Alice", VALID_RNA, 1.0, 0.6)
    _publish(client, admin, "Bob", "U" + VALID_RNA[1:], 0.7, 1.0)
    board = client.get("/api/leaderboard").json()["entries"]
    assert [row["username"] for row in board] == ["Bob", "Alice"]
    assert board[0]["score"] == 0.85
    assert board[0]["plddt"] == 0.7
    assert board[0]["iptm"] == 1.0


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
    first = _publish(client, admin, "Alice", VALID_RNA, 0.9, 0.9)
    second = _publish(client, admin, "Bob", "U" + VALID_RNA[1:], 0.9, 0.9)
    board = client.get("/api/leaderboard").json()["entries"]
    assert [row["username"] for row in board] == ["Alice", "Bob"]
    assert first != second


def test_export_csv(client, db_session):
    admin = _admin_token(client, db_session)
    _publish(client, admin, "Alice", VALID_RNA, 0.9, 0.8)
    response = client.get("/api/admin/export", headers=auth_header(admin))
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    text = response.text
    assert "email" in text
    assert "alice@example.com" in text
    assert "0.900000" in text
    assert "0.800000" in text
    assert "0.850000" in text

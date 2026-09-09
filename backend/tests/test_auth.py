from tests.conftest import auth_header, register_user


def test_register_and_login(client):
    created = register_user(client, "Alice")
    assert created["user"]["username"] == "Alice"
    assert created["user"]["participant_id"].startswith("HEPHA-")
    assert created["user"]["role"] == "user"
    assert created["access_token"]

    me = client.get("/api/auth/me", headers=auth_header(created["access_token"]))
    assert me.status_code == 200
    assert me.json()["username"] == "Alice"

    login = client.post("/api/auth/login", json={"username": "Alice", "password": "secret123"})
    assert login.status_code == 200
    assert login.json()["user"]["participant_id"] == created["user"]["participant_id"]


def test_wrong_password(client):
    register_user(client, "Alice")
    response = client.post("/api/auth/login", json={"username": "Alice", "password": "nope"})
    assert response.status_code == 401


def test_duplicate_username(client):
    register_user(client, "Alice")
    response = client.post(
        "/api/auth/register",
        json={"username": "Alice", "password": "secret123", "confirm_password": "secret123"},
    )
    assert response.status_code == 400


def test_unauthenticated_challenge_routes(client):
    assert client.get("/api/me").status_code == 401
    assert client.post("/api/designs", json={"sequence": "AUGCCAGUCCAGUACGAUCG"}).status_code == 401


def test_user_cannot_access_admin(client):
    token = register_user(client, "Alice")["access_token"]
    response = client.get("/api/admin/dashboard", headers=auth_header(token))
    assert response.status_code == 403
    assert "permission" in response.json()["detail"].lower()


def test_participant_ids_are_unique(client):
    first = register_user(client, "Alice")["user"]["participant_id"]
    second = register_user(client, "Bob")["user"]["participant_id"]
    assert first != second

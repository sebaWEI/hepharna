from tests.conftest import VALID_RNA, auth_header, create_admin_user, register_user


def _admin_token(client, db_session):
    create_admin_user(db_session, "admin", "adminpass")
    response = client.post("/api/auth/login", json={"username": "admin", "password": "adminpass"})
    assert response.status_code == 200
    return response.json()["access_token"]


def _submit_as_user(client, username="Alice"):
    token = register_user(client, username)["access_token"]
    created = client.post("/api/designs", json={"sequence": VALID_RNA}, headers=auth_header(token))
    submitted = client.post(
        f"/api/designs/{created.json()['id']}/submit",
        headers=auth_header(token),
    )
    return token, submitted.json()["design"]


def test_admin_score_publish_unpublish_edit(client, db_session):
    admin = _admin_token(client, db_session)
    user_token, design = _submit_as_user(client)
    pk = design["id"]

    scored = client.post(
        f"/api/admin/submissions/{pk}/score",
        json={"plddt": 0.546245, "iptm": 0.590283},
        headers=auth_header(admin),
    )
    assert scored.status_code == 200
    body = scored.json()
    assert body["status"] == "scored"
    assert body["score"] == 0.568264
    assert body["scores"]["plddt"] == 0.546245
    assert body["scores"]["iptm"] == 0.590283

    board = client.get("/api/leaderboard").json()
    assert board["entries"] == []

    published = client.post(
        f"/api/admin/submissions/{pk}/publish",
        headers=auth_header(admin),
    )
    assert published.status_code == 200
    assert published.json()["status"] == "published"

    board = client.get("/api/leaderboard").json()
    assert len(board["entries"]) == 1
    assert board["entries"][0]["score"] == 0.568264
    assert board["entries"][0]["plddt"] == 0.546245
    assert board["entries"][0]["iptm"] == 0.590283

    edited = client.put(
        f"/api/admin/submissions/{pk}/score",
        json={"plddt": 0.94, "iptm": 0.9456},
        headers=auth_header(admin),
    )
    assert edited.status_code == 200
    assert edited.json()["score"] == 0.9428
    assert edited.json()["status"] == "published"

    board = client.get("/api/leaderboard").json()
    assert board["entries"][0]["score"] == 0.9428

    unpublished = client.post(
        f"/api/admin/submissions/{pk}/unpublish",
        headers=auth_header(admin),
    )
    assert unpublished.status_code == 200
    assert unpublished.json()["status"] == "scored"
    assert client.get("/api/leaderboard").json()["entries"] == []

    me = client.get("/api/me", headers=auth_header(user_token)).json()
    assert me["best_score"] is None


def test_admin_can_upload_structure(client, db_session, tmp_path):
    admin = _admin_token(client, db_session)
    _user_token, design = _submit_as_user(client)
    pk = design["id"]
    content = b"data_test\n_entry.id test\n"
    response = client.post(
        f"/api/admin/submissions/{pk}/structure",
        headers=auth_header(admin),
        files={"file": ("model.cif", content, "chemical/x-cif")},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["has_structure"] is True
    assert body["structure_filename"] == "model.cif"

    downloaded = client.get(
        f"/api/designs/{pk}/structure",
        headers=auth_header(_user_token),
    )
    assert downloaded.status_code == 200
    assert downloaded.content == content


def test_user_cannot_write_score_via_admin_api(client, db_session):
    _admin_token(client, db_session)
    user_token, design = _submit_as_user(client)
    response = client.post(
        f"/api/admin/submissions/{design['id']}/score",
        json={"plddt": 0.99, "iptm": 0.99},
        headers=auth_header(user_token),
    )
    assert response.status_code == 403

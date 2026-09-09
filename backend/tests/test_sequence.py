from tests.conftest import VALID_RNA, auth_header, register_user


def _token(client, name="Alice"):
    return register_user(client, name)["access_token"]


def test_valid_rna(client):
    token = _token(client)
    response = client.post("/api/designs", json={"sequence": VALID_RNA}, headers=auth_header(token))
    assert response.status_code == 200
    body = response.json()
    assert body["sequence"] == VALID_RNA
    assert body["length"] == len(VALID_RNA)
    assert body["status"] == "draft"


def test_lowercase_rna_is_normalized(client):
    token = _token(client)
    response = client.post(
        "/api/designs",
        json={"sequence": "augccaguccaguacgaucg"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["sequence"] == "AUGCCAGUCCAGUACGAUCG"


def test_dna_sequence_rejected(client):
    token = _token(client)
    response = client.post("/api/designs", json={"sequence": "ATGCCAGTAC"}, headers=auth_header(token))
    assert response.status_code == 400
    assert "A, U, G and C" in response.json()["detail"]


def test_invalid_characters_rejected(client):
    token = _token(client)
    response = client.post("/api/designs", json={"sequence": "AUGNCC"}, headers=auth_header(token))
    assert response.status_code == 400


def test_too_short_rejected(client):
    token = _token(client)
    response = client.post("/api/designs", json={"sequence": "AUGC"}, headers=auth_header(token))
    assert response.status_code == 400
    assert "too short" in response.json()["detail"]


def test_too_long_rejected(client):
    token = _token(client)
    response = client.post("/api/designs", json={"sequence": "A" * 101}, headers=auth_header(token))
    assert response.status_code == 400
    assert "too long" in response.json()["detail"]


def test_empty_sequence_rejected(client):
    token = _token(client)
    response = client.post("/api/designs", json={"sequence": "   "}, headers=auth_header(token))
    assert response.status_code == 400


def test_gc_content(client):
    token = _token(client)
    # 10 nt: GGGGGCCCCC -> 100%
    response = client.post(
        "/api/designs",
        json={"sequence": "GGGGGCCCCC"},
        headers=auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["gc_content"] == 100.0
    assert response.json()["length"] == 10

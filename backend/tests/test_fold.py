from tests.conftest import VALID_RNA, auth_header, register_user


def test_reference_fold_is_public(client):
    response = client.get("/api/rna/reference")
    assert response.status_code == 200
    body = response.json()
    assert body["length"] == 167
    assert body["structure"]
    assert len(body["residues"]) == 167
    assert body["sequence"].startswith("CAGUGCUA")


def test_user_fold_requires_login(client):
    response = client.post("/api/rna/fold", json={"sequence": VALID_RNA})
    assert response.status_code == 401


def test_user_fold_returns_structure(client):
    token = register_user(client, "Alice")["access_token"]
    response = client.post(
        "/api/rna/fold",
        json={"sequence": VALID_RNA},
        headers=auth_header(token),
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["sequence"] == VALID_RNA
    assert len(body["structure"]) == len(VALID_RNA)
    assert set(body["structure"]) <= set(".()")
    assert len(body["residues"]) == len(VALID_RNA)
    assert body["length_delta"] == len(VALID_RNA) - 167


def test_reference_fold_bases_are_separated(client):
    body = client.get("/api/rna/reference").json()
    residues = body["residues"]
    n = len(residues)
    backbone = []
    for i in range(n - 1):
        dx = residues[i + 1]["x"] - residues[i]["x"]
        dy = residues[i + 1]["y"] - residues[i]["y"]
        backbone.append((dx * dx + dy * dy) ** 0.5)
    backbone.sort()
    median = backbone[len(backbone) // 2]
    min_other = float("inf")
    for i in range(n):
        for j in range(i + 2, n):
            dx = residues[j]["x"] - residues[i]["x"]
            dy = residues[j]["y"] - residues[i]["y"]
            min_other = min(min_other, (dx * dx + dy * dy) ** 0.5)
    assert min_other > median * 0.4


def test_fold_rejects_dna(client):
    token = register_user(client, "Alice")["access_token"]
    response = client.post(
        "/api/rna/fold",
        json={"sequence": "ATGCCAGTAC"},
        headers=auth_header(token),
    )
    assert response.status_code == 400

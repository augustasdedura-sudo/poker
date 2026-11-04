"""API tests using FastAPI's TestClient and an in-memory repository.

No PostgreSQL is needed: the repository dependency is overridden, and the app's
lifespan (which opens the DB pool) is not triggered because the TestClient is
not used as a context manager.
"""

from uuid import UUID, uuid4

from fastapi.testclient import TestClient

import main
from poker.api import get_repository
from poker.domain import Hand


class FakeHandRepository:
    """In-memory stand-in for the PostgreSQL repository."""

    def __init__(self) -> None:
        self._store: dict[UUID, Hand] = {}

    def add(self, hand: Hand) -> Hand:
        self._store[hand.id] = hand
        return hand

    def get(self, hand_id: UUID) -> Hand | None:
        return self._store.get(hand_id)

    def list(self) -> list[Hand]:
        return sorted(self._store.values(), key=lambda h: h.created_at, reverse=True)


def make_client() -> tuple[TestClient, FakeHandRepository]:
    repo = FakeHandRepository()
    main.app.dependency_overrides[get_repository] = lambda: repo
    return TestClient(main.app), repo


SAMPLE_HAND = {
    "stack": 10000,
    "dealer": 2,
    "holeCards": ["AcKc", "QdJd", "9h8h", "7s6s", "5c4c", "2d3d"],
    "streets": [
        {
            "street": "preflop",
            "board": "",
            "actions": [
                {"player": 5, "kind": "fold"},
                {"player": 0, "kind": "fold"},
                {"player": 1, "kind": "fold"},
                {"player": 2, "kind": "fold"},
                {"player": 3, "kind": "fold"},
            ],
        }
    ],
}


def test_post_computes_winnings_then_get_roundtrips():
    client, _ = make_client()
    try:
        created = client.post("/api/hands", json=SAMPLE_HAND)
        assert created.status_code == 201
        body = created.json()
        assert sum(body["winnings"]) == 0
        assert body["winnings"][4] == 20  # big blind wins the dead small blind
        assert body["pot"] == 40
        hand_id = body["id"]

        listed = client.get("/api/hands")
        assert listed.status_code == 200
        assert [h["id"] for h in listed.json()] == [hand_id]

        single = client.get(f"/api/hands/{hand_id}")
        assert single.status_code == 200
        assert single.json()["id"] == hand_id
    finally:
        main.app.dependency_overrides.clear()


def test_get_unknown_hand_returns_404():
    client, _ = make_client()
    try:
        resp = client.get(f"/api/hands/{uuid4()}")
        assert resp.status_code == 404
    finally:
        main.app.dependency_overrides.clear()


def test_invalid_hand_is_rejected():
    client, _ = make_client()
    try:
        bad = {**SAMPLE_HAND, "holeCards": ["AcKc"]}  # must be 6 entries
        resp = client.post("/api/hands", json=bad)
        assert resp.status_code == 422
    finally:
        main.app.dependency_overrides.clear()

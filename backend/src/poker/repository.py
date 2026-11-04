"""Repository for the hand resource (repository pattern, RAW SQL, no ORM).

The API talks to the database only through a repository. ``HandRepository`` is a
Protocol so the real PostgreSQL implementation and an in-memory test double are
interchangeable.
"""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from .domain import Action, ActionKind, Hand, Street, StreetPlay


# --- (de)serialization between dataclasses and JSON columns ---------------------


def _street_to_dict(sp: StreetPlay) -> dict:
    return {
        "street": sp.street.value,
        "board": sp.board,
        "actions": [
            {"player": a.player, "kind": a.kind.value, "amount": a.amount}
            for a in sp.actions
        ],
    }


def _street_from_dict(data: dict) -> StreetPlay:
    return StreetPlay(
        street=Street(data["street"]),
        board=data.get("board", ""),
        actions=[
            Action(player=a["player"], kind=ActionKind(a["kind"]), amount=a.get("amount"))
            for a in data["actions"]
        ],
    )


def _row_to_hand(row: dict) -> Hand:
    return Hand(
        id=row["id"],
        stack=row["stack"],
        dealer=row["dealer"],
        hole_cards=list(row["hole_cards"]),
        streets=[_street_from_dict(s) for s in row["streets"]],
        winnings=list(row["winnings"]),
        pot=row["pot"],
        created_at=row["created_at"],
    )


# --- interface ------------------------------------------------------------------


class HandRepository(Protocol):
    def add(self, hand: Hand) -> Hand: ...

    def get(self, hand_id: UUID) -> Hand | None: ...

    def list(self) -> list[Hand]: ...


# --- PostgreSQL implementation --------------------------------------------------


class PostgresHandRepository:
    """Stores hands in PostgreSQL via parameterized raw SQL."""

    def __init__(self, conn: Connection) -> None:
        self._conn = conn

    def add(self, hand: Hand) -> Hand:
        self._conn.execute(
            """
            INSERT INTO hands (id, stack, dealer, hole_cards, streets, winnings, pot, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                hand.id,
                hand.stack,
                hand.dealer,
                Jsonb(hand.hole_cards),
                Jsonb([_street_to_dict(s) for s in hand.streets]),
                Jsonb(hand.winnings),
                hand.pot,
                hand.created_at,
            ),
        )
        self._conn.commit()
        return hand

    def get(self, hand_id: UUID) -> Hand | None:
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM hands WHERE id = %s", (hand_id,))
            row = cur.fetchone()
        return _row_to_hand(row) if row else None

    def list(self) -> list[Hand]:
        with self._conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM hands ORDER BY created_at DESC")
            rows = cur.fetchall()
        return [_row_to_hand(r) for r in rows]

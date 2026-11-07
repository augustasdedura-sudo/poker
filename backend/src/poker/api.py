"""REST API for the hand resource.

Routes (mounted under ``/api`` by ``main.py``):

* ``POST /api/hands``       create a hand; the server computes winnings + pot.
* ``GET  /api/hands``       list hands, newest first.
* ``GET  /api/hands/{id}``  fetch one hand (404 if unknown).

The endpoints reach the database only through a ``HandRepository``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status

from .domain import Hand
from .repository import HandRepository, PostgresHandRepository
from .schemas import HandCreate, HandOut
from .winnings import compute

router = APIRouter(prefix="/hands", tags=["hands"])


def get_repository(request: Request):
    """Yield a repository backed by a pooled connection.

    Overridable in tests via ``app.dependency_overrides[get_repository]``.
    """
    pool = request.app.state.pool
    with pool.connection() as conn:
        yield PostgresHandRepository(conn)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=HandOut)
def create_hand(payload: HandCreate, repo: HandRepository = Depends(get_repository)) -> HandOut:
    streets = payload.to_street_plays()
    stacks = payload.seat_stacks()
    try:
        # pokerkit validates the hand while replaying it; an illegal hand raises.
        winnings, pot = compute(stacks, payload.dealer, payload.hole_cards, streets)
    except Exception as exc:  # noqa: BLE001 - surface any replay/validation failure as 422
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"invalid hand: {exc}",
        ) from exc

    hand = Hand(
        id=payload.id or uuid4(),
        stack=payload.stack,
        dealer=payload.dealer,
        hole_cards=payload.hole_cards,
        streets=streets,
        winnings=winnings,
        pot=pot,
        created_at=datetime.now(timezone.utc),
        stacks=stacks,
    )
    repo.add(hand)
    return HandOut.from_domain(hand)


@router.get("", response_model=list[HandOut])
def list_hands(repo: HandRepository = Depends(get_repository)) -> list[HandOut]:
    return [HandOut.from_domain(h) for h in repo.list()]


@router.get("/{hand_id}", response_model=HandOut)
def get_hand(hand_id: UUID, repo: HandRepository = Depends(get_repository)) -> HandOut:
    hand = repo.get(hand_id)
    if hand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="hand not found")
    return HandOut.from_domain(hand)

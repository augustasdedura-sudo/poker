"""Domain model.

Storage revolves around ``@dataclass`` classes (per the exercise brief). These are
plain in-memory structures with no framework or database coupling; the repository
maps them to/from SQL, and the API maps them to/from pydantic DTOs.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID

NUM_PLAYERS = 6
SMALL_BLIND = 20
BIG_BLIND = 40


class ActionKind(str, Enum):
    """A voluntary player action within a betting round.

    Blind postings are not actions: they are implied by the dealer position.
    """

    FOLD = "fold"
    CHECK = "check"
    CALL = "call"
    BET = "bet"
    RAISE = "raise"
    ALLIN = "allin"


class Street(str, Enum):
    PREFLOP = "preflop"
    FLOP = "flop"
    TURN = "turn"
    RIVER = "river"


@dataclass
class Action:
    """One action by one player.

    ``amount`` is the "raise-to" total for BET and RAISE (matching the log's
    "raises to 300" / "bets 100" semantics) and ``None`` for FOLD/CHECK/CALL/ALLIN,
    whose chip cost is derived from the running state during replay.
    """

    player: int  # player index 0..5
    kind: ActionKind
    amount: int | None = None


@dataclass
class StreetPlay:
    """The board dealt for a street plus the actions taken on it.

    ``board`` is the cards revealed at the start of this street: "" for preflop,
    e.g. "3hKdQs" for the flop, "Ac" for the turn, "Th" for the river.
    """

    street: Street
    actions: list[Action] = field(default_factory=list)
    board: str = ""


@dataclass
class Hand:
    """A complete, finished hand ready to be stored and shown in history."""

    id: UUID
    stack: int  # starting stack, identical for all six players
    dealer: int  # dealer/button player index 0..5
    hole_cards: list[str]  # index 0..5, e.g. "Tc2c"
    streets: list[StreetPlay]
    winnings: list[int]  # net chips per player index (sums to 0)
    pot: int  # total chips contributed across the hand
    created_at: datetime


def small_blind_seat(dealer: int) -> int:
    return (dealer + 1) % NUM_PLAYERS


def big_blind_seat(dealer: int) -> int:
    return (dealer + 2) % NUM_PLAYERS

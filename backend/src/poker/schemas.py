"""REST DTOs (pydantic) and mapping to/from the domain dataclasses.

JSON is camelCase on the wire (``holeCards``, ``createdAt``); Python stays
snake_case. The request body never includes winnings or pot -- the server
computes those.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

from .domain import NUM_PLAYERS, Action, ActionKind, Hand, Street, StreetPlay


class _Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ActionIn(_Camel):
    player: int = Field(ge=0, le=NUM_PLAYERS - 1)
    kind: ActionKind
    amount: int | None = None


class StreetIn(_Camel):
    street: Street
    actions: list[ActionIn] = Field(default_factory=list)
    board: str = ""


class HandCreate(_Camel):
    # The client generates the id up front (it is shown in the live play log), so
    # the server honours it to keep the log and the stored hand consistent.
    id: UUID | None = None
    stack: int = Field(gt=0)
    dealer: int = Field(ge=0, le=NUM_PLAYERS - 1)
    hole_cards: list[str]
    streets: list[StreetIn]
    # Per-seat starting stacks (index 0..5). Optional: when omitted the hand is a
    # full ring where every seat started with ``stack``. A seat with stack 0 sat out.
    stacks: list[int] | None = None

    @field_validator("hole_cards")
    @classmethod
    def _six_hole_cards(cls, value: list[str]) -> list[str]:
        if len(value) != NUM_PLAYERS:
            raise ValueError(f"expected {NUM_PLAYERS} hole-card entries, got {len(value)}")
        return value

    @field_validator("stacks")
    @classmethod
    def _six_stacks(cls, value: list[int] | None) -> list[int] | None:
        if value is not None and len(value) != NUM_PLAYERS:
            raise ValueError(f"expected {NUM_PLAYERS} stack entries, got {len(value)}")
        return value

    def seat_stacks(self) -> list[int]:
        return self.stacks if self.stacks is not None else [self.stack] * NUM_PLAYERS

    def to_street_plays(self) -> list[StreetPlay]:
        return [
            StreetPlay(
                street=s.street,
                board=s.board,
                actions=[Action(player=a.player, kind=a.kind, amount=a.amount) for a in s.actions],
            )
            for s in self.streets
        ]


class HandOut(_Camel):
    id: UUID
    stack: int
    dealer: int
    hole_cards: list[str]
    streets: list[StreetIn]
    winnings: list[int]
    pot: int
    created_at: datetime
    stacks: list[int]

    @classmethod
    def from_domain(cls, hand: Hand) -> "HandOut":
        return cls(
            id=hand.id,
            stack=hand.stack,
            dealer=hand.dealer,
            stacks=hand.stacks,
            hole_cards=hand.hole_cards,
            streets=[
                StreetIn(
                    street=s.street,
                    board=s.board,
                    actions=[
                        ActionIn(player=a.player, kind=a.kind, amount=a.amount)
                        for a in s.actions
                    ],
                )
                for s in hand.streets
            ],
            winnings=hand.winnings,
            pot=hand.pot,
            created_at=hand.created_at,
        )

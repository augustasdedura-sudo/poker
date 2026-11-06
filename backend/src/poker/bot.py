"""Bot decisions powered by RLCard.

RLCard ships no pre-trained 6-max No-Limit Hold'em agent, so the bot's "brain"
is a Monte-Carlo equity estimate: we deal out many random completions of the
hand and score them with RLCard's hand evaluator (``compare_hands``). The equity
is then mapped onto RLCard's No-Limit Hold'em action space
(FOLD / CHECK_CALL / RAISE_HALF_POT / RAISE_POT / ALL_IN) and finally onto a
concrete action + amount that is legal in the client's engine.

Endpoint: ``POST /api/bot-action`` -- the frontend calls it for each non-human
seat and applies the returned action with its existing engine.
"""

from __future__ import annotations

import random

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from rlcard.games.limitholdem.utils import compare_hands
from rlcard.games.nolimitholdem.round import Action as RLAction

from .domain import BIG_BLIND

# --- cards ----------------------------------------------------------------------

_RANKS = "23456789TJQKA"
_SUITS = "cdhs"
_FULL_DECK = [r + s for r in _RANKS for s in _SUITS]  # our format: rank+suit, e.g. "Tc"


def _split(cards: str) -> list[str]:
    return [cards[i : i + 2] for i in range(0, len(cards), 2)]


def _to_rlcard(card: str) -> str:
    """Our "9s"/"Tc" -> RLCard "S9"/"CT" (suit first, upper-case)."""
    return card[1].upper() + card[0]


def equity(hole: str, board: str, opponents: int, trials: int = 240) -> float:
    """Monte-Carlo win probability of ``hole`` vs ``opponents`` random hands.

    Ties split the pot (counted as a fraction). Uses RLCard's ``compare_hands``.
    """
    my_hole = _split(hole)
    shared = _split(board)
    used = set(my_hole) | set(shared)
    deck = [c for c in _FULL_DECK if c not in used]
    need_board = 5 - len(shared)
    draws = opponents * 2 + need_board

    score = 0.0
    for _ in range(trials):
        random.shuffle(deck)
        drawn = deck[:draws]
        opp_holes = [drawn[i * 2 : i * 2 + 2] for i in range(opponents)]
        full_board = shared + drawn[opponents * 2 :]
        hands = [[_to_rlcard(c) for c in my_hole + full_board]]
        hands += [[_to_rlcard(c) for c in oh + full_board] for oh in opp_holes]
        winners = compare_hands(hands)
        score += winners[0] / sum(winners)
    return score / trials


# --- DTOs -----------------------------------------------------------------------


class _Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class LegalActions(_Camel):
    can_check: bool
    can_call: bool
    call_amount: int = 0
    can_bet: bool
    bet_min: int = 0
    bet_max: int = 0
    can_raise: bool
    raise_min: int = 0
    raise_max: int = 0
    can_allin: bool
    allin_chips: int = 0


class BotRequest(_Camel):
    hole: str  # the bot's two cards, e.g. "Tc2c"
    board: str = ""  # community cards so far, e.g. "3hKdQs"
    num_active: int = Field(ge=2, le=6)  # players still in the hand
    stack: int
    pot: int  # total pot, for raise sizing
    to_call: int = 0
    legal: LegalActions


class BotDecision(_Camel):
    kind: str  # fold | check | call | bet | raise | allin
    amount: int | None = None  # "raise-to" total for bet/raise
    equity: float
    rl_action: str  # the RLCard action the equity mapped to


# --- policy ---------------------------------------------------------------------


def _snap(amount: float, lo: int, hi: int) -> int:
    snapped = round(amount / BIG_BLIND) * BIG_BLIND
    return max(lo, min(hi, snapped))


def _to_engine_action(rl: RLAction, legal: LegalActions, pot: int) -> tuple[str, int | None]:
    if rl == RLAction.FOLD:
        return ("check", None) if legal.can_check else ("fold", None)
    if rl == RLAction.CHECK_CALL:
        if legal.can_check:
            return ("check", None)
        return ("call", None) if legal.can_call else ("fold", None)
    if rl == RLAction.ALL_IN and legal.can_allin:
        return ("allin", None)

    # A raise/bet (or an all-in that we convert to a sized raise if needed).
    frac = 0.5 if rl == RLAction.RAISE_HALF_POT else 1.0
    if legal.can_bet:
        return ("bet", _snap(frac * pot, legal.bet_min, legal.bet_max))
    if legal.can_raise:
        return ("raise", _snap(legal.raise_min + frac * pot, legal.raise_min, legal.raise_max))
    if legal.can_allin:
        return ("allin", None)
    if legal.can_check:
        return ("check", None)
    return ("call", None) if legal.can_call else ("fold", None)


def decide(req: BotRequest) -> BotDecision:
    opponents = max(1, req.num_active - 1)
    eq = equity(req.hole, req.board, opponents)
    legal = req.legal
    pot = max(req.pot, BIG_BLIND)
    r = random.random()

    if req.to_call > 0:
        pot_odds = req.to_call / (pot + req.to_call)
        if legal.can_raise and eq > 0.85:
            rl = RLAction.ALL_IN if (eq > 0.92 and r < 0.4 and legal.can_allin) else RLAction.RAISE_POT
        elif legal.can_raise and eq > 0.62 and r < 0.55:
            rl = RLAction.RAISE_HALF_POT
        elif eq + 0.02 >= pot_odds:
            rl = RLAction.CHECK_CALL
        else:
            rl = RLAction.FOLD
    else:
        if legal.can_bet and eq > 0.72 and r < 0.85:
            rl = RLAction.RAISE_POT
        elif legal.can_bet and eq > 0.52 and r < 0.7:
            rl = RLAction.RAISE_HALF_POT
        else:
            rl = RLAction.CHECK_CALL

    kind, amount = _to_engine_action(rl, legal, pot)
    return BotDecision(kind=kind, amount=amount, equity=round(eq, 3), rl_action=rl.name)


# --- route ----------------------------------------------------------------------

bot_router = APIRouter(tags=["bot"])


@bot_router.post("/bot-action", response_model=BotDecision)
def bot_action(req: BotRequest) -> BotDecision:
    return decide(req)

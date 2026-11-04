"""Win/loss computation via ``pokerkit``.

The client posts the full hand (starting stack, dealer, hole cards, and the
actions per street). The server replays it in ``pokerkit`` and reads the net
payoff per player. Because ``pokerkit`` enforces the rules during replay, an
illegal hand raises here and is rejected by the API -- this is the server-side
validation that mirrors the client engine.

Seat mapping
------------
``pokerkit`` uses *positions*, not seats: position 0 is always the small blind,
position 1 the big blind, position 2 UTG, ... and the last position is the
button. Our players are a fixed list ``Player 1..6`` (index 0..5) with a rotating
dealer, so we order them starting at the small blind and ending at the dealer::

    order[pos] = player index sitting in pokerkit position ``pos``
    order = [D+1, D+2, D+3, D+4, D+5, D]   (mod 6)

Payoffs come back indexed by position and are remapped to player index.
"""

from __future__ import annotations

from pokerkit import Automation, Mode, NoLimitTexasHoldem

from .domain import (
    BIG_BLIND,
    NUM_PLAYERS,
    SMALL_BLIND,
    ActionKind,
    Hand,
    Street,
    StreetPlay,
)

# Automations from the exercise brief: everything except the dealing of cards,
# which we drive explicitly so we can supply the exact shuffled cards.
_AUTOMATIONS = (
    Automation.ANTE_POSTING,
    Automation.BET_COLLECTION,
    Automation.BLIND_OR_STRADDLE_POSTING,
    Automation.HOLE_CARDS_SHOWING_OR_MUCKING,
    Automation.HAND_KILLING,
    Automation.CHIPS_PUSHING,
    Automation.CHIPS_PULLING,
)


def seat_order(dealer: int) -> list[int]:
    """Player indices in pokerkit position order (small blind first, dealer last)."""
    return [(dealer + i) % NUM_PLAYERS for i in range(1, NUM_PLAYERS)] + [dealer]


def _drive_allin(state, to_level: int, current_bet: int) -> None:
    """Apply an all-in to pokerkit: a raise when legal, otherwise a (capped) call."""
    if to_level > current_bet and state.can_complete_bet_or_raise_to():
        # Maximum legal "raise to" equals the player's entire stack (no-limit).
        state.complete_bet_or_raise_to(state.max_completion_betting_or_raising_to_amount)
    else:
        # All-in that cannot raise is a call; pokerkit caps it to the stack.
        state.check_or_call()


def compute(stack: int, dealer: int, hole_cards: list[str], streets: list[StreetPlay]) -> tuple[list[int], int]:
    """Return ``(winnings, pot)``.

    ``winnings`` is net chips per player index (sums to 0). ``pot`` is the total
    chips contributed across the hand (blinds included).
    """
    order = seat_order(dealer)
    pos_of = {player: pos for pos, player in enumerate(order)}

    state = NoLimitTexasHoldem.create_state(
        _AUTOMATIONS,
        True,  # ante_trimming_status (uniform / no antes)
        0,  # antes
        (SMALL_BLIND, BIG_BLIND),  # blinds: position 0 = SB, position 1 = BB
        BIG_BLIND,  # min bet / min raise increment
        stack,  # starting stack, same for every player
        NUM_PLAYERS,
        mode=Mode.CASH_GAME,  # allow a fold when checking is possible (faithful replay)
    )

    # Deal hole cards in pokerkit position order (small blind first).
    for pos in range(NUM_PLAYERS):
        state.deal_hole(hole_cards[order[pos]])

    # Track contributions ourselves to compute the pot. (pokerkit's pot is pushed
    # away automatically, so we sum what each player puts in.)
    contributed = [0] * NUM_PLAYERS  # per player index

    for sp in streets:
        if sp.board:
            # Reveal this street's board before its betting round.
            state.burn_card("??")
            state.deal_board(sp.board)

        committed_street = [0] * NUM_PLAYERS  # chips in this round, per player index
        current_bet = 0

        if sp.street == Street.PREFLOP:
            # pokerkit posts the blinds automatically; mirror them in our tracking.
            sb, bb = order[0], order[1]
            sb_amt, bb_amt = min(SMALL_BLIND, stack), min(BIG_BLIND, stack)
            committed_street[sb] += sb_amt
            committed_street[bb] += bb_amt
            contributed[sb] += sb_amt
            contributed[bb] += bb_amt
            current_bet = bb_amt

        for action in sp.actions:
            p = action.player
            remaining = stack - contributed[p]

            if action.kind == ActionKind.FOLD:
                state.fold()
            elif action.kind == ActionKind.CHECK:
                state.check_or_call()
            elif action.kind == ActionKind.CALL:
                chips = min(current_bet - committed_street[p], remaining)
                contributed[p] += chips
                committed_street[p] += chips
                state.check_or_call()
            elif action.kind in (ActionKind.BET, ActionKind.RAISE):
                assert action.amount is not None, f"{action.kind} needs an amount"
                to_level = action.amount
                chips = to_level - committed_street[p]
                contributed[p] += chips
                committed_street[p] = to_level
                current_bet = to_level
                state.complete_bet_or_raise_to(to_level)
            elif action.kind == ActionKind.ALLIN:
                chips = remaining
                to_level = committed_street[p] + chips
                contributed[p] += chips
                committed_street[p] = to_level
                _drive_allin(state, to_level, current_bet)
                current_bet = max(current_bet, to_level)
            else:  # pragma: no cover - exhaustive
                raise ValueError(f"unknown action kind: {action.kind}")

    payoffs = list(state.payoffs)  # indexed by pokerkit position
    winnings = [0] * NUM_PLAYERS
    for pos, player in enumerate(order):
        winnings[player] = int(payoffs[pos])

    # The final pot excludes any uncalled bet: when one player has put in more
    # than everyone else (an unmatched bet/blind), the excess over the next-highest
    # contribution is returned, matching pokerkit's own bet-return behaviour.
    top, second = sorted(contributed, reverse=True)[:2]
    uncalled = top - second
    pot = sum(contributed) - uncalled

    return winnings, pot


def compute_for_hand(hand: Hand) -> tuple[list[int], int]:
    return compute(hand.stack, hand.dealer, hand.hole_cards, hand.streets)

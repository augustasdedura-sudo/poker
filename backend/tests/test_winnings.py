"""Win/loss and pot computation via pokerkit (no database required)."""

from poker.domain import Action, ActionKind, Street, StreetPlay
from poker.winnings import compute, position_order, seat_order


def a(p: int) -> Action:
    return Action(p, ActionKind.ALLIN)


def f(p: int) -> Action:
    return Action(p, ActionKind.FOLD)


def x(p: int) -> Action:
    return Action(p, ActionKind.CHECK)


def c(p: int) -> Action:
    return Action(p, ActionKind.CALL)


def b(p: int, amount: int) -> Action:
    return Action(p, ActionKind.BET, amount)


def r(p: int, amount: int) -> Action:
    return Action(p, ActionKind.RAISE, amount)


def test_seat_order_puts_small_blind_first_and_dealer_last():
    # dealer = Player 3 (index 2): SB=3, BB=4, UTG=5, then 0, 1, button=2
    assert seat_order(2) == [3, 4, 5, 0, 1, 2]
    assert seat_order(0) == [1, 2, 3, 4, 5, 0]


def test_fold_to_big_blind():
    # Dealer P3 (idx2); SB P4 (idx3) posts 20, BB P5 (idx4) posts 40.
    # Everyone folds around to the big blind, who wins the small blind.
    holes = ["AcKc", "QdJd", "9h8h", "7s6s", "5c4c", "2d3d"]
    streets = [StreetPlay(Street.PREFLOP, [f(5), f(0), f(1), f(2), f(3)], "")]

    winnings, pot = compute(10000, 2, holes, streets)

    assert sum(winnings) == 0
    assert winnings == [0, 0, 0, -20, 20, 0]  # SB loses 20, BB wins 20
    assert pot == 40  # uncalled 20 of the big blind is returned


def test_showdown_winner_and_seat_mapping():
    # Dealer P1 (idx0). Field folds; P2 (SB) and P3 (BB) go to showdown.
    # P3 holds AcAd and flops a set of aces -> P3 wins.
    holes = ["9c8c", "2c7d", "AcAd", "TsJh", "4d5d", "6c6d"]
    streets = [
        StreetPlay(Street.PREFLOP, [f(3), f(4), f(5), f(0), c(1), x(2)], ""),
        StreetPlay(Street.FLOP, [x(1), x(2)], "AhKsQd"),
        StreetPlay(Street.TURN, [x(1), x(2)], "2h"),
        StreetPlay(Street.RIVER, [x(1), x(2)], "3s"),
    ]

    winnings, pot = compute(10000, 0, holes, streets)

    assert sum(winnings) == 0
    assert winnings[2] == 40  # P3 wins
    assert winnings[1] == -40  # P2 loses
    assert pot == 80


def test_bet_raise_fold_with_uncalled_bet_returned():
    # Dealer P3 (idx2). P3 raises preflop, P4 (SB) calls, P5 (BB) folds.
    # P3 bets each street; on the river P4 folds to P3's 200 bet (uncalled -> returned).
    holes = ["2c2d", "5s5d", "AsAh", "7c8c", "9h9s", "Jc4d"]
    streets = [
        StreetPlay(Street.PREFLOP, [f(5), f(0), f(1), r(2, 120), c(3), f(4)], ""),
        StreetPlay(Street.FLOP, [x(3), b(2, 80), c(3)], "3hKdQs"),
        StreetPlay(Street.TURN, [x(3), x(2)], "Ac"),
        StreetPlay(Street.RIVER, [x(3), b(2, 200), f(3)], "Th"),
    ]

    winnings, pot = compute(10000, 2, holes, streets)

    assert sum(winnings) == 0
    assert winnings[2] == 240  # P3 wins P4's 200 + P5's 40
    assert winnings[3] == -200  # P4
    assert winnings[4] == -40  # P5 (big blind, folded preflop)
    assert pot == 440  # 640 contributed minus the 200 uncalled river bet


# --- short-handed / cash-game tables (variable live players, per-seat stacks) ---


def test_position_order_handles_sit_outs_and_heads_up():
    full = [100] * 6
    assert position_order(2, full) == seat_order(2)  # full ring unchanged
    # Seats 1 and 5 sat out: live order is SB, BB, ..., button (button last).
    three = [100, 0, 100, 100, 100, 0]
    assert position_order(0, three) == [2, 3, 4, 0]
    # Heads-up: pokerkit lists the big blind first and the button (small blind)
    # last, which is exactly what walking from the seat after the button gives.
    heads = [100, 0, 0, 100, 0, 0]
    assert position_order(0, heads) == [3, 0]


def test_three_handed_fold_to_big_blind():
    # Seats 1,3,5 sat out. Live: 0 (button), 2 (SB), 4 (BB). Button folds, SB folds.
    holes = ["AcKc", "xx", "QdJd", "xx", "9h8h", "xx"]
    stacks = [100, 0, 100, 0, 100, 0]
    streets = [StreetPlay(Street.PREFLOP, [f(0), f(2)], "")]

    winnings, pot = compute(stacks, 0, holes, streets)

    assert sum(winnings) == 0
    assert winnings == [0, 0, -20, 0, 20, 0]  # SB loses 20, BB wins 20
    assert pot == 40


def test_heads_up_button_is_small_blind_and_folds():
    # Only seats 0 and 3 are funded. Heads-up: seat 0 is button+SB and folds.
    holes = ["2c3c", "xx", "xx", "AcAd", "xx", "xx"]
    stacks = [100, 0, 0, 100, 0, 0]
    streets = [StreetPlay(Street.PREFLOP, [f(0)], "")]

    winnings, pot = compute(stacks, 0, holes, streets)

    assert sum(winnings) == 0
    assert winnings == [-20, 0, 0, 20, 0, 0]
    assert pot == 40


def test_varying_stacks_short_all_in_called_and_loses():
    # Heads-up with unequal stacks: short button (100) jams, deep BB (300) calls
    # and wins at showdown. The short stack can only lose its 100.
    holes = ["2c3c", "Kd4d", "5h6h", "AcAd", "8c9c", "ThJh"]
    stacks = [100, 0, 0, 300, 0, 0]
    streets = [
        StreetPlay(Street.PREFLOP, [a(0), c(3)], ""),
        StreetPlay(Street.FLOP, [], "7h8d9s"),
        StreetPlay(Street.TURN, [], "Jc"),
        StreetPlay(Street.RIVER, [], "Qd"),
    ]

    winnings, pot = compute(stacks, 0, holes, streets)

    assert sum(winnings) == 0
    assert winnings[3] == 100  # deep stack wins the 100 at risk
    assert winnings[0] == -100  # short stack busts its buy-in, no more
    assert pot == 200

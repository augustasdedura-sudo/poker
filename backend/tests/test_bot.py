"""Tests for the RLCard-backed bot (Monte-Carlo equity + action mapping).

No database or server needed.
"""

from poker.bot import BotRequest, LegalActions, decide, equity

FACING_BET = LegalActions(
    canCheck=False, canCall=True, callAmount=200, canBet=False, betMin=0, betMax=0,
    canRaise=True, raiseMin=400, raiseMax=10000, canAllin=True, allinChips=9800,
)
CAN_CHECK = LegalActions(
    canCheck=True, canCall=False, callAmount=0, canBet=True, betMin=40, betMax=9800,
    canRaise=False, raiseMin=0, raiseMax=0, canAllin=True, allinChips=9800,
)


def test_equity_ranks_hands_sensibly():
    assert equity("AsAc", "", 1) > 0.75  # aces crush heads-up
    assert equity("2c7d", "", 1) < 0.45  # 7-2 offsuit is weak
    assert equity("AsAc", "", 5) < equity("AsAc", "", 1)  # worse multiway


def test_strong_hand_does_not_fold_facing_a_bet():
    # Set of aces facing a 200 bet: must call or raise, never fold.
    kinds = {decide(_req("AsAc", "Ah7d2s", 200, FACING_BET)).kind for _ in range(8)}
    assert kinds <= {"call", "raise", "allin"}
    assert "fold" not in kinds


def test_trash_hand_folds_to_a_bet():
    kinds = [decide(_req("2c7d", "AhKsQc", 200, FACING_BET)).kind for _ in range(8)]
    assert kinds.count("fold") >= 6  # overwhelmingly folds


def test_decision_amounts_are_within_legal_bounds():
    d = decide(_req("AsAc", "Ah7d2s", 0, CAN_CHECK))
    assert d.kind in {"check", "bet", "allin"}
    if d.kind == "bet":
        assert CAN_CHECK.bet_min <= d.amount <= CAN_CHECK.bet_max


def _req(hole: str, board: str, to_call: int, legal: LegalActions) -> BotRequest:
    return BotRequest(
        hole=hole, board=board, numActive=2, stack=9800, pot=400, toCall=to_call, legal=legal
    )

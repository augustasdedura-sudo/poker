import { describe, expect, it } from "vitest";

import { applyAction, legalActions, startHand, toRecord } from "../engine";
import type { GameState } from "../engine";
import type { ActionKind } from "../types";

// Deterministic shuffle so hands are reproducible. (Card values are irrelevant
// to the betting logic; the backend computes the winner.)
const rng = () => 0;

function act(state: GameState, player: number, kind: ActionKind, amount?: number): GameState {
  return applyAction(state, { player, kind, amount });
}

describe("startHand", () => {
  it("posts the blinds and sets UTG to act", () => {
    // dealer = P3 (idx 2) -> SB = idx 3, BB = idx 4, UTG = idx 5
    const s = startHand(10000, { dealer: 2, rng, id: "hand-1" });
    expect(s.players[3].committedTotal).toBe(20);
    expect(s.players[4].committedTotal).toBe(40);
    expect(s.currentBet).toBe(40);
    expect(s.toAct).toBe(5);
    expect(s.hasActed).toBe(false);
    // 6 deal lines + "---" + dealer + 2 blinds + "---"
    expect(s.log.slice(0, 6).every((l) => l.text.includes("is dealt"))).toBe(true);
    expect(s.log.some((l) => l.text === "Player 3 is the dealer")).toBe(true);
    expect(s.log.some((l) => l.text === "Player 4 posts small blind - 20 chips")).toBe(true);
  });
});

describe("legalActions preflop", () => {
  it("lets UTG call or raise but not check or bet", () => {
    const s = startHand(10000, { dealer: 2, rng, id: "hand-2" });
    const la = legalActions(s);
    expect(la.canCheck).toBe(false);
    expect(la.canCall).toBe(true);
    expect(la.callAmount).toBe(40);
    expect(la.canBet).toBe(false); // there is already a bet (the big blind)
    expect(la.canRaise).toBe(true);
    expect(la.raiseMin).toBe(80); // min raise is to currentBet + BB
    expect(la.canAllin).toBe(true);
  });
});

describe("hand termination", () => {
  it("ends when everyone folds to the big blind", () => {
    let s = startHand(10000, { dealer: 2, rng, id: "hand-3" });
    for (const p of [5, 0, 1, 2, 3]) s = act(s, p, "fold");
    expect(s.complete).toBe(true);
    expect(s.toAct).toBeNull();
    expect(s.pot).toBe(40); // uncalled 20 of the big blind returned
    expect(s.streets).toHaveLength(1);
    const record = toRecord(s);
    expect(record.id).toBe("hand-3");
    expect(record.streets[0].actions).toHaveLength(5);
    expect(record.holeCards).toHaveLength(6);
  });

  it("checks down to showdown through all four streets", () => {
    let s = startHand(10000, { dealer: 2, rng, id: "hand-4" });
    // Preflop: everyone limps, big blind checks the option.
    for (const p of [5, 0, 1, 2, 3]) s = act(s, p, "call");
    s = act(s, 4, "check");
    expect(s.street).toBe("flop");
    // Check down flop, turn, river (action starts left of the dealer).
    for (const street of ["flop", "turn", "river"] as const) {
      expect(s.street).toBe(street);
      for (const p of [3, 4, 5, 0, 1, 2]) s = act(s, p, "check");
    }
    expect(s.complete).toBe(true);
    expect(s.streets).toHaveLength(4);
    expect(s.pot).toBe(240); // six players each put in 40
  });
});

describe("betting, raising and uncalled bets", () => {
  it("tracks a bet/raise/fold line and returns the uncalled river bet", () => {
    let s = startHand(10000, { dealer: 2, rng, id: "hand-5" });
    // Preflop: folds to the dealer, who raises; SB calls, BB folds.
    s = act(s, 5, "fold");
    s = act(s, 0, "fold");
    s = act(s, 1, "fold");
    s = act(s, 2, "raise", 120);
    s = act(s, 3, "call");
    s = act(s, 4, "fold");
    expect(s.street).toBe("flop");
    // Flop
    s = act(s, 3, "check");
    s = act(s, 2, "bet", 80);
    s = act(s, 3, "call");
    expect(s.street).toBe("turn");
    // Turn
    s = act(s, 3, "check");
    s = act(s, 2, "check");
    expect(s.street).toBe("river");
    // River: dealer bets, SB folds -> uncalled
    s = act(s, 3, "check");
    s = act(s, 2, "bet", 200);
    s = act(s, 3, "fold");
    expect(s.complete).toBe(true);
    expect(s.pot).toBe(440); // 640 contributed minus the 200 uncalled bet
  });
});

describe("all-in run-out", () => {
  it("deals the remaining board with no further betting", () => {
    let s = startHand(10000, { dealer: 2, rng, id: "hand-6" });
    s = act(s, 5, "fold");
    s = act(s, 0, "fold");
    s = act(s, 1, "fold");
    s = act(s, 2, "allin");
    s = act(s, 3, "fold");
    s = act(s, 4, "allin");
    expect(s.complete).toBe(true);
    expect(s.streets).toHaveLength(4); // flop/turn/river dealt automatically
    expect(s.streets[1].actions).toHaveLength(0);
    expect(s.streets[3].actions).toHaveLength(0);
    expect(s.pot).toBe(20020); // two 10000 stacks in, plus the dead small blind
  });
});

import { describe, expect, it } from "vitest";

import { decideAction } from "../bot";
import { startHand, type GameState } from "../engine";

// rng above every bluff probability, so decisions are the "honest" ones.
const noBluff = () => 0.99;

function stateWith(mutate: (s: GameState) => void): GameState {
  const s = startHand(10000, { dealer: 0, rng: () => 0, id: "bot-test" });
  mutate(s);
  return s;
}

describe("decideAction", () => {
  it("folds trash facing a large bet", () => {
    const s = stateWith((g) => {
      g.players[g.toAct as number].holeCards = "7d2c";
      g.currentBet = 2000;
    });
    expect(decideAction(s, "medium", noBluff).kind).toBe("fold");
  });

  it("never folds a premium hand preflop", () => {
    const s = stateWith((g) => {
      g.players[g.toAct as number].holeCards = "AsAh";
    });
    expect(["raise", "call", "allin"]).toContain(decideAction(s, "hard", noBluff).kind);
  });

  it("value-bets a monster when checked to", () => {
    const s = stateWith((g) => {
      g.players[g.toAct as number].holeCards = "AsAd";
      g.board = "AhAc7d"; // quad aces
      g.street = "flop";
      g.currentBet = 0;
      g.players.forEach((p) => (p.committedStreet = 0));
    });
    expect(["bet", "allin"]).toContain(decideAction(s, "medium", noBluff).kind);
  });

  it("always returns a legal action for the player to act", () => {
    const s = startHand(10000, { dealer: 2, rng: () => 0.3, id: "legal" });
    const a = decideAction(s, "easy", noBluff);
    expect(["fold", "check", "call", "bet", "raise", "allin"]).toContain(a.kind);
    expect(a.player).toBe(s.toAct);
  });
});

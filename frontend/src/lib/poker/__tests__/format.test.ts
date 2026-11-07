import { describe, expect, it } from "vitest";

import { historyLines } from "@/lib/poker/format";
import type { StoredHand } from "@/lib/poker/types";

function hand(stacks: number[]): StoredHand {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    stack: stacks[0],
    stacks,
    dealer: 0,
    holeCards: ["AhKh", "2c2d", "7s8s", "QdJd", "9c9h", "3s4s"],
    streets: [],
    winnings: [0, -20, 20, 0, 0, 0],
    pot: 60,
    createdAt: "2026-01-01T00:00:00Z",
  } as StoredHand;
}

describe("historyLines", () => {
  it("has five lines with one stack when all seats start equal", () => {
    const lines = historyLines(hand([10000, 10000, 10000, 10000, 10000, 10000]));
    expect(lines).toHaveLength(5);
    expect(lines[1]).toBe(
      "Stack 10000; Dealer: Player 1; Player 2 Small blind; Player 3 Big blind",
    );
    expect(lines[4]).toBe(
      "Winnings: Player 1: 0; Player 2: -20; Player 3: +20; Player 4: 0; Player 5: 0; Player 6: 0",
    );
  });

  it("lists each seat's stack when they differ", () => {
    const lines = historyLines(hand([9600, 10400, 10000, 10000, 10000, 10000]));
    expect(lines[1]).toMatch(/^Stacks Player 1 9600, Player 2 10400, Player 3 10000/);
  });
});

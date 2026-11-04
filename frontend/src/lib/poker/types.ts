// Shared poker types. The HandRecord shape is the exact contract POSTed to the
// backend (camelCase), and StoredHand is what the backend returns.

export type ActionKind = "fold" | "check" | "call" | "bet" | "raise" | "allin";

export type StreetName = "preflop" | "flop" | "turn" | "river";

export interface HandAction {
  player: number; // player index 0..5
  kind: ActionKind;
  amount?: number | null; // "raise-to" total for bet/raise; omitted otherwise
}

export interface StreetRecord {
  street: StreetName;
  actions: HandAction[];
  board: string; // cards revealed at the start of this street ("" for preflop)
}

/** The complete hand the client sends to the backend on completion. */
export interface HandRecord {
  id: string;
  stack: number;
  dealer: number;
  holeCards: string[]; // index 0..5, e.g. "Tc2c"
  streets: StreetRecord[];
}

/** A hand as stored and returned by the backend. */
export interface StoredHand extends HandRecord {
  winnings: number[]; // net chips per player index (sums to 0)
  pot: number;
  createdAt: string;
}

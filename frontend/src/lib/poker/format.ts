// Formatting helpers: the play-log phrasing, the short action codes, and the
// 5-line hand-history card. Kept separate from both the engine and the UI.

import type { HandAction, StoredHand, StreetName, StreetRecord } from "./types";

export const SMALL_BLIND = 20;
export const BIG_BLIND = 40;

export function playerLabel(index: number): string {
  return `Player ${index + 1}`;
}

/** Human-readable play-log text for one action. */
export function describeAction(player: number, kind: HandAction["kind"], amount?: number | null): string {
  const who = playerLabel(player);
  switch (kind) {
    case "fold":
      return `${who} folds`;
    case "check":
      return `${who} checks`;
    case "call":
      return `${who} calls`;
    case "bet":
      return `${who} bets ${amount}`;
    case "raise":
      return `${who} raises to ${amount}`;
    case "allin":
      return `${who} goes all-in (${amount})`;
  }
}

/** Bold play-log line announcing a street's board. */
export function boardLine(street: StreetName, cards: string): string {
  switch (street) {
    case "flop":
      return `Flop cards dealt: ${cards}`;
    case "turn":
      return `Turn card dealt: ${cards}`;
    case "river":
      return `River card dealt: ${cards}`;
    default:
      return "";
  }
}

/** Short action code for the history line: f / x / c / bAMOUNT / rAMOUNT / allin. */
export function shortAction(action: HandAction): string {
  switch (action.kind) {
    case "fold":
      return "f";
    case "check":
      return "x";
    case "call":
      return "c";
    case "bet":
      return `b${action.amount}`;
    case "raise":
      return `r${action.amount}`;
    case "allin":
      return "allin";
  }
}

/**
 * The "Actions:" value: preflop actions, then for each later street its board
 * string followed by that street's actions, all space-separated. Matches the
 * brief's example: `f:f:f:r300:c:f 3hKdQs x:b100:c Ac x:x Th b80:r160:c`.
 */
export function actionsLine(streets: StreetRecord[]): string {
  const parts: string[] = [];
  for (const sp of streets) {
    if (sp.board) {
      parts.push(sp.board);
    }
    if (sp.actions.length > 0) {
      parts.push(sp.actions.map(shortAction).join(":"));
    }
  }
  return parts.join(" ");
}

/** Signed winnings: "+600", "0", "-40". */
export function signedChips(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function positionsLine(hand: StoredHand): string {
  const d = hand.dealer;
  const sb = (d + 1) % 6;
  const bb = (d + 2) % 6;
  // One number when every seat started equal (the normal case); otherwise list
  // each seat's starting stack so the line stays true for cash-game hands.
  const stacks = hand.stacks ?? [];
  const uniform = stacks.length === 0 || stacks.every((s) => s === stacks[0]);
  const stackPart = uniform
    ? `Stack ${stacks[0] ?? hand.stack}`
    : `Stacks ${stacks.map((s, i) => `${playerLabel(i)} ${s}`).join(", ")}`;
  return (
    `${stackPart}; Dealer: ${playerLabel(d)}; ` +
    `${playerLabel(sb)} Small blind; ${playerLabel(bb)} Big blind`
  );
}

function handsLine(hand: StoredHand): string {
  const parts = hand.holeCards.map((cards, i) => `${playerLabel(i)}: ${cards}`);
  return `Hands: ${parts.join("; ")}`;
}

function winningsLine(hand: StoredHand): string {
  const parts = hand.winnings.map((w, i) => `${playerLabel(i)}: ${signedChips(w)}`);
  return `Winnings: ${parts.join("; ")}`;
}

/** The five lines shown on a hand-history card. */
export function historyLines(hand: StoredHand): string[] {
  return [
    `Hand #${hand.id}`,
    positionsLine(hand),
    handsLine(hand),
    `Actions: ${actionsLine(hand.streets)}`,
    winningsLine(hand),
  ];
}

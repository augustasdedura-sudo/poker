// Rule-based hand strength in [0, 1]. No Monte-Carlo simulation:
// - preflop uses the classic Chen formula,
// - postflop uses the made-hand category (via pokersolver) with a small kicker nudge.

import { Hand } from "pokersolver";

import { splitCards } from "./cards";

const RANK_VALUE: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  T: 10, J: 11, Q: 12, K: 13, A: 14,
};

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function chenBase(rank: string): number {
  switch (rank) {
    case "A":
      return 10;
    case "K":
      return 8;
    case "Q":
      return 7;
    case "J":
      return 6;
    default:
      return RANK_VALUE[rank] / 2;
  }
}

/** Classic Chen preflop score (roughly -1 for 72o up to 20 for AA). */
export function chenScore(hole: string): number {
  const [c1, c2] = splitCards(hole);
  const r1 = c1[0];
  const r2 = c2[0];
  const suited = c1[1] === c2[1];
  const pair = r1 === r2;
  const highRank = RANK_VALUE[r1] >= RANK_VALUE[r2] ? r1 : r2;

  let score = chenBase(highRank);
  if (pair) {
    score = Math.max(chenBase(highRank) * 2, 5);
  }
  if (suited) score += 2;

  if (!pair) {
    const gap = Math.abs(RANK_VALUE[r1] - RANK_VALUE[r2]) - 1;
    if (gap === 1) score -= 1;
    else if (gap === 2) score -= 2;
    else if (gap === 3) score -= 4;
    else if (gap >= 4) score -= 5;
    // Bonus for low connectors/one-gappers (straight potential).
    if (gap <= 1 && RANK_VALUE[highRank] < 12) score += 1;
  }

  return Math.ceil(score);
}

export function preflopStrength(hole: string): number {
  return clamp01(chenScore(hole) / 20);
}

const CATEGORY_STRENGTH: Record<string, number> = {
  "High Card": 0.08,
  Pair: 0.3,
  "Two Pair": 0.52,
  "Three of a Kind": 0.66,
  Straight: 0.78,
  Flush: 0.85,
  "Full House": 0.92,
  "Four of a Kind": 0.97,
  "Straight Flush": 1.0,
  "Royal Flush": 1.0,
};

/** Made-hand strength from the best 5 of (hole + board). */
export function madeHandStrength(hole: string, board: string): number {
  const cards = [...splitCards(hole), ...splitCards(board)];
  const solved = Hand.solve(cards);
  const base = CATEGORY_STRENGTH[solved.name] ?? 0.1;

  // For weak categories, nudge by the better hole card so AK > 72.
  if (solved.name === "High Card" || solved.name === "Pair") {
    const top = Math.max(RANK_VALUE[hole[0]], RANK_VALUE[hole[2]]);
    return clamp01(base + ((top - 2) / 12) * 0.12);
  }
  return clamp01(base);
}

/** Preflop when the board is empty, otherwise the made-hand strength. */
export function handStrength(hole: string, board: string): number {
  return board.length === 0 ? preflopStrength(hole) : madeHandStrength(hole, board);
}

/** Human-readable best-hand label for display, e.g. "Pair, A's" or "A High". */
export function handLabel(hole: string, board: string): string {
  const cards = [...splitCards(hole), ...splitCards(board)];
  if (cards.length < 2) return "";
  try {
    return Hand.solve(cards).descr;
  } catch {
    return "";
  }
}

// Rule-based AI opponent. Given the game state on a bot's turn, it picks a legal
// action from made-hand / preflop strength, pot odds and position. Difficulty
// scales how tight, aggressive and bluffy it plays. No simulation, no network.

import { legalActions, type GameState } from "./engine";
import { BIG_BLIND } from "./format";
import { handStrength } from "./handStrength";
import type { HandAction } from "./types";

export type Difficulty = "easy" | "medium" | "hard";

interface DifficultyParams {
  foldBase: number; // base strength needed to continue vs a bet
  raiseAbove: number; // strength at/above which it raises or value-bets big
  betAbove: number; // strength at/above which it bets into an open pot
  bluff: number; // probability of turning a weak hand into aggression
  sizeFrac: number; // bet/raise size as a fraction of the pot
  stick: number; // how much pot odds tighten calls (lower = calls wider, stickier)
}

// The bots play loose: they see a lot of flops, call down lighter instead of
// folding every weak hand, and bluff now and then so the action stays lively and
// the table is fun (and beatable) to play against. `stick` discounts the pot-odds
// requirement so a bet does not auto-fold marginal hands.
const PARAMS: Record<Difficulty, DifficultyParams> = {
  // Loose-passive calling station: sticks around with almost anything, rarely
  // raises, bluffs occasionally. The easiest table to play against.
  easy: { foldBase: 0.08, raiseAbove: 0.84, betAbove: 0.52, bluff: 0.08, sizeFrac: 0.5, stick: 0.45 },
  // Loose and a bit aggressive: continues wide and mixes in real bluffs.
  medium: { foldBase: 0.14, raiseAbove: 0.66, betAbove: 0.46, bluff: 0.16, sizeFrac: 0.62, stick: 0.64 },
  // Loose-aggressive: applies pressure, value-bets thin and bluffs often.
  hard: { foldBase: 0.18, raiseAbove: 0.56, betAbove: 0.42, bluff: 0.24, sizeFrac: 0.72, stick: 0.8 },
};

function snapToBet(value: number, min: number, max: number): number {
  const snapped = Math.round(value / BIG_BLIND) * BIG_BLIND;
  return Math.max(min, Math.min(max, snapped));
}

/** Decide one action for the player to act. `rng` is injectable for tests. */
export function decideAction(
  state: GameState,
  difficulty: Difficulty,
  rng: () => number = Math.random,
): HandAction {
  const i = state.toAct;
  if (i === null) throw new Error("decideAction called with no player to act");

  const player = state.players[i];
  const legal = legalActions(state);
  const params = PARAMS[difficulty];

  const strength = handStrength(player.holeCards, state.board);
  const pot = state.players.reduce((sum, p) => sum + p.committedTotal, 0);
  const toCall = legal.callAmount;
  const facingBet = legal.canCall; // a call is only offered when there is a bet
  const potOdds = facingBet && pot + toCall > 0 ? toCall / (pot + toCall) : 0;

  // Late position (button / cutoff) plays a touch looser.
  const late = i === state.dealer || i === (state.dealer + 5) % 6;
  const posAdj = late ? 0.04 : 0;

  // `stick` discounts the price so a bet does not scare the bot off marginal
  // hands -- it calls wider and folds only its genuinely weak holdings.
  const continueThresh = Math.max(params.foldBase, potOdds * params.stick) - posAdj;
  const raiseThresh = params.raiseAbove - posAdj;
  const betThresh = params.betAbove - posAdj;
  const bluffing = rng() < params.bluff;

  const raiseTo = () => snapToBet(state.currentBet + pot * params.sizeFrac, legal.raiseMin, legal.raiseMax);
  const betTo = (frac: number) => snapToBet(pot * frac, legal.betMin, legal.betMax);

  if (facingBet) {
    // Strong enough to raise for value.
    if (strength >= raiseThresh && legal.canRaise) {
      return { player: i, kind: "raise", amount: raiseTo() };
    }
    // Occasional bluff-raise with a weak hand.
    if (bluffing && strength < continueThresh && legal.canRaise) {
      return { player: i, kind: "raise", amount: raiseTo() };
    }
    // Continue (call) when strong enough relative to the price.
    if (strength >= continueThresh) {
      return { player: i, kind: "call" };
    }
    return { player: i, kind: "fold" };
  }

  // No bet to face: check or bet.
  if (strength >= raiseThresh && legal.canBet) {
    if (difficulty === "hard" && strength > 0.93 && legal.canAllin && rng() < 0.25) {
      return { player: i, kind: "allin" };
    }
    return { player: i, kind: "bet", amount: betTo(params.sizeFrac) };
  }
  if (strength >= betThresh && legal.canBet) {
    return { player: i, kind: "bet", amount: betTo(params.sizeFrac) };
  }
  if (bluffing && legal.canBet) {
    return { player: i, kind: "bet", amount: betTo(0.5) };
  }
  return { player: i, kind: legal.canCheck ? "check" : "fold" };
}

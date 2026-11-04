// Pure, UI-free game logic for a simplified 6-max No-Limit Texas Hold'em hand.
//
// The engine owns the betting state machine and the legal-action rules; the UI
// only renders state and forwards button presses. On completion `toRecord`
// produces the exact payload the backend replays with pokerkit, so the two
// implementations validate the same rules.

import { freshDeck, shuffle } from "./cards";
import { BIG_BLIND, SMALL_BLIND, boardLine, describeAction, playerLabel } from "./format";
import type { HandAction, HandRecord, StreetName, StreetRecord } from "./types";

export const NUM_PLAYERS = 6;
const STREET_ORDER: StreetName[] = ["preflop", "flop", "turn", "river"];

export interface LogEntry {
  text: string;
  bold?: boolean;
}

export interface PlayerState {
  index: number;
  holeCards: string;
  stack: number; // chips remaining
  committedStreet: number; // chips put in during the current street
  committedTotal: number; // chips put in across the whole hand
  folded: boolean;
  allIn: boolean;
  actedThisRound: boolean;
}

export interface GameState {
  id: string;
  stack: number; // starting stack
  dealer: number;
  players: PlayerState[];
  deck: string[]; // remaining undealt cards (used for the board)
  street: StreetName;
  board: string; // cumulative board, for display
  currentBet: number; // highest committedStreet this round
  lastRaiseSize: number; // size of the last bet/raise (for the min-raise rule)
  toAct: number | null; // player index to act; null when the hand is resolved
  streets: StreetRecord[]; // accumulated record of play
  log: LogEntry[];
  complete: boolean;
  pot: number; // contested pot (set at completion)
  hasActed: boolean; // whether any action has been taken (Start -> Reset label)
}

export interface LegalActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canBet: boolean;
  betMin: number; // bet "to" level
  betMax: number; // bet "to" level (all-in)
  canRaise: boolean;
  raiseMin: number; // raise "to" level
  raiseMax: number; // raise "to" level (all-in)
  canAllin: boolean;
  allinChips: number; // chips the all-in would commit
}

export const NO_ACTIONS: LegalActions = {
  canFold: false,
  canCheck: false,
  canCall: false,
  callAmount: 0,
  canBet: false,
  betMin: 0,
  betMax: 0,
  canRaise: false,
  raiseMin: 0,
  raiseMax: 0,
  canAllin: false,
  allinChips: 0,
};

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function clone(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p })),
    deck: [...state.deck],
    streets: state.streets.map((s) => ({ ...s, actions: s.actions.map((a) => ({ ...a })) })),
    log: state.log.map((l) => ({ ...l })),
  };
}

function canAct(p: PlayerState): boolean {
  return !p.folded && !p.allIn && p.stack > 0;
}

function needsToAct(p: PlayerState, currentBet: number): boolean {
  return canAct(p) && (!p.actedThisRound || p.committedStreet < currentBet);
}

/** First player after `fromIndex` (exclusive, wrapping) that still needs to act. */
function findNextToAct(state: GameState, fromIndex: number): number | null {
  for (let step = 1; step <= NUM_PLAYERS; step++) {
    const idx = (fromIndex + step) % NUM_PLAYERS;
    if (needsToAct(state.players[idx], state.currentBet)) return idx;
  }
  return null;
}

function currentStreetRecord(state: GameState): StreetRecord {
  return state.streets[state.streets.length - 1];
}

function postBlind(state: GameState, idx: number, amount: number, label: string): void {
  const p = state.players[idx];
  const put = Math.min(amount, p.stack);
  p.stack -= put;
  p.committedStreet += put;
  p.committedTotal += put;
  if (p.stack === 0) p.allIn = true;
  state.log.push({ text: `${playerLabel(idx)} posts ${label} - ${put} chips` });
}

/** Deal a fresh hand: shuffle, deal hole cards, post blinds, set the first actor. */
export function startHand(
  stack: number,
  opts: { dealer?: number; rng?: () => number; id?: string } = {},
): GameState {
  const rng = opts.rng ?? Math.random;
  const dealer = opts.dealer ?? Math.floor(rng() * NUM_PLAYERS);
  const deck = shuffle(freshDeck(), rng);

  const players: PlayerState[] = [];
  const log: LogEntry[] = [];
  let cursor = 0;
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const hole = deck[cursor++] + deck[cursor++];
    players.push({
      index: i,
      holeCards: hole,
      stack,
      committedStreet: 0,
      committedTotal: 0,
      folded: false,
      allIn: false,
      actedThisRound: false,
    });
    log.push({ text: `${playerLabel(i)} is dealt ${hole}` });
  }

  const sb = (dealer + 1) % NUM_PLAYERS;
  const bb = (dealer + 2) % NUM_PLAYERS;

  const state: GameState = {
    id: opts.id ?? newId(),
    stack,
    dealer,
    players,
    deck: deck.slice(cursor),
    street: "preflop",
    board: "",
    currentBet: 0,
    lastRaiseSize: BIG_BLIND,
    toAct: null,
    streets: [{ street: "preflop", actions: [], board: "" }],
    log,
    complete: false,
    pot: 0,
    hasActed: false,
  };

  state.log.push({ text: "---" });
  state.log.push({ text: `${playerLabel(dealer)} is the dealer` });
  postBlind(state, sb, SMALL_BLIND, "small blind");
  postBlind(state, bb, BIG_BLIND, "big blind");
  state.currentBet = state.players[bb].committedStreet;
  state.log.push({ text: "---" });

  // First to act preflop is UTG: the first actable player after the big blind.
  state.toAct = findNextToAct(state, bb);
  if (state.toAct === null) closeRound(state); // everyone already all-in from blinds
  return state;
}

function dealBoard(state: GameState, count: number): string {
  const cards = state.deck.splice(0, count).join("");
  state.board += cards;
  return cards;
}

function advanceStreet(state: GameState, next: StreetName): void {
  const cards = dealBoard(state, next === "flop" ? 3 : 1);
  state.street = next;
  state.streets.push({ street: next, actions: [], board: cards });
  state.log.push({ text: boardLine(next, cards), bold: true });

  for (const p of state.players) {
    p.committedStreet = 0;
    p.actedThisRound = false;
  }
  state.currentBet = 0;
  state.lastRaiseSize = BIG_BLIND;
  // Postflop the first to act is the first actable player after the dealer.
  state.toAct = findNextToAct(state, state.dealer);
}

/** Deal the remaining streets with no betting (an all-in run-out). */
function runout(state: GameState): void {
  let idx = STREET_ORDER.indexOf(state.street);
  while (idx < STREET_ORDER.length - 1) {
    const next = STREET_ORDER[idx + 1];
    const cards = dealBoard(state, next === "flop" ? 3 : 1);
    state.street = next;
    state.streets.push({ street: next, actions: [], board: cards });
    state.log.push({ text: boardLine(next, cards), bold: true });
    idx++;
  }
}

function endHand(state: GameState): void {
  state.complete = true;
  state.toAct = null;

  // Contested pot = total contributed minus the single uncalled overhang.
  const contrib = state.players.map((p) => p.committedTotal);
  const [top, second] = [...contrib].sort((a, b) => b - a);
  const uncalled = top - second;
  state.pot = contrib.reduce((a, b) => a + b, 0) - uncalled;

  state.log.push({ text: `Hand #${state.id} ended`, bold: true });
  state.log.push({ text: `Final pot was ${state.pot}`, bold: true });
}

function closeRound(state: GameState): void {
  const stillIn = state.players.filter((p) => !p.folded);
  if (stillIn.length === 1) {
    endHand(state); // everyone else folded
    return;
  }
  if (state.street === "river") {
    endHand(state); // showdown
    return;
  }
  const canStillBet = state.players.filter((p) => canAct(p)).length;
  if (canStillBet < 2) {
    runout(state); // players are all-in; deal the remaining board
    endHand(state);
    return;
  }
  advanceStreet(state, STREET_ORDER[STREET_ORDER.indexOf(state.street) + 1]);
}

/** Apply one action for the player to act and return the resulting state. */
export function applyAction(prev: GameState, action: HandAction): GameState {
  const state = clone(prev);
  if (state.complete || state.toAct === null) return state;

  const idx = action.player;
  const p = state.players[idx];
  const toCall = state.currentBet - p.committedStreet;
  const recorded: HandAction = { player: idx, kind: action.kind };
  let logAmount: number | undefined;

  switch (action.kind) {
    case "fold":
      p.folded = true;
      break;
    case "check":
      break;
    case "call": {
      const chips = Math.min(toCall, p.stack);
      p.stack -= chips;
      p.committedStreet += chips;
      p.committedTotal += chips;
      if (p.stack === 0) p.allIn = true;
      break;
    }
    case "bet":
    case "raise": {
      const to = action.amount as number;
      const chips = to - p.committedStreet;
      p.stack -= chips;
      p.committedStreet = to;
      p.committedTotal += chips;
      if (p.stack === 0) p.allIn = true;
      state.lastRaiseSize = to - state.currentBet;
      state.currentBet = to;
      recorded.amount = to;
      logAmount = to;
      break;
    }
    case "allin": {
      const chips = p.stack;
      const to = p.committedStreet + chips;
      p.stack = 0;
      p.committedStreet = to;
      p.committedTotal += chips;
      p.allIn = true;
      if (to > state.currentBet) {
        state.lastRaiseSize = to - state.currentBet;
        state.currentBet = to;
      }
      logAmount = chips; // the log shows the chips committed
      break; // recorded.amount stays undefined: the server derives it
    }
  }

  p.actedThisRound = true;
  state.hasActed = true;
  currentStreetRecord(state).actions.push(recorded);
  state.log.push({ text: describeAction(idx, action.kind, logAmount) });

  // If everyone else has folded, the hand is over immediately.
  if (state.players.filter((pl) => !pl.folded).length === 1) {
    endHand(state);
    return state;
  }

  const next = findNextToAct(state, idx);
  if (next !== null) {
    state.toAct = next;
  } else {
    closeRound(state);
  }
  return state;
}

/** Legal actions for the player to act (drives button enabling/amounts). */
export function legalActions(state: GameState): LegalActions {
  if (state.complete || state.toAct === null) return NO_ACTIONS;
  const p = state.players[state.toAct];
  const toCall = state.currentBet - p.committedStreet;

  const canCheck = toCall === 0;
  const canCall = toCall > 0 && p.stack > 0;

  const canBet = state.currentBet === 0 && p.stack > 0;
  const betMin = Math.min(BIG_BLIND, p.stack);
  const betMax = p.stack; // committedStreet is 0 when a bet is possible

  const raiseMin = state.currentBet + Math.max(state.lastRaiseSize, BIG_BLIND);
  const raiseMax = p.committedStreet + p.stack; // all-in "to" level
  const canRaise = state.currentBet > 0 && p.stack > toCall && raiseMax >= raiseMin;

  return {
    canFold: true,
    canCheck,
    canCall,
    callAmount: Math.min(toCall, p.stack),
    canBet,
    betMin,
    betMax,
    canRaise,
    raiseMin,
    raiseMax,
    canAllin: p.stack > 0,
    allinChips: p.stack,
  };
}

/** The payload POSTed to the backend when the hand completes. */
export function toRecord(state: GameState): HandRecord {
  return {
    id: state.id,
    stack: state.stack,
    dealer: state.dealer,
    holeCards: state.players.map((p) => p.holeCards),
    streets: state.streets.map((s) => ({
      street: s.street,
      board: s.board,
      actions: s.actions.map((a) => ({ ...a })),
    })),
  };
}

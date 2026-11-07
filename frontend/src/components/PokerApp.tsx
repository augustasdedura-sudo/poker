"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ScrollText } from "lucide-react";

import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ActionBar } from "@/components/poker/ActionBar";
import { PokerTable } from "@/components/poker/PokerTable";
import { RoomBackdrop } from "@/components/poker/RoomBackdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHand, fetchHands } from "@/lib/api";
import { useTween } from "@/lib/useTween";
import { cn } from "@/lib/utils";
import {
  NO_ACTIONS,
  NUM_PLAYERS,
  applyAction,
  legalActions,
  startHand,
  toRecord,
  type GameState,
} from "@/lib/poker/engine";
import { decideAction, type Difficulty } from "@/lib/poker/bot";
import { BIG_BLIND } from "@/lib/poker/format";
import type { HandAction, StoredHand } from "@/lib/poker/types";

const DEFAULT_STACK = 10000;
const HERO = 0; // the human controls Player 1
const NEXT_HAND_DELAY = 2500; // 247-style pause between hands, in ms

/** Next funded seat after `from` (wrapping); used to rotate the button. */
function nextFunded(stacks: number[], from: number): number {
  for (let step = 1; step <= NUM_PLAYERS; step++) {
    const idx = (from + step) % NUM_PLAYERS;
    if (stacks[idx] > 0) return idx;
  }
  return from;
}

const liveCount = (stacks: number[]) => stacks.filter((s) => s > 0).length;

/** Short label shown in the pop-up bubble above a seat when it acts. */
function actionBubble(a: HandAction): string {
  switch (a.kind) {
    case "fold":
      return "Fold";
    case "check":
      return "Check";
    case "call":
      return "Call";
    case "bet":
      return `Bet ${a.amount?.toLocaleString()}`;
    case "raise":
      return `Raise ${a.amount?.toLocaleString()}`;
    case "allin":
      return "All-in";
  }
}

export function PokerApp() {
  const [stackInput, setStackInput] = useState(String(DEFAULT_STACK));
  const [stack, setStack] = useState(DEFAULT_STACK);
  const [game, setGame] = useState<GameState | null>(null);
  const [history, setHistory] = useState<StoredHand[]>([]);
  const [lastHand, setLastHand] = useState<StoredHand | null>(null);
  const [everActed, setEverActed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPanels, setShowPanels] = useState(false);
  const closePanels = useCallback(() => setShowPanels(false), []);

  // "H" toggles the log & history drawer (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "h" || e.key === "H") setShowPanels((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const [mode, setMode] = useState<"solo" | "manual">("solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Cash-game session (solo mode): a persistent bankroll per seat and a rotating
  // button. `table` is null until the player sits down.
  const [table, setTable] = useState<number[] | null>(null);
  const [button, setButton] = useState(0);
  const [buyIn, setBuyIn] = useState(DEFAULT_STACK);
  const [flash, setFlash] = useState<{ seat: number; text: string; key: number } | null>(null);
  const nextHandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNextHand = () => {
    if (nextHandTimer.current) {
      clearTimeout(nextHandTimer.current);
      nextHandTimer.current = null;
    }
  };
  useEffect(() => clearNextHand, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await fetchHands());
    } catch (e) {
      setError(`Could not load hand history: ${(e as Error).message}`);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const applyStack = () => {
    const value = Number.parseInt(stackInput, 10);
    if (Number.isFinite(value) && value > 0) {
      setStack(value);
      setStackInput(String(value));
    } else {
      setStackInput(String(stack));
    }
  };

  // --- Manual mode: one hand at a time, uniform stacks --------------------------

  const dealNewHand = () => {
    setError(null);
    setLastHand(null);
    setFlash(null);
    setGame(startHand(stack));
  };

  // --- Cash game (solo mode) ----------------------------------------------------

  const readBuyIn = () => {
    const value = Number.parseInt(stackInput, 10);
    return Number.isFinite(value) && value > 0 ? value : stack;
  };

  const dealCashHand = (seatStacks: number[], fromButton: number) => {
    const nb = nextFunded(seatStacks, fromButton);
    setButton(nb);
    setLastHand(null);
    setError(null);
    setFlash(null);
    setGame(startHand(seatStacks, { dealer: nb }));
  };

  const sitDown = () => {
    clearNextHand();
    const amount = readBuyIn();
    setBuyIn(amount);
    setStack(amount);
    const seats = Array<number>(NUM_PLAYERS).fill(amount);
    setTable(seats);
    const first = Math.floor(Math.random() * NUM_PLAYERS);
    setButton(first);
    setLastHand(null);
    setError(null);
    setFlash(null);
    setGame(startHand(seats, { dealer: first }));
  };

  const leaveTable = () => {
    clearNextHand();
    setTable(null);
    setGame(null);
    setLastHand(null);
  };

  const rebuyHero = () => {
    if (!table) return;
    const seats = [...table];
    seats[HERO] = buyIn;
    setTable(seats);
    dealCashHand(seats, button);
  };

  const refillTable = () => {
    if (!table) return;
    const seats = table.map((s) => (s > 0 ? s : buyIn));
    setTable(seats);
    dealCashHand(seats, button);
  };

  const scheduleNextHand = (seatStacks: number[], fromButton: number) => {
    clearNextHand();
    nextHandTimer.current = setTimeout(() => {
      nextHandTimer.current = null;
      dealCashHand(seatStacks, fromButton);
    }, NEXT_HAND_DELAY);
  };

  // --- Shared: persist a finished hand, then settle the cash game ----------------

  const saveHand = async (finished: GameState, seated: boolean, handButton: number) => {
    setBusy(true);
    try {
      const stored = await createHand(toRecord(finished));
      setLastHand(stored);
      await loadHistory();
      if (seated) {
        // Settle the table from the authoritative winnings, then line up the next
        // hand (or surface a bust / short-table state).
        const nextStacks = finished.stacks.map((s, i) => s + stored.winnings[i]);
        setTable(nextStacks);
        if (nextStacks[HERO] > 0 && liveCount(nextStacks) >= 2) {
          scheduleNextHand(nextStacks, handButton);
        }
      }
    } catch (e) {
      setError(`Could not save hand: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const isSolo = mode === "solo";
  const seated = isSolo && table !== null;

  const onAction = (action: HandAction) => {
    if (!game || game.complete) return;
    setFlash({ seat: action.player, text: actionBubble(action), key: Date.now() });
    const next = applyAction(game, action);
    setGame(next);
    setEverActed(true);
    if (next.complete) void saveHand(next, seated, button);
  };

  // In solo mode, each bot acts automatically a moment after its turn.
  useEffect(() => {
    if (!game || game.complete || mode !== "solo") return;
    if (game.toAct === null || game.toAct === HERO) return;
    const id = setTimeout(() => {
      const botAction = decideAction(game, difficulty);
      setFlash({ seat: botAction.player, text: actionBubble(botAction), key: Date.now() });
      const next = applyAction(game, botAction);
      setGame(next);
      setEverActed(true);
      if (next.complete) void saveHand(next, table !== null, button);
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, mode, difficulty]);

  const legal = game ? legalActions(game) : NO_ACTIONS;
  const heroTurn = !!game && !game.complete && (isSolo ? game.toAct === HERO : game.toAct !== null);
  const botTurn = isSolo && !!game && !game.complete && game.toAct !== null && game.toAct !== HERO;

  const heroStack = table ? table[HERO] : 0;
  const tableLive = table ? liveCount(table) : 0;
  const heroBusted = seated && !!game?.complete && heroStack <= 0;
  const tableTooSmall = seated && !!game?.complete && heroStack > 0 && tableLive < 2;
  const heroNet = seated && lastHand ? lastHand.winnings[HERO] : 0;
  const heroStackShown = useTween(heroStack);

  return (
    <main className="relative min-h-screen text-slate-100">
      <RoomBackdrop />
      <div className="mx-auto max-w-[1440px] px-6 py-5">
        {/* Header */}
        <header className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-lg font-semibold leading-none text-slate-50">
            <span className="text-brass-400">♠</span> 6-max Hold&apos;em
          </h1>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400">Mode</span>
              <div className="flex rounded-lg border border-white/[0.08] bg-slate-900 p-0.5 text-xs">
                {(["solo", "manual"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      if (m === mode) return;
                      clearNextHand();
                      setMode(m);
                      setGame(null);
                      setLastHand(null);
                      setTable(null);
                    }}
                    className={cn(
                      "flex h-8 items-center rounded-md px-3 font-medium duration-150 ease-out transition-colors",
                      mode === m
                        ? "bg-slate-700 text-slate-50 shadow-sm"
                        : "text-slate-400 hover:text-slate-200",
                    )}
                  >
                    {m === "solo" ? "You vs AI" : "Manual"}
                  </button>
                ))}
              </div>
            </div>
            {isSolo && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-400">Difficulty</span>
                <div className="flex rounded-lg border border-white/[0.08] bg-slate-900 p-0.5 text-xs">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "flex h-8 items-center rounded-md px-3 font-medium duration-150 ease-out capitalize transition-colors",
                        difficulty === d
                          ? "bg-slate-700 text-slate-50 shadow-sm"
                          : "text-slate-400 hover:text-slate-200",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {seated ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400">Your stack</span>
                  <div className="flex h-9 min-w-[96px] items-center justify-end rounded-lg border border-white/[0.08] bg-slate-900 px-3 font-mono text-sm tabular-nums text-slate-50">
                    {heroStackShown.toLocaleString()}
                  </div>
                </div>
                <Button variant="outline" onClick={leaveTable}>
                  Leave table
                </Button>
              </>
            ) : isSolo ? (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400">Buy-in</span>
                  <Input
                    type="number"
                    min={BIG_BLIND}
                    value={stackInput}
                    onChange={(e) => setStackInput(e.target.value)}
                    className="h-9 w-28 rounded-lg font-mono tabular-nums"
                  />
                </label>
                <Button variant="primary" onClick={sitDown}>
                  Sit down
                </Button>
              </>
            ) : (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400">Stacks</span>
                  <Input
                    type="number"
                    min={1}
                    value={stackInput}
                    onChange={(e) => setStackInput(e.target.value)}
                    className="h-9 w-28 rounded-lg font-mono tabular-nums"
                  />
                </label>
                <Button variant="outline" onClick={applyStack}>
                  Apply
                </Button>
                <Button variant="primary" onClick={dealNewHand}>
                  {everActed ? "Reset" : "Start"}
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label="Log and history"
              title="Log and history (H)"
              onClick={() => setShowPanels(true)}
            >
              <ScrollText strokeWidth={1.5} />
            </Button>
          </div>
        </header>

        {error && (
          <p className="mb-4 rounded-lg border border-clay-500/40 bg-clay-500/10 px-3 py-2 text-sm text-clay-300">
            {error}
          </p>
        )}

        {/* Table + actions */}
        <section className="animate-enter">
          <PokerTable game={game} fallbackStack={seated ? heroStack : stack} result={lastHand} hero={HERO} solo={isSolo} flash={flash} />
          <div className="mx-auto mt-4 max-w-3xl">
            {heroTurn ? (
              <ActionBar player={game!.toAct} legal={legal} disabled={busy} onAction={onAction} />
            ) : heroBusted ? (
              <div className="animate-enter flex flex-col items-center gap-3 rounded-2xl border border-clay-500/30 bg-slate-900 p-4 text-center">
                <p className="text-sm font-medium text-clay-300">
                  You&apos;re out of chips
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={rebuyHero}>
                    Rebuy {buyIn.toLocaleString()}
                  </Button>
                  <Button variant="outline" onClick={leaveTable}>
                    Leave table
                  </Button>
                </div>
              </div>
            ) : tableTooSmall ? (
              <div className="animate-enter flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-slate-900 p-4 text-center">
                <p className="text-sm font-medium text-slate-200">
                  You busted the table — everyone else is out of chips
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={refillTable}>
                    Reseat opponents
                  </Button>
                  <Button variant="outline" onClick={leaveTable}>
                    Leave with {heroStack.toLocaleString()}
                  </Button>
                </div>
              </div>
            ) : seated && game?.complete ? (
              <p
                className={cn(
                  "animate-enter py-3 text-center text-base font-medium",
                  heroNet > 0 ? "text-[#8cc7a0]" : heroNet < 0 ? "text-clay-300" : "text-slate-400",
                )}
              >
                {heroNet > 0
                  ? `You won ${heroNet.toLocaleString()} — next hand dealing…`
                  : heroNet < 0
                    ? `You lost ${Math.abs(heroNet).toLocaleString()} — next hand dealing…`
                    : "Next hand dealing…"}
              </p>
            ) : botTurn ? (
              <p className="py-3 text-center text-base text-slate-300">Opponents are thinking…</p>
            ) : (
              <p className="py-2 text-center text-sm text-slate-400">
                {game?.complete
                  ? 'Hand complete — press "Reset" to deal the next one'
                  : seated
                    ? "Dealing…"
                    : isSolo
                      ? 'Press "Sit down" to take a seat'
                      : 'Press "Start" to deal a hand'}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Log + history live in a slide-out drawer (header icon or the H key) */}
      <HistoryDrawer open={showPanels} onClose={closePanels} log={game?.log ?? []} hands={history} />
    </main>
  );
}

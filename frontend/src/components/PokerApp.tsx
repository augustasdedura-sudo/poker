"use client";

import { useCallback, useEffect, useState } from "react";

import { HandHistory } from "@/components/HandHistory";
import { ActionBar } from "@/components/poker/ActionBar";
import { LogPanel } from "@/components/poker/LogPanel";
import { PokerTable } from "@/components/poker/PokerTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHand, fetchHands } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  NO_ACTIONS,
  applyAction,
  legalActions,
  startHand,
  toRecord,
  type GameState,
} from "@/lib/poker/engine";
import { decideAction, type Difficulty } from "@/lib/poker/bot";
import type { HandAction, StoredHand } from "@/lib/poker/types";

const DEFAULT_STACK = 10000;
const HERO = 0; // the human controls Player 1

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
  const [mode, setMode] = useState<"solo" | "manual">("solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

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

  const dealNewHand = () => {
    setError(null);
    setLastHand(null);
    setGame(startHand(stack));
  };

  const saveHand = async (finished: GameState) => {
    setBusy(true);
    try {
      const stored = await createHand(toRecord(finished));
      setLastHand(stored);
      await loadHistory();
    } catch (e) {
      setError(`Could not save hand: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const onAction = (action: HandAction) => {
    if (!game || game.complete) return;
    const next = applyAction(game, action);
    setGame(next);
    setEverActed(true);
    if (next.complete) void saveHand(next);
  };

  // In single-player mode, each bot acts automatically a moment after its turn.
  useEffect(() => {
    if (!game || game.complete || mode !== "solo") return;
    if (game.toAct === null || game.toAct === HERO) return;
    const id = setTimeout(() => {
      const next = applyAction(game, decideAction(game, difficulty));
      setGame(next);
      setEverActed(true);
      if (next.complete) void saveHand(next);
    }, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, mode, difficulty]);

  const legal = game ? legalActions(game) : NO_ACTIONS;
  const isSolo = mode === "solo";
  const heroTurn = !!game && !game.complete && (isSolo ? game.toAct === HERO : game.toAct !== null);
  const botTurn = isSolo && !!game && !game.complete && game.toAct !== null && game.toAct !== HERO;
  const showActions = heroTurn;

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,#13233f_0%,#0a0f1c_60%)] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-5">
        {/* Header */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-teal-400">♠</span> 6-max Hold&apos;em
          </h1>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400">Mode</span>
              <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
                {(["solo", "manual"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 font-medium",
                      mode === m ? "bg-teal-500 text-slate-950" : "text-slate-300 hover:text-white",
                    )}
                  >
                    {m === "solo" ? "You vs AI" : "Manual"}
                  </button>
                ))}
              </div>
            </div>
            {isSolo && (
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Difficulty</span>
                <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 font-medium capitalize",
                        difficulty === d ? "bg-indigo-500 text-white" : "text-slate-300 hover:text-white",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400">Stacks</span>
              <Input
                type="number"
                min={1}
                value={stackInput}
                onChange={(e) => setStackInput(e.target.value)}
                className="h-9 w-28 border-slate-700 bg-slate-900 text-slate-100"
              />
            </label>
            <Button
              variant="outline"
              className="h-9 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              onClick={applyStack}
            >
              Apply
            </Button>
            <Button
              className="h-9 bg-teal-500 font-semibold text-slate-950 hover:bg-teal-400"
              onClick={dealNewHand}
            >
              {everActed ? "Reset" : "Start"}
            </Button>
          </div>
        </header>

        {error && (
          <p className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        {/* Table + actions */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <PokerTable game={game} fallbackStack={stack} result={lastHand} hero={HERO} solo={isSolo} />
          <div className="mx-auto mt-4 max-w-2xl">
            {showActions ? (
              <ActionBar player={game!.toAct} legal={legal} disabled={busy} onAction={onAction} />
            ) : botTurn ? (
              <p className="py-3 text-center text-sm text-slate-400">Opponents are thinking…</p>
            ) : (
              <p className="py-2 text-center text-sm text-slate-400">
                {game?.complete
                  ? 'Hand complete — press "Reset" to deal the next one.'
                  : 'Press "Start" to deal a hand.'}
              </p>
            )}
          </div>
        </section>

        {/* Log + history — hidden by default, kept mounted so they stay live */}
        <section className="mt-5">
          <button
            type="button"
            onClick={() => setShowPanels((v) => !v)}
            className="mb-3 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            {showPanels ? "Hide log & history" : "Show log & history"}
          </button>
          <div className={cn("grid gap-5 md:grid-cols-2", !showPanels && "hidden")}>
            <LogPanel log={game?.log ?? []} />
            <HandHistory hands={history} />
          </div>
        </section>
      </div>
    </main>
  );
}

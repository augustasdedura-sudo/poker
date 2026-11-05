"use client";

import { useCallback, useEffect, useState } from "react";

import { HandHistory } from "@/components/HandHistory";
import { ActionBar } from "@/components/poker/ActionBar";
import { LogPanel } from "@/components/poker/LogPanel";
import { PokerTable } from "@/components/poker/PokerTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHand, fetchHands } from "@/lib/api";
import {
  NO_ACTIONS,
  applyAction,
  legalActions,
  startHand,
  toRecord,
  type GameState,
} from "@/lib/poker/engine";
import type { HandAction, StoredHand } from "@/lib/poker/types";

const DEFAULT_STACK = 10000;

export function PokerApp() {
  const [stackInput, setStackInput] = useState(String(DEFAULT_STACK));
  const [stack, setStack] = useState(DEFAULT_STACK);
  const [game, setGame] = useState<GameState | null>(null);
  const [history, setHistory] = useState<StoredHand[]>([]);
  const [lastHand, setLastHand] = useState<StoredHand | null>(null);
  const [everActed, setEverActed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const legal = game ? legalActions(game) : NO_ACTIONS;
  const showActions = !!game && !game.complete;

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,#13233f_0%,#0a0f1c_60%)] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-5">
        {/* Header */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-teal-400">♠</span> 6-max Hold&apos;em
          </h1>
          <div className="flex items-end gap-2">
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
          <PokerTable game={game} fallbackStack={stack} result={lastHand} />
          <div className="mx-auto mt-4 max-w-2xl">
            {showActions ? (
              <ActionBar player={game!.toAct} legal={legal} disabled={busy} onAction={onAction} />
            ) : (
              <p className="py-2 text-center text-sm text-slate-400">
                {game?.complete
                  ? 'Hand complete — press "Reset" to deal the next one.'
                  : 'Press "Start" to deal a hand.'}
              </p>
            )}
          </div>
        </section>

        {/* Log + history */}
        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <LogPanel log={game?.log ?? []} />
          <HandHistory hands={history} />
        </section>
      </div>
    </main>
  );
}

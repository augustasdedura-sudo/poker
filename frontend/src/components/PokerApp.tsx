"use client";

import { useCallback, useEffect, useState } from "react";

import { HandHistory } from "@/components/HandHistory";
import { PlayingField } from "@/components/PlayingField";
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
    setGame(startHand(stack));
  };

  const saveHand = async (finished: GameState) => {
    setBusy(true);
    try {
      await createHand(toRecord(finished));
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
    if (next.complete) {
      void saveHand(next);
    }
  };

  const legal = game ? legalActions(game) : NO_ACTIONS;

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-4 text-2xl font-bold">6-max Texas Hold&apos;em</h1>
      {error && (
        <p className="mb-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <PlayingField
          stackInput={stackInput}
          onStackChange={setStackInput}
          onApply={applyStack}
          onReset={dealNewHand}
          resetLabel={everActed ? "Reset" : "Start"}
          log={game?.log ?? []}
          legal={legal}
          player={game?.toAct ?? null}
          showActions={!!game && !game.complete}
          busy={busy}
          onAction={onAction}
        />
        <HandHistory hands={history} />
      </div>
    </main>
  );
}

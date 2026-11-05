"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { LegalActions } from "@/lib/poker/engine";
import { BIG_BLIND, playerLabel } from "@/lib/poker/format";
import type { HandAction } from "@/lib/poker/types";

interface Props {
  player: number | null;
  legal: LegalActions;
  disabled?: boolean;
  onAction: (action: HandAction) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snap(value: number, min: number, max: number): number {
  // Snap to the big-blind grid, but always allow the exact max (all-in).
  const snapped = Math.round(value / BIG_BLIND) * BIG_BLIND;
  return clamp(snapped, min, max);
}

export function ActionBar({ player, legal, disabled, onAction }: Props) {
  // Raising takes precedence when facing a bet; otherwise betting.
  const mode: "bet" | "raise" | null = legal.canRaise ? "raise" : legal.canBet ? "bet" : null;
  const min = mode === "raise" ? legal.raiseMin : legal.betMin;
  const max = mode === "raise" ? legal.raiseMax : legal.betMax;

  const [amount, setAmount] = useState(min);
  useEffect(() => {
    setAmount(min);
  }, [min, max, player]);

  const off = disabled || player === null;
  const act = (action: Omit<HandAction, "player">) => {
    if (player !== null) onAction({ player, ...action });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-3">
      <div className="text-xs font-medium text-slate-400">
        {player !== null ? (
          <span>
            <span className="text-teal-300">{playerLabel(player)}</span> to act
          </span>
        ) : (
          "Waiting"
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="bg-rose-600 text-white hover:bg-rose-500"
          disabled={off || !legal.canFold}
          onClick={() => act({ kind: "fold" })}
        >
          Fold
        </Button>

        {legal.canCheck ? (
          <Button
            className="bg-slate-700 text-slate-100 hover:bg-slate-600"
            disabled={off}
            onClick={() => act({ kind: "check" })}
          >
            Check
          </Button>
        ) : (
          <Button
            className="bg-slate-700 text-slate-100 hover:bg-slate-600"
            disabled={off || !legal.canCall}
            onClick={() => act({ kind: "call" })}
          >
            Call {legal.canCall ? legal.callAmount.toLocaleString() : ""}
          </Button>
        )}

        {mode && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1">
            <button
              type="button"
              aria-label="decrease amount"
              className="h-7 w-7 rounded-md bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-40"
              disabled={off || amount - BIG_BLIND < min}
              onClick={() => setAmount((a) => clamp(a - BIG_BLIND, min, max))}
            >
              &minus;
            </button>
            <input
              type="range"
              min={min}
              max={max}
              step={BIG_BLIND}
              value={amount}
              disabled={off}
              onChange={(e) => setAmount(snap(Number(e.target.value), min, max))}
              className="h-1.5 w-32 cursor-pointer accent-teal-400"
            />
            <button
              type="button"
              aria-label="increase amount"
              className="h-7 w-7 rounded-md bg-slate-700 text-slate-100 hover:bg-slate-600 disabled:opacity-40"
              disabled={off || amount + BIG_BLIND > max}
              onClick={() => setAmount((a) => clamp(a + BIG_BLIND, min, max))}
            >
              +
            </button>
            <Button
              className="bg-teal-500 text-slate-950 hover:bg-teal-400"
              disabled={off}
              onClick={() => act({ kind: mode, amount })}
            >
              {mode === "raise" ? "Raise" : "Bet"} {amount.toLocaleString()}
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          className="border-amber-400/60 bg-transparent text-amber-300 hover:bg-amber-400/10"
          disabled={off || !legal.canAllin}
          onClick={() => act({ kind: "allin" })}
        >
          ALL-IN {legal.canAllin ? legal.allinChips.toLocaleString() : ""}
        </Button>
      </div>
    </div>
  );
}

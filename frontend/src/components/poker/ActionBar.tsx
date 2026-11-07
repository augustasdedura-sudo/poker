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
    <div className="animate-enter flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-slate-900 p-4 shadow-xl shadow-black/30">
      <div className="text-xs font-medium text-slate-400">
        {player !== null ? (
          <span>
            <span className="text-brass-300">{playerLabel(player)}</span> to act
          </span>
        ) : (
          "Waiting"
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
          disabled={off || !legal.canFold}
          onClick={() => act({ kind: "fold" })}
        >
          Fold
        </Button>

        {legal.canCheck ? (
          <Button
            className="bg-slate-700 text-slate-50 hover:bg-slate-600"
            disabled={off}
            onClick={() => act({ kind: "check" })}
          >
            Check
          </Button>
        ) : (
          <Button
            className="bg-slate-700 text-slate-50 tabular-nums hover:bg-slate-600"
            disabled={off || !legal.canCall}
            onClick={() => act({ kind: "call" })}
          >
            Call {legal.canCall ? legal.callAmount.toLocaleString() : ""}
          </Button>
        )}

        {mode && (
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-950 py-1 pl-2 pr-1">
            <button
              type="button"
              aria-label="decrease amount"
              className="h-7 w-7 rounded-md bg-slate-800 text-slate-200 transition-colors duration-150 ease-out hover:bg-slate-700 disabled:opacity-40"
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
              className="h-1.5 w-32 cursor-pointer accent-[#d6ac5e]"
            />
            <button
              type="button"
              aria-label="increase amount"
              className="h-7 w-7 rounded-md bg-slate-800 text-slate-200 transition-colors duration-150 ease-out hover:bg-slate-700 disabled:opacity-40"
              disabled={off || amount + BIG_BLIND > max}
              onClick={() => setAmount((a) => clamp(a + BIG_BLIND, min, max))}
            >
              +
            </button>
            <Button
              className="min-w-[104px] bg-brass-400 font-semibold text-brass-ink tabular-nums hover:bg-brass-300"
              disabled={off}
              onClick={() => act({ kind: mode, amount })}
            >
              {mode === "raise" ? "Raise" : "Bet"} {amount.toLocaleString()}
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          className="border-clay-500/50 bg-transparent text-clay-300 tabular-nums hover:bg-clay-500/10 hover:text-clay-300"
          disabled={off || !legal.canAllin}
          onClick={() => act({ kind: "allin" })}
        >
          All-in {legal.canAllin ? legal.allinChips.toLocaleString() : ""}
        </Button>
      </div>
    </div>
  );
}

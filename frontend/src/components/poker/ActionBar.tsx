"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

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
      <div className="text-sm font-medium text-slate-300">
        {player !== null ? (
          <span>
            <span className="text-brass-300">{playerLabel(player)}</span> to act
          </span>
        ) : (
          "Waiting"
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg" variant="quiet" disabled={off || !legal.canFold} onClick={() => act({ kind: "fold" })}>
          Fold
        </Button>

        {legal.canCheck ? (
          <Button size="lg" disabled={off} onClick={() => act({ kind: "check" })}>
            Check
          </Button>
        ) : (
          <Button size="lg" disabled={off || !legal.canCall} onClick={() => act({ kind: "call" })}>
            Call {legal.canCall ? legal.callAmount.toLocaleString() : ""}
          </Button>
        )}

        {mode && (
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-950 p-1 pl-2">
            <Button
              size="icon-sm"
              variant="quiet"
              aria-label="decrease amount"
              disabled={off || amount - BIG_BLIND < min}
              onClick={() => setAmount((a) => clamp(a - BIG_BLIND, min, max))}
            >
              <Minus strokeWidth={1.5} />
            </Button>
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
            <Button
              size="icon-sm"
              variant="quiet"
              aria-label="increase amount"
              disabled={off || amount + BIG_BLIND > max}
              onClick={() => setAmount((a) => clamp(a + BIG_BLIND, min, max))}
            >
              <Plus strokeWidth={1.5} />
            </Button>
            <Button
              variant="primary"
              className="h-10 min-w-[120px] text-base"
              disabled={off}
              onClick={() => act({ kind: mode, amount })}
            >
              {mode === "raise" ? "Raise" : "Bet"} {amount.toLocaleString()}
            </Button>
          </div>
        )}

        <Button size="lg" variant="danger" disabled={off || !legal.canAllin} onClick={() => act({ kind: "allin" })}>
          All-in {legal.canAllin ? legal.allinChips.toLocaleString() : ""}
        </Button>
      </div>
    </div>
  );
}

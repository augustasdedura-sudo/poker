"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LegalActions } from "@/lib/poker/engine";
import { BIG_BLIND, playerLabel } from "@/lib/poker/format";
import type { HandAction } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

interface Props {
  player: number | null;
  legal: LegalActions;
  disabled?: boolean;
  onAction: (action: HandAction) => void;
  pot?: number; // chips in the middle, including bets on this street
  currentBet?: number; // highest bet on this street
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snap(value: number, min: number, max: number): number {
  // Snap to the big-blind grid, but anything at or past the top is exactly max (all-in).
  if (value >= max) return max;
  const snapped = Math.round(value / BIG_BLIND) * BIG_BLIND;
  return clamp(snapped, min, max);
}

type Preset = { label: string; frac: number | "min" | "max" };
const PRESETS: Preset[] = [
  { label: "Min", frac: "min" },
  { label: "½ Pot", frac: 0.5 },
  { label: "¾ Pot", frac: 0.75 },
  { label: "Pot", frac: 1 },
  { label: "Max", frac: "max" },
];

/**
 * The hero's controls, in three rows like a desktop poker client:
 *   1. whose turn it is + quick sizing presets
 *   2. the six actions: Fold · Check · Call / Bet · Raise · Allin (illegal ones disabled)
 *   3. fine sizing: − slider + and a typed amount
 * The bet amount is one piece of state; presets, slider, stepper and the typed
 * field all write to it, and the Raise button always shows its current value.
 */
export function ActionBar({ player, legal, disabled, onAction, pot = 0, currentBet = 0 }: Props) {
  // Raising takes precedence when facing a bet; otherwise betting.
  const mode: "bet" | "raise" | null = legal.canRaise ? "raise" : legal.canBet ? "bet" : null;
  const min = mode === "raise" ? legal.raiseMin : legal.betMin;
  const max = mode === "raise" ? legal.raiseMax : legal.betMax;

  const [amount, setAmount] = useState(min);
  const [draft, setDraft] = useState<string | null>(null); // typed amount while editing
  useEffect(() => {
    setAmount(min);
    setDraft(null);
  }, [min, max, player]);

  const off = disabled || player === null;
  const sizingOff = off || !mode;
  const act = (action: Omit<HandAction, "player">) => {
    if (player !== null) onAction({ player, ...action });
  };

  // Pot-sized bets: a bet is a fraction of the pot; a raise is "call, then
  // raise by that fraction of the pot after calling" (the standard pot raise).
  const presetValue = (frac: Preset["frac"]): number => {
    if (frac === "min") return min;
    if (frac === "max") return max;
    const target =
      mode === "raise" ? currentBet + frac * (pot + legal.callAmount) : frac * pot;
    return snap(target, min, max);
  };

  const commitDraft = () => {
    if (draft === null) return;
    const n = parseInt(draft.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(n)) setAmount(snap(n, min, max));
    setDraft(null);
  };

  const fill = max > min ? ((amount - min) / (max - min)) * 100 : 100;

  return (
    <div className="animate-enter flex flex-col gap-3 rounded-lg border border-white/[0.07] bg-[#1c1a17] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_32px_rgba(0,0,0,0.45)]">
      {/* Row 1: turn + quick sizing */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[#a9a296] [text-shadow:0_1px_0_rgba(0,0,0,0.6)]">
          {player !== null ? (
            <>
              <span className="text-brass-300">{playerLabel(player)}</span> to act
            </>
          ) : (
            "Waiting"
          )}
        </div>
        <div className="grid grid-cols-5 gap-1" role="group" aria-label="Bet size presets">
          {PRESETS.map((p) => {
            const value = mode ? presetValue(p.frac) : 0;
            const active = !!mode && value === amount;
            return (
              <button
                key={p.label}
                type="button"
                disabled={sizingOff}
                onClick={() => {
                  setDraft(null);
                  setAmount(value);
                }}
                title={mode ? value.toLocaleString() : undefined}
                className={cn(
                  "h-8 rounded-md border px-2.5 text-xs font-semibold tracking-[0.01em] transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/60",
                  "disabled:pointer-events-none disabled:opacity-40",
                  active
                    ? "border-brass-400/50 bg-brass-400/[0.12] text-brass-200"
                    : "border-white/[0.07] bg-[#24211d] text-[#a9a296] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#2c2924] hover:text-[#ede8df]",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: all six actions, always present; the ones that aren't legal
          right now are disabled (e.g. Call with no bet to call). */}
      <div className="grid grid-cols-3 gap-2">
        <Button size="xl" variant="quiet" disabled={off || !legal.canFold} onClick={() => act({ kind: "fold" })}>
          Fold
        </Button>
        <Button size="xl" variant="call" disabled={off || !legal.canCheck} onClick={() => act({ kind: "check" })}>
          Check
        </Button>
        <Button size="xl" variant="call" disabled={off || !legal.canCall} onClick={() => act({ kind: "call" })}>
          Call {legal.canCall && <Amount value={legal.callAmount} />}
        </Button>
        <Button
          size="xl"
          variant="primary"
          disabled={off || mode !== "bet"}
          onClick={() => act({ kind: "bet", amount })}
        >
          Bet {mode === "bet" && <Amount value={amount} />}
        </Button>
        <Button
          size="xl"
          variant="primary"
          disabled={off || mode !== "raise"}
          onClick={() => act({ kind: "raise", amount })}
        >
          Raise {mode === "raise" && <Amount value={amount} />}
        </Button>
        <Button size="xl" variant="danger" disabled={off || !legal.canAllin} onClick={() => act({ kind: "allin" })}>
          Allin {legal.canAllin && <Amount value={legal.allinChips} />}
        </Button>
      </div>

      {/* Row 3: fine sizing */}
      <div className="flex items-center gap-2">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-md border border-white/[0.08] bg-[#12100e] px-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)]">
          <Button
            size="icon-sm"
            variant="well"
            aria-label="decrease amount"
            disabled={sizingOff || amount - BIG_BLIND < min}
            onClick={() => {
              setDraft(null);
              setAmount((a) => clamp(a - BIG_BLIND, min, max));
            }}
          >
            <Minus strokeWidth={1.75} />
          </Button>
          <input
            type="range"
            aria-label={mode === "raise" ? "Raise amount" : "Bet amount"}
            min={min}
            max={max}
            step={BIG_BLIND}
            value={amount}
            disabled={sizingOff}
            onChange={(e) => {
              setDraft(null);
              setAmount(snap(Number(e.target.value), min, max));
            }}
            className="bet-range min-w-0 flex-1"
            style={{ "--fill": `${fill}%` } as React.CSSProperties}
          />
          <Button
            size="icon-sm"
            variant="well"
            aria-label="increase amount"
            disabled={sizingOff || amount + BIG_BLIND > max}
            onClick={() => {
              setDraft(null);
              setAmount((a) => clamp(a + BIG_BLIND, min, max));
            }}
          >
            <Plus strokeWidth={1.75} />
          </Button>
        </div>
        <input
          type="text"
          inputMode="numeric"
          aria-label="Exact amount"
          disabled={sizingOff}
          value={draft ?? (mode ? amount.toLocaleString() : "")}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => {
            setDraft(String(amount));
            e.currentTarget.select();
          }}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitDraft();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setDraft(null);
              e.currentTarget.blur();
            }
          }}
          className="h-10 w-28 rounded-md border border-white/[0.08] bg-[#12100e] px-3 text-right font-mono text-base font-semibold tabular-nums text-[#ede8df] shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)] transition-colors duration-150 ease-out [text-shadow:0_1px_0_rgba(0,0,0,0.6)] focus-visible:border-brass-400/60 focus-visible:outline-none disabled:opacity-40"
        />
      </div>
    </div>
  );
}

/** Chip amounts in a button: mono figures so they don't jitter as they change. */
function Amount({ value }: { value: number }) {
  return <span className="font-mono font-semibold tabular-nums">{value.toLocaleString()}</span>;
}

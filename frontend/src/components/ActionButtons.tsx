"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { LegalActions } from "@/lib/poker/engine";
import { BIG_BLIND } from "@/lib/poker/format";
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

export function ActionButtons({ player, legal, disabled, onAction }: Props) {
  const [betAmount, setBetAmount] = useState(legal.betMin);
  const [raiseAmount, setRaiseAmount] = useState(legal.raiseMin);

  // Reset the bet/raise amounts to their minimums whenever it becomes a new
  // player's turn or the legal range changes.
  useEffect(() => {
    setBetAmount(legal.betMin);
  }, [legal.betMin, legal.betMax, player]);
  useEffect(() => {
    setRaiseAmount(legal.raiseMin);
  }, [legal.raiseMin, legal.raiseMax, player]);

  const off = disabled || player === null;
  const act = (action: Omit<HandAction, "player">) => {
    if (player === null) return;
    onAction({ player, ...action });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="destructive" disabled={off || !legal.canFold} onClick={() => act({ kind: "fold" })}>
        Fold
      </Button>

      <Button variant="secondary" disabled={off || !legal.canCheck} onClick={() => act({ kind: "check" })}>
        Check
      </Button>

      <Button variant="secondary" disabled={off || !legal.canCall} onClick={() => act({ kind: "call" })}>
        Call
      </Button>

      {/* Bet with - / + stepping by the big blind */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={off || !legal.canBet || betAmount - BIG_BLIND < legal.betMin}
          onClick={() => setBetAmount((a) => clamp(a - BIG_BLIND, legal.betMin, legal.betMax))}
          aria-label="decrease bet"
        >
          -
        </Button>
        <Button disabled={off || !legal.canBet} onClick={() => act({ kind: "bet", amount: betAmount })}>
          Bet {betAmount}
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={off || !legal.canBet || betAmount + BIG_BLIND > legal.betMax}
          onClick={() => setBetAmount((a) => clamp(a + BIG_BLIND, legal.betMin, legal.betMax))}
          aria-label="increase bet"
        >
          +
        </Button>
      </div>

      {/* Raise with - / + stepping by the big blind */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={off || !legal.canRaise || raiseAmount - BIG_BLIND < legal.raiseMin}
          onClick={() => setRaiseAmount((a) => clamp(a - BIG_BLIND, legal.raiseMin, legal.raiseMax))}
          aria-label="decrease raise"
        >
          -
        </Button>
        <Button disabled={off || !legal.canRaise} onClick={() => act({ kind: "raise", amount: raiseAmount })}>
          Raise {raiseAmount}
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={off || !legal.canRaise || raiseAmount + BIG_BLIND > legal.raiseMax}
          onClick={() => setRaiseAmount((a) => clamp(a + BIG_BLIND, legal.raiseMin, legal.raiseMax))}
          aria-label="increase raise"
        >
          +
        </Button>
      </div>

      <Button variant="outline" disabled={off || !legal.canAllin} onClick={() => act({ kind: "allin" })}>
        ALLIN
      </Button>
    </div>
  );
}

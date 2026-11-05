"use client";

import { PlayingCard, CardSlot } from "@/components/poker/Card";
import { Seat, type SeatView } from "@/components/poker/Seat";
import type { GameState } from "@/lib/poker/engine";
import { splitCards } from "@/lib/poker/cards";
import { playerLabel } from "@/lib/poker/format";
import type { StoredHand } from "@/lib/poker/types";

const SEAT_POS = [
  { top: "85%", left: "27%" },
  { top: "85%", left: "73%" },
  { top: "50%", left: "93%" },
  { top: "13%", left: "73%" },
  { top: "13%", left: "27%" },
  { top: "50%", left: "7%" },
];

const BET_POS = [
  { top: "67%", left: "34%" },
  { top: "67%", left: "66%" },
  { top: "50%", left: "75%" },
  { top: "32%", left: "66%" },
  { top: "32%", left: "34%" },
  { top: "50%", left: "25%" },
];

interface Props {
  game: GameState | null;
  fallbackStack: number;
  result: StoredHand | null;
}

export function PokerTable({ game, fallbackStack, result }: Props) {
  const dealer = game?.dealer ?? -1;
  const sb = game ? (dealer + 1) % 6 : -1;
  const bb = game ? (dealer + 2) % 6 : -1;

  const showResult = !!(game && game.complete && result && result.id === game.id);

  const seats: SeatView[] = Array.from({ length: 6 }, (_, i) => {
    const p = game?.players[i];
    return {
      index: i,
      name: playerLabel(i),
      stack: p ? p.stack : fallbackStack,
      holeCards: p?.holeCards ?? "",
      folded: p?.folded ?? false,
      allIn: p?.allIn ?? false,
      toAct: game?.toAct === i,
      isDealer: i === dealer,
      isSB: i === sb,
      isBB: i === bb,
      showCards: !!p,
      net: showResult ? result!.winnings[i] : undefined,
    };
  });

  const board = game ? splitCards(game.board) : [];
  const collectedPot = game
    ? game.complete
      ? game.pot
      : game.players.reduce((sum, p) => sum + p.committedTotal - p.committedStreet, 0)
    : 0;

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl select-none">
      {/* Rail + felt */}
      <div className="absolute inset-[4%] rounded-[50%] bg-[#07251d] shadow-2xl" />
      <div
        className="absolute inset-[7%] rounded-[50%] ring-1 ring-teal-300/20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, #1b8265 0%, #0f5643 55%, #0a3a2e 100%)",
          boxShadow: "inset 0 0 60px rgba(0,0,0,0.55)",
        }}
      />

      {/* Center: pot + community board */}
      <div className="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        <div className="rounded-full bg-black/35 px-3 py-1 text-sm font-semibold text-amber-300 ring-1 ring-amber-300/30">
          Pot {collectedPot.toLocaleString()}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }, (_, i) =>
            board[i] ? (
              <PlayingCard key={i} card={board[i]} size="md" />
            ) : (
              <CardSlot key={i} size="md" />
            ),
          )}
        </div>
        {game?.complete && (
          <div className="mt-1 rounded-full bg-black/40 px-3 py-0.5 text-xs text-slate-200">
            Hand complete &middot; final pot {game.pot.toLocaleString()}
          </div>
        )}
      </div>

      {/* Bet chips in front of players */}
      {game &&
        !game.complete &&
        game.players.map((p, i) =>
          p.committedStreet > 0 ? (
            <div
              key={`bet-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: BET_POS[i].top, left: BET_POS[i].left }}
            >
              <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-300/30">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-1 ring-amber-200" />
                {p.committedStreet.toLocaleString()}
              </span>
            </div>
          ) : null,
        )}

      {/* Seats */}
      {seats.map((seat) => (
        <div
          key={seat.index}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: SEAT_POS[seat.index].top, left: SEAT_POS[seat.index].left }}
        >
          <Seat seat={seat} />
        </div>
      ))}
    </div>
  );
}

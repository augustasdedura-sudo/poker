"use client";

import { PlayingCard, CardSlot } from "@/components/poker/Card";
import { Chips } from "@/components/poker/Chips";
import { Seat, type SeatView } from "@/components/poker/Seat";
import type { GameState } from "@/lib/poker/engine";
import { splitCards } from "@/lib/poker/cards";
import { playerLabel } from "@/lib/poker/format";
import { handLabel } from "@/lib/poker/handStrength";
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

const pct = (s: string) => parseFloat(s);

// Rough pixels per percent of the table's width / height, used only to aim the
// deal and chip-push animations (they don't need to be exact to read right).
const PX_X = 9;
const PX_Y = 5.5;

/** CSS vars aiming a seat's cards back at the middle of the table (where they're dealt from). */
function dealVector(i: number): React.CSSProperties {
  return {
    "--deal-x": `${(50 - pct(SEAT_POS[i].left)) * PX_X}px`,
    "--deal-y": `${(50 - pct(SEAT_POS[i].top)) * PX_Y}px`,
  } as React.CSSProperties;
}

/** CSS vars aiming a bet's chips back at the seat that pushed them out. */
function pushVector(i: number): React.CSSProperties {
  return {
    "--push-x": `${(pct(SEAT_POS[i].left) - pct(BET_POS[i].left)) * PX_X * 0.8}px`,
    "--push-y": `${(pct(SEAT_POS[i].top) - pct(BET_POS[i].top)) * PX_Y * 0.8}px`,
  } as React.CSSProperties;
}

interface Props {
  game: GameState | null;
  fallbackStack: number;
  result: StoredHand | null;
  hero: number; // the human's seat index
  solo: boolean; // true = hide opponents' cards (single-player mode)
  flash?: { seat: number; text: string; key: number } | null; // transient action bubble
}

export function PokerTable({ game, fallbackStack, result, hero, solo, flash }: Props) {
  const dealer = game?.dealer ?? -1;
  const sb = game ? (dealer + 1) % 6 : -1;
  const bb = game ? (dealer + 2) % 6 : -1;

  const showResult = !!(game && game.complete && result && result.id === game.id);
  // At a real showdown (2+ players still in at the end) opponents' cards are shown.
  const showdown = !!(game && game.complete && game.players.filter((p) => !p.folded).length > 1);

  const seats: SeatView[] = Array.from({ length: 6 }, (_, i) => {
    const p = game?.players[i];
    const sittingOut = !!game && game.stacks[i] === 0;
    const reveal = !solo || i === hero || (showdown && !!p && !p.folded);
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
      isHero: i === hero,
      sittingOut,
      showCards: !!p && reveal && !sittingOut,
      label: p && reveal && !sittingOut ? handLabel(p.holeCards, game ? game.board : "") : undefined,
      net: showResult ? result!.winnings[i] : undefined,
      flash: flash && flash.seat === i && !sittingOut ? { text: flash.text, key: flash.key } : null,
    };
  });

  const board = game ? splitCards(game.board) : [];
  const collectedPot = game
    ? game.complete
      ? game.pot
      : game.players.reduce((sum, p) => sum + p.committedTotal - p.committedStreet, 0)
    : 0;

  return (
    <div className="relative mx-auto aspect-[16/9] w-full max-w-[min(86rem,140vh)] select-none">
      {/* Shadow the table throws on the carpet */}
      <div
        className="absolute inset-x-[6%] bottom-[-2%] top-[10%] rounded-[50%] blur-2xl"
        style={{ background: "rgba(0,0,0,0.6)" }}
      />
      {/* Polished walnut rail, catching the lamp along its top edge */}
      <div
        className="absolute inset-[3.5%] rounded-[50%]"
        style={{
          background: [
            // lamp reflection on the varnish
            "radial-gradient(46% 14% at 50% 4%, rgba(255,226,180,0.42) 0%, rgba(255,226,180,0) 100%)",
            "radial-gradient(30% 10% at 50% 97%, rgba(255,210,160,0.12) 0%, rgba(255,210,160,0) 100%)",
            // grain running around the rail
            "repeating-linear-gradient(100deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 9px)",
            // the wood
            "linear-gradient(180deg, #7a4a2b 0%, #5a361f 20%, #3d2414 55%, #24150c 100%)",
          ].join(","),
          boxShadow:
            "inset 0 2px 0 rgba(255,226,186,0.22), inset 0 -4px 10px rgba(0,0,0,0.55), 0 2px 0 rgba(0,0,0,0.4)",
        }}
      />
      {/* Dark inner lip where the rail meets the cloth */}
      <div
        className="absolute inset-[6.4%] rounded-[50%]"
        style={{ background: "#120a06", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8)" }}
      />
      {/* Baize under a low lamp */}
      <div
        className="absolute inset-[7%] overflow-hidden rounded-[50%] ring-1 ring-black/60"
        style={{
          background: [
            // warm lamp light pooling over the middle of the table
            "radial-gradient(58% 52% at 50% 34%, rgba(255,232,186,0.11) 0%, rgba(255,232,186,0) 62%)",
            // fall-off toward the rail
            "radial-gradient(120% 100% at 50% 120%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 46%)",
            // the cloth
            "radial-gradient(ellipse at 50% 38%, #2f7451 0%, #215a3d 46%, #133826 100%)",
          ].join(","),
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.55), inset 0 6px 14px rgba(0,0,0,0.45)",
        }}
      >
        <div className="absolute inset-[7%] rounded-[50%] border border-[#f3e7cf]/[0.07]" />
        {/* Table mark pressed into the cloth */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none text-[108px] font-semibold leading-none text-black/[0.06]">♠</span>
        </div>
      </div>

      {/* Cone of light from the pendant lamp, falling onto the cloth */}
      <div
        className="pointer-events-none absolute inset-[7%] overflow-hidden rounded-[50%] mix-blend-screen"
        style={{
          background:
            "radial-gradient(34% 82% at 50% 0%, rgba(255,226,170,0.16) 0%, rgba(255,226,170,0.06) 45%, rgba(255,226,170,0) 75%)",
        }}
      />

      {/* Brass pendant lamp hanging over the middle of the table */}
      <div className="pointer-events-none absolute left-1/2 top-[-3%] flex w-[11%] -translate-x-1/2 flex-col items-center">
        {/* chain up to the ceiling */}
        <div
          className="absolute bottom-[70%] left-1/2 h-[60vh] w-[3px] -translate-x-1/2"
          style={{
            background:
              "repeating-linear-gradient(180deg, #8a6a35 0 5px, #3d2c14 5px 7px)",
          }}
        />
        <svg viewBox="0 0 120 52" className="relative w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]">
          <defs>
            <linearGradient id="lamp-shade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#6e5023" />
              <stop offset="0.35" stopColor="#e2bd72" />
              <stop offset="0.55" stopColor="#c99a4c" />
              <stop offset="1" stopColor="#5a401b" />
            </linearGradient>
            <radialGradient id="lamp-bulb" cx="0.5" cy="0" r="0.8">
              <stop offset="0" stopColor="#fff6dd" />
              <stop offset="0.5" stopColor="#ffd68f" stopOpacity="0.9" />
              <stop offset="1" stopColor="#ffb85c" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* finial */}
          <rect x="55" y="0" width="10" height="7" rx="2" fill="#a07a3a" />
          {/* dome shade */}
          <path d="M8 44 C 14 14, 106 14, 112 44 Z" fill="url(#lamp-shade)" />
          {/* rolled rim */}
          <rect x="4" y="42" width="112" height="5" rx="2.5" fill="#b48a45" />
          {/* lit opening */}
          <ellipse cx="60" cy="47" rx="50" ry="5" fill="url(#lamp-bulb)" />
        </svg>
      </div>

      {/* Center: pot + community board */}
      <div className="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-full bg-black/40 px-4 py-1.5 ring-1 ring-white/[0.08]">
          <span className="text-sm font-medium text-slate-200">Pot</span>
          <Chips amount={collectedPot} size="md" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) =>
            board[i] ? (
              <PlayingCard key={i} card={board[i]} size="lg" flip delay={i < 3 ? i * 120 : 0} />
            ) : (
              <CardSlot key={i} size="lg" />
            ),
          )}
        </div>
        {game?.complete && (
          <div className="animate-enter rounded-full bg-black/40 px-4 py-1.5 text-sm font-medium text-slate-100 ring-1 ring-white/[0.08]">
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
              key={`bet-${i}-${p.committedStreet}`}
              className="animate-chips absolute"
              style={{ top: BET_POS[i].top, left: BET_POS[i].left, ...pushVector(i) }}
            >
              <span className="rounded-full bg-black/50 px-2.5 py-1.5 ring-1 ring-white/[0.08]">
                <Chips amount={p.committedStreet} />
              </span>
            </div>
          ) : null,
        )}

      {/* Seats */}
      {seats.map((seat) => (
        <div
          key={seat.index}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: SEAT_POS[seat.index].top, left: SEAT_POS[seat.index].left, ...dealVector(seat.index) }}
        >
          <Seat seat={seat} dealKey={game?.id ?? "none"} />
        </div>
      ))}
    </div>
  );
}

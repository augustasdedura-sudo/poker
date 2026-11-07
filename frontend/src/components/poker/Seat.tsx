import { PlayingCard } from "@/components/poker/Card";
import { splitCards } from "@/lib/poker/cards";
import { useTween } from "@/lib/useTween";
import { cn } from "@/lib/utils";

export interface SeatView {
  index: number;
  name: string;
  stack: number;
  holeCards: string;
  folded: boolean;
  allIn: boolean;
  toAct: boolean;
  isDealer: boolean;
  isSB: boolean;
  isBB: boolean;
  isHero: boolean;
  showCards: boolean;
  sittingOut?: boolean; // busted / not in this hand
  label?: string; // best-hand label, e.g. "Pair, A's" (only when cards are shown)
  net?: number;
  flash?: { text: string; key: number } | null; // transient action bubble
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold leading-none shadow", className)}>
      {children}
    </span>
  );
}

// Action callouts read at a glance by weight, not by a rainbow: fold recedes,
// check/call are ivory, bets and raises are brass, and an all-in is clay.
function bubbleStyle(text: string): string {
  const t = text.toLowerCase();
  if (t.startsWith("all")) return "bg-clay-500 text-white ring-black/20";
  if (t.startsWith("raise") || t.startsWith("bet")) return "bg-brass-400 text-brass-ink ring-black/20";
  if (t.startsWith("call") || t.startsWith("check")) return "bg-slate-100 text-slate-950 ring-black/15";
  return "bg-slate-800 text-slate-300 ring-white/10"; // fold
}

export function Seat({ seat, dealKey }: { seat: SeatView; dealKey: string }) {
  const stack = useTween(seat.stack);
  const cards = seat.holeCards ? splitCards(seat.holeCards) : [];
  // Deal order: one card to each seat around the table, then the second card.
  const dealDelay = (cardIdx: number) => (cardIdx * 6 + seat.index) * 70;
  const faceUp = seat.showCards && cards.length === 2;
  const size = seat.isHero ? "lg" : "md";

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Action bubble — pops above the seat for a moment when the player acts. */}
      {seat.flash && (
        <div
          key={seat.flash.key}
          className={cn(
            "animate-bubble pointer-events-none absolute -top-11 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg px-3.5 py-2 text-base font-semibold leading-none shadow-lg shadow-black/40 ring-1",
            bubbleStyle(seat.flash.text),
          )}
        >
          {seat.flash.text}
        </div>
      )}

      {/* Hole cards (keyed by dealKey so the deal animation replays each hand) */}
      {seat.sittingOut ? (
        <div className="flex h-[88px] items-center text-sm font-medium text-slate-400">Sitting out</div>
      ) : seat.isHero ? (
        // The human's hand: large and fanned so it reads at a glance.
        <div
          className={cn(
            "relative flex items-end justify-center transition-opacity duration-300 ease-out",
            seat.folded && "opacity-40",
          )}
        >
          <span className="origin-bottom" style={{ transform: "rotate(-7deg)" }}>
            {faceUp ? (
              <PlayingCard key={`${dealKey}-0`} card={cards[0]} size={size} delay={dealDelay(0)} />
            ) : (
              <PlayingCard key={`${dealKey}-0`} faceDown size={size} delay={dealDelay(0)} />
            )}
          </span>
          <span className="origin-bottom" style={{ transform: "rotate(7deg)", marginLeft: -16 }}>
            {faceUp ? (
              <PlayingCard key={`${dealKey}-1`} card={cards[1]} size={size} delay={dealDelay(1)} />
            ) : (
              <PlayingCard key={`${dealKey}-1`} faceDown size={size} delay={dealDelay(1)} />
            )}
          </span>
        </div>
      ) : (
        <div className={cn("flex gap-1 transition-opacity duration-300 ease-out", seat.folded && "opacity-30")}>
          {faceUp ? (
            cards.map((c, i) => (
              <PlayingCard key={`${dealKey}-${i}`} card={c} size={size} delay={dealDelay(i)} />
            ))
          ) : (
            <>
              <PlayingCard key={`${dealKey}-0`} faceDown size={size} delay={dealDelay(0)} />
              <PlayingCard key={`${dealKey}-1`} faceDown size={size} delay={dealDelay(1)} />
            </>
          )}
        </div>
      )}

      {/* Avatar + name/stack plate */}
      <div
        className={cn(
          "relative flex w-[176px] items-center gap-3 rounded-xl border bg-slate-900/90 px-3 py-2 shadow-lg shadow-black/30 transition-[border-color,opacity] duration-300 ease-out",
          seat.toAct ? "animate-seat border-brass-400" : "border-white/[0.08]",
          seat.folded && "opacity-50",
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 transition-colors duration-300 ease-out",
            seat.toAct
              ? "bg-brass-400 text-brass-ink ring-brass-200/40"
              : "bg-slate-700 text-slate-200 ring-white/10",
          )}
        >
          {seat.index + 1}
        </div>
        <div className="min-w-0 text-left">
          <div className="truncate text-sm font-medium leading-5 text-slate-50">{seat.name}</div>
          <div
            className={cn(
              "font-mono text-[15px] font-medium leading-5 tabular-nums",
              seat.allIn ? "text-clay-300" : "text-slate-200",
            )}
          >
            {seat.allIn ? "All-in" : stack.toLocaleString()}
          </div>
        </div>

        {seat.isHero && (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold leading-none text-slate-950 shadow">
            You
          </span>
        )}
        {seat.isDealer && (
          <span className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-brass-300 to-brass-500 text-xs font-bold text-brass-ink ring-1 ring-black/30 shadow">
            D
          </span>
        )}
        <div className="absolute -left-2 -top-2 flex gap-1">
          {seat.isSB && <Badge className="bg-slate-800 text-slate-300 ring-1 ring-white/10">SB</Badge>}
          {seat.isBB && <Badge className="bg-slate-800 text-slate-300 ring-1 ring-white/10">BB</Badge>}
        </div>

        {seat.net !== undefined && seat.net !== 0 && (
          <div
            className={cn(
              "absolute -bottom-3 left-1/2 -translate-x-1/2 rounded px-2 py-1 text-sm font-semibold tabular-nums leading-none shadow",
              seat.net > 0 ? "bg-win text-white" : "bg-clay-600 text-white",
            )}
          >
            {seat.net > 0 ? `+${seat.net}` : seat.net}
          </div>
        )}
      </div>

      {/* Best-hand label (shown only when this seat's cards are revealed) */}
      {seat.label && (
        <div className="mt-3 max-w-[176px] truncate rounded-md bg-slate-800/90 px-2.5 py-1 text-center text-sm font-medium text-slate-100 ring-1 ring-white/5">
          {seat.label}
        </div>
      )}
    </div>
  );
}

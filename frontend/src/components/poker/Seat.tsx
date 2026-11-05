import { PlayingCard } from "@/components/poker/Card";
import { splitCards } from "@/lib/poker/cards";
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
  showCards: boolean;
  net?: number;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold leading-none", className)}>
      {children}
    </span>
  );
}

export function Seat({ seat }: { seat: SeatView }) {
  const cards = seat.holeCards ? splitCards(seat.holeCards) : [];

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Hole cards */}
      <div className={cn("flex gap-1 transition", seat.folded && "opacity-30")}>
        {seat.showCards && cards.length === 2 ? (
          cards.map((c, i) => <PlayingCard key={i} card={c} size="sm" faceDown={!seat.showCards} />)
        ) : (
          <>
            <PlayingCard faceDown />
            <PlayingCard faceDown />
          </>
        )}
      </div>

      {/* Name + stack plate */}
      <div
        className={cn(
          "relative w-[132px] rounded-xl border bg-slate-900/85 px-3 py-1.5 text-center backdrop-blur transition",
          seat.toAct
            ? "border-teal-400 shadow-[0_0_18px_rgba(45,212,191,0.45)]"
            : "border-slate-700",
          seat.folded && "opacity-50",
        )}
      >
        <div className="truncate text-xs font-semibold text-slate-100">{seat.name}</div>
        <div className="font-mono text-[11px] text-teal-300">
          {seat.allIn ? "ALL-IN" : `${seat.stack.toLocaleString()}`}
        </div>

        {/* Dealer button + blind markers */}
        <div className="absolute -right-2 -top-2 flex gap-1">
          {seat.isDealer && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-[10px] font-bold text-slate-900 shadow">
              D
            </span>
          )}
        </div>
        <div className="absolute -left-2 -top-2 flex gap-1">
          {seat.isSB && <Badge className="bg-sky-500 text-white">SB</Badge>}
          {seat.isBB && <Badge className="bg-indigo-500 text-white">BB</Badge>}
        </div>

        {/* Result at showdown */}
        {seat.net !== undefined && seat.net !== 0 && (
          <div
            className={cn(
              "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-bold leading-none shadow",
              seat.net > 0 ? "bg-emerald-500 text-white" : "bg-rose-600 text-white",
            )}
          >
            {seat.net > 0 ? `+${seat.net}` : seat.net}
          </div>
        )}
      </div>
    </div>
  );
}

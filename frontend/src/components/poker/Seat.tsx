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
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold leading-none shadow", className)}>
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
          cards.map((c, i) => <PlayingCard key={i} card={c} size="sm" />)
        ) : (
          <>
            <PlayingCard faceDown />
            <PlayingCard faceDown />
          </>
        )}
      </div>

      {/* Avatar + name/stack plate */}
      <div
        className={cn(
          "relative flex w-[142px] items-center gap-2 rounded-xl border bg-slate-900/85 px-2.5 py-1.5 backdrop-blur transition",
          seat.toAct ? "animate-seat border-teal-400" : "border-slate-700",
          seat.folded && "opacity-50",
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-slate-200 ring-1 ring-white/10",
            seat.toAct && "from-teal-500 to-cyan-700 text-slate-950",
          )}
        >
          {seat.index + 1}
        </div>
        <div className="min-w-0 text-left">
          <div className="truncate text-xs font-semibold text-slate-100">{seat.name}</div>
          <div className="font-mono text-[11px] text-teal-300">
            {seat.allIn ? "ALL-IN" : seat.stack.toLocaleString()}
          </div>
        </div>

        {seat.isDealer && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-[10px] font-bold text-slate-900 shadow">
            D
          </span>
        )}
        <div className="absolute -left-2 -top-2 flex gap-1">
          {seat.isSB && <Badge className="bg-sky-500 text-white">SB</Badge>}
          {seat.isBB && <Badge className="bg-indigo-500 text-white">BB</Badge>}
        </div>

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

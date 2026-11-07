import { parseCard } from "@/lib/poker/cardFormat";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "w-10 h-[58px]",
  md: "w-12 h-[70px]",
  lg: "w-[78px] h-[110px]",
};

const RANK_TEXT: Record<Size, string> = { sm: "text-sm", md: "text-lg", lg: "text-3xl" };
const SUIT_TEXT: Record<Size, string> = { sm: "text-lg", md: "text-2xl", lg: "text-5xl" };

export function PlayingCard({
  card,
  size = "sm",
  faceDown = false,
  delay = 0,
  flip = false,
}: {
  card?: string;
  size?: Size;
  faceDown?: boolean;
  delay?: number; // staggered deal-in delay, in ms
  flip?: boolean; // turn over in place (community cards) instead of sliding in
}) {
  const style = delay ? { animationDelay: `${delay}ms` } : undefined;
  const motion = flip ? "animate-flip" : "animate-card";

  if (faceDown || !card) {
    return (
      <div
        style={{ ...style, background: "linear-gradient(160deg, #7a2a2f 0%, #4c171b 100%)" }}
        className={cn(
          "flex items-center justify-center rounded-md shadow-md shadow-black/40 ring-1 ring-black/50",
          motion,
          SIZES[size],
        )}
      >
        <div className="h-[78%] w-[74%] rounded-[3px] border border-[#f3e7cf]/25" />
      </div>
    );
  }

  const { rank, symbol, color } = parseCard(card);
  return (
    <div
      style={{ ...style, background: "linear-gradient(180deg, #faf6ee 0%, #ece5d7 100%)" }}
      className={cn(
        "flex flex-col items-center justify-center rounded-md shadow-md shadow-black/40 ring-1 ring-black/15",
        motion,
        SIZES[size],
      )}
    >
      <span className={cn("font-bold leading-none", RANK_TEXT[size])} style={{ color }}>
        {rank}
      </span>
      <span className={cn("leading-none", SUIT_TEXT[size])} style={{ color }}>
        {symbol}
      </span>
    </div>
  );
}

/** An empty outlined slot for a community card not yet dealt. */
export function CardSlot({ size = "md" }: { size?: Size }) {
  return <div className={cn("rounded-md border border-dashed border-[#f3e7cf]/20 bg-black/[0.06]", SIZES[size])} />;
}

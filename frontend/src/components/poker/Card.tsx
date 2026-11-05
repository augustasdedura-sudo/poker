import { parseCard } from "@/lib/poker/cardFormat";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

const SIZES: Record<Size, string> = {
  sm: "w-9 h-[52px]",
  md: "w-12 h-[70px]",
};

const RANK_TEXT: Record<Size, string> = { sm: "text-sm", md: "text-lg" };
const SUIT_TEXT: Record<Size, string> = { sm: "text-base", md: "text-2xl" };

export function PlayingCard({
  card,
  size = "sm",
  faceDown = false,
}: {
  card?: string;
  size?: Size;
  faceDown?: boolean;
}) {
  if (faceDown || !card) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-cyan-800 ring-1 ring-black/30 shadow",
          SIZES[size],
        )}
      >
        <div className="h-3/5 w-3/5 rounded-[3px] border border-white/30" />
      </div>
    );
  }

  const { rank, symbol, color } = parseCard(card);
  return (
    <div
      className={cn(
        "animate-card flex flex-col items-center justify-center rounded-md bg-white shadow-md ring-1 ring-black/10",
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
  return <div className={cn("rounded-md border-2 border-dashed border-white/15", SIZES[size])} />;
}

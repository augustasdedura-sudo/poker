"use client";

import { cn } from "@/lib/utils";
import { useTween } from "@/lib/useTween";

// A small stacked-chips graphic with an amount label. The chip colour reflects
// the bet size (classic casino denominations, in clay-chip tones).

function chipColor(amount: number): string {
  if (amount < 40) return "#d9d1c1"; // bone
  if (amount < 100) return "#b8452f"; // clay red
  if (amount < 500) return "#2f7a4a"; // green
  if (amount < 2000) return "#2f4f86"; // blue
  return "#c99a46"; // brass
}

type Size = "sm" | "md";

export function Chips({
  amount,
  size = "sm",
  className,
}: {
  amount: number;
  size?: Size;
  className?: string;
}) {
  const shown = useTween(amount);
  const color = chipColor(amount);
  const disc = size === "md" ? 22 : 18;
  const offset = size === "md" ? 4 : 3;
  const chips = [0, 1, 2];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="relative inline-block"
        style={{ width: disc, height: disc + chips.length * offset }}
      >
        {chips.map((i) => (
          <span
            key={i}
            className="absolute left-0 rounded-full border border-dashed transition-colors duration-300 ease-out"
            style={{
              width: disc,
              height: disc,
              bottom: i * offset,
              background: color,
              borderColor: "rgba(255,250,240,0.6)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.45)",
            }}
          />
        ))}
      </span>
      <span
        className={cn(
          "font-mono font-medium tabular-nums text-slate-100",
          size === "md" ? "text-lg" : "text-[15px]",
        )}
      >
        {shown.toLocaleString()}
      </span>
    </span>
  );
}

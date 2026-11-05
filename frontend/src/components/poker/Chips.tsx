import { cn } from "@/lib/utils";

// A small stacked-chips graphic with an amount label. The chip colour reflects
// the bet size (classic casino denominations), purely for visual flavour.

function chipColor(amount: number): string {
  if (amount < 40) return "#94a3b8"; // slate
  if (amount < 100) return "#ef4444"; // red
  if (amount < 500) return "#22c55e"; // green
  if (amount < 2000) return "#3b82f6"; // blue
  return "#f59e0b"; // gold
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
  const color = chipColor(amount);
  const disc = size === "md" ? 18 : 14;
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
            className="absolute left-0 rounded-full border border-dashed"
            style={{
              width: disc,
              height: disc,
              bottom: i * offset,
              background: color,
              borderColor: "rgba(255,255,255,0.65)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          />
        ))}
      </span>
      <span
        className={cn(
          "font-semibold text-amber-100",
          size === "md" ? "text-sm" : "text-[11px]",
        )}
      >
        {amount.toLocaleString()}
      </span>
    </span>
  );
}

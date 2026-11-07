"use client";

import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A recessed segmented control with one tab that slides between options.
 *
 * Why it reads as crafted rather than generated:
 *  - It is *carved into* the surface (dark well + inner shadow) instead of a row
 *    of floating pills, so the options read as one physical switch.
 *  - Exactly one raised tab, and it moves: the tab slides with a transform
 *    (no width/left animation), which tells you the choice changed and where.
 *  - Equal-width segments (CSS grid, 1fr each) keep the tab the same size, so the
 *    slide is a pure translateX of its own width — no measuring, no jitter.
 *  - Nested radius: 6px well − 2px inset = 4px tab.
 */
export function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const n = options.length;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <div
        role="group"
        aria-label={label}
        className="relative inline-grid h-9 rounded-md border border-white/[0.08] bg-[#12100e] p-[2px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)]"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      >
        {/* The sliding tab */}
        <span
          aria-hidden
          className="absolute bottom-[2px] left-[2px] top-[2px] rounded border border-white/[0.07] bg-[#2a2723] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out"
          style={{
            width: `calc((100% - 4px) / ${n})`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative z-10 flex items-center justify-center whitespace-nowrap rounded px-3 text-xs font-semibold tracking-[0.01em] transition-colors duration-150 ease-out [text-shadow:0_1px_0_rgba(0,0,0,0.6)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400/60",
                active ? "text-slate-50" : "text-slate-400 hover:text-slate-200",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

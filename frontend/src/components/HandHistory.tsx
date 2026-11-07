"use client";

import { historyLines } from "@/lib/poker/format";
import type { StoredHand } from "@/lib/poker/types";

interface Props {
  hands: StoredHand[];
}

export function HandHistory({ hands }: Props) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 text-sm font-medium text-slate-300">Hand history</h2>
      {hands.length === 0 ? (
        <div className="rounded-lg border border-white/[0.08] bg-slate-900/95 p-4 text-sm text-slate-500">
          No hands played yet.
        </div>
      ) : (
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1 xl:max-h-[calc(100vh-140px)]">
          {hands.map((hand) => {
            const [title, ...rest] = historyLines(hand);
            return (
              <div
                key={hand.id}
                className="animate-enter rounded-lg border border-[#4a6796]/50 bg-[#1b2740]/95 p-4 font-mono text-xs leading-relaxed text-slate-300"
              >
                <div className="mb-1 break-all font-semibold text-[#a9bfe4]">{title}</div>
                {rest.map((line, i) => (
                  <div key={i} className="break-words text-slate-300">
                    {line}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { historyLines } from "@/lib/poker/format";
import type { StoredHand } from "@/lib/poker/types";

interface Props {
  hands: StoredHand[];
}

export function HandHistory({ hands }: Props) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Hand history
      </h2>
      {hands.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-500">
          No hands played yet.
        </div>
      ) : (
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
          {hands.map((hand) => {
            const [title, ...rest] = historyLines(hand);
            return (
              <div
                key={hand.id}
                className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-3 font-mono text-[12px] leading-relaxed text-slate-200"
              >
                <div className="mb-1 break-all font-semibold text-teal-300">{title}</div>
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

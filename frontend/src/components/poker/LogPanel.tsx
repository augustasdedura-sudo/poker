"use client";

import type { LogEntry } from "@/lib/poker/engine";

export function LogPanel({ log }: { log: LogEntry[] }) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 text-sm font-medium text-slate-300">Playing field log</h2>
      <div
        data-testid="play-log"
        className="h-80 overflow-y-auto rounded-2xl border border-white/[0.08] bg-slate-900 p-4 font-mono text-[13px] leading-relaxed text-slate-300"
      >
        {log.length === 0 ? (
          <p className="text-slate-500">Press Start to deal a new hand</p>
        ) : (
          log.map((entry, i) => (
            <div key={i} className={entry.bold ? "font-bold text-slate-50" : undefined}>
              {entry.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

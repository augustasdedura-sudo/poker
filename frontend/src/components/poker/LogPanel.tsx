"use client";

import type { LogEntry } from "@/lib/poker/engine";

export function LogPanel({ log }: { log: LogEntry[] }) {
  return (
    <div className="flex flex-col">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Playing field log
      </h2>
      <div
        data-testid="play-log"
        className="h-80 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950/70 p-3 font-mono text-[13px] leading-relaxed text-slate-200"
      >
        {log.length === 0 ? (
          <p className="text-slate-500">Press Start to deal a new hand.</p>
        ) : (
          log.map((entry, i) => (
            <div key={i} className={entry.bold ? "font-bold text-teal-200" : undefined}>
              {entry.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

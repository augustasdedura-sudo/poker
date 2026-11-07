"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { HandHistory } from "@/components/HandHistory";
import { Button } from "@/components/ui/button";
import { LogPanel } from "@/components/poker/LogPanel";
import type { LogEntry } from "@/lib/poker/engine";
import type { StoredHand } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  log: LogEntry[];
  hands: StoredHand[];
}

/**
 * The playing-field log and hand history, tucked into a panel that slides in
 * from the right. It stays mounted while closed so both keep updating live.
 */
export function HistoryDrawer({ open, onClose, log, hands }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Dim the table behind the panel */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-label="Log and hand history"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col gap-6 overflow-y-auto border-l border-white/[0.08] bg-slate-950/95 p-6 shadow-2xl shadow-black/60 backdrop-blur transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-100">Log and history</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close log and history"
            tabIndex={open ? 0 : -1}
            onClick={onClose}
          >
            <X strokeWidth={1.5} />
          </Button>
        </div>
        <LogPanel log={log} />
        <HandHistory hands={hands} />
      </aside>
    </>
  );
}

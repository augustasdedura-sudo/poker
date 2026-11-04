"use client";

import { ActionButtons } from "@/components/ActionButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LegalActions, LogEntry } from "@/lib/poker/engine";
import type { HandAction } from "@/lib/poker/types";

interface Props {
  stackInput: string;
  onStackChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  resetLabel: string;
  log: LogEntry[];
  legal: LegalActions;
  player: number | null;
  showActions: boolean;
  busy: boolean;
  onAction: (action: HandAction) => void;
}

export function PlayingField({
  stackInput,
  onStackChange,
  onApply,
  onReset,
  resetLabel,
  log,
  legal,
  player,
  showActions,
  busy,
  onAction,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="text-lg font-semibold">Playing field log</h2>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor="stack">Stacks</Label>
          <Input
            id="stack"
            type="number"
            min={1}
            className="w-32"
            value={stackInput}
            onChange={(e) => onStackChange(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={onApply}>
          Apply
        </Button>
        <Button onClick={onReset}>{resetLabel}</Button>
      </div>

      <div
        data-testid="play-log"
        className="min-h-[16rem] flex-1 overflow-y-auto rounded-md border bg-muted/40 p-3 font-mono text-sm"
      >
        {log.length === 0 ? (
          <p className="text-muted-foreground">
            Set the stacks, then press &quot;{resetLabel}&quot; to deal a new hand.
          </p>
        ) : (
          log.map((entry, i) => (
            <div key={i} className={entry.bold ? "font-bold" : undefined}>
              {entry.text}
            </div>
          ))
        )}
      </div>

      {showActions && (
        <ActionButtons player={player} legal={legal} disabled={busy} onAction={onAction} />
      )}
    </div>
  );
}

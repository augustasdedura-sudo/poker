"use client";

import { Card, CardContent } from "@/components/ui/card";
import { historyLines } from "@/lib/poker/format";
import type { StoredHand } from "@/lib/poker/types";

interface Props {
  hands: StoredHand[];
}

export function HandHistory({ hands }: Props) {
  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="text-lg font-semibold">Hand history</h2>
      {hands.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hands played yet.</p>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {hands.map((hand) => (
            <Card key={hand.id} className="border-blue-300 bg-blue-50">
              <CardContent className="space-y-1 p-3 font-mono text-xs leading-relaxed text-blue-950">
                {historyLines(hand).map((line, i) => (
                  <div key={i} className={i === 0 ? "font-semibold break-all" : "break-words"}>
                    {line}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

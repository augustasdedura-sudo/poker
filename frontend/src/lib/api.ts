// REST client for the hand resource. All calls are same-origin (/api/...) and
// proxied to the backend by the Next.js rewrite.

import type { HandRecord, StoredHand } from "@/lib/poker/types";

const BASE = "/api/hands";

export async function fetchHands(): Promise<StoredHand[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Failed to load hands: ${res.status}`);
  return res.json();
}

export async function createHand(record: HandRecord): Promise<StoredHand> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`Failed to save hand: ${res.status}`);
  return res.json();
}

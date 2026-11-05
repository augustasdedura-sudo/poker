// Visual helpers for rendering cards. Uses a four-colour deck (clubs green,
// diamonds blue, hearts red, spades near-black) for quick readability.

export const SUIT_SYMBOL: Record<string, string> = {
  c: "♣", // ♣
  d: "♦", // ♦
  h: "♥", // ♥
  s: "♠", // ♠
};

export const SUIT_COLOR: Record<string, string> = {
  s: "#1e293b",
  h: "#e4436b",
  d: "#3b82f6",
  c: "#22c55e",
};

export interface ParsedCard {
  rank: string; // "A", "K", ... "10", "2"
  suit: string; // c d h s
  symbol: string;
  color: string;
}

export function parseCard(card: string): ParsedCard {
  const rank = card[0];
  const suit = card[1];
  return {
    rank: rank === "T" ? "10" : rank,
    suit,
    symbol: SUIT_SYMBOL[suit] ?? "?",
    color: SUIT_COLOR[suit] ?? "#1e293b",
  };
}

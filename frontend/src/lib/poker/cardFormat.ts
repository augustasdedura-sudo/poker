// Visual helpers for rendering cards. Uses a four-colour deck (clubs green,
// diamonds blue, hearts red, spades near-black) for quick readability.

export const SUIT_SYMBOL: Record<string, string> = {
  c: "♣", // ♣
  d: "♦", // ♦
  h: "♥", // ♥
  s: "♠", // ♠
};

export const SUIT_COLOR: Record<string, string> = {
  s: "#1f1c19", // ink
  h: "#b8322f", // card red
  d: "#2b5aa8", // deep blue
  c: "#2f7a45", // baize green
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
    color: SUIT_COLOR[suit] ?? "#1f1c19",
  };
}

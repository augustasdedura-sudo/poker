// A standard 52-card deck. A card is rank + suit, e.g. "Tc", "As".

export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
export const SUITS = ["c", "d", "h", "s"] as const;

export function freshDeck(): string[] {
  const deck: string[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(rank + suit);
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle. A custom `rng` (returning [0,1)) makes shuffles
 * deterministic in tests.
 */
export function shuffle(deck: string[], rng: () => number = Math.random): string[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Split a concatenated card string ("3hKdQs") into individual cards. */
export function splitCards(cards: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    out.push(cards.slice(i, i + 2));
  }
  return out;
}

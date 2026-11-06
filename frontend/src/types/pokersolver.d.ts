declare module "pokersolver" {
  export class Hand {
    rank: number;
    name: string;
    descr: string;
    cards: unknown[];
    static solve(cards: string[], game?: string, canDisqualify?: boolean): Hand;
    static winners(hands: Hand[]): Hand[];
  }
  const _default: { Hand: typeof Hand };
  export default _default;
}

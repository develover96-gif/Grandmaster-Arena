
import { Card, Suit, Rank, PlayerState, TrickPlay } from './types';
import crypto from 'crypto';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

export function fairInt(serverSeed: string, clientSeed: string, purpose: string, maxExclusive: number): number {
  const hmac = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${purpose}`).digest('hex');
  const int = parseInt(hmac.slice(0, 13), 16);
  return Math.floor((int / Math.pow(2, 52)) * maxExclusive);
}

export function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function fairShuffle(serverSeed: string, clientSeed: string, dealNumber: number): Card[] {
  const deck = freshDeck();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = fairInt(serverSeed, clientSeed, `shuffle-${dealNumber}-${i}`, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealHands(shuffledDeck: Card[]): Card[][] {
  const hands: Card[][] = [[], [], [], []];
  shuffledDeck.forEach((card, i) => {
    hands[i % 4].push(card);
  });
  // Sort hands for better UI experience
  hands.forEach(hand => {
    hand.sort((a, b) => {
      if (a.suit !== b.suit) {
        const suitOrder = { S: 0, H: 1, D: 2, C: 3 };
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return b.rank - a.rank;
    });
  });
  return hands;
}

export function getLegalPlays(hand: Card[], ledSuit: Suit | null): Card[] {
  if (!ledSuit) return hand;
  const followable = hand.filter(c => c.suit === ledSuit);
  if (followable.length > 0) {
    // Standard rule: Must follow suit. 
    // Some variants require following and beating the current highest card if possible.
    // We'll stick to basic follow-suit for now.
    return followable;
  }
  // Cannot follow suit, can play anything (including trump)
  return hand;
}

export function cardBeats(a: Card, b: Card, ledSuit: Suit | null): boolean {
  if (!ledSuit) return true;
  const aTrump = a.suit === 'S';
  const bTrump = b.suit === 'S';
  
  if (aTrump && !bTrump) return true;
  if (!aTrump && bTrump) return false;
  if (aTrump && bTrump) return a.rank > b.rank;
  
  if (a.suit === ledSuit && b.suit === ledSuit) return a.rank > b.rank;
  if (a.suit === ledSuit) return true;
  return false;
}

export function resolveTrick(trick: TrickPlay[], ledSuit: Suit | null): number {
  if (trick.length === 0) return -1;
  let winner = trick[0];
  for (let i = 1; i < trick.length; i++) {
    if (cardBeats(trick[i].card, winner.card, ledSuit)) {
      winner = trick[i];
    }
  }
  return winner.seat;
}

export function calculateDealScore(call: number, tricksWon: number): number {
  if (tricksWon >= call) {
    return call + (tricksWon - call) * 0.1;
  }
  return -call;
}

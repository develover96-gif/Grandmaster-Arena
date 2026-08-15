
export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = number; // 2-14 (11=J, 12=Q, 13=K, 14=A)

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type Phase = 'bidding' | 'playing' | 'scoring' | 'match_over';

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  seat: number;
  hand: Card[];
  call: number | null;
  tricksWon: number;
  score: number;
  cumulativeScore: number;
}

export interface TrickPlay {
  seat: number;
  card: Card;
}

export interface CallbreakState {
  roomId: string;
  players: PlayerState[];
  currentDeal: number;
  totalDeals: number;
  phase: Phase;
  turnSeat: number;
  dealerSeat: number;
  ledSuit: Suit | null;
  currentTrick: TrickPlay[];
  lastTrick: TrickPlay[] | null;
  serverSeedHash: string;
}

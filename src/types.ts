
export type CoinStyle = 'classic' | 'neon' | 'metallic';

export type CheckersColor = 'w' | 'b';
export type LudoColor = 'red' | 'green' | 'yellow' | 'blue';
export type PlayerId = string | null;

export interface Piece {
  id: string;
  color: CheckersColor;
  isKing: boolean;
  row: number;
  col: number;
}

export interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  captured?: { row: number; col: number };
}

// Ludo specific types
export interface LudoToken {
  id: string;
  color: string;
  loc: number | 'yard';
  slot?: number;
}

export interface LudoGameState {
  roomId: string;
  gameType: 'checkers' | 'ludo';
  players: Record<string, {
    id: PlayerId;
    tokens: LudoToken[];
  }>;
  turn: string;
  status: 'waiting' | 'playing' | 'ended';
  winner: string | null;
  stake: number;
  turnTimer: number;
  lastRoll: number | null;
  diceRolled: boolean;
  consecutiveSixes: number;
  botThinking?: boolean;
}

export interface GameState {
  roomId: string;
  gameType: 'checkers' | 'ludo' | 'callbreak';
  board?: (Piece | null)[][]; // for checkers
  players: Record<string, any>; // Record<string, PlayerId | { id: PlayerId; tokens: LudoToken[] } | any>
  turn: string; // current turn (color/seat)
  status: 'waiting' | 'playing' | 'ended';
  winner: string | null;
  stake: number;
  endReason?: 'timeout' | 'resignation' | 'capture' | 'completion';
  botThinking?: boolean;
  turnTimer: number;
  captures?: { w: number; b: number }; // for checkers
  lastRoll?: number | null; // for ludo
  diceRolled?: boolean; // for ludo
  consecutiveSixes?: number; // for ludo
  
  // Callbreak specific
  phase?: 'bidding' | 'playing' | 'scoring' | 'match_over';
  currentDeal?: number;
  totalDeals?: number;
  ledSuit?: string | null;
  currentTrick?: any[];
  lastTrick?: any[] | null;
  serverSeedHash?: string;
  dealerSeat?: number;
}

export interface ServerToClientEvents {
  'game:update': (state: any) => void;
  'game:error': (message: string) => void;
  'game:log': (log: { message: string; color?: string }) => void;
  'player:assigned': (seat: any) => void;
  'room:join': (roomId: string) => void;
  'match:found': (roomId: string) => void;
}

export interface ClientToServerEvents {
  'room:join': (roomId: string) => void;
  'room:create': (gameType?: 'checkers' | 'ludo' | 'callbreak') => void;
  'match:search': (data: { stake: number; gameType: 'checkers' | 'ludo' | 'callbreak' }) => void;
  'game:move': (data: { roomId: string; move: any }) => void;
  'game:roll': (data: { roomId: string }) => void;
  'game:bid': (data: { roomId: string; call: number }) => void;
  'game:play': (data: { roomId: string; card: any }) => void;
  'game:chat': (data: { roomId: string; message: string }) => void;
  'game:reset': () => void;
}

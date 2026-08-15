
import { Server, Socket } from 'socket.io';
import { CallbreakState, PlayerState, Card, TrickPlay } from './types';
import { 
  generateServerSeed, hashSeed, fairShuffle, dealHands, 
  getLegalPlays, resolveTrick, calculateDealScore 
} from './engine';

const TURN_TIME = 30;
const BOT_ID = 'BOT_USER';
const BOT_DELAY = 1500;

export function initCallbreak(roomId: string, stake: number): CallbreakState {
  return {
    roomId,
    players: [],
    currentDeal: 1,
    totalDeals: 5,
    phase: 'bidding',
    turnSeat: 1, // Left of dealer (seat 0)
    dealerSeat: 0,
    ledSuit: null,
    currentTrick: [],
    lastTrick: null,
    serverSeedHash: '',
  };
}

export function startNewDeal(room: any, io: Server) {
  const serverSeed = generateServerSeed();
  room.serverSeed = serverSeed;
  room.serverSeedHash = hashSeed(serverSeed);
  
  const clientSeed = room.roomId; // Simple client seed for now
  const shuffled = fairShuffle(serverSeed, clientSeed, room.currentDeal);
  const hands = dealHands(shuffled);
  
  room.players.forEach((p: any, i: number) => {
    p.hand = hands[i];
    p.call = null;
    p.tricksWon = 0;
    p.score = 0;
  });
  
  room.phase = 'bidding';
  room.turnSeat = (room.dealerSeat + 1) % 4;
  room.ledSuit = null;
  room.currentTrick = [];
  
  broadcastFilteredState(room, io);
  
  // Bot bidding
  room.players.forEach((p: any, i: number) => {
    if (p.id === BOT_ID) {
      setTimeout(() => {
        handleBid(room, i, chooseBotBid(p.hand), io);
      }, BOT_DELAY + i * 200);
    }
  });
}

function chooseBotBid(hand: Card[]): number {
  const spades = hand.filter(c => c.suit === 'S').length;
  const highCards = hand.filter(c => c.rank >= 13).length; // K, A
  const bid = Math.max(1, Math.min(8, Math.floor(spades * 0.7 + highCards * 0.5 + Math.random())));
  return bid;
}

const BOT_NAMES = [
  'Aria', 'Soren', 'Mira', 'Rex', 'Kai', 'Lyra', 'Finn', 'Nova',
  'Atlas', 'Elara', 'Zane', 'Maya', 'Silas', 'Juno', 'Leo', 'Ria'
];

export function getRandomBotName(exclude: string[] = []) {
  const available = BOT_NAMES.filter(n => !exclude.includes(n));
  return available[Math.floor(Math.random() * available.length)];
}

export function handleBid(room: any, seat: number, call: number, io: Server) {
  if (room.phase !== 'bidding' || room.players[seat].call !== null) return;
  
  room.players[seat].call = call;
  
  if (room.players.every((p: any) => p.call !== null)) {
    room.phase = 'playing';
    room.turnSeat = (room.dealerSeat + 1) % 4;
    io.to(room.roomId).emit('game:log', { message: 'All bids placed! Let the game begin.', color: '#26c6ee' });
  }
  
  broadcastFilteredState(room, io);
  maybeBotPlay(room, io);
}

export function handlePlay(room: any, seat: number, card: Card, io: Server) {
  if (room.phase !== 'playing' || room.turnSeat !== seat) return;
  
  const player = room.players[seat];
  const cardIdx = player.hand.findIndex((c: any) => c.suit === card.suit && c.rank === card.rank);
  if (cardIdx === -1) return;
  
  const legal = getLegalPlays(player.hand, room.ledSuit);
  if (!legal.some(c => c.suit === card.suit && c.rank === card.rank)) return;
  
  // Execute play
  const playedCard = player.hand.splice(cardIdx, 1)[0];
  room.currentTrick.push({ seat, card: playedCard });
  if (room.currentTrick.length === 1) {
    room.ledSuit = playedCard.suit;
  }
  
  if (room.currentTrick.length < 4) {
    room.turnSeat = (room.turnSeat + 1) % 4;
  } else {
    // Resolve trick
    const winnerSeat = resolveTrick(room.currentTrick, room.ledSuit);
    room.players[winnerSeat].tricksWon++;
    room.lastTrick = [...room.currentTrick];
    room.currentTrick = [];
    room.ledSuit = null;
    room.turnSeat = winnerSeat;
    
    if (room.players[0].hand.length === 0) {
      // Deal complete
      endDeal(room, io);
      return;
    }
  }
  
  broadcastFilteredState(room, io);
  maybeBotPlay(room, io);
}

function maybeBotPlay(room: any, io: Server) {
  const currentTurn = room.turnSeat;
  const player = room.players[currentTurn];
  if (player && player.id === BOT_ID && room.phase === 'playing') {
    setTimeout(() => {
      const legal = getLegalPlays(player.hand, room.ledSuit);
      // Simple bot: plays a random legal card
      const card = legal[Math.floor(Math.random() * legal.length)];
      handlePlay(room, currentTurn, card, io);
    }, BOT_DELAY);
  }
}

function endDeal(room: any, io: Server) {
  room.players.forEach((p: any) => {
    const dealScore = calculateDealScore(p.call, p.tricksWon);
    p.score = dealScore;
    p.cumulativeScore += dealScore;
  });
  
  room.phase = 'scoring';
  broadcastFilteredState(room, io);
  
  setTimeout(() => {
    if (room.currentDeal < room.totalDeals) {
      room.currentDeal++;
      room.dealerSeat = (room.dealerSeat + 1) % 4;
      startNewDeal(room, io);
    } else {
      room.phase = 'match_over';
      const winner = room.players.reduce((prev: any, current: any) => (prev.cumulativeScore > current.cumulativeScore) ? prev : current);
      room.winner = winner.name;
      room.status = 'ended';
      broadcastFilteredState(room, io);
    }
  }, 1000); // 1 second delay between rounds
}

export function broadcastFilteredState(room: any, io: Server) {
  room.players.forEach((p: any, i: number) => {
    if (p.id !== BOT_ID) {
      const filteredState = {
        ...room,
        players: room.players.map((other: any, j: number) => ({
          ...other,
          hand: i === j ? other.hand : other.hand.length, // Hide other players' hands
        }))
      };
      io.to(p.id).emit('game:update', filteredState);
    }
  });
}

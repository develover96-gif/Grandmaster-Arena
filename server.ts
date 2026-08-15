
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GameState, Piece, CheckersColor, LudoColor, Move, LudoToken } from './src/types';
import { initCallbreak, startNewDeal, handleBid, handlePlay, broadcastFilteredState, getRandomBotName } from './src/games/callbreak/serverLogic';

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const rooms: Record<string, GameState> = {};
  const botTimeouts: Record<string, NodeJS.Timeout> = {};
  const matchmakingQueue: Record<string, string[]> = {}; // "stake-gameType" -> socket ids
  const BOT_ID = 'BOT_USER';
  const TURN_TIME = 30;

  // Ludo Constants
  const LUDO_COLORS = ['pink', 'cyan'];

  function initLudoTokens(color: string): LudoToken[] {
    return [0, 1, 2, 3].map(i => ({
      id: `${color}-${i}`,
      color,
      loc: 'yard',
      slot: i
    }));
  }

  setInterval(() => {
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      if (room.status === 'playing') {
        room.turnTimer--;
        if (room.turnTimer <= 0) {
          const playerColors = Object.keys(room.players);
          const currentIndex = playerColors.indexOf(room.turn);
          const nextIndex = (currentIndex + 1) % playerColors.length;
          
          room.turn = playerColors[nextIndex];
          room.turnTimer = TURN_TIME;
          room.lastRoll = null;
          room.diceRolled = false;
          room.consecutiveSixes = 0;
          room.botThinking = false;
        }

        // Bot Logic
        const isLudo = room.gameType === 'ludo';
        const currentPlayer = room.players[room.turn];
        const currentPlayerId = isLudo ? currentPlayer?.id : currentPlayer;

        if (currentPlayerId === BOT_ID && room.status === 'playing' && !room.botThinking) {
          room.botThinking = true;
          io.to(roomId).emit('game:update', room);

          if (room.gameType === 'checkers' && room.board) {
            const botPieces = room.board.flat().filter(p => p?.color === room.turn) as Piece[];
            const allMoves = botPieces.flatMap(p => getValidCheckersMoves(room, p));
            
            setTimeout(() => {
              if (allMoves.length > 0) {
                const jumpMoves = allMoves.filter(m => m.captured);
                const move = jumpMoves.length > 0 ? jumpMoves[0] : allMoves[Math.floor(Math.random() * allMoves.length)];
                
                const { from, to } = move;
                const piece = room.board![from.row][from.col]!;
                room.board![from.row][from.col] = null;
                piece.row = to.row;
                piece.col = to.col;
                if ((piece.color === 'w' && to.row === 0) || (piece.color === 'b' && to.row === 7)) piece.isKing = true;
                room.board![to.row][to.col] = piece;

                if (move.captured && room.captures) {
                  room.board![move.captured.row][move.captured.col] = null;
                  room.captures[room.turn as 'w' | 'b']++;
                  const nextJumps = getValidCheckersMoves(room, piece).filter(m => m.captured);
                  if (nextJumps.length > 0) {
                    room.botThinking = false;
                    io.to(roomId).emit('game:update', room);
                    return;
                  }
                }
                room.turn = room.turn === 'w' ? 'b' : 'w';
                room.turnTimer = TURN_TIME;
              } else {
                // No moves possible
                room.status = 'ended';
                room.winner = room.turn === 'w' ? 'b' : 'w';
              }
              room.botThinking = false;
              io.to(roomId).emit('game:update', room);
            }, 1500);
          } else if (room.gameType === 'ludo') {
            setTimeout(() => {
              if (!room.diceRolled) {
                room.lastRoll = Math.floor(Math.random() * 6) + 1;
                room.diceRolled = true;

                if (room.lastRoll === 6) {
                  room.consecutiveSixes = (room.consecutiveSixes || 0) + 1;
                } else {
                  room.consecutiveSixes = 0;
                }

                if (room.consecutiveSixes === 3) {
                   setTimeout(() => {
                    room.consecutiveSixes = 0;
                    room.lastRoll = null;
                    room.diceRolled = false;
                    const colors = Object.keys(room.players);
                    const currentIndex = colors.indexOf(room.turn);
                    room.turn = colors[(currentIndex + 1) % colors.length];
                    room.turnTimer = TURN_TIME;
                    room.botThinking = false;
                    io.to(roomId).emit('game:update', room);
                  }, 1500);
                  return;
                }

                io.to(roomId).emit('game:update', room);

                const player = room.players[room.turn];
                if (!player || !player.tokens) {
                   room.botThinking = false;
                   return;
                }

                const possibleMoves = (player.tokens as LudoToken[]).filter(t => {
                  if (t.loc === 'yard') return room.lastRoll === 6;
                  return (t.loc as number) + (room.lastRoll || 0) <= 56;
                });

                setTimeout(() => {
                  if (possibleMoves.length === 0) {
                    const colors = Object.keys(room.players);
                    const currentIndex = colors.indexOf(room.turn);
                    room.turn = colors[(currentIndex + 1) % colors.length];
                    room.lastRoll = null;
                    room.diceRolled = false;
                    room.turnTimer = TURN_TIME;
                  } else {
                    const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                    executeLudoMove(roomId, move.id);
                  }
                  room.botThinking = false;
                  io.to(roomId).emit('game:update', room);
                }, 1000);
              }
            }, 1000);
          }
        }
        io.to(roomId).emit('game:update', room);
      }
    });
  }, 1000);

  // --- Checkers Logic ---
  function initBoard(): (Piece | null)[][] {
    const board: (Piece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          board[r][c] = { id: `b-${r}-${c}`, color: 'b', isKing: false, row: r, col: c };
        }
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          board[r][c] = { id: `w-${r}-${c}`, color: 'w', isKing: false, row: r, col: c };
        }
      }
    }
    return board;
  }

  function getValidCheckersMoves(room: GameState, piece: Piece): Move[] {
    const moves: Move[] = [];
    if (!room.board) return [];
    const dirs = piece.isKing ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : 
                 piece.color === 'w' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];

    for (const [dr, dc] of dirs) {
      const tr = piece.row + dr;
      const tc = piece.col + dc;
      if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && !room.board[tr][tc]) {
        moves.push({ from: { row: piece.row, col: piece.col }, to: { row: tr, col: tc } });
      }

      const jr = piece.row + dr * 2;
      const jc = piece.col + dc * 2;
      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !room.board[jr][jc]) {
        const midR = piece.row + dr;
        const midC = piece.col + dc;
        const midPiece = room.board[midR][midC];
        if (midPiece && midPiece.color !== piece.color) {
          moves.push({ 
            from: { row: piece.row, col: piece.col }, 
            to: { row: jr, col: jc },
            captured: { row: midR, col: midC }
          });
        }
      }
    }
    return moves;
  }

  function executeLudoMove(roomId: string, tokenId: string) {
    const room = rooms[roomId];
    if (!room || room.status !== 'playing' || !room.lastRoll) return;

    const player = room.players[room.turn];
    if (!player || !player.tokens) return;

    const token = (player.tokens as LudoToken[]).find(t => t.id === tokenId);
    if (!token) return;

    const roll = room.lastRoll;
    let newLoc: number;

    if (token.loc === 'yard') {
      if (roll === 6) newLoc = 0;
      else return;
    } else {
      newLoc = (token.loc as number) + roll;
    }

    if (newLoc > 56) return;

    token.loc = newLoc;

    // Handle captures
    let captureHappened = false;
    if (newLoc < 51) {
      const START_IDX: Record<string, number> = { pink: 40, cyan: 14 };
      const absIdx = (START_IDX[room.turn] + newLoc) % 52;
      
      const otherColor = room.turn === 'pink' ? 'cyan' : 'pink';
      const otherPlayer = room.players[otherColor];
      
      if (otherPlayer && otherPlayer.tokens) {
        otherPlayer.tokens.forEach((t: LudoToken) => {
          if (typeof t.loc === 'number' && t.loc < 51) {
            const otherAbsIdx = (START_IDX[otherColor] + t.loc) % 52;
            if (absIdx === otherAbsIdx) {
              const safeAbsIndices = [1, 9, 14, 22, 27, 35, 40, 48];
              if (!safeAbsIndices.includes(absIdx)) {
                t.loc = 'yard';
                captureHappened = true;
                // Bonus for capture (10% of stake)
                if (player.balance !== undefined) {
                  player.balance += room.stake * 0.1;
                }
              }
            }
          }
        });
      }
    }

    if (newLoc === 56) {
      // Bonus for home (10% of stake)
      if (player.balance !== undefined) {
        player.balance += room.stake * 0.1;
      }
    }

    // Check win condition
    if (player.tokens.every((t: LudoToken) => t.loc === 56)) {
      room.status = 'ended';
      room.winner = room.turn;
      io.to(roomId).emit('game:update', room);
      return;
    }

    // Turn logic
    if (roll !== 6 && !captureHappened) {
      const colors = Object.keys(room.players);
      const currentIndex = colors.indexOf(room.turn);
      room.turn = colors[(currentIndex + 1) % colors.length];
      room.consecutiveSixes = 0;
    } else if (roll !== 6) {
      room.consecutiveSixes = 0;
    }
    
    room.lastRoll = null;
    room.diceRolled = false;
    room.turnTimer = TURN_TIME;
    io.to(roomId).emit('game:update', room);
  }

  // --- Shared Logic ---
  function createRoom(roomId: string, gameType: 'checkers' | 'ludo' | 'callbreak' = 'checkers', stake: number = 0.025): GameState {
    let players: Record<string, any>;
    let turn = 'w';

    if (gameType === 'checkers') {
      players = { w: null, b: null };
      turn = 'w';
    } else if (gameType === 'ludo') {
      players = { 
        pink: { id: null, tokens: initLudoTokens('pink'), balance: stake }, 
        cyan: { id: null, tokens: initLudoTokens('cyan'), balance: stake } 
      };
      turn = 'pink';
    } else {
      // callbreak
      players = {}; // Handled by room:join for now
      turn = '0';
    }

    const room: GameState = {
      roomId,
      gameType,
      players,
      turn,
      status: 'waiting',
      winner: null,
      stake,
      turnTimer: TURN_TIME,
    };

    if (gameType === 'checkers') {
      room.board = initBoard();
      room.captures = { w: 0, b: 0 };
    } else if (gameType === 'ludo') {
      room.lastRoll = null;
      room.diceRolled = false;
      room.consecutiveSixes = 0;
    } else if (gameType === 'callbreak') {
      Object.assign(room, initCallbreak(roomId, stake));
    }

    return room;
  }

  io.on('connection', (socket) => {
    socket.on('match:search', ({ stake, gameType }: { stake: number, gameType: 'checkers' | 'ludo' | 'callbreak' }) => {
      const queueKey = `${stake}-${gameType}`;
      if (!matchmakingQueue[queueKey]) matchmakingQueue[queueKey] = [];
      if (matchmakingQueue[queueKey].includes(socket.id)) return;

      const opponentId = matchmakingQueue[queueKey].shift();
      if (opponentId) {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms[roomId] = createRoom(roomId, gameType, stake);
        io.to(socket.id).emit('match:found', roomId);
        io.to(opponentId).emit('match:found', roomId);
      } else {
        matchmakingQueue[queueKey].push(socket.id);
        setTimeout(() => {
          const index = matchmakingQueue[queueKey].indexOf(socket.id);
          if (index !== -1) {
            matchmakingQueue[queueKey].splice(index, 1);
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            rooms[roomId] = createRoom(roomId, gameType, stake);
            const playerKeys = Object.keys(rooms[roomId].players);
            if (gameType === 'ludo') {
              rooms[roomId].players[playerKeys[0]].id = socket.id;
              rooms[roomId].players[playerKeys[1]].id = BOT_ID;
              rooms[roomId].status = 'playing';
            } else if (gameType === 'checkers') {
              rooms[roomId].players[playerKeys[0]] = socket.id;
              rooms[roomId].players[playerKeys[1]] = BOT_ID;
              rooms[roomId].status = 'playing';
            } else if (gameType === 'callbreak') {
               // Callbreak handled by room:join after match:found
            }
            socket.emit('match:found', roomId);
            if (gameType !== 'callbreak') socket.emit('player:assigned', playerKeys[0]);
          }
        }, 15000);
      }
    });

    socket.on('room:create', (gameType = 'checkers') => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      rooms[roomId] = createRoom(roomId, gameType);
      socket.emit('room:join', roomId);
    });

    socket.on('room:join', (roomId) => {
      let room = rooms[roomId];
      if (!room) {
        room = createRoom(roomId);
        rooms[roomId] = room;
      }
      socket.join(roomId);

      if (room.gameType === 'callbreak') {
        let seat = (room.players as any[]).findIndex((p: any) => p.id === socket.id);
        if (seat === -1) {
          if (room.status !== 'waiting') return;
          seat = (room.players as any[]).length;
          if (seat < 4) {
            (room.players as any[]).push({
              id: socket.id,
              name: `Player ${seat + 1}`,
              isBot: false,
              seat,
              hand: [],
              call: null,
              tricksWon: 0,
              score: 0,
              cumulativeScore: 0
            });
            socket.emit('player:assigned', seat);
          }
        }

        if (room.players.length === 1) {
           botTimeouts[roomId] = setTimeout(() => {
             if (rooms[roomId] && rooms[roomId].gameType === 'callbreak' && rooms[roomId].status === 'waiting') {
               while (rooms[roomId].players.length < 4) {
                 const s = rooms[roomId].players.length;
                 const usedNames = (rooms[roomId].players as any[]).map(p => p.name);
                 rooms[roomId].players.push({
                   id: BOT_ID,
                   name: getRandomBotName(usedNames),
                   isBot: true,
                   seat: s,
                   hand: [],
                   call: null,
                   tricksWon: 0,
                   score: 0,
                   cumulativeScore: 0
                 });
               }
               rooms[roomId].status = 'playing';
               startNewDeal(rooms[roomId], io);
             }
           }, 10000);
        } else if (room.players.length === 4) {
          room.status = 'playing';
          if (botTimeouts[roomId]) clearTimeout(botTimeouts[roomId]);
          startNewDeal(room, io);
        }
        broadcastFilteredState(room, io);
      } else {
        const playerKeys = Object.keys(room.players);
        const isLudo = room.gameType === 'ludo';
        const emptyKey = playerKeys.find(k => isLudo ? !room.players[k].id : !room.players[k]);

        if (emptyKey) {
          if (isLudo) {
            room.players[emptyKey].id = socket.id;
          } else {
            room.players[emptyKey] = socket.id;
          }
          socket.emit('player:assigned', emptyKey);
          
          if (emptyKey === playerKeys[0]) {
            botTimeouts[roomId] = setTimeout(() => {
              if (rooms[roomId]) {
                const p2 = rooms[roomId].players[playerKeys[1]];
                const p2Id = isLudo ? p2.id : p2;
                if (!p2Id) {
                  if (isLudo) rooms[roomId].players[playerKeys[1]].id = BOT_ID;
                  else rooms[roomId].players[playerKeys[1]] = BOT_ID;
                  rooms[roomId].status = 'playing';
                  io.to(roomId).emit('game:update', rooms[roomId]);
                }
              }
            }, 15000);
          } else {
            room.status = 'playing';
            if (botTimeouts[roomId]) clearTimeout(botTimeouts[roomId]);
          }
        }
        io.to(roomId).emit('game:update', room);
      }
    });

    socket.on('game:roll', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.status !== 'playing') return;
      
      const isLudo = room.gameType === 'ludo';
      const turnPlayer = room.players[room.turn];
      const turnPlayerId = isLudo ? turnPlayer?.id : turnPlayer;
      
      if (turnPlayerId !== socket.id || room.diceRolled) return;

      room.lastRoll = Math.floor(Math.random() * 6) + 1;
      room.diceRolled = true;

      if (room.lastRoll === 6) {
        room.consecutiveSixes = (room.consecutiveSixes || 0) + 1;
      } else {
        room.consecutiveSixes = 0;
      }

      if (room.consecutiveSixes === 3) {
        // Forfeit turn on three 6s
        setTimeout(() => {
          room.consecutiveSixes = 0;
          room.lastRoll = null;
          room.diceRolled = false;
          const colors = Object.keys(room.players);
          const currentIndex = colors.indexOf(room.turn);
          room.turn = colors[(currentIndex + 1) % colors.length];
          room.turnTimer = TURN_TIME;
          io.to(roomId).emit('game:update', room);
        }, 1500);
        return;
      }

      io.to(roomId).emit('game:update', room);

      // Check if any moves are possible
      if (room.gameType === 'ludo') {
        const player = room.players[room.turn];
        if (player && player.tokens) {
          const possibleMoves = (player.tokens as LudoToken[]).filter(t => {
            if (t.loc === 'yard') return room.lastRoll === 6;
            return (t.loc as number) + (room.lastRoll || 0) <= 56;
          });

          if (possibleMoves.length === 0) {
            setTimeout(() => {
              const colors = Object.keys(room.players);
              const currentIndex = colors.indexOf(room.turn);
              room.turn = colors[(currentIndex + 1) % colors.length];
              room.lastRoll = null;
              room.diceRolled = false;
              room.turnTimer = TURN_TIME;
              io.to(roomId).emit('game:update', room);
            }, 1500);
          }
        }
      }
    });

    socket.on('game:move', ({ roomId, move }) => {
      const room = rooms[roomId];
      if (!room || room.status !== 'playing') return;

      const isLudo = room.gameType === 'ludo';
      const turnPlayer = room.players[room.turn];
      const turnPlayerId = isLudo ? turnPlayer?.id : turnPlayer;

      if (turnPlayerId !== socket.id) return;

      if (room.gameType === 'checkers' && room.board) {
        const { from, to } = move;
        const piece = room.board[from.row][from.col];
        if (!piece || piece.color !== room.turn) return;

        room.board[from.row][from.col] = null;
        piece.row = to.row;
        piece.col = to.col;
        if ((piece.color === 'w' && to.row === 0) || (piece.color === 'b' && to.row === 7)) piece.isKing = true;
        room.board[to.row][to.col] = piece;

        if (Math.abs(from.row - to.row) === 2 && room.captures) {
          const midRow = (from.row + to.row) / 2;
          const midCol = (from.col + to.col) / 2;
          room.board[midRow][midCol] = null;
          room.captures[room.turn as 'w' | 'b']++;
          
          const nextMoves = getValidCheckersMoves(room, piece).filter(m => m.captured);
          if (nextMoves.length > 0) {
            io.to(roomId).emit('game:update', room);
            return;
          }
        }

        let wCount = 0, bCount = 0;
        room.board.flat().forEach(p => {
          if (p?.color === 'w') wCount++;
          if (p?.color === 'b') bCount++;
        });

        if (wCount === 0) { room.status = 'ended'; room.winner = 'b'; }
        else if (bCount === 0) { room.status = 'ended'; room.winner = 'w'; }
        else { room.turn = room.turn === 'w' ? 'b' : 'w'; }

        room.turnTimer = TURN_TIME;
        io.to(roomId).emit('game:update', room);
      } else if (room.gameType === 'ludo') {
        executeLudoMove(roomId, move.tokenId);
      }
    });

    socket.on('game:bid', ({ roomId, call }) => {
      const room = rooms[roomId];
      if (!room || room.gameType !== 'callbreak') return;
      const seat = (room.players as any[]).findIndex((p: any) => p.id === socket.id);
      if (seat === -1) return;
      handleBid(room, seat, call, io);
    });

    socket.on('game:play', ({ roomId, card }) => {
      const room = rooms[roomId];
      if (!room || room.gameType !== 'callbreak') return;
      const seat = (room.players as any[]).findIndex((p: any) => p.id === socket.id);
      if (seat === -1) return;
      handlePlay(room, seat, card, io);
    });

    socket.on('game:chat', ({ roomId, message }) => {
      const room = rooms[roomId];
      if (!room) return;
      let name = 'User';
      let color = '#ff2e7e';
      
      if (room.gameType === 'callbreak') {
        const p = (room.players as any[]).find((p: any) => p.id === socket.id);
        if (p) {
          name = p.name;
          const colors = ['#ff2e7e', '#26c6ee', '#f5c542', '#9d7cff'];
          color = colors[p.seat % colors.length];
        }
      }
      
      io.to(roomId).emit('game:log', { message: `${name}: ${message}`, color });
    });

    socket.on('disconnect', () => {
      Object.keys(matchmakingQueue).forEach(k => {
        matchmakingQueue[k] = matchmakingQueue[k].filter(id => id !== socket.id);
      });
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

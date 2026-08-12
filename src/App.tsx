import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, ClientToServerEvents, ServerToClientEvents } from './types';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { LudoBoard } from './components/LudoBoard';
import Dice3D from './components/Dice3D';
import { Matchmaking } from './components/Matchmaking';
import { Trophy, Swords, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerColor, setPlayerColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [selectedStake, setSelectedStake] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    socket.on('game:update', (state: GameState) => {
      setGameState(state);
      setIsMatching(false);
      setError(null);
    });

    socket.on('room:join', (roomId: string) => {
      socket.emit('room:join', roomId);
    });

    socket.on('match:found', (roomId: string) => {
      socket.emit('room:join', roomId);
    });

    socket.on('player:assigned', (color: string) => {
      setPlayerColor(color);
    });

    socket.on('game:error', (msg: string) => {
      setError(msg);
      setIsMatching(false);
    });

    return () => {
      socket.off('game:update');
      socket.off('room:join');
      socket.off('match:found');
      socket.off('player:assigned');
      socket.off('game:error');
    };
  }, []);

  const handleMatchSearch = useCallback((data: { stake: number; gameType: 'checkers' | 'ludo' }) => {
    setSelectedStake(data.stake);
    setIsMatching(true);
    socket.emit('match:search', data);
  }, []);

  const handleJoinRoom = useCallback((roomId: string) => {
    socket.emit('room:join', roomId);
  }, []);

  const handleMove = useCallback((move: any) => {
    if (gameState?.roomId) {
      socket.emit('game:move', { roomId: gameState.roomId, move });
    }
  }, [gameState?.roomId]);

  const handleRoll = useCallback(() => {
    if (gameState?.roomId && !isShaking) {
      setIsShaking(true);
      socket.emit('game:roll', { roomId: gameState.roomId });
      // Shake for 1 second before revealing
      setTimeout(() => {
        setIsShaking(false);
      }, 1000);
    }
  }, [gameState?.roomId, isShaking]);

  const handleLeave = () => {
    window.location.reload(); 
  };

  if (!gameState && isMatching) {
    return <Matchmaking stake={selectedStake || 0.025} onCancel={handleLeave} />;
  }

  if (!gameState) {
    return <Lobby onJoinRoom={handleJoinRoom} onMatchSearch={handleMatchSearch} />;
  }

  const isMyTurn = playerColor === gameState.turn;
  const opponentColors = Object.keys(gameState.players).filter(c => c !== playerColor);
  const opponentColor = opponentColors[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isBot = (color: string) => {
    const p = gameState.players[color];
    return (p === 'BOT_USER' || (p && typeof p === 'object' && p.id === 'BOT_USER'));
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-300 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 border-b border-slate-800 bg-[#12141C] z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {gameState.gameType === 'checkers' ? 'Grandmaster Checkers' : 'Ludo Arena'}
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">
              Live Tournament Room • ID: {gameState.roomId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Provably Fair Active</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLeave}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-md border border-slate-700 transition-colors uppercase tracking-widest"
            >
              Exit Arena
            </button>
            <div className={`
              px-4 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-widest border
              ${isMyTurn ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-slate-800/50 text-slate-500 border-slate-700 opacity-50'}
            `}>
              {gameState.botThinking ? 'Tactical Bot Thinking...' : (isMyTurn ? 'Your Turn' : "Opponent Turn")}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border-b border-red-500/20 text-red-500 p-3 text-center text-xs font-bold uppercase tracking-widest"
        >
          {error}
        </motion.div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Opponent */}
        <aside className="w-80 border-r border-slate-800 flex flex-col bg-[#0F1118]">
          <div className="p-6 space-y-8 flex-1">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Opponent</h3>
              <div className={`
                flex items-center gap-3 p-3 rounded-xl border transition-all
                ${gameState.turn === opponentColor ? 'bg-slate-800/60 border-slate-600 ring-1 ring-slate-600' : 'bg-slate-800/40 border-slate-800'}
              `}>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold border"
                  style={{ backgroundColor: `${opponentColor}99`, borderColor: opponentColor || 'transparent' }}
                >
                  {opponentColor?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {isBot(opponentColor) ? 'Tactical Bot' : 'Challenger'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">
                    {isBot(opponentColor) ? 'ENGINE ACTIVE' : `Opponent`}
                  </p>
                </div>
                <div className="ml-auto">
                  <span className={`text-lg font-mono ${gameState.turn === opponentColor ? 'text-white' : 'text-slate-500'}`}>
                    {gameState.turn === opponentColor ? formatTime(gameState.turnTimer) : '--:--'}
                  </span>
                </div>
              </div>
            </div>

            {gameState.gameType === 'ludo' && (
              <div className="flex flex-col items-center justify-center py-6 border-y border-slate-800/50 bg-slate-900/20 my-4">
                 <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-4 font-bold">Arena Status</p>
                 <div className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest">
                    {gameState.turn === opponentColor ? 'Opponent Strategic Phase' : 'Opponent Standing By'}
                 </div>
              </div>
            )}
          </div>

          {/* Bottom Sidebar: You */}
          <div className="p-6 border-t border-slate-800 mt-auto">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Your Profile</h3>
            <div className={`
              flex items-center gap-3 p-3 rounded-xl border transition-all mb-4
              ${isMyTurn ? 'bg-indigo-900/10 border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.05)] ring-1 ring-indigo-500/20' : 'bg-slate-800/20 border-slate-800'}
            `}>
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center font-bold border"
                style={{ backgroundColor: `${playerColor}99`, borderColor: playerColor || 'transparent' }}
              >
                {playerColor?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white">Commander</p>
                <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Primary Seat</p>
              </div>
              <div className="ml-auto">
                <span className={`text-lg font-mono ${isMyTurn ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {isMyTurn ? formatTime(gameState.turnTimer) : '--:--'}
                </span>
              </div>
            </div>

            {gameState.gameType === 'ludo' && isMyTurn && (
              <div className="space-y-4">
                {gameState.diceRolled ? (
                  <div className="text-center p-5 bg-indigo-600/10 rounded-xl border border-indigo-500/30">
                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest mb-2 font-bold">Roll Active</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Deploy or advance token on board</p>
                  </div>
                ) : (
                  <div className="text-center p-5 bg-slate-800/20 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Waiting for Roll</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-tighter mt-1">Tap the dice on board to roll</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Board Section */}
        <section className="flex-1 flex items-center justify-center bg-[#07080B] p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 w-full flex justify-center max-w-[600px]">
            {gameState.gameType === 'checkers' ? (
              <Board state={gameState} playerColor={playerColor as any} onMove={handleMove} />
            ) : (
              <LudoBoard 
                mirror={gameState} 
                myColor={playerColor} 
                onPickMove={(move: any) => handleMove({ tokenId: move.id })} 
                onRoll={handleRoll}
                isMyTurn={isMyTurn}
                diceRolled={gameState.diceRolled}
                lastRoll={gameState.lastRoll}
                isShaking={isShaking}
                previewMoves={(() => {
                  if (!isMyTurn || !gameState.diceRolled || !gameState.lastRoll) return [];
                  const player = gameState.players[playerColor!];
                  if (!player || !player.tokens) return [];
                  return player.tokens.map((t: any, i: number) => {
                    if (t.loc === 'yard') {
                      if (gameState.lastRoll === 6) return { i, id: t.id, dest: 0 };
                      return null;
                    }
                    const dest = (t.loc as number) + gameState.lastRoll!;
                    if (dest <= 56) return { i, id: t.id, dest };
                    return null;
                  }).filter(Boolean);
                })()}
              />
            )}
            
            {gameState.status === 'waiting' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-50 text-center p-8 border border-white/5">
                <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                  <Swords className="w-8 h-8 text-indigo-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter mb-2 italic uppercase">Awaiting Challenger</h3>
                <p className="text-slate-500 max-w-xs font-medium text-sm">Deployment code: <span className="text-indigo-400 font-mono tracking-widest">{gameState.roomId}</span></p>
              </div>
            )}
          </div>
        </section>

        {/* Right Sidebar: Observers & Chat */}
        <aside className="w-64 border-l border-slate-800 bg-[#0F1118] flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Spectators (14)</h3>
          </div>
          <div className="flex-1 overflow-hidden p-4 space-y-4 font-mono">
            <div className="flex items-center gap-2 opacity-40">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span className="text-[10px] font-medium uppercase tracking-tighter">Gary_K connected</span>
            </div>
            <div className="flex items-center gap-2 opacity-40">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
              <span className="text-[10px] font-medium uppercase tracking-tighter">Mikhail_T connected</span>
            </div>
            <div className="mt-8 space-y-4">
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                <p className="text-[10px] font-bold text-indigo-400 mb-1 tracking-widest">SYSTEM:</p>
                <p className="text-[10px] text-slate-400 italic leading-relaxed uppercase tracking-tighter">Match monitoring active. Provably seated protocol enabled.</p>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-800">
             <div className="relative">
               <input 
                type="text" 
                placeholder="SEND MESSAGE..." 
                className="w-full bg-[#1A1C23] border border-slate-700 rounded-md py-3 px-4 text-[10px] font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all uppercase tracking-widest"
               />
             </div>
          </div>
        </aside>
      </main>

      {/* End Overlay */}
      <AnimatePresence>
        {gameState.status === 'ended' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#12141C] border border-slate-800 p-12 rounded-[2rem] max-w-lg w-full text-center space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
              <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/40 relative">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2 relative">
                <h2 className="text-5xl font-black tracking-tighter text-white">
                  {gameState.winner === playerColor ? 'VICTORY' : 'DEFEAT'}
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">Tournament Concluded</p>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                {gameState.endReason === 'timeout' 
                  ? (gameState.winner === playerColor ? 'Opponent forfeited due to tactical timeout. Victory is yours.' : 'You failed to act within the tactical window. Defeat by timeout.')
                  : (gameState.winner === playerColor 
                    ? 'Grandmaster performance confirmed. Strategy successfully executed against high-level opposition.' 
                    : 'Board lost to tactical superiority. Reviewing match logs for strategic adjustment is recommended.')}
              </p>
              <button
                onClick={handleLeave}
                className="w-full bg-indigo-600 text-white font-black py-5 rounded-xl text-lg hover:bg-indigo-500 transition-all active:scale-[0.95] shadow-lg shadow-indigo-600/20"
              >
                RETURN TO ARENA
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

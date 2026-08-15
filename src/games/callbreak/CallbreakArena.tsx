
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Settings, MessageSquare, LogOut, Info, 
  Volume2, VolumeX, ShieldCheck, ChevronRight, Send,
  ArrowUpDown, X, Menu, Zap
} from 'lucide-react';
import { Card, Suit, Rank, PlayerState, Phase, CallbreakState, TrickPlay } from './types';
import { getLegalPlays, SUITS, RANKS } from './engine';
import confetti from 'canvas-confetti';

const GLYPH: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const SUIT_COLOR: Record<Suit, string> = { S: 'text-white', H: 'text-rose-500', D: 'text-indigo-400', C: 'text-emerald-400' };

interface CallbreakArenaProps {
  socket: any;
  roomId: string;
}

export const CallbreakArena: React.FC<CallbreakArenaProps> = ({ socket, roomId }) => {
  const [gameState, setGameState] = useState<CallbreakState | null>(null);
  const [mySeat, setMySeat] = useState<number>(0);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [showBidding, setShowBidding] = useState(false);
  const [settings, setSettings] = useState({ sound: true, mute: false, fair: true });
  const [tableTheme, setTableTheme] = useState('pink');

  const myPlayer = gameState?.players[mySeat];

  useEffect(() => {
    if (!socket) return;

    socket.on('game:update', (state: CallbreakState) => {
      setGameState(state);
      if (state.phase === 'bidding' && state.players[mySeat]?.call === null) {
        setShowBidding(true);
      } else {
        setShowBidding(false);
      }
    });

    socket.on('game:log', (log: any) => {
      setLogs(prev => [...prev, log].slice(-10));
    });

    socket.on('player:assigned', (seat: number) => {
      setMySeat(seat);
    });

    return () => {
      socket.off('game:update');
      socket.off('game:log');
      socket.off('player:assigned');
    };
  }, [socket, mySeat]);

  const handleBid = (call: number) => {
    socket.emit('game:bid', { roomId, call });
    setShowBidding(false);
  };

  const handlePlayCard = () => {
    if (selectedCardIdx === null || !myPlayer) return;
    const card = myPlayer.hand[selectedCardIdx];
    socket.emit('game:play', { roomId, card });
    setSelectedCardIdx(null);
  };

  const isMyTurn = gameState?.turnSeat === mySeat && gameState?.phase === 'playing';
  const legalPlays = useMemo(() => {
    if (!myPlayer || !gameState) return [];
    return getLegalPlays(myPlayer.hand, gameState.ledSuit);
  }, [myPlayer, gameState]);

  const isLegal = (card: Card) => {
    return legalPlays.some(c => c.suit === card.suit && c.rank === card.rank);
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 14) return 'A';
    if (rank === 13) return 'K';
    if (rank === 12) return 'Q';
    if (rank === 11) return 'J';
    return rank.toString();
  };

  const seats = [0, 1, 2, 3];
  // Reorder seats so mySeat is at the bottom (0)
  const orderedSeats = seats.map(s => (s + mySeat) % 4);

  const getSeatPosition = (index: number) => {
    if (index === 0) return 'bottom';
    if (index === 1) return 'right';
    if (index === 2) return 'top';
    if (index === 3) return 'left';
    return 'bottom';
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#07070d] text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-unbounded tracking-widest text-sm opacity-50 uppercase">Loading Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070d] text-[#f4f4fa] font-plus-jakarta overflow-x-hidden selection:bg-pink-500/30">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-5">
        <span className="absolute left-[36%] top-[24%] text-4xl text-cyan-400">♠</span>
        <span className="absolute left-[62%] top-[23%] text-4xl text-pink-500">♥</span>
        <span className="absolute left-[33%] top-[51%] text-4xl text-cyan-400">♣</span>
        <span className="absolute left-[64%] top-[51%] text-4xl text-violet-400">♦</span>
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 md:px-8 py-3 bg-[#07070d]/90 backdrop-blur-xl border-b border-[#1f1f38]">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1d1030] to-[#12081c] border-1.5 border-pink-500 flex items-center justify-center text-pink-500 text-xl shadow-[0_0_22px_-4px_rgba(255,46,126,0.75)]">
            ♠
          </div>
          <div>
            <h1 className="font-unbounded text-lg md:text-xl font-bold tracking-widest leading-none">
              CALL <span className="text-pink-500 shadow-pink-500/50 drop-shadow-[0_0_12px_rgba(255,46,126,0.6)]">BREAK</span>
            </h1>
            <p className="font-mono text-[9px] tracking-[0.34em] text-[#8a8aa8] mt-1 uppercase">Provably Fair Arena</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="flex items-center gap-2 bg-[#0e0e19] border border-[#2b2b4d] rounded-xl px-4 py-2 text-[10px] font-mono tracking-wider text-[#8a8aa8]">
            STAKE 50 · BOTS ×3
          </div>
          <div className="flex items-center gap-2 bg-[#f5c542]/5 border border-[#f5c542]/45 rounded-xl px-4 py-2 text-[10px] font-mono tracking-wider text-[#f5c542]">
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#a97e12] via-[#f5c542] to-[#ffe9a3] flex items-center justify-center text-[#4d3800] text-[9px] font-bold">★</span>
            2,508
          </div>
          <button className="flex items-center gap-2 bg-[#0e0e19] border border-[#2b2b4d] rounded-xl px-3 py-2 text-[10px] font-mono hover:border-[#545472] transition-colors">
            1×
          </button>
          <button className="flex items-center gap-2 bg-[#0e0e19] border border-[#2b2b4d] rounded-xl px-3 py-2 text-[10px] font-mono hover:border-[#545472] transition-colors">
            <Volume2 size={14} /> SOUND
          </button>
          <button className="flex items-center gap-2 bg-[#0e0e19] border border-[#2b2b4d] rounded-xl px-3 py-2 text-[10px] font-mono hover:border-[#545472] transition-colors">
            <Menu size={14} /> MENU
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="relative z-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-5 p-4 md:p-6 max-w-[1720px] mx-auto">
        
        {/* Left Aside */}
        <aside className="flex flex-col gap-4 order-2 lg:order-1">
          <section className="bg-gradient-to-br from-[#131322] to-[#0e0e19] border border-[#1f1f38] rounded-2xl p-4">
            <h3 className="font-mono text-[10px] tracking-[0.26em] text-[#8a8aa8] font-semibold mb-4 uppercase">Game Info</h3>
            <div className="flex flex-col gap-px">
              {[
                { label: 'GAME ID', value: '#' + roomId },
                { label: 'ROUND', value: `${gameState.currentDeal} / ${gameState.totalDeals}` },
                { label: 'DECK', value: 'STANDARD' },
                { label: 'JOKER', value: 'DISABLED' }
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-dashed border-[#1f1f38] last:border-0 font-mono text-[10px]">
                  <span className="text-[#545472]">{item.label}</span>
                  <b className="text-[#8a8aa8] font-normal">{item.value}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#131322] to-[#0e0e19] border border-[#1f1f38] rounded-2xl p-4">
            <h3 className="font-mono text-[10px] tracking-[0.26em] text-[#8a8aa8] font-semibold mb-4 uppercase">Score Board</h3>
            <div className="grid grid-cols-[1fr_60px_60px] text-[10px] font-mono text-[#545472] tracking-wider mb-2">
              <span>PLAYER</span>
              <span className="text-center">TRICKS</span>
              <span className="text-right">SCORE</span>
            </div>
            <div className="flex flex-col gap-1">
              {gameState.players.map((player, i) => {
                const isMe = i === mySeat;
                const colors = ['#ff2e7e', '#26c6ee', '#f5c542', '#9d7cff'];
                const color = colors[i % colors.length];
                
                return (
                  <div key={i} className={`grid grid-cols-[1fr_60px_60px] items-center p-2 rounded-xl font-mono text-[10px] tracking-wider transition-all
                    ${isMe ? 'bg-pink-500/10 border border-pink-500/50 shadow-[0_0_14px_-6px_#ff2e7e]' : ''}`}
                  >
                    <div className="flex items-center gap-2 text-[#f4f4fa]">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_7px_currentColor]" style={{ backgroundColor: color, color }}></div>
                      {player.name} {isMe ? '(You)' : ''}
                    </div>
                    <span className="text-center text-cyan-400">{player.tricksWon} / {player.call || 0}</span>
                    <span className="text-right" style={{ color }}>{player.cumulativeScore.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#131322] to-[#0e0e19] border border-[#1f1f38] rounded-2xl p-4">
            <h3 className="font-mono text-[10px] tracking-[0.26em] text-[#8a8aa8] font-semibold mb-4 uppercase">Game Log</h3>
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-1">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-dashed border-[#1f1f38] last:border-0 font-mono text-[10px] text-[#8a8aa8]">
                  <div className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: log.color }}></div>
                  <span>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-[10px] font-mono text-[#545472] py-2">Waiting for action...</div>}
            </div>
          </section>
        </aside>

        {/* Center Stage */}
        <main className="relative min-h-[500px] md:min-h-[600px] order-1 lg:order-2">
          {/* The Oval Table */}
          <div className="absolute inset-4 md:inset-[64px_60px_118px] rounded-[50%] border-2 border-transparent bg-field p-[2px] shadow-[0_0_60px_-18px_rgba(255,46,126,0.35),inset_0_0_80px_rgba(0,0,0,0.7)]"
            style={{ 
              backgroundImage: `linear-gradient(#0b0b15, #0b0b15), linear-gradient(115deg, #26c6ee, #ff2e7e 55%, #9d7cff)`,
              backgroundClip: 'padding-box, border-box',
              backgroundOrigin: 'border-box'
            }}
          >
            {/* Table Decorations */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <span className="absolute left-[20%] top-[12%] text-3xl text-cyan-400">♠</span>
              <span className="absolute right-[20%] top-[12%] text-pink-500 text-3xl">♥</span>
              <span className="absolute left-[16%] bottom-[14%] text-cyan-400 text-3xl">♣</span>
              <span className="absolute right-[16%] bottom-[14%] text-violet-400 text-3xl">♦</span>
            </div>

            {/* Trick Cards */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {gameState.currentTrick.map((play, idx) => {
                  // Find relative position based on mySeat
                  const relSeat = (play.seat - mySeat + 4) % 4;
                  const positions = [
                    'bottom-[6%] left-1/2 -translate-x-1/2', // bottom (me)
                    'top-[33%] right-[15%]', // right
                    'top-[5%] left-1/2 -translate-x-1/2', // top
                    'top-[33%] left-[15%]' // left
                  ];
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0.7, opacity: 0, y: relSeat === 0 ? 50 : relSeat === 2 ? -50 : 0, x: relSeat === 1 ? 50 : relSeat === 3 ? -50 : 0 }}
                      animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
                      className={`absolute w-[70px] h-[100px] md:w-[92px] md:h-[128px] rounded-xl bg-gradient-to-br from-white to-[#e9e9f2] text-[#16162a] shadow-2xl flex flex-col p-2 md:p-3
                        ${positions[relSeat]} ${isRed(play.card) ? 'text-rose-500' : ''}`}
                    >
                      <span className="font-mono font-bold text-lg md:text-xl leading-none">{getRankDisplay(play.card.rank)}</span>
                      <span className="mt-auto self-end text-3xl md:text-5xl leading-none">{GLYPH[play.card.suit]}</span>
                    </motion.div>
                  );
                })}

                {/* Center Info */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center flex flex-col gap-2 items-center pointer-events-none">
                  <span className="font-mono text-[11px] tracking-[0.3em] text-[#8a8aa8]">TRICK {gameState.currentTrick.length + 1}/13</span>
                  <span className="font-unbounded text-xl md:text-2xl tracking-widest text-white drop-shadow-[0_0_22px_rgba(255,46,126,0.4)] uppercase">
                    Deal {gameState.currentDeal}/{gameState.totalDeals}
                  </span>
                  {gameState.ledSuit && (
                    <div className="font-mono text-[10px] tracking-[0.22em] text-[#8a8aa8] flex items-center gap-2">
                      LED BY <b className="bg-pink-500 text-[#26041a] rounded-md px-2 py-1 shadow-[0_0_14px_rgba(255,46,126,0.6)] uppercase">
                        {gameState.players[gameState.turnSeat]?.name}
                      </b>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Player HUDs */}
          {orderedSeats.map((seatIdx, i) => {
            const player = gameState.players[seatIdx];
            if (!player) return null;
            const pos = getSeatPosition(i);
            const colors = ['#ff2e7e', '#26c6ee', '#f5c542', '#9d7cff'];
            const color = colors[seatIdx % colors.length];
            const isActive = gameState.turnSeat === seatIdx;

            const positions = {
              bottom: 'bottom-0 left-1/2 -translate-x-1/2 z-10',
              right: 'top-[34%] right-0 translate-x-[15%] lg:translate-x-0',
              top: 'top-0 left-1/2 -translate-x-1/2',
              left: 'top-[34%] left-0 -translate-x-[15%] lg:translate-x-0'
            };

            return (
              <motion.div 
                key={seatIdx} 
                initial={false}
                animate={{ 
                  scale: isActive ? 1.05 : 1,
                  boxShadow: isActive ? `0 0 30px -10px ${color}` : '0 10px 15px -3px rgba(0,0,0,0.1)'
                }}
                className={`absolute ${positions[pos]} flex items-center gap-3 bg-[#0e0e1c]/90 backdrop-blur-md rounded-2xl p-2 md:p-3 min-w-[170px] md:min-w-[220px] border-1.5 transition-all duration-500
                ${isActive ? 'border-opacity-100' : 'border-opacity-20'}`}
                style={{ borderColor: color }}
              >
                {isActive && (
                  <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full animate-ping opacity-75" style={{ backgroundColor: color }}></div>
                    <div className="absolute w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color }}></div>
                  </div>
                )}
                
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border-1.5 bg-black/40 flex items-center justify-center text-xl transition-all duration-300 relative overflow-hidden group" style={{ borderColor: color, color }}>
                  <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  {player.isBot ? (
                    <span className="font-serif">☺</span>
                  ) : (
                    <Trophy size={20} className="md:w-6 md:h-6" />
                  )}
                </div>

                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <b className="text-xs md:text-sm font-bold text-white truncate">{player.name}</b>
                    {player.isBot ? (
                      <span className="text-[8px] font-mono tracking-widest border border-current rounded-md px-1.5 py-0.5 flex-none opacity-70 uppercase">Bot</span>
                    ) : (
                      <span className="text-[8px] font-mono tracking-widest border border-pink-500 text-pink-500 rounded-md px-1.5 py-0.5 flex-none uppercase bg-pink-500/10">You</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-mono text-[9px] md:text-[10px] text-[#8a8aa8]">
                      <div className="flex gap-0.5 opacity-60">
                        {Array.from({ length: typeof player.hand === 'number' ? Math.min(player.hand, 3) : Math.min(player.hand.length, 3) }).map((_, b) => (
                          <div key={b} className="w-2.5 h-3.5 rounded-[2px] bg-gradient-to-br from-[#2b2b4d] to-[#191930] border border-[#34345c]"></div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="opacity-70">TRK</span>
                        <span className="text-white font-bold">{player.tricksWon}</span>
                        <span className="opacity-40">/</span>
                        <span className="text-white opacity-80">{player.call || '?'}</span>
                      </div>
                    </div>
                    
                    <div className="w-full h-1.5 rounded-full bg-[#22223c] overflow-hidden p-[1px]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((player.tricksWon || 0) / (player.call || 1)) * 100, 100)}%` }}
                        className="h-full rounded-full transition-all duration-700" 
                        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Action Messages */}
          <AnimatePresence>
            {gameState.phase === 'playing' && gameState.ledSuit && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`absolute left-1/2 bottom-[86px] -translate-x-1/2 font-mono text-xs tracking-widest px-5 py-2 rounded-full border bg-opacity-10 backdrop-blur-md z-4
                  ${isMyTurn ? 'text-green-400 border-green-500/40 bg-green-500' : 'text-pink-400 border-pink-500/40 bg-pink-500'}`}
              >
                {isMyTurn ? 'YOUR TURN TO PLAY ✓' : `${gameState.players[gameState.turnSeat]?.name.toUpperCase()}'S TURN`}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Aside */}
        <aside className="flex flex-col gap-4 order-3">
          <section className="bg-gradient-to-br from-[#131322] to-[#0e0e19] border border-[#1f1f38] rounded-2xl p-4">
            <h3 className="font-mono text-[10px] tracking-[0.26em] text-[#8a8aa8] font-semibold mb-4 uppercase">Settings</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setSettings(s => ({ ...s, sound: !s.sound, mute: false }))}
                className={`flex-1 h-11 rounded-xl border border-[#2b2b4d] bg-[#0e0e19] flex items-center justify-center transition-all
                  ${settings.sound && !settings.mute ? 'text-green-400 border-green-500/50 shadow-[0_0_12px_-4px_#2fe6a0]' : 'text-[#8a8aa8]'}`}
              >
                <Volume2 size={16} />
              </button>
              <button 
                onClick={() => setSettings(s => ({ ...s, mute: !s.mute, sound: false }))}
                className={`flex-1 h-11 rounded-xl border border-[#2b2b4d] bg-[#0e0e19] flex items-center justify-center transition-all
                  ${settings.mute ? 'text-rose-500 border-rose-500/50 shadow-[0_0_12px_-4px_#e0355c]' : 'text-[#8a8aa8]'}`}
              >
                <VolumeX size={16} />
              </button>
              <button 
                onClick={() => setSettings(s => ({ ...s, fair: !s.fair }))}
                className={`flex-1 h-11 rounded-xl border border-[#2b2b4d] bg-[#0e0e19] flex items-center justify-center transition-all
                  ${settings.fair ? 'text-cyan-400 border-cyan-500/50 shadow-[0_0_12px_-4px_#26c6ee]' : 'text-[#8a8aa8]'}`}
              >
                <ShieldCheck size={16} />
              </button>
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#131322] to-[#0e0e19] border border-[#1f1f38] rounded-2xl p-4">
            <h3 className="font-mono text-[10px] tracking-[0.26em] text-[#8a8aa8] font-semibold mb-4 uppercase">Table Theme</h3>
            <div className="flex justify-between gap-2">
              {[
                { color: '#2fe6a0', name: 'emerald' },
                { color: '#4f7cff', name: 'sapphire' },
                { color: '#ff2e7e', name: 'pink' },
                { color: '#f5c542', name: 'gold' }
              ].map((theme, i) => (
                <button
                  key={i}
                  onClick={() => setTableTheme(theme.name)}
                  className={`relative w-11 h-11 rounded-full border-1.5 bg-[#0b0b15]/80 flex items-center justify-center transition-all hover:scale-105
                    ${tableTheme === theme.name ? 'border-pink-500 shadow-[0_0_18px_rgba(255,46,126,0.5)]' : 'border-opacity-50'}`}
                  style={{ color: theme.color, borderColor: tableTheme === theme.name ? undefined : theme.color }}
                >
                  ♠
                  {tableTheme === theme.name && <div className="absolute inset-0 bg-pink-500/35 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#131322] to-[#0e0e19] border border-[#1f1f38] rounded-2xl p-4">
            <h3 className="font-mono text-[10px] tracking-[0.26em] text-[#8a8aa8] font-semibold mb-4 uppercase">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {['GOOD LUCK', 'WELL PLAYED', 'THANKS', 'NICE MOVE'].map((qa, i) => (
                <button
                  key={i}
                  onClick={() => socket.emit('game:chat', { roomId, message: qa })}
                  className="font-mono text-[9px] tracking-widest text-[#8a8aa8] border border-[#2b2b4d] bg-[#0e0e19] rounded-xl py-3 hover:text-white hover:border-pink-500 transition-all"
                >
                  {qa}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Hand Interaction */}
      <div className="relative z-1 flex flex-col items-center gap-6 mt-4 md:mt-8 pb-10">
        <div id="hand" className="flex items-end justify-center min-h-[160px] px-10">
          {myPlayer?.hand.map((card, i) => {
            const n = myPlayer.hand.length;
            const isSelected = selectedCardIdx === i;
            const canPlay = isMyTurn && isLegal(card);
            
            // Fan calculation
            const rot = (i - (n - 1) / 2) * 4;
            const ty = Math.pow(Math.abs(i - (n - 1) / 2), 1.4) * 4;

            return (
              <motion.button
                key={`${card.suit}-${card.rank}`}
                onClick={() => canPlay && setSelectedCardIdx(isSelected ? null : i)}
                className={`group relative flex-none w-[72px] h-[104px] md:w-[98px] md:h-[138px] rounded-xl bg-gradient-to-br from-white to-[#e9e9f2] text-[#16162a] shadow-2xl transition-all
                  ${i > 0 ? '-ml-8 md:-ml-10' : ''} ${isRed(card) ? 'text-rose-500' : ''}
                  ${canPlay ? 'cursor-pointer' : 'cursor-not-allowed opacity-60 grayscale-[0.3]'}
                  ${isSelected ? 'z-50' : 'z-0'}
                `}
                style={{ 
                  transform: isSelected ? 'translateY(-26px) rotate(0deg)' : `translateY(${ty}px) rotate(${rot}deg)`,
                  boxShadow: isSelected ? '0 0 0 2.5px #ff2e7e, 0 0 26px rgba(255,46,126,0.55), 0 16px 32px rgba(0,0,0,0.6)' : undefined
                }}
              >
                <span className="absolute top-2 left-3 font-mono font-bold text-base md:text-lg leading-none">
                  {getRankDisplay(card.rank)}<small className="block text-xs md:text-sm mt-0.5">{GLYPH[card.suit]}</small>
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl md:text-5xl">{GLYPH[card.suit]}</span>
                
                {canPlay && !isSelected && (
                  <div className="absolute inset-0 rounded-xl group-hover:bg-pink-500/5 transition-colors">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <footer className="w-full max-w-[1720px] px-4 md:px-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-[330px]">
            <button className="w-11 h-11 rounded-xl border border-[#2b2b4d] bg-[#0e0e19] flex items-center justify-center text-[#8a8aa8] hover:text-white transition-colors">
              <MessageSquare size={16} />
            </button>
            <div className="flex-1 flex items-center bg-[#0e0e19] border border-[#2b2b4d] rounded-xl px-4 h-11">
              <input 
                type="text" 
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                placeholder="Type a message..." 
                className="flex-1 bg-transparent border-none text-[#f4f4fa] font-mono text-[10px] tracking-wider outline-none"
              />
              <button 
                onClick={() => {
                  if (chatMsg) {
                    socket.emit('game:chat', { roomId, message: chatMsg });
                    setChatMsg('');
                  }
                }}
                className="text-[#8a8aa8] hover:text-pink-500 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mx-auto">
            <button className="flex items-center gap-2 bg-[#0e0e19] border border-[#2b2b4d] rounded-xl px-5 py-3 text-xs font-mono tracking-widest hover:border-[#545472] transition-colors">
              <ArrowUpDown size={14} /> SORT
            </button>
            <button 
              onClick={handlePlayCard}
              disabled={selectedCardIdx === null}
              className={`font-mono text-xs tracking-[0.16em] font-bold px-8 py-4 rounded-xl transition-all shadow-xl
                ${selectedCardIdx !== null 
                  ? 'bg-gradient-to-r from-pink-500 to-[#c2185b] text-white shadow-pink-500/40 hover:brightness-110 active:scale-95' 
                  : 'bg-[#0e0e19] border border-[#2b2b4d] text-[#545472] cursor-not-allowed'}`}
            >
              PLAY CARD
            </button>
            <button 
              onClick={() => setSelectedCardIdx(null)}
              className="flex items-center gap-2 bg-[#0e0e19] border border-[#2b2b4d] rounded-xl px-5 py-3 text-xs font-mono tracking-widest hover:border-[#545472] transition-colors"
            >
              CANCEL
            </button>
          </div>

          <button className="flex items-center gap-2 text-pink-500 border border-pink-500/50 bg-pink-500/5 rounded-xl px-5 py-3 text-xs font-mono tracking-widest hover:bg-pink-500/10 transition-all shadow-sm">
            <LogOut size={14} /> LEAVE TABLE
          </button>
        </footer>
      </div>

      {/* Bidding Overlay */}
      <AnimatePresence>
        {showBidding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#07070d]/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-gradient-to-br from-[#131322] to-[#0e0e19] border border-[#1f1f38] rounded-3xl p-8 shadow-2xl text-center"
            >
              <h2 className="font-unbounded text-2xl mb-2 tracking-widest">PLACE YOUR <span className="text-pink-500">CALL</span></h2>
              <p className="text-[#8a8aa8] text-xs font-mono mb-8 tracking-wider">HOW MANY TRICKS DO YOU COMMIT TO WIN?</p>
              
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <button
                    key={num}
                    onClick={() => handleBid(num)}
                    className="aspect-square rounded-2xl border border-[#2b2b4d] bg-[#0b0b15] flex flex-col items-center justify-center gap-1 hover:border-pink-500 hover:bg-pink-500/5 transition-all group"
                  >
                    <span className="font-unbounded text-lg group-hover:text-pink-400">{num}</span>
                    <span className="text-[8px] font-mono tracking-tighter opacity-40">TRICKS</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-[#1f1f38]">
                <p className="text-[10px] font-mono text-[#545472] uppercase tracking-widest">Provably Fair Shuffle Verified ✓</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const isRed = (card: Card) => card.suit === 'H' || card.suit === 'D';

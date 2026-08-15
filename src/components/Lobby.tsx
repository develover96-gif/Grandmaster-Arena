
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, LogIn, Swords } from 'lucide-react';

interface LobbyProps {
  onJoinRoom: (roomId: string) => void;
  onMatchSearch: (data: { stake: number; gameType: 'checkers' | 'ludo' | 'callbreak' }) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoinRoom, onMatchSearch }) => {
  const [stake, setStake] = useState(0.025);
  const [gameType, setGameType] = useState<'checkers' | 'ludo' | 'callbreak'>('callbreak');
  const [roomCode, setRoomCode] = useState('');

  const stakes = [
    { amt: 0.010, usd: '~$29' },
    { amt: 0.025, usd: '~$74' },
    { amt: 0.050, usd: '~$147' },
    { amt: 0.100, usd: '~$294' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-300 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-10 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 mb-4 shadow-xl shadow-indigo-500/5">
            <Swords className="w-12 h-12 text-indigo-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
            Grandmaster Arena
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">Strategic Deployment Interface</p>
        </div>

        <div className="bg-[#12141C] border border-slate-800 rounded-[2rem] p-8 space-y-8 shadow-2xl">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setGameType('checkers')}
              className={`p-3 rounded-xl border transition-all text-center ${gameType === 'checkers' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-[#1A1C23] border-slate-800'}`}
            >
              <p className="text-[10px] font-bold text-white uppercase">Checkers</p>
            </button>
            <button
              onClick={() => setGameType('ludo')}
              className={`p-3 rounded-xl border transition-all text-center ${gameType === 'ludo' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-[#1A1C23] border-slate-800'}`}
            >
              <p className="text-[10px] font-bold text-white uppercase">Ludo</p>
            </button>
            <button
              onClick={() => setGameType('callbreak')}
              className={`p-3 rounded-xl border transition-all text-center ${gameType === 'callbreak' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-[#1A1C23] border-slate-800'}`}
            >
              <p className="text-[10px] font-bold text-white uppercase">Callbreak</p>
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Configure Stake</h3>
            <p className="text-[10px] text-slate-600 font-medium">Winner takes the full pot. 0% House Edge.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stakes.map((s) => (
              <button
                key={s.amt}
                onClick={() => setStake(s.amt)}
                className={`
                  p-4 rounded-xl border transition-all text-left group
                  ${stake === s.amt 
                    ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500' 
                    : 'bg-[#1A1C23] border-slate-800 hover:border-slate-600'}
                `}
              >
                <p className={`text-lg font-black tracking-tight ${stake === s.amt ? 'text-white' : 'text-slate-400'}`}>
                  {s.amt.toFixed(3)} Ξ
                </p>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{s.usd}</p>
              </button>
            ))}
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Payout (2x)</span>
            <span className="text-lg font-black text-indigo-400">{(stake * 2).toFixed(3)} Ξ</span>
          </div>

          <button
            onClick={() => onMatchSearch({ stake, gameType })}
            className="w-full bg-indigo-600 text-white font-black py-5 px-8 rounded-xl flex items-center justify-center gap-4 hover:bg-indigo-500 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 group"
          >
            <span className="text-lg tracking-tighter uppercase italic">Locate Challenger</span>
            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center group-hover:translate-x-1 transition-transform">
              →
            </div>
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="px-4 bg-[#0A0B0E] text-slate-700 font-bold tracking-[0.3em]">Access Private Sector</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="SECTOR CODE"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="flex-1 bg-[#12141C] border border-slate-800 rounded-xl py-4 px-6 text-sm font-mono tracking-widest text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-800 uppercase"
          />
          <button
            type="submit"
            disabled={!roomCode.trim()}
            className="bg-slate-800 text-slate-300 font-bold px-6 rounded-xl hover:bg-slate-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700"
          >
            <LogIn className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

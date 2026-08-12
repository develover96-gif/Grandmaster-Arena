import React from 'react';
import { motion } from 'motion/react';

interface MatchmakingProps {
  stake: number;
  onCancel: () => void;
}

export const Matchmaking: React.FC<MatchmakingProps> = ({ stake, onCancel }) => {
  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-300 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#12141C] border border-slate-800 rounded-[2.5rem] p-12 text-center space-y-8 relative z-10 shadow-2xl"
      >
        <div className="relative w-48 h-48 mx-auto">
          {/* Radar Circles */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut"
              }}
              className="absolute inset-0 border-2 border-indigo-500/30 rounded-full"
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 relative z-20">
              <span className="text-3xl animate-pulse">🙂</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Scanning Sectors</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Locating worthy challenger</p>
        </div>

        <div className="bg-indigo-900/10 border border-indigo-500/20 py-3 px-6 rounded-xl inline-block">
          <span className="text-indigo-400 font-mono text-sm font-bold uppercase tracking-widest">
            STAKE: {stake.toFixed(3)} Ξ
          </span>
        </div>

        <div className="pt-4">
          <button
            onClick={onCancel}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] rounded-lg border border-slate-700 transition-all active:scale-95"
          >
            Cancel Deployment
          </button>
        </div>
      </motion.div>

      <div className="mt-8 flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 animate-pulse">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Network Synchronized</span>
      </div>
    </div>
  );
};

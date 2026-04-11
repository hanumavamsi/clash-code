import { Trophy, Timer, LogOut } from "lucide-react";
import { motion } from "framer-motion";

interface GameHeaderProps {
  timer: string;
  players: any[];
  currentUser: any;
  onLeave: () => void;
}

export function GameHeader({ timer, players, currentUser, onLeave }: GameHeaderProps) {
  const opponent = players.find(p => p.id !== currentUser?.id);
  const me = players.find(p => p.id === currentUser?.id);

  return (
    <div className="flex-none h-16 bg-[#1a1f2e] border-b border-white/5 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-10">
        <div className="font-black text-xl tracking-tighter text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-500" />
          Code Clash
        </div>
        
        {/* Opponent Progress Bar */}
        {opponent && (
           <div className="flex items-center gap-4 bg-dark-800/50 px-4 py-1.5 rounded-full border border-white/5">
              <span className="text-sm font-semibold text-dark-300">Vs {opponent.name}</span>
              <div className="w-32 h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(opponent.progress || 0) * 20}%` }}
                  className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                />
              </div>
              <span className="text-xs font-bold text-red-400">{opponent.progress || 0} pts</span>
           </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-dark-900/80 px-4 py-1.5 rounded-full border border-brand-500/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
          <Timer className="w-4 h-4 text-brand-400" />
          <span className={`font-mono font-bold tracking-widest ${timer.startsWith("00:") || timer.startsWith("01:") || timer.startsWith("02:") ? "text-red-400 animate-pulse" : "text-brand-100"}`}>
            {timer}
          </span>
        </div>
        <button 
          onClick={onLeave}
          className="flex items-center gap-2 text-dark-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors text-sm font-bold"
        >
          <LogOut className="w-4 h-4" /> Forfeit
        </button>
      </div>
    </div>
  );
}

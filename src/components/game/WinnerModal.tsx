import { motion } from "framer-motion";
import { Trophy, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface WinnerModalProps {
  winner: any;
  players: any[];
}

export function WinnerModal({ winner, players }: WinnerModalProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-[#1e2333] to-[#151926] p-10 rounded-3xl max-w-md w-full text-center border border-brand-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]"
      >
        <div className="w-24 h-24 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Trophy className="w-12 h-12 text-brand-400" />
        </div>
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Match Over!</h2>
        
        {winner ? (
          <p className="text-xl text-brand-200 mb-8 font-medium">
            <span className="font-bold text-white shadow-brand-500 drop-shadow-md">{winner.name}</span> wins the clash!
          </p>
        ) : (
          <p className="text-xl text-dark-300 mb-8 font-medium">It's a draw!</p>
        )}

        <div className="bg-[#11141e] rounded-2xl p-4 mb-8 shadow-inner border border-white/5 space-y-2">
          {players.map((p: any) => (
            <div key={p.id} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white truncate pr-4">{p.name}</span>
                <span className="font-mono text-brand-400 font-bold px-3 py-1 bg-brand-500/10 rounded-lg">{p.score} pts</span>
              </div>
              
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-xs font-bold text-dark-400 uppercase tracking-widest">ELO</span>
                <span className="text-sm font-bold text-dark-100">{p.newElo || 1200}</span>
                {p.eloDelta !== undefined && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    p.eloDelta >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {p.eloDelta >= 0 ? "+" : ""}{p.eloDelta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => router.replace("/")}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:-translate-y-1"
        >
          <Home className="w-5 h-5" /> Return Home
        </button>
      </motion.div>
    </div>
  );
}

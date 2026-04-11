"use client";

import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero } from "@/components/home/Hero";
import { AuthPanel } from "@/components/home/AuthPanel";
import { LobbyControls } from "@/components/home/LobbyControls";
import { useHasMounted } from "@/hooks/useHasMounted";

export default function Home() {
  const { data: session, status } = useSession();
  const mounted = useHasMounted();

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#020617] via-[#09090b] to-[#111827] overflow-hidden relative">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      
      <Hero />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-dark-800/80 to-dark-900/90 rounded-3xl blur shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/5" />
        
        <div className="relative glass-panel rounded-3xl p-8 shadow-2xl shadow-brand-900/10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {status === "loading" ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-12">
                <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin drop-shadow-lg"/>
              </motion.div>
            ) : !session ? (
              <motion.div key="unauth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <AuthPanel />
              </motion.div>
            ) : (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <div className="flex items-center justify-between mb-8 bg-dark-900/60 p-4 rounded-2xl border border-brand-500/10 shadow-inner">
                  <div className="flex items-center gap-4">
                    {session.user?.image ? (
                      <img src={session.user.image} className="w-12 h-12 rounded-xl border border-dark-600 shadow-md" alt="Avatar"/>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white uppercase text-xl shadow-md border border-brand-400">
                        {session.user?.name?.substring(0, 2) || "??"}
                      </div>
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-white font-bold tracking-wide truncate max-w-[120px]">{session.user?.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse" />
                        <span className="text-xs text-brand-400 font-mono font-bold tracking-widest uppercase">
                          ELO {(session.user as any)?.eloRating || 1200}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => signOut()} className="text-dark-400 hover:text-red-400 font-semibold text-xs bg-dark-900 border border-dark-700 px-3 py-2 rounded-lg transition-all">
                    Logout
                  </button>
                </div>
                <LobbyControls session={session} currentUser={null} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

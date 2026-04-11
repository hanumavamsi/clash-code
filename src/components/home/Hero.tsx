import { motion } from "framer-motion";
import { Swords } from "lucide-react";

export function Hero() {
  return (
    <motion.div 
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="z-10 text-center mb-12"
    >
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="p-4 bg-brand-600/20 rounded-2xl border border-brand-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <Swords className="w-12 h-12 text-brand-400" />
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-brand-100 to-brand-500">
          Code Clash
        </h1>
      </div>
      <p className="text-dark-300 text-lg md:text-xl max-w-xl mx-auto font-medium mt-6 leading-relaxed">
        Real-time 1v1 coding battles. Prove your DSA skills against the best developers in the world.
      </p>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { Play, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface ReplayActionsProps {
  onSubmit: () => void;
  onViewSolution: () => void;
  isSubmitting: boolean;
  isLoadingSolution: boolean;
  showingSolution: boolean;
}

export function ReplayActions({
  onSubmit,
  onViewSolution,
  isSubmitting,
  isLoadingSolution,
  showingSolution
}: ReplayActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:shadow-none"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            Test Code
          </>
        )}
      </button>

      <button
        onClick={onViewSolution}
        disabled={isLoadingSolution}
        className={`flex items-center gap-2 font-bold py-2 px-6 rounded-lg transition-all ${
          showingSolution
            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            : 'bg-[#2d3244] text-dark-300 hover:bg-[#363c52] hover:text-dark-100 border border-[#3d4452]'
        } disabled:opacity-50`}
      >
        {isLoadingSolution ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-indigo-300/30 border-t-indigo-400 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            {showingSolution ? 'Hide' : 'View'} Solution
          </>
        )}
      </button>
    </motion.div>
  );
}

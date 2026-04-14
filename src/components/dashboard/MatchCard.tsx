"use client";

import { motion } from "framer-motion";
import { Trophy, Skull, Handshake, Clock, Zap } from "lucide-react";
import { MatchListItem } from "@/types/dashboard";

interface MatchCardProps {
  match: MatchListItem;
  onClick: () => void;
}

export function MatchCard({ match, onClick }: MatchCardProps) {
  const getOutcomeIcon = () => {
    switch (match.outcome) {
      case "win":
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case "loss":
        return <Skull className="w-5 h-5 text-red-400" />;
      default:
        return <Handshake className="w-5 h-5 text-blue-400" />;
    }
  };

  const getOutcomeBgColor = () => {
    switch (match.outcome) {
      case "win":
        return "bg-green-500/10 border-green-500/30";
      case "loss":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-blue-500/10 border-blue-500/30";
    }
  };

  const getOutcomeTextColor = () => {
    switch (match.outcome) {
      case "win":
        return "text-green-400";
      case "loss":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  const eloDeltaColor = (match.eloDelta ?? 0) >= 0 ? "text-green-400" : "text-red-400";
  const eloDeltaSign = (match.eloDelta ?? 0) >= 0 ? "+" : "";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-4 rounded-xl border transition-all ${getOutcomeBgColor()} hover:shadow-lg hover:shadow-brand-500/20 cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Outcome Icon */}
          <div className={`p-2.5 rounded-lg ${getOutcomeBgColor()}`}>
            {getOutcomeIcon()}
          </div>

          {/* Opponent Info */}
          <div className="flex flex-col">
            <span className="text-white font-semibold text-sm">{match.opponent.name || "Anonymous"}</span>
            <span className="text-xs text-dark-400 flex items-center gap-1 mt-0.5">
              <Zap className="w-3 h-3" />
              ELO {match.opponent.eloRating}
            </span>
          </div>
        </div>

        {/* Outcome Badge */}
        <div className="text-right">
          <div className={`text-lg font-bold uppercase tracking-wider ${getOutcomeTextColor()}`}>
            {match.outcome === "win"
              ? "WIN"
              : match.outcome === "loss"
              ? "LOSS"
              : "DRAW"}
          </div>
          <div className={`text-sm font-semibold ${eloDeltaColor}`}>
            {eloDeltaSign}{match.eloDelta ?? 0}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-dark-300 border-t border-white/10 pt-3">
        <div className="flex items-center gap-1">
          <span className="font-bold text-white">{match.questionCount}</span>
          <span>Question{match.questionCount !== 1 ? "s" : ""}</span>
        </div>

        {match.duration && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{match.duration}m</span>
          </div>
        )}

        {match.endTime && (
          <span className="text-dark-400">
            {new Date(match.endTime).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            })}
          </span>
        )}
      </div>
    </motion.button>
  );
}

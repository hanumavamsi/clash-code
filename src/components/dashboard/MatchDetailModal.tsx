"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Trophy, Skull, Handshake, Zap, Clock } from "lucide-react";
import { MatchDetailResponse } from "@/types/dashboard";
import { QuestionReviewPanel } from "./QuestionReviewPanel";

interface MatchDetailModalProps {
  matchId: string;
  onClose: () => void;
}

export function MatchDetailModal({ matchId, onClose }: MatchDetailModalProps) {
  const [data, setData] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/matches/${matchId}`);

        if (!response.ok) {
          setError("Failed to load match details");
          return;
        }

        const matchData: MatchDetailResponse = await response.json();
        setData(matchData);
      } catch (err) {
        setError("Error loading match details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetail();
  }, [matchId]);

  const getOutcomeIcon = () => {
    if (!data) return null;
    switch (data.match.outcome) {
      case "win":
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case "loss":
        return <Skull className="w-6 h-6 text-red-400" />;
      default:
        return <Handshake className="w-6 h-6 text-blue-400" />;
    }
  };

  const getOutcomeTextColor = () => {
    if (!data) return "";
    switch (data.match.outcome) {
      case "win":
        return "text-green-400";
      case "loss":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-dark-800 to-dark-900 border border-dark-600 shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur border-b border-dark-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getOutcomeIcon()}
              <span
                className={`text-lg font-bold uppercase tracking-wider ${getOutcomeTextColor()}`}
              >
                {!data
                  ? "Loading..."
                  : data.match.outcome === "win"
                  ? "VICTORY"
                  : data.match.outcome === "loss"
                  ? "DEFEAT"
                  : "DRAW"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-dark-300" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex justify-center items-center py-16">
              <p className="text-red-400 font-semibold">{error}</p>
            </div>
          )}

          {/* Content */}
          {data && !loading && (
            <div className="p-6 space-y-6">
              {/* Match Stats Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Player 1 */}
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
                    You
                  </div>
                  <div className="flex items-center gap-2">
                    {data.match.player1.image ? (
                      <img
                        src={data.match.player1.image}
                        alt={data.match.player1.name || "Player"}
                        className="w-10 h-10 rounded-lg border border-dark-600"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center text-sm font-bold text-brand-400">
                        {(data.match.player1.name || "?").substring(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {data.match.player1.name || "Anonymous"}
                      </p>
                      <p className="text-xs text-dark-400">
                        {data.match.player1.eloRating}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ELO Delta */}
                <div className="col-span-2 sm:col-span-2">
                  <div className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
                    ELO Change
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-dark-400">
                      {data.match.elo.before}
                    </span>
                    <span className="text-2xl font-bold text-white">→</span>
                    <span className="text-xs text-white font-bold">
                      {data.match.elo.after}
                    </span>
                    <span
                      className={`ml-1 font-bold text-lg ${
                        (data.match.elo.delta ?? 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {(data.match.elo.delta ?? 0) >= 0 ? "+" : ""}
                      {data.match.elo.delta}
                    </span>
                  </div>
                </div>

                {/* Player 2 */}
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
                    Opponent
                  </div>
                  <div className="flex items-center gap-2">
                    {data.match.player2.image ? (
                      <img
                        src={data.match.player2.image}
                        alt={data.match.player2.name || "Player"}
                        className="w-10 h-10 rounded-lg border border-dark-600"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-sm font-bold text-indigo-400">
                        {(data.match.player2.name || "?").substring(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {data.match.player2.name || "Anonymous"}
                      </p>
                      <p className="text-xs text-dark-400">
                        {data.match.player2.eloRating}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Meta */}
              {(data.match.duration || data.match.endTime) && (
                <div className="flex items-center gap-4 text-sm text-dark-300 border-t border-dark-600 pt-4">
                  {data.match.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-400" />
                      <span>{data.match.duration} minutes</span>
                    </div>
                  )}
                  {data.match.endTime && (
                    <span className="text-xs">
                      {new Date(data.match.endTime).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Questions Section */}
              {data.questions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Questions ({data.questions.length})
                  </h3>
                  <div className="space-y-3">
                    {data.questions.map((question, index) => (
                      <QuestionReviewPanel
                        key={question.id}
                        question={question}
                        questionIndex={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

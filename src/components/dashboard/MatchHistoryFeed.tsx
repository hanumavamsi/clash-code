"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { MatchCard } from "./MatchCard";
import { MatchDetailModal } from "./MatchDetailModal";
import { MatchListResponse, MatchListItem } from "@/types/dashboard";

const ITEMS_PER_PAGE = 10;

export function MatchHistoryFeed() {
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Fetch matches on mount and when offset changes
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/matches?limit=${ITEMS_PER_PAGE}&offset=${offset}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError("Please log in to view match history");
          } else {
            setError("Failed to load match history");
          }
          return;
        }

        const data: MatchListResponse = await response.json();
        if (offset === 0) {
          setMatches(data.matches);
        } else {
          setMatches((prev) => [...prev, ...data.matches]);
        }
        setHasMore(offset + ITEMS_PER_PAGE < data.pagination.total);
      } catch (err) {
        setError("Error loading matches");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [offset]);

  const handleLoadMore = () => {
    setOffset((prev) => prev + ITEMS_PER_PAGE);
  };

  if (error && offset === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 px-4"
      >
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-dark-300 text-center">{error}</p>
      </motion.div>
    );
  }

  if (matches.length === 0 && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 px-4"
      >
        <div className="w-16 h-16 rounded-full bg-brand-600/20 flex items-center justify-center mb-4">
          <span className="text-3xl">🎮</span>
        </div>
        <p className="text-white font-semibold mb-1">No matches yet</p>
        <p className="text-dark-400 text-sm">
          Play your first match to see it here!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Matches List */}
      <AnimatePresence mode="popLayout">
        {matches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
          >
            <MatchCard
              match={match}
              onClick={() => setSelectedMatchId(match.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load More Button */}
      {hasMore && !loading && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleLoadMore}
          className="w-full py-3 px-4 rounded-xl border border-brand-500/30 bg-brand-600/10 hover:bg-brand-600/20 text-brand-300 font-semibold transition-all hover:shadow-lg hover:shadow-brand-500/20"
        >
          Load More Matches
        </motion.button>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-6"
        >
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </motion.div>
      )}

      {/* Match Detail Modal */}
      {selectedMatchId && (
        <MatchDetailModal
          matchId={selectedMatchId}
          onClose={() => setSelectedMatchId(null)}
        />
      )}
    </div>
  );
}

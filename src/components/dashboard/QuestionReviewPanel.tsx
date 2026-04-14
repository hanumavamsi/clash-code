"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { QuestionWithSubmission, SolutionResponse } from "@/types/dashboard";

interface QuestionReviewPanelProps {
  question: QuestionWithSubmission;
  questionIndex: number;
}

export function QuestionReviewPanel({
  question,
  questionIndex,
}: QuestionReviewPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState<SolutionResponse | null>(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);

  const handleShowSolution = async () => {
    if (solution) {
      setShowSolution(!showSolution);
      return;
    }

    setLoadingSolution(true);
    setSolutionError(null);
    try {
      const response = await fetch(
        `/api/questions/${question.id}/solution`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const data = await response.json();
        setSolutionError(data.error || "Failed to load solution");
        setLoadingSolution(false);
        return;
      }

      const data: SolutionResponse = await response.json();
      setSolution(data);
      setShowSolution(true);
    } catch (err) {
      setSolutionError("Error loading solution");
      console.error(err);
    } finally {
      setLoadingSolution(false);
    }
  };

  const submission = question.submission;
  const statusColor =
    submission?.status === "ACCEPTED"
      ? "text-green-400"
      : submission?.status === "PENDING"
      ? "text-yellow-400"
      : "text-red-400";

  const statusBg =
    submission?.status === "ACCEPTED"
      ? "bg-green-500/10"
      : submission?.status === "PENDING"
      ? "bg-yellow-500/10"
      : "bg-red-500/10";

  return (
    <motion.div className="border border-dark-600 rounded-xl overflow-hidden bg-dark-900/50">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-dark-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left flex-1 min-w-0">
          {/* Question Number */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center">
            <span className="text-brand-400 font-bold text-sm">Q{questionIndex + 1}</span>
          </div>

          {/* Question Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold truncate text-sm">
                {question.title}
              </h3>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white bg-dark-700 flex-shrink-0">
                {question.difficulty.toLowerCase()}
              </span>
            </div>
            {submission && (
              <div className={`text-xs font-semibold ${statusColor}`}>
                {submission.status === "ACCEPTED"
                  ? "✓ Accepted"
                  : submission.status === "PENDING"
                  ? "⏳ Pending"
                  : "✗ Wrong Answer"}
              </div>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-dark-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-dark-600 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Question Description */}
              <div>
                <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
                  Description
                </h4>
                <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">
                  {question.description}
                </p>
              </div>

              {/* Function Signature */}
              <div>
                <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
                  Function Signature
                </h4>
                <div className="bg-dark-800 rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto border border-dark-600">
                  <span className="text-indigo-400">function</span>{" "}
                  <span className="text-yellow-400">solution</span>
                  <span className="text-white">({question.args.join(", ")})</span>
                  {question.returnType && (
                    <>
                      <span className="text-white">: </span>
                      <span className="text-green-400">{question.returnType}</span>
                    </>
                  )}
                </div>
              </div>

              {/* User's Submission */}
              {submission && (
                <div>
                  <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
                    Your Submission
                  </h4>
                  <div className="bg-dark-800 rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto border border-dark-600 max-h-48">
                    {submission.code}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={`font-bold ${statusColor}`}>
                      {submission.status === "ACCEPTED"
                        ? "✓ Accepted"
                        : "✗ Failed"}
                    </span>
                    {submission.executionTime && (
                      <span className="text-dark-400">
                        Execution time: {submission.executionTime}ms
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Solution Button */}
              <motion.button
                onClick={handleShowSolution}
                disabled={loadingSolution}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingSolution ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : showSolution ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Solution
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    View Solution
                  </>
                )}
              </motion.button>

              {/* Solution Display */}
              {solutionError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-xs text-red-300">{solutionError}</span>
                </motion.div>
              )}

              {solution && showSolution && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Editorial Solution
                    </h4>
                    <span className="text-xs text-emerald-400 font-mono">
                      {solution.language}
                    </span>
                  </div>
                  <div className="bg-dark-800 rounded p-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-64 border border-dark-600">
                    {solution.solution}
                  </div>
                </motion.div>
              )}

              {/* Constraints */}
              {question.constraints && question.constraints.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider mb-2">
                    Constraints
                  </h4>
                  <ul className="space-y-1">
                    {question.constraints.map((constraint, i) => (
                      <li key={i} className="text-xs text-dark-300 flex gap-2">
                        <span className="text-brand-400">•</span>
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

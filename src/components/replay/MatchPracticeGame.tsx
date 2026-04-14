"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, XCircle, AlertCircle, Check, X, Eye, Play } from "lucide-react";
import { ProblemPanel } from "@/components/game/ProblemPanel";
import { EditorSurface } from "@/components/game/EditorSurface";
import { TestCasesBlock } from "@/components/game/TestCasesBlock";
import { ReplayActions } from "./ReplayActions";
import { MatchPracticeContextResponse, PracticeQuestion, TestExecutionResponse } from "@/types/replay";
import { getDefaultCode } from "@/lib/codeSkeletons";

interface MatchPracticeGameProps {
  context: MatchPracticeContextResponse;
  matchId: string;
}

export function MatchPracticeGame({ context, matchId }: MatchPracticeGameProps) {
  const router = useRouter();
  const { match, questions } = context;

  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-question editor state
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    questions.forEach((q) => {
      map[q.id] = q.userSubmission?.code || getDefaultCode(q, q.userSubmission?.language || "javascript");
    });
    return map;
  });
  const [languageMap, setLanguageMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    questions.forEach((q) => {
      map[q.id] = q.userSubmission?.language || "javascript";
    });
    return map;
  });

  // Per-question test results
  const [testResultsMap, setTestResultsMap] = useState<Record<string, TestExecutionResponse | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [showingSolutionMap, setShowingSolutionMap] = useState<Record<string, boolean>>({});
  const [solutionMap, setSolutionMap] = useState<Record<string, { code: string; language: string }>>({});
  const [activeBottomTab, setActiveBottomTab] = useState<"testcases" | "result">("testcases");
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentCode = codeMap[currentQuestion.id] ?? "";
  const currentLanguage = languageMap[currentQuestion.id] ?? "javascript";
  const currentTestResults = testResultsMap[currentQuestion.id] ?? null;
  const showingSolution = showingSolutionMap[currentQuestion.id] ?? false;
  const solutionData = solutionMap[currentQuestion.id] ?? null;

  const opponent = match.player1.id === (match as any).currentUserId ? match.player2 : match.player1;

  const outcomeColor = {
    win: "text-green-400",
    loss: "text-red-400",
    draw: "text-yellow-400"
  };

  const handleSelectQuestion = (index: number) => {
    setCurrentIndex(index);
    setActiveBottomTab("testcases");
    setActiveTestCaseIndex(0);
    setError(null);
  };

  const handleCodeChange = (val: string | undefined) => {
    setCodeMap((prev) => ({ ...prev, [currentQuestion.id]: val || "" }));
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguageMap((prev) => ({ ...prev, [currentQuestion.id]: newLang }));
    setCodeMap((prev) => ({ ...prev, [currentQuestion.id]: getDefaultCode(currentQuestion, newLang) }));
    setSolutionMap((prev) => { const next = { ...prev }; delete next[currentQuestion.id]; return next; });
    setShowingSolutionMap((prev) => ({ ...prev, [currentQuestion.id]: false }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/replay/test/${currentQuestion.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: currentCode, language: currentLanguage })
      });

      if (!response.ok) {
        throw new Error(`Test execution failed: ${response.statusText}`);
      }

      const results: TestExecutionResponse = await response.json();
      setTestResultsMap((prev) => ({ ...prev, [currentQuestion.id]: results }));
      setActiveBottomTab("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSolution = async () => {
    if (showingSolution) {
      setShowingSolutionMap((prev) => ({ ...prev, [currentQuestion.id]: false }));
      return;
    }

    setIsLoadingSolution(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/questions/${currentQuestion.id}/solution?lang=${encodeURIComponent(currentLanguage)}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch solution: ${response.statusText}`);
      }

      const solution = await response.json();
      setSolutionMap((prev) => ({
        ...prev,
        [currentQuestion.id]: { code: solution.solution || "", language: solution.language || currentLanguage }
      }));
      setShowingSolutionMap((prev) => ({ ...prev, [currentQuestion.id]: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load solution");
    } finally {
      setIsLoadingSolution(false);
    }
  };

  const getQuestionStatus = (q: PracticeQuestion) => {
    const testResult = testResultsMap[q.id];
    if (testResult) {
      return testResult.passed === testResult.total ? "passed" : "failed";
    }
    if (q.userSubmission?.status === "ACCEPTED") return "accepted";
    if (q.userSubmission?.status === "WRONG_ANSWER") return "wrong";
    return "unattempted";
  };

  const correctCount = questions.filter((q) => {
    const s = getQuestionStatus(q);
    return s === "passed" || s === "accepted";
  }).length;

  return (
    <div className="h-screen w-full flex flex-col bg-[#0f1117] overflow-hidden">
      {/* Header */}
      <div className="flex-none h-14 bg-[#181c29] border-b border-[#2d3244] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#2d3244] rounded-lg transition-colors text-dark-300 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm font-bold text-white">Practice Mode</p>
            <p className="text-xs text-dark-400">
              vs {opponent.name || "Unknown"} •{" "}
              <span className={outcomeColor[match.outcome]}>
                {match.outcome.toUpperCase()}
                {match.elo.delta !== undefined && (
                  <> ({match.elo.delta > 0 ? "+" : ""}{match.elo.delta} ELO)</>
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-dark-400">
          <span className="font-bold text-white">{correctCount}</span>
          <span>/</span>
          <span>{questions.length}</span>
          <span className="text-dark-500 ml-1">correct</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: question list */}
        <div className="w-56 flex-none bg-[#13161f] border-r border-[#2d3244] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2d3244]">
            <p className="text-xs font-bold text-dark-400 uppercase tracking-wider">Questions</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {questions.map((q, i) => {
              const status = getQuestionStatus(q);
              const isActive = i === currentIndex;

              const statusIcon =
                status === "passed" || status === "accepted" ? (
                  <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                ) : status === "wrong" || status === "failed" ? (
                  <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 flex-shrink-0" />
                );

              const difficultyColor =
                q.difficulty?.toLowerCase() === "hard"
                  ? "text-red-400"
                  : q.difficulty?.toLowerCase() === "medium"
                  ? "text-yellow-400"
                  : "text-green-400";

              return (
                <button
                  key={q.id}
                  onClick={() => handleSelectQuestion(i)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-all ${
                    isActive
                      ? "bg-brand-600/20 border-l-2 border-brand-500"
                      : "hover:bg-[#1e2333] border-l-2 border-transparent"
                  }`}
                >
                  <span
                    className={`text-xs font-bold w-6 flex-shrink-0 ${
                      isActive ? "text-brand-400" : "text-dark-500"
                    }`}
                  >
                    Q{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isActive ? "text-white" : "text-dark-300"
                      }`}
                    >
                      {q.title}
                    </p>
                    <p className={`text-xs ${difficultyColor}`}>{q.difficulty}</p>
                  </div>
                  {statusIcon}
                </button>
              );
            })}
          </div>

          {/* Bottom score summary */}
          <div className="border-t border-[#2d3244] px-4 py-3">
            <div className="flex justify-between text-xs text-dark-400 mb-1.5">
              <span>Your score</span>
              <span className="text-white font-bold">{correctCount}/{questions.length}</span>
            </div>
            <div className="h-1.5 bg-[#2d3244] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(correctCount / questions.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-brand-500 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Right: problem + editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Problem panel */}
          <div className="w-[38%] flex-none h-full border-r border-[#2d3244]">
            <ProblemPanel
              questions={questions}
              currentIndex={currentIndex}
              onSelectQuestion={handleSelectQuestion}
              players={[match.player1, match.player2]}
              currentUser={{ id: match.player1.id }}
              solvedQuestionIds={
                new Set(
                  questions
                    .filter((q) => {
                      const s = getQuestionStatus(q);
                      return s === "passed" || s === "accepted";
                    })
                    .map((q) => q.id)
                )
              }
            />
          </div>

          {/* Editor + test cases */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {showingSolution && solutionData ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col bg-[#1a1f2e] border-b border-[#2d3244]"
              >
                <div className="flex-none h-12 bg-[#1a1f2e] border-b border-[#2d3244] px-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-dark-300">Editorial Solution</span>
                  <span className="text-xs text-emerald-400 font-mono">{solutionData.language}</span>
                </div>
                <div className="flex-1 overflow-auto p-6 font-mono text-sm text-dark-300 bg-black/20 whitespace-pre-wrap break-words">
                  {solutionData.code}
                </div>
              </motion.div>
            ) : (
              <EditorSurface
                code={currentCode}
                onChange={handleCodeChange}
                language={currentLanguage}
                onLanguageChange={handleLanguageChange}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            <div className="flex-none border-t border-[#2d3244] z-20">
              <TestCasesBlock
                questions={questions}
                currentIndex={currentIndex}
                activeTab={activeBottomTab}
                setActiveTab={setActiveBottomTab}
                activeTestCaseIndex={activeTestCaseIndex}
                setActiveTestCaseIndex={setActiveTestCaseIndex}
                output={
                  currentTestResults
                    ? {
                        success: currentTestResults.passed === currentTestResults.total,
                        message: `${currentTestResults.passed}/${currentTestResults.total} tests passed`,
                        executionTime: currentTestResults.executionTime
                      }
                    : null
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex-none h-20 bg-[#181c29] border-t border-[#2d3244] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
          {currentTestResults && currentTestResults.passed === currentTestResults.total && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-green-400 text-sm font-bold"
            >
              <CheckCircle className="w-5 h-5" />
              All tests passed!
            </motion.div>
          )}
          {currentTestResults && currentTestResults.passed < currentTestResults.total && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-red-400 text-sm font-bold"
            >
              <XCircle className="w-5 h-5" />
              {currentTestResults.passed}/{currentTestResults.total} tests passed
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Prev / Next question navigation */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => handleSelectQuestion(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-3 py-2 text-xs font-bold text-dark-300 hover:text-white bg-[#2d3244] hover:bg-[#363c52] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={() => handleSelectQuestion(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
              className="px-3 py-2 text-xs font-bold text-dark-300 hover:text-white bg-[#2d3244] hover:bg-[#363c52] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>

          <ReplayActions
            onSubmit={handleSubmit}
            onViewSolution={handleViewSolution}
            isSubmitting={isSubmitting}
            isLoadingSolution={isLoadingSolution}
            showingSolution={showingSolution}
          />
        </div>
      </div>
    </div>
  );
}

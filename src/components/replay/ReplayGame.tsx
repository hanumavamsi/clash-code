"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ReplayHeader } from "./ReplayHeader";
import { ReplayActions } from "./ReplayActions";
import { ProblemPanel } from "@/components/game/ProblemPanel";
import { EditorSurface } from "@/components/game/EditorSurface";
import { TestCasesBlock } from "@/components/game/TestCasesBlock";
import { ReplayContextResponse, TestExecutionResponse } from "@/types/replay";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ReplayGameProps {
  replayContext: ReplayContextResponse;
  questionId: string;
  matchId: string;
}

export function ReplayGame({ replayContext, questionId, matchId }: ReplayGameProps) {
  const { match, question, userSubmission } = replayContext;
  const [code, setCode] = useState(userSubmission.code || "");
  const [language, setLanguage] = useState(userSubmission.language || "javascript");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestExecutionResponse | null>(null);
  const [showingSolution, setShowingSolution] = useState(false);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [solutionCode, setSolutionCode] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<"testcases" | "result">("testcases");
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const questionsArray = [question];
  const currentIndex = 0;

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await fetch(`/api/replay/test/${questionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, language })
      });

      if (!response.ok) {
        throw new Error(`Test execution failed: ${response.statusText}`);
      }

      const results: TestExecutionResponse = await response.json();
      setTestResults(results);
      setActiveBottomTab("result");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to test code";
      setError(message);
      console.error("[Replay] Test execution error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSolution = async () => {
    if (showingSolution) {
      setShowingSolution(false);
      setSolutionCode(null);
      return;
    }

    setIsLoadingSolution(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/${questionId}/solution`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch solution: ${response.statusText}`);
      }

      const solution = await response.json();
      setSolutionCode(solution.solution || "");
      setShowingSolution(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load solution";
      setError(message);
      console.error("[Replay] Solution fetch error:", err);
    } finally {
      setIsLoadingSolution(false);
    }
  };

  const opponent = match.player1.id === (match as any).currentUserId ? match.player2 : match.player1;

  return (
    <div className="h-screen w-full flex flex-col bg-[#0f1117] overflow-hidden">
      <ReplayHeader
        questionTitle={question.title}
        difficulty={question.difficulty}
        matchContext={{
          opponent: { name: opponent.name },
          outcome: match.outcome,
          eloDelta: match.elo.delta
        }}
      />

      <div className="flex-1 flex overflow-hidden gap-0">
        <div className="w-1/3 flex-none border-r border-[#2d3244]">
          <ProblemPanel
            questions={questionsArray}
            currentIndex={currentIndex}
            onSelectQuestion={() => {}}
            players={[match.player1, match.player2]}
            currentUser={{ id: match.player1.id }}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {showingSolution && solutionCode ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col bg-[#1a1f2e] border-b border-[#2d3244] relative z-10"
            >
              <div className="flex-none h-12 bg-[#1a1f2e] border-b border-[#2d3244] px-4 flex items-center">
                <span className="text-sm font-bold text-dark-300">Editorial Solution</span>
              </div>
              <div className="flex-1 overflow-auto p-6 font-mono text-sm text-dark-300 bg-black/20 whitespace-pre-wrap break-words">
                {solutionCode}
              </div>
            </motion.div>
          ) : (
            <EditorSurface
              code={code}
              onChange={(val) => setCode(val || "")}
              language={language}
              onLanguageChange={handleLanguageChange}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          <div className="flex-none border-t border-[#2d3244] z-20">
            <TestCasesBlock
              questions={questionsArray}
              currentIndex={currentIndex}
              activeTab={activeBottomTab}
              setActiveTab={setActiveBottomTab}
              activeTestCaseIndex={activeTestCaseIndex}
              setActiveTestCaseIndex={setActiveTestCaseIndex}
              output={
                testResults
                  ? {
                      success: testResults.passed === testResults.total,
                      message: `${testResults.passed}/${testResults.total} tests passed`,
                      executionTime: testResults.executionTime
                    }
                  : null
              }
            />
          </div>
        </div>
      </div>

      <div className="flex-none h-20 bg-[#181c29] border-t border-[#2d3244] px-6 py-4 flex items-center justify-between">
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

        {testResults && testResults.passed === testResults.total && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-green-400 text-sm font-bold"
          >
            <CheckCircle className="w-5 h-5" />
            All tests passed! 🎉
          </motion.div>
        )}

        <div className="ml-auto">
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

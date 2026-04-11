import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

interface TestCasesBlockProps {
  questions: any[];
  currentIndex: number;
  activeTab: "testcases" | "result";
  setActiveTab: (tab: "testcases" | "result") => void;
  activeTestCaseIndex: number;
  setActiveTestCaseIndex: (i: number) => void;
  output: any;
}

export function TestCasesBlock({
  questions,
  currentIndex,
  activeTab,
  setActiveTab,
  activeTestCaseIndex,
  setActiveTestCaseIndex,
  output
}: TestCasesBlockProps) {
  const q = questions[currentIndex];

  return (
    <div className="flex-none h-64 bg-[#1a1f2e] flex flex-col relative z-20">
      <div className="flex bg-[#23283b] p-1 gap-1 border-b border-[#2d3244]">
        <button
          onClick={() => setActiveTab("testcases")}
          className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
            activeTab === "testcases" ? "bg-[#2d3244] text-white shadow-sm" : "text-dark-400 hover:text-dark-200"
          }`}
        >
          Sample Testcases
        </button>
        <button
          onClick={() => setActiveTab("result")}
          className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
            activeTab === "result" ? "bg-[#2d3244] text-white shadow-sm" : "text-dark-400 hover:text-dark-200"
          }`}
        >
          Result Output
          {output && (
            <span className={`ml-2 inline-flex items-center justify-center w-2 h-2 rounded-full ${output.success ? "bg-green-500" : "bg-red-500"}`} />
          )}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "testcases" ? (
          <div>
            <div className="flex gap-2 mb-4">
              {q?.sampleTests?.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveTestCaseIndex(i)}
                  className={`px-3 py-1 text-sm font-bold rounded-lg transition-colors ${
                    i === activeTestCaseIndex
                      ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                      : "bg-[#2d3244] text-dark-300 hover:bg-[#363c52]"
                  }`}
                >
                  Case {i + 1}
                </button>
              ))}
            </div>
            {q?.sampleTests?.[activeTestCaseIndex] && (
              <motion.div 
                key={activeTestCaseIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <div className="text-xs font-bold text-dark-400 mb-1 uppercase tracking-wider">Input</div>
                  <div className="font-mono text-sm bg-black/40 p-3 rounded-xl text-brand-100 border border-white/5 break-all">
                    {q.sampleTests[activeTestCaseIndex].input}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-dark-400 mb-1 uppercase tracking-wider">Expected Output</div>
                  <div className="font-mono text-sm bg-black/40 p-3 rounded-xl text-green-400 border border-white/5 break-all">
                    {q.sampleTests[activeTestCaseIndex].expected}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }}
             className="h-full flex flex-col"
          >
            {output ? (
              <div className={`p-4 rounded-xl border ${output.success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {output.success ? <Check className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5 text-red-400" />}
                  <span className={`font-bold ${output.success ? "text-green-400" : "text-red-400"}`}>
                    {output.message}
                  </span>
                </div>
                {output.success && output.points && (
                   <div className="text-sm font-bold text-green-500/70 mt-2">
                      +{output.points} points
                   </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-dark-500 font-semibold">
                Run code to see logic output
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

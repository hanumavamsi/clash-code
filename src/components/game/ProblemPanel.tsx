import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Check, Terminal } from "lucide-react";
import { motion } from "framer-motion";

interface ProblemPanelProps {
  questions: any[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  players: any[];
  currentUser: any;
}

export function ProblemPanel({ questions, currentIndex, onSelectQuestion, players, currentUser }: ProblemPanelProps) {
  const q = questions[currentIndex];
  // Calculate completed indices based on score bounds
  const me = players.find(p => p.id === currentUser?.id);
  const myProgress = me?.progress || 0;

  return (
    <div className="w-1/3 flex flex-col bg-[#1e2333] border-r border-[#2d3244] shadow-xl z-10 relative">
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-[#181c29] border-b border-[#2d3244]">
        <div className="flex bg-[#23283b] rounded-lg p-1 w-full gap-1 overflow-x-auto no-scrollbar">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => onSelectQuestion(i)}
              className={`flex-1 min-w-[40px] h-8 rounded-md text-xs font-bold transition-all flex items-center justify-center ${
                i === currentIndex
                  ? "bg-brand-600 text-white shadow-md"
                  : i < myProgress
                  ? "bg-green-500/20 text-green-400"
                  : "text-dark-400 hover:bg-[#2d3244] hover:text-dark-200"
              }`}
            >
              {i < myProgress ? <Check className="w-4 h-4" /> : `Q${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {q ? (
          <motion.div 
            key={q.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-2xl font-black text-white tracking-tight">{q.title}</h2>
                 <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                    q.difficulty === "hard" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    q.difficulty === "medium" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                    "bg-green-500/10 text-green-400 border-green-500/20"
                 }`}>
                    {q.difficulty}
                 </span>
             </div>
             <div className="prose prose-invert prose-brand max-w-none text-dark-300">
               <ReactMarkdown rehypePlugins={[rehypeRaw]}>{q.description}</ReactMarkdown>
             </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center text-dark-500">
            <div className="flex flex-col items-center gap-2">
              <Terminal className="w-8 h-8 opacity-50" />
              <span className="font-semibold">Loading constraints...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

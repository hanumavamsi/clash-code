"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReplayHeaderProps {
  questionTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  matchContext?: {
    opponent: {
      name: string | null;
    };
    outcome: 'win' | 'loss' | 'draw';
    eloDelta?: number;
  };
}

export function ReplayHeader({ questionTitle, difficulty, matchContext }: ReplayHeaderProps) {
  const router = useRouter();

  const difficultyColor = {
    'Easy': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Medium': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Hard': 'bg-red-500/10 text-red-400 border-red-500/20'
  };

  const outcomeColor = {
    'win': 'text-green-400',
    'loss': 'text-red-400',
    'draw': 'text-yellow-400'
  };

  return (
    <div className="flex-none h-16 bg-[#181c29] border-b border-[#2d3244] flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-[#2d3244] rounded-lg transition-colors text-dark-300 hover:text-white"
          title="Back to match"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-white">{questionTitle}</h1>
          {matchContext && (
            <p className="text-xs text-dark-400">
              vs {matchContext.opponent.name || 'Unknown'} •{' '}
              <span className={outcomeColor[matchContext.outcome]}>
                {matchContext.outcome.toUpperCase()}
                {matchContext.eloDelta && (
                  <>
                    {' '}
                    ({matchContext.eloDelta > 0 ? '+' : ''}{matchContext.eloDelta})
                  </>
                )}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${difficultyColor[difficulty]}`}>
        {difficulty}
      </div>
    </div>
  );
}

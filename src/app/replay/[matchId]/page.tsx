"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MatchPracticeGame } from "@/components/replay/MatchPracticeGame";
import { MatchPracticeContextResponse } from "@/types/replay";
import { AlertTriangle, Loader } from "lucide-react";

export default function MatchPracticePage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [context, setContext] = useState<MatchPracticeContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/replay/${matchId}`, {
          credentials: "include"
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to load practice session: ${response.statusText}`);
        }

        const data: MatchPracticeContextResponse = await response.json();
        setContext(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        console.error("[MatchPractice] Error loading context:", err);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchContext();
    }
  }, [matchId]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-dark-400 font-medium">Loading practice session...</p>
        </div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="h-screen w-full bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Failed to Load Practice Session</h1>
            <p className="text-dark-400 mb-6">{error || "Could not fetch match data"}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <MatchPracticeGame context={context} matchId={matchId} />;
}

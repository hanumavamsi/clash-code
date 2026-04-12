"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReplayGame } from "@/components/replay/ReplayGame";
import { ReplayContextResponse } from "@/types/replay";
import { AlertTriangle, Loader } from "lucide-react";

export default function ReplayPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const questionId = params.questionId as string;

  const [replayContext, setReplayContext] = useState<ReplayContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReplayContext = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/replay/${matchId}/${questionId}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to load replay: ${response.statusText}`);
        }

        const data: ReplayContextResponse = await response.json();
        setReplayContext(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        console.error("[Replay] Error loading context:", err);
      } finally {
        setLoading(false);
      }
    };

    if (matchId && questionId) {
      fetchReplayContext();
    }
  }, [matchId, questionId]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-dark-400 font-medium">Loading replay...</p>
        </div>
      </div>
    );
  }

  if (error || !replayContext) {
    return (
      <div className="h-screen w-full bg-[#0f1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <div>
            <h1 className="text-xl font-bold text-white mb-2">Failed to Load Replay</h1>
            <p className="text-dark-400 mb-6">{error || "Could not fetch replay data"}</p>
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

  return <ReplayGame replayContext={replayContext} questionId={questionId} matchId={matchId} />;
}

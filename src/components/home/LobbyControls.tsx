import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, LogIn, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { MatchHistoryFeed } from "@/components/dashboard/MatchHistoryFeed";

export function LobbyControls({ session, currentUser }: { session: any, currentUser: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"matchmaking" | "create" | "join" | "dashboard">("matchmaking");
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<string>("any");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [joinRoomId, setJoinRoomId] = useState("");

  const handleAction = () => {
    if (activeTab === "dashboard") return; // Dashboard doesn't need an action button

    const activeUserName = session?.user?.name || currentUser?.name || "Guest";
    const activeUserId = (session?.user as any)?.id || currentUser?.id || crypto.randomUUID();

    sessionStorage.setItem("code_clash_username", activeUserName);
    sessionStorage.setItem("code_clash_userId", activeUserId);

    if (activeTab === "matchmaking") {
      router.push(`/room/matchmaking?time=${timeLimit}&diff=${difficulty}&q=${numQuestions}`);
    } else if (activeTab === "create") {
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/room/${newRoomId}?time=${timeLimit}&diff=${difficulty}&q=${numQuestions}`);
    } else if (activeTab === "join") {
      if (!joinRoomId.trim()) {
        alert("Please enter a valid Room ID");
        return;
      }
      router.push(`/room/${joinRoomId.toUpperCase()}`);
    }
  };

  return (
    <div className="w-full">
      {/* Tab Toggle */}
      <div className="flex bg-dark-900/80 p-1.5 rounded-xl mb-6 border border-dark-700/50 shadow-inner gap-1">
        {(['matchmaking', 'create', 'join', 'dashboard'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              activeTab === tab
              ? "text-white"
              : "text-dark-400 hover:text-dark-200"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-brand-600 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1">
              {tab === 'matchmaking' && <>
                <Swords className="w-4 h-4" />
                <span className="hidden sm:inline">Find Match</span>
              </>}
              {tab === 'create' && <>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </>}
              {tab === 'join' && <>
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Join</span>
              </>}
              {tab === 'dashboard' && <>
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </>}
            </span>
          </button>
        ))}
      </div>

      <div className="min-h-[180px] max-h-[600px] overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MatchHistoryFeed />
            </motion.div>
          )}

          {(activeTab === "create" || activeTab === "matchmaking") && (
            <motion.div 
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 mb-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-300 mb-1.5 uppercase tracking-wider">Time Limit</label>
                  <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-full px-4 py-3 bg-dark-800 border border-dark-600 hover:border-dark-500 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold appearance-none">
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-300 mb-1.5 uppercase tracking-wider">Questions</label>
                  <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-full px-4 py-3 bg-dark-800 border border-dark-600 hover:border-dark-500 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold appearance-none">
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={7}>7 Questions</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-300 mb-1.5 uppercase tracking-wider">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-4 py-3 bg-dark-800 border border-dark-600 hover:border-dark-500 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold appearance-none">
                  <option value="any">Mixed / Any Difficulty</option>
                  <option value="easy">Easy Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="hard">Hard Only</option>
                </select>
              </div>
            </motion.div>
          )}

          {activeTab === "join" && (
            <motion.div 
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-6 h-[178px] flex flex-col justify-center"
            >
              <label className="block text-xs font-bold text-brand-300 mb-2 uppercase tracking-wider text-center">
                Enter Room Code
              </label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="e.g. X7Z9A"
                className="w-full px-4 py-4 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all uppercase text-center text-2xl font-black tracking-widest"
                maxLength={6}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Button */}
      {activeTab !== "dashboard" && (
        <button
          onClick={handleAction}
          className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {activeTab === "matchmaking" ? (
            <>
              <Swords className="w-5 h-5" /> Queue for Battle
            </>
          ) : activeTab === "create" ? (
            <>
              <Plus className="w-5 h-5" /> Host New Room
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" /> Join Match
            </>
          )}
        </button>
      )}
    </div>
  );
}

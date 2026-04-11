"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/game/GameHeader";
import { ProblemPanel } from "@/components/game/ProblemPanel";
import { EditorSurface } from "@/components/game/EditorSurface";
import { TestCasesBlock } from "@/components/game/TestCasesBlock";
import { WinnerModal } from "@/components/game/WinnerModal";
import { AlertTriangle } from "lucide-react";

import { useHasMounted } from "@/hooks/useHasMounted";

export default function GameScreen() {
    const mounted = useHasMounted();
    const params = useParams();
    const roomId = params.roomId as string;
    const router = useRouter();

    const [players, setPlayers] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [code, setCode] = useState("");
    const [output, setOutput] = useState<any>(null);
    const [activeBottomTab, setActiveBottomTab] = useState<"testcases" | "result">("testcases");
    const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
    const [timer, setTimer] = useState("15:00");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [matchEnded, setMatchEnded] = useState(false);
    const [winner, setWinner] = useState<any>(null);
    const [language, setLanguage] = useState("javascript");
    const [codeStuffs, setCodeStuffs] = useState<Record<number, string>>({});
    const [solvedQuestionIds, setSolvedQuestionIds] = useState<Set<string>>(new Set());

    const [showExitModal, setShowExitModal] = useState(false);
    const [disconnectBanner, setDisconnectBanner] = useState<string | null>(null);
    const matchEndedRef = useRef(false);

    const questionsRef = useRef<any[]>([]);
    const currentQuestionIndexRef = useRef(0);
    const languageRef = useRef("javascript");
    const currentUserRef = useRef<any>(null);

    const mapType = (type: string, lang: string, forReturn = false) => {
        const is2DArray = type.endsWith("[][]");
        const is1DArray = !is2DArray && type.endsWith("[]");
        const base = type.replace(/\[\](\[\])?$/, "");
        let mapped = base;

        if (lang === "cpp" || lang === "c") {
            mapped = base === "integer" ? "int" : base === "boolean" ? "bool" : base === "string" ? "string" : base;
            if (is2DArray) return forReturn ? `vector<vector<${mapped}>>` : `const vector<vector<${mapped}>>&`;
            if (is1DArray) return forReturn ? `vector<${mapped}>` : `const vector<${mapped}>&`;
            return mapped;
        }
        if (lang === "java") {
            mapped = base === "integer" ? "int" : base === "boolean" ? "boolean" : base === "string" ? "String" : base;
            if (is2DArray) return `${mapped}[][]`;
            if (is1DArray) return `${mapped}[]`;
            return mapped;
        }
        if (lang === "typescript") {
            mapped = base === "integer" ? "number" : base === "boolean" ? "boolean" : base === "string" ? "string" : "any";
            if (is2DArray) return `${mapped}[][]`;
            if (is1DArray) return `${mapped}[]`;
            return mapped;
        }
        return type;
    };

    const getDefaultCode = (q: any, lang: string) => {
        if (!q) return "";
        const argsTypes = q.args && q.args.length > 0 ? q.args : ["integer[]"];
        const retType   = q.returnType || "integer";
        const cppParams  = argsTypes.map((t: string, i: number) => `${mapType(t, "cpp", false)} arg${i}`).join(", ");
        const cppRet     = mapType(retType, "cpp", true);
        const javaParams = argsTypes.map((t: string, i: number) => `${mapType(t, "java")} arg${i}`).join(", ");
        const tsParams   = argsTypes.map((t: string, i: number) => `arg${i}: ${mapType(t, "typescript")}`).join(", ");
        const untypedParams = argsTypes.map((_: any, i: number) => `arg${i}`).join(", ");

        if (lang === "python" || lang === "python3") return `import math, sys, collections\n\n# Solve: ${q.title}\ndef solution(${untypedParams}):\n    pass\n`;
        if (lang === "cpp" || lang === "c") return `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <unordered_map>\n#include <unordered_set>\nusing namespace std;\n\n// Solve: ${q.title}\n${cppRet} solution(${cppParams}) {\n    \n}\n`;
        if (lang === "java") return `import java.util.*;\n\n// Solve: ${q.title}\nclass Solution {\n    public ${mapType(retType, "java")} solution(${javaParams}) {\n        \n    }\n}\n`;
        if (lang === "typescript") return `// Solve: ${q.title}\nfunction solution(${tsParams}): ${mapType(retType, "typescript")} {\n  \n}\n`;
        return `// Solve: ${q.title}\nfunction solution(${untypedParams}) {\n  \n}\n`;
    };

    useEffect(() => {
        questionsRef.current = questions;
        currentQuestionIndexRef.current = currentQuestionIndex;
        languageRef.current = language;
    }, [questions, currentQuestionIndex, language]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (matchEndedRef.current) return;
            e.preventDefault();
            e.returnValue = "Leave match? You will forfeit.";
        };
        const handleVisibilityChange = () => {
            if (matchEndedRef.current) return;
            if (document.visibilityState === "hidden" && currentUserRef.current) {
                const socket = getSocket();
                if (socket) socket.emit("tab_switch_violation", { roomId, userId: currentUserRef.current.id });
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [roomId]);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) {
            router.replace("/");
            return;
        }

        const lsName = sessionStorage.getItem("code_clash_username");
        const lsId = sessionStorage.getItem("code_clash_userId");
        if (!lsId) {
            router.replace("/");
            return;
        }

        const cUser = { id: lsId, name: lsName };
        setCurrentUser(cUser);
        currentUserRef.current = cUser;

        socket.emit("join_room", { roomId, user: cUser });

        socket.on("room_state", (room) => {
            if (room.state === "IN_PROGRESS" && questionsRef.current.length === 0) {
                setQuestions(room.questions || []);
                questionsRef.current = room.questions || [];
                setPlayers(room.players || []);
                if (room.questions?.length > 0) {
                    setCode(getDefaultCode(room.questions[0], languageRef.current));
                }
            } else {
                setPlayers(room.players || []);
            }
        });

        socket.on("timer_tick", ({ timeLeft }) => {
            const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
            const s = (timeLeft % 60).toString().padStart(2, "0");
            setTimer(`${m}:${s}`);
        });

        socket.on("progress_update", ({ players }) => {
            setPlayers(players);
        });

        socket.on("submission_status", ({ status }) => {
            if (status === "running") {
                setIsSubmitting(true);
                setActiveBottomTab("result");
                setOutput(null);
            }
        });

        socket.on("submission_result", (result) => {
            setIsSubmitting(false);
            setOutput(result);
            if (result.success) {
                const currentQuestion = questionsRef.current[currentQuestionIndexRef.current];
                if (currentQuestion) {
                    setSolvedQuestionIds(prev => new Set([...prev, currentQuestion.id]));
                }
            }
        });

        socket.on("opponent_disconnected", ({ message }) => {
            setDisconnectBanner(message);
        });

        socket.on("cheating_warning", ({ playerName, message }) => {
            setDisconnectBanner(`${playerName}: ${message}`);
            setTimeout(() => setDisconnectBanner(null), 5000);
        });

        socket.on("match_ended", ({ winner, players }) => {
            matchEndedRef.current = true;
            setWinner(winner);
            setPlayers(players);
            setMatchEnded(true);
            setDisconnectBanner(null);
            setShowExitModal(false);
            // Auto-redirect after 5 seconds if they don't click anything
            setTimeout(() => {
                router.replace("/");
            }, 5000);
        });

        return () => {
            socket.off("room_state");
            socket.off("timer_tick");
            socket.off("progress_update");
            socket.off("submission_status");
            socket.off("submission_result");
            socket.off("opponent_disconnected");
            socket.off("cheating_warning");
            socket.off("match_ended");
        };
    }, [roomId, router]);

    const handleCodeChange = (val: string | undefined) => {
        const newVal = val || "";
        setCode(newVal);
        setCodeStuffs(prev => ({ ...prev, [currentQuestionIndex]: newVal }));
    };

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        const newCode = getDefaultCode(questions[currentQuestionIndex], lang);
        setCode(newCode);
        setCodeStuffs(prev => ({ ...prev, [currentQuestionIndex]: newCode }));
    };

    const switchQuestion = (idx: number) => {
        setCurrentQuestionIndex(idx);
        setActiveTestCaseIndex(0);
        if (codeStuffs[idx]) {
            setCode(codeStuffs[idx]);
        } else {
            const defaultC = getDefaultCode(questions[idx], language);
            setCode(defaultC);
            setCodeStuffs(prev => ({ ...prev, [idx]: defaultC }));
        }
    };

    const submitCode = () => {
        const socket = getSocket();
        if (!socket || !questions[currentQuestionIndex]) return;
        socket.emit("submit_code", {
            roomId,
            userId: currentUser.id,
            code,
            questionId: questions[currentQuestionIndex].id,
            language
        });
    };

    if (!mounted) return null;

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-white animate-spin"/>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-[#0f111a] overflow-hidden text-gray-100 font-sans">
            <GameHeader 
              timer={timer} 
              players={players} 
              currentUser={currentUser} 
              onLeave={() => setShowExitModal(true)} 
            />

            <AnimatePresence>
                {disconnectBanner && (
                    <motion.div 
                      initial={{ y: -50, opacity: 0 }} 
                      animate={{ y: 0, opacity: 1 }} 
                      exit={{ y: -50, opacity: 0 }}
                      className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-red-400"
                    >
                        <AlertTriangle className="w-5 h-5"/>
                        <span className="font-bold tracking-wide">{disconnectBanner}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex overflow-hidden">
                <ProblemPanel
                  questions={questions}
                  currentIndex={currentQuestionIndex}
                  onSelectQuestion={switchQuestion}
                  players={players}
                  currentUser={currentUser}
                  solvedQuestionIds={solvedQuestionIds}
                />

                <div className="flex-1 flex flex-col min-w-0">
                    <EditorSurface 
                       code={code}
                       onChange={handleCodeChange}
                       language={language}
                       onLanguageChange={handleLanguageChange}
                       onSubmit={submitCode}
                       isSubmitting={isSubmitting}
                    />

                    <TestCasesBlock 
                       questions={questions}
                       currentIndex={currentQuestionIndex}
                       activeTab={activeBottomTab}
                       setActiveTab={setActiveBottomTab}
                       activeTestCaseIndex={activeTestCaseIndex}
                       setActiveTestCaseIndex={setActiveTestCaseIndex}
                       output={output}
                    />
                </div>
            </div>

            <AnimatePresence>
                {matchEnded && <WinnerModal winner={winner} players={players} />}
            </AnimatePresence>

            {/* Exit Confirmation Modal */}
            <AnimatePresence>
                {showExitModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }} 
                          animate={{ scale: 1, opacity: 1 }} 
                          exit={{ scale: 0.95, opacity: 0 }}
                          className="bg-dark-800 p-8 rounded-2xl max-w-sm w-full border border-dark-600 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-2">Leave Match?</h3>
                            <p className="text-dark-300 mb-6 font-medium leading-relaxed">
                                You will instantly forfeit the match and lose ELO points.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowExitModal(false)}
                                    className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-white font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const socket = getSocket();
                                        if (socket && currentUser) {
                                            socket.emit("forfeit_match", { roomId, userId: currentUser.id });
                                            setShowExitModal(false);
                                            // Don't redirect immediately - wait for match_ended event
                                        }
                                    }}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                >
                                    Forfeit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { Copy, CheckCircle2, Circle, Trophy, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RoomLobby() {
    const params       = useParams();
    const searchParams = useSearchParams();
    const roomId       = params.roomId as string;
    const router       = useRouter();

    const [players, setPlayers]     = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isCopied, setIsCopied]   = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [queueError, setQueueError] = useState<string | null>(null);

    // Ref so the cleanup effect always has the latest user object
    const userRef = useRef<any>(null);

    const isMatchmaking = roomId === "matchmaking";

    useEffect(() => {
        const userId   = sessionStorage.getItem("code_clash_userId");
        const username = sessionStorage.getItem("code_clash_username") || "Anonymous";

        if (!userId) {
            router.replace("/");
            return;
        }

        const user = { id: userId, name: username };
        setCurrentUser(user);
        userRef.current = user;

        const socket = getSocket();

        if (isMatchmaking) {
            // ── MATCHMAKING FLOW ────────────────────────────────────────────
            const config = {
                timeLimit:    Number(searchParams.get("time"))   || 15,
                difficulty:   searchParams.get("diff")           || "any",
                numQuestions: Number(searchParams.get("q"))      || 5,
            };

            socket.emit("join_queue", { user, config });

            const onMatchFound = ({ roomId: realRoomId }: any) => {
                // Replace history so Back won't return to the matchmaking page
                router.replace(`/room/${realRoomId}`);
            };

            const onQueueError = ({ message }: any) => {
                setQueueError(message);
            };

            socket.on("match_found",  onMatchFound);
            socket.on("queue_error",  onQueueError);

            return () => {
                // On unmount (user pressed Cancel or navigated away), leave the queue
                socket.emit("leave_queue", { userId: userRef.current?.id });
                socket.off("match_found", onMatchFound);
                socket.off("queue_error", onQueueError);
            };

        } else {
            // ── DIRECT ROOM FLOW ────────────────────────────────────────────
            const config = {
                timeLimit:    Number(searchParams.get("time"))   || 15,
                difficulty:   searchParams.get("diff")           || "any",
                numQuestions: Number(searchParams.get("q"))      || 5,
            };

            socket.emit("join_room", { roomId, user, config });

            const onRoomState  = (room: any) => setPlayers(room.players);
            const onRoomError  = ({ message }: any) => { alert(message); router.replace("/"); };
            const onCountdown  = ({ duration }: any) => setCountdown(duration);
            const onMatchStart = ({ questions, duration, players }: any) => {
                sessionStorage.setItem("code_clash_match_state", JSON.stringify({ questions, duration, players }));
                router.replace(`/game/${roomId}`);
            };

            socket.on("room_state",      onRoomState);
            socket.on("room_error",      onRoomError);
            socket.on("start_countdown", onCountdown);
            socket.on("match_start",     onMatchStart);

            return () => {
                socket.off("room_state",      onRoomState);
                socket.off("room_error",      onRoomError);
                socket.off("start_countdown", onCountdown);
                socket.off("match_start",     onMatchStart);
            };
        }
    }, [roomId, isMatchmaking, router, searchParams]);

    // Countdown ticker
    useEffect(() => {
        if (countdown === null || countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const toggleReady = () => {
        const socket = getSocket();
        socket.emit("player_ready", { roomId, userId: currentUser?.id });
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // ── MATCHMAKING UI ──────────────────────────────────────────────────────
    if (isMatchmaking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#030712] to-[#111827]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-10 rounded-2xl w-full max-w-lg z-10 text-center shadow-xl border border-brand-500/20">
                    {queueError ? (
                        <>
                            <div className="text-red-400 text-5xl mb-4">⚠️</div>
                            <h1 className="text-2xl font-bold text-white mb-3">Cannot Join Queue</h1>
                            <p className="text-dark-400 mb-8">{queueError}</p>
                            <button onClick={() => router.replace("/")} className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all">
                                Return Home
                            </button>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-6">Finding Opponent…</h1>
                            <div className="flex justify-center items-center h-28">
                                <Loader2 className="w-14 h-14 text-brand-500 animate-spin drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
                            </div>
                            <p className="text-dark-400 font-medium mb-2">Searching for a worthy opponent in your Elo range…</p>
                            <p className="text-dark-600 text-xs font-mono mb-8">Player ID: {currentUser?.id?.slice(0, 8)}</p>
                            <button
                                onClick={() => router.replace("/")}
                                className="px-8 py-3 bg-dark-800 text-dark-300 rounded-xl hover:bg-dark-700 hover:text-white transition-all font-bold border border-dark-700"
                            >
                                Cancel Search
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        );
    }

    // ── LOBBY UI ────────────────────────────────────────────────────────────
    const myPlayer  = players.find(p => p.id === currentUser?.id);
    const amIReady  = myPlayer?.ready ?? false;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#030712] to-[#111827]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-8 rounded-2xl w-full max-w-2xl z-10">
                <div className="flex justify-between items-center border-b border-dark-700 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Users className="text-brand-500" /> Match Lobby
                        </h1>
                        <p className="text-dark-400 mt-1">Waiting for both players to ready up…</p>
                    </div>
                    <div className="bg-dark-800 p-3 rounded-lg flex items-center gap-4">
                        <span className="text-xl font-mono tracking-widest text-brand-400 font-bold">{roomId}</span>
                        <button onClick={copyRoomId} className="text-dark-400 hover:text-white transition-colors p-2 hover:bg-dark-700 rounded-md">
                            {isCopied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {[0, 1].map((index) => {
                        const player = players[index];
                        const isMe   = player?.id === currentUser?.id;
                        return (
                            <div
                                key={index}
                                className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 transition-all ${
                                    player
                                        ? player.ready
                                            ? "bg-brand-900/20 border-brand-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                            : "bg-dark-800/50 border-dark-700"
                                        : "bg-dark-900/50 border-dark-800 border-dashed"
                                }`}
                            >
                                {player ? (
                                    <>
                                        <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mb-4 text-3xl font-bold uppercase overflow-hidden shadow-inner">
                                            {player.name.substring(0, 2)}
                                        </div>
                                        <span className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                            {player.name}
                                            {isMe && <span className="text-xs text-brand-400 bg-brand-900/30 px-2 py-1 rounded-full">YOU</span>}
                                            {player.elo && <span className="text-xs text-dark-400 font-mono tracking-widest">({player.elo})</span>}
                                        </span>
                                        <span className={`text-sm font-semibold flex items-center gap-2 ${player.ready ? "text-brand-400" : "text-dark-400"}`}>
                                            {player.ready ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                            {player.ready ? "READY" : "NOT READY"}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-dark-700 flex items-center justify-center mb-4 text-dark-500 text-2xl">?</div>
                                        <span className="text-dark-500 font-medium tracking-widest text-sm">WAITING…</span>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center">
                    <AnimatePresence mode="wait">
                        {countdown !== null ? (
                            <motion.div key="countdown" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                <div className="text-zinc-400 font-medium mb-2 tracking-widest uppercase text-sm">Match starts in</div>
                                <div className="text-7xl font-black text-brand-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]">{countdown}</div>
                            </motion.div>
                        ) : (
                            <motion.button
                                key="ready"
                                onClick={toggleReady}
                                disabled={amIReady}
                                className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                                    amIReady
                                        ? "bg-dark-800 text-brand-500 cursor-not-allowed border border-dark-700"
                                        : "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1"
                                }`}
                            >
                                {amIReady ? "Waiting for opponent…" : <><Trophy className="w-5 h-5" /> Ready for Battle</>}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

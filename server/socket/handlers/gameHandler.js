const { rooms } = require("../../state");
const { concludeMatch } = require("../../services/eloService");
const crypto = require("crypto");
const redis = require("../../redisClient");
const judgeQueue = require("../../services/judgeQueue");

// ── Shared forfeit handler ────────────────────────────────────────────────────
function _handleForfeit(io, prisma, roomId, userId, socketId, socketToUser) {
    const room = rooms.get(roomId);
    if (!room || room.state !== "IN_PROGRESS") return;

    const player = room.players.find(p => p.id === userId || p.socketId === socketId);
    if (!player) return;

    // Guard: don't forfeit twice
    if (player._forfeited) return;
    player._forfeited = true;

    console.log(`[Socket] ${player.name} forfeited room ${roomId}`);
    // No longer setting score to -9999 to avoid display issues

    io.to(roomId).emit("opponent_disconnected", {
        playerName: player.name,
        message: `${player.name} has left the match.`,
    });

    concludeMatch(roomId, room, io, prisma, { isForfeit: true, forfeiterId: userId || player.id });
}

/** Start a match: pick questions, start timer, notify players */
async function _startMatch(io, prisma, roomId, room) {
    // Clear any pending match start timeout
    if (room.matchStartTimeout) {
        clearTimeout(room.matchStartTimeout);
        room.matchStartTimeout = undefined;
    }

    room.state = "READY";
    io.to(roomId).emit("start_countdown", { duration: 3 });

    await new Promise(res => setTimeout(res, 3000));

    room.state = "IN_PROGRESS";

    // ── Load questions ────────────────────────────────────────────────────────
    const FALLBACK_QUESTIONS = [
        { id: "fq1", title: "Sum of Array",      difficulty: "easy",   description: "Write `solution(arr)` that returns the sum of all elements.", sampleTests: [{ input: "[1,2,3]",   expected: "6"       }, { input: "[10,-5,5]", expected: "10"      }] },
        { id: "fq2", title: "Reverse String",    difficulty: "medium", description: "Write `solution(str)` that reverses the given string.",         sampleTests: [{ input: '"hello"',  expected: '"olleh"'  }, { input: '"code"',   expected: '"edoc"'   }] },
        { id: "fq3", title: "Max of Array",      difficulty: "easy",   description: "Write `solution(arr)` that returns the largest number.",         sampleTests: [{ input: "[1,5,9]",  expected: "9"       }, { input: "[-5,-1]",  expected: "-1"      }] },
        { id: "fq4", title: "Is Palindrome",     difficulty: "medium", description: "Write `solution(str)` returning true if palindrome.",             sampleTests: [{ input: '"racecar"',expected: "true"    }, { input: '"hello"',  expected: "false"   }] },
        { id: "fq5", title: "Contains Duplicate",difficulty: "medium", description: "Write `solution(arr)` returning true if any value repeats.",      sampleTests: [{ input: "[1,2,1]", expected: "true"    }, { input: "[1,2,3]",  expected: "false"   }] },
    ];

    let dbQuestions = [];
    try {
        const raw = await prisma.question.findMany();
        dbQuestions = raw.map(q => ({
            id:          q.id,
            title:       q.title,
            difficulty:  q.difficulty,
            description: q.description,
            args:        q.args,
            returnType:  q.returnType,
            sampleTests: q.sampleTests,       // exposed to UI
            hiddenTests: q.hiddenTests,       // used by judge, not exposed to UI
            constraints: q.constraints || [],
            testCases:   q.sampleTests,       // legacy compat for UI
        }));
    } catch (_) {}

    if (dbQuestions.length === 0) dbQuestions = FALLBACK_QUESTIONS;

    // Filter by difficulty config
    let filtered = [...dbQuestions];
    if (room.config?.difficulty && room.config.difficulty !== "any") {
        const byDiff = filtered.filter(q => q.difficulty === room.config.difficulty);
        if (byDiff.length > 0) filtered = byDiff;
    }

    // Ensure we have enough questions (repeat if necessary)
    const need = room.config?.numQuestions || 5;
    while (filtered.length < need) {
        filtered.push({ ...filtered[Math.floor(Math.random() * filtered.length)], id: "dup_" + crypto.randomUUID() });
    }

    filtered.sort(() => Math.random() - 0.5);
    room.questions = filtered.slice(0, need);
    room.timeLeft  = (room.config?.timeLimit || 15) * 60;

    // Emit match_start with questions (strip hiddenTests from the payload!)
    const clientQuestions = room.questions.map(({ hiddenTests, ...q }) => q);
    io.to(roomId).emit("match_start", {
        questions: clientQuestions,
        duration:  room.timeLeft,
        players:   room.players,
    });

    // ── Start countdown timer ─────────────────────────────────────────────────
    room.timerInterval = setInterval(() => {
        room.timeLeft -= 1;
        if (room.timeLeft <= 0) {
            concludeMatch(roomId, room, io, prisma);
        } else {
            io.to(roomId).emit("timer_tick", { timeLeft: room.timeLeft });
        }
    }, 1000);

    // ── Persist to DB ─────────────────────────────────────────────────────────
    try {
        await prisma.room.upsert({
            where:  { id: roomId },
            update: { status: "IN_PROGRESS" },
            create: { id: roomId, status: "IN_PROGRESS", player1Id: room.players[0].id, player2Id: room.players[1].id },
        });
    } catch (_) {}
}


function registerGameHandlers(io, socket, prisma, socketToUser) {
    socket.on("submit_code", async ({ roomId, userId, code, questionId, language = "javascript" }) => {
        // Enforce basic rate limiting
        const rateKey = `ratelimit:judge:${userId}`;
        const count = await redis.incr(rateKey);
        if (count === 1) await redis.expire(rateKey, 60); // 1 minute window
        if (count > 10) {
            socket.emit("submission_result", { success: false, points: 0, message: "Rate limit exceeded. Too many requests in the last minute." });
            return;
        }

        const room = rooms.get(roomId);
        if (!room || room.state !== "IN_PROGRESS") return;

        socket.emit("submission_status", { status: "running" });

        const question = room.questions.find(q => q.id === questionId);
        if (!question) {
            socket.emit("submission_result", { success: false, points: 0, message: "Invalid question." });
            return;
        }

        // Delegate code execution to BullMQ worker queue 
        await judgeQueue.add('executeCode', { roomId, userId, socketId: socket.id, code, language, question });
    });

    // ── forfeit_match (explicit leave via UI – socket stays alive in SPA) ────
    socket.on("forfeit_match", ({ roomId, userId }) => {
        _handleForfeit(io, prisma, roomId, userId, socket.id, socketToUser);
    });
}

module.exports = { registerGameHandlers, _startMatch, _handleForfeit };

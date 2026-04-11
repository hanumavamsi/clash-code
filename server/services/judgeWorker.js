const { Worker } = require('bullmq');
const redis = require('../redisClient');
const { rooms } = require('../state');
const { executeCode } = require('./judgeService');
const { concludeMatch } = require('./eloService');

/**
 * Sets up the BullMQ worker for executing code.
 * It sits in the same process and accesses shared memory `rooms`, `io`, and `prisma`.
 */
function setupJudgeWorker(io, prisma) {
    const worker = new Worker('judgeQueue', async (job) => {
        const { roomId, userId, socketId, code, language, question } = job.data;

        // 1. Execute Code
        let result;
        try {
            result = await executeCode(code, language, question);
        } catch (error) {
            result = { allTestsPassed: false, failedMessage: String(error), points: 0, ratio: "0/0" };
        }

        const { allTestsPassed, failedMessage, points, ratio } = result;

        // 2. We are in the same process, so we can access `rooms` memory directly
        const room = rooms.get(roomId);
        if (!room || room.state !== "IN_PROGRESS") return;

        const player = room.players.find(p => p.id === userId);
        if (!player) return;

        // 3. Process Result and Emit
        if (allTestsPassed) {
            player.score += points;
            player.progress += 1;

            // Track which specific question was solved (if not already solved)
            if (!player.solvedQuestions) player.solvedQuestions = {};
            player.solvedQuestions[question.id] = true;

            io.to(socketId).emit("submission_result", {
                success: true, points,
                message: `Accepted! Passed ${ratio} tests.`,
            });
            io.to(roomId).emit("progress_update", { players: room.players });

            // Check if this player finished all questions
            if (player.progress >= room.questions.length) {
                const allDone = room.players.every(p => p.progress >= room.questions.length);
                if (allDone) {
                    concludeMatch(roomId, room, io, prisma);
                } else {
                    // Pressure timer collapse
                    const LEVERAGE_SECONDS = 5 * 60;
                    if (room.timeLeft > LEVERAGE_SECONDS) {
                        room.timeLeft = LEVERAGE_SECONDS;
                        io.to(roomId).emit("cheating_warning", {
                            playerName: "System",
                            message: `${player.name} finished all questions! Match timer collapsed to 5 minutes.`,
                        });
                    }
                }
            }
        } else {
            player.score -= 2; // Wrong answer penalty
            io.to(roomId).emit("progress_update", { players: room.players });
            io.to(socketId).emit("submission_result", {
                success: false, points: 0,
                message: (failedMessage || "Wrong Answer.") + (ratio ? ` (${ratio})` : ""),
            });
        }
    }, { connection: redis, concurrency: 5 }); // Process up to 5 container executions concurrently

    worker.on('error', err => {
        console.error('[Judge Worker] Error:', err);
    });

    console.log('[Judge Worker] Initialized and listening on judgeQueue.');
    return worker;
}

module.exports = { setupJudgeWorker };

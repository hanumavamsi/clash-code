const { rooms } = require("../state");
const { startMatchmakingWorker, leaveQueueBySocket } = require("../services/matchmakingService");
const { registerMatchmakingHandlers } = require("./handlers/matchmakingHandler");
const { registerRoomHandlers } = require("./handlers/roomHandler");
const { registerGameHandlers, _handleForfeit } = require("./handlers/gameHandler");

function setupSocketEvents(io, prisma) {
    // Ignite the independent matchmaking worker
    startMatchmakingWorker(io);

    // ──────────────────────────────────────────────────────────────────────────
    // Track userId ↔ socketId on THIS server instance for fast lookup
    // ──────────────────────────────────────────────────────────────────────────
    const socketToUser = new Map(); // socketId → { id, name }
    const pendingForfeits = new Map(); // userId → timeoutId

    io.on("connection", (socket) => {
        console.log("[Socket] Connected:", socket.id);

        // Register distributed domain handlers
        registerMatchmakingHandlers(io, socket, prisma, socketToUser);
        registerRoomHandlers(io, socket, prisma, socketToUser, pendingForfeits);
        registerGameHandlers(io, socket, prisma, socketToUser);

        // ── disconnect ────────────────────────────────────────────────────────
        socket.on("disconnect", async () => {
            console.log("[Socket] Disconnected:", socket.id);

            // Remove from matchmaking queue first
            await leaveQueueBySocket(socket.id);

            // Find any active room this socket was in and forfeit AFTER grace period
            const disconnectedUser = socketToUser.get(socket.id);
            if (disconnectedUser) {
                const timeoutId = setTimeout(() => {
                    pendingForfeits.delete(disconnectedUser.id);
                    for (const [rId, room] of rooms.entries()) {
                        if (room.state !== "IN_PROGRESS") continue;
                        if (room.players.some(p => p.id === disconnectedUser.id)) {
                            _handleForfeit(io, prisma, rId, disconnectedUser.id, null, socketToUser);
                            break;
                        }
                    }
                }, 5000); // 5 second grace period
                
                pendingForfeits.set(disconnectedUser.id, timeoutId);
            }

            socketToUser.delete(socket.id);
        });
    });
}

module.exports = { setupSocketEvents };

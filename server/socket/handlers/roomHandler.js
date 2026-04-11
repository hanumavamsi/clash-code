const { rooms } = require("../../state");
const { concludeMatch } = require("../../services/eloService");
const { _startMatch } = require("./gameHandler"); // We'll export _startMatch from gameHandler
const crypto = require("crypto");

/** Strip non-serialisable fields from the room before emitting */
function sanitizeRoom(room) {
    return { ...room, timerInterval: undefined };
}

function registerRoomHandlers(io, socket, prisma, socketToUser, pendingForfeits) {
    // ── Anti-cheat ────────────────────────────────────────────────────────
    socket.on("tab_switch_violation", ({ roomId, userId }) => {
        const room = rooms.get(roomId);
        if (!room || room.state !== "IN_PROGRESS") return;
        const player = room.players.find(p => p.id === userId);
        if (!player) return;
        player.tabSwitches = (player.tabSwitches || 0) + 1;
        if (player.tabSwitches > 5) {
            player.score = -999;
            io.to(roomId).emit("cheating_warning", { playerName: player.name, message: "Disqualified for excessive tab switching." });
            concludeMatch(roomId, room, io, prisma);
        } else if (player.tabSwitches > 3) {
            io.to(roomId).emit("cheating_warning", { playerName: player.name, message: `Warning (${player.tabSwitches}/5): Stop switching tabs!` });
        }
    });

    // ── join_room ─────────────────────────────────────────────────────────
    socket.on("join_room", async ({ roomId, user, config }) => {
        if (!user?.id || !roomId) return;

        // Clear any pending forfeit grace period
        if (pendingForfeits.has(user.id)) {
            console.log(`[Socket] Reconnection detected for user ${user.id}. Clearing forfeit timeout.`);
            clearTimeout(pendingForfeits.get(user.id));
            pendingForfeits.delete(user.id);
        }

        socketToUser.set(socket.id, user);

        // Upsert user in DB
        let dbUser = { eloRating: 1200 };
        try {
            dbUser = await prisma.user.upsert({
                where:  { username: user.name },
                update: {},
                create: { id: user.id, username: user.name },
            });
        } catch (_) {}

        // ── Create room if it doesn't exist yet ───────────────────────────
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                players:   [],
                state:     "WAITING",
                questions: [],
                config:    config || { timeLimit: 15, difficulty: "any", numQuestions: 5 },
            });
        }

        const room = rooms.get(roomId);

        // Guard: don't let a finished/in-progress room be joined by outsiders
        if (room.state === "IN_PROGRESS" || room.state === "FINISHED") {
            const isParticipant = room.players.some(p => p.id === user.id);
            if (!isParticipant) {
                socket.emit("room_error", { message: "This room is already in progress." });
                return;
            }
            // Reconnecting participant
            const player = room.players.find(p => p.id === user.id);
            if (player) player.socketId = socket.id;
            socket.join(roomId);
            socket.emit("room_state", sanitizeRoom(room));
            return;
        }

        // Guard: full room
        if (room.players.length >= 2 && !room.players.some(p => p.id === user.id)) {
            socket.emit("room_error", { message: "Room is full." });
            return;
        }

        // Add or reconnect player
        const existing = room.players.find(p => p.id === user.id);
        if (existing) {
            existing.socketId = socket.id;
            existing.elo      = dbUser.eloRating;
        } else {
            room.players.push({
                ...user,
                socketId: socket.id,
                ready:    false,
                score:    0,
                progress: 0,
                elo:      dbUser.eloRating,
            });
        }

        socket.join(roomId);

        // ── Start timeout for second player if this is the first player ──────
        if (room.players.length === 1 && !room.matchStartTimeout) {
            room.matchStartTimeout = setTimeout(() => {
                if (room.state === "WAITING" && room.players.length === 1) {
                    console.log(`[Socket] Room ${roomId} timeout: only 1 player after 30s. Kicking player and removing room.`);
                    const player = room.players[0];
                    if (player) {
                        const socket = io.sockets.sockets.get(player.socketId);
                        if (socket) {
                            socket.emit("room_error", { message: "Match failed to start: opponent did not join." });
                            socket.disconnect(true);
                        }
                    }
                    rooms.delete(roomId);
                }
            }, 30000); // 30 second timeout
        }

        // ── Cancel timeout if second player joins ──────────────────────────
        if (room.players.length === 2 && room.matchStartTimeout) {
            clearTimeout(room.matchStartTimeout);
            room.matchStartTimeout = undefined;
        }

        io.to(roomId).emit("room_state", sanitizeRoom(room));
    });

    // ── player_ready ──────────────────────────────────────────────────────
    socket.on("player_ready", ({ roomId, userId }) => {
        const room = rooms.get(roomId);
        if (!room || room.state !== "WAITING") return;

        const player = room.players.find(p => p.id === userId);
        if (player) player.ready = true;

        io.to(roomId).emit("room_state", sanitizeRoom(room));

        if (room.players.length === 2 && room.players.every(p => p.ready)) {
            _startMatch(io, prisma, roomId, room);
        }
    });

    // ── spectate_room ─────────────────────────────────────────────────────
    socket.on("spectate_room", ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit("room_error", { message: "Room not found." });
            return;
        }

        socket.join(`spectate:${roomId}`);
        // Send current room state to spectator
        socket.emit("room_state", sanitizeRoom(room));
    });

    // ── code_sync ─────────────────────────────────────────────────────────
    socket.on("code_sync", ({ roomId, userId, code }) => {
        const room = rooms.get(roomId);
        if (!room || room.state !== "IN_PROGRESS") return;

        // Broadcast to other player
        socket.to(roomId).emit("code_update", { userId, code });
        // Broadcast to spectators
        socket.to(`spectate:${roomId}`).emit("code_update", { userId, code });
    });
}

module.exports = { registerRoomHandlers, sanitizeRoom };

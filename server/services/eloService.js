const { calculateNewRatings } = require("../utils/eloCalculator");

const concludeMatch = async (roomId, room, io, prisma, options = {}) => {
    if (room.state === "FINISHED") return;
    room.state = "FINISHED";
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timerInterval = undefined;

    const { isForfeit = false, forfeiterId = null } = options;

    const p1 = room.players[0];
    const p2 = room.players[1];

    try {
        // 1. Fetch current DB state for both users
        const u1 = p1?.id ? await prisma.user.findUnique({ where: { id: p1.id } }) : null;
        const u2 = p2?.id ? await prisma.user.findUnique({ where: { id: p2.id } }) : null;

        const p1Params = { 
            id: p1.id, 
            rating: u1?.eloRating ?? 1200, 
            matchCount: u1?.matchCount ?? 0, 
            score: p1.score 
        };
        const p2Params = { 
            id: p2.id, 
            rating: u2?.eloRating ?? 1200, 
            matchCount: u2?.matchCount ?? 0, 
            score: p2.score 
        };

        // 2. Calculate New Ratings
        const results = calculateNewRatings(p1Params, p2Params, isForfeit, forfeiterId);
        
        p1.newElo = results.p1.newRating;
        p1.eloDelta = results.p1.delta;
        p2.newElo = results.p2.newRating;
        p2.eloDelta = results.p2.delta;

        // 3. Atomically update users and record match
        const winner = isForfeit 
            ? (forfeiterId === p1.id ? p2 : p1)
            : (p1.score > p2.score ? p1 : (p2.score > p1.score ? p2 : null));

        await prisma.$transaction([
            ...(u1 ? [prisma.user.update({
                where: { id: p1.id },
                data: { eloRating: p1.newElo, matchCount: { increment: 1 } }
            })] : []),
            ...(u2 ? [prisma.user.update({
                where: { id: p2.id },
                data: { eloRating: p2.newElo, matchCount: { increment: 1 } }
            })] : []),
            prisma.match.create({
                data: {
                    roomId,
                    winnerId: winner?.id || null,
                    endTime: new Date(),
                    eloAfter: {
                        p1: { id: p1.id, old: p1Params.rating, new: p1.newElo, delta: p1.eloDelta },
                        p2: { id: p2.id, old: p2Params.rating, new: p2.newElo, delta: p2.eloDelta }
                    }
                }
            })
        ]).catch(err => console.error("[ELO] DB Update Error:", err));

        // Fetch fresh player data from DB to send correct ELO to both players
        const updatedP1 = p1?.id ? await prisma.user.findUnique({ where: { id: p1.id }, select: { eloRating: true } }) : null;
        const updatedP2 = p2?.id ? await prisma.user.findUnique({ where: { id: p2.id }, select: { eloRating: true } }) : null;

        // Prepare players data with fresh ELO from database
        const playersData = room.players.map(p => ({
            ...p,
            newElo: p.id === p1.id ? updatedP1?.eloRating : updatedP2?.eloRating,
            eloDelta: p.id === p1.id ? p1.eloDelta : p2.eloDelta
        }));

        io.to(roomId).emit("match_ended", { winner, players: playersData });

    } catch(e) { 
        console.error("[ELO] Conclude Match Error:", e);
        io.to(roomId).emit("match_ended", { winner: null, players: room.players });
    }

    // Unblock both players from queuing again + clean up room after 1 min
    try {
        const { markMatchFinished } = require("./matchmakingService");
        const { rooms } = require("../state");
        if (p1?.id) await markMatchFinished(p1.id).catch(() => {});
        if (p2?.id) await markMatchFinished(p2.id).catch(() => {});
        setTimeout(() => rooms.delete(roomId), 1 * 60 * 1000);
    } catch (_) {}
};

module.exports = {
    concludeMatch
};


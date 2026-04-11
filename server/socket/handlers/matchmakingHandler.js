const { joinQueue, leaveQueue, leaveQueueBySocket } = require("../../services/matchmakingService");

function registerMatchmakingHandlers(io, socket, prisma, socketToUser) {
    socket.on("join_queue", async ({ user, config }) => {
        if (!user?.id || !user?.name) return;

        socketToUser.set(socket.id, user);

        let eloRating = 1200;
        try {
            const dbUser = await prisma.user.findUnique({ where: { username: user.name } });
            if (dbUser?.eloRating) eloRating = dbUser.eloRating;
        } catch (_) {}

        await joinQueue(socket, user, config, eloRating);
    });

    socket.on("leave_queue", async (payload) => {
        const userId = (payload && payload.userId) || (socketToUser.get(socket.id) || {}).id;
        if (userId) {
            await leaveQueue(userId);
        } else {
            await leaveQueueBySocket(socket.id);
        }
    });
}

module.exports = { registerMatchmakingHandlers };

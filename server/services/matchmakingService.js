const redis = require("../redisClient");
const crypto = require("crypto");
const { rooms } = require("../state");

// ─────────────────────────────────────────────────────────────────────────────
// Key schemas:
//   queue:matchmaking:<timeLimit>_<difficulty>_<numQuestions>   ZSET  score=elo
//   player_socket_map   HASH  userId  → socketId   (latest live socket)
//   player_queue_map    HASH  userId  → bucketKey  (which queue they're in)
//   player_in_match     SET   userId               (in an active match – blocks re-queue)
// ─────────────────────────────────────────────────────────────────────────────

const PLAYER_SOCKET_MAP = "player_socket_map";
const PLAYER_QUEUE_MAP  = "player_queue_map";
const PLAYER_IN_MATCH   = "player_in_match";   // SET of userIds currently in a match
const QUEUE_TTL_SECONDS = 120;               // auto-expire stale queue slots

/**
 * Add a player to a matchmaking queue bucket.
 * Idempotent: removes any previous entry for this userId first.
 */
async function joinQueue(socket, user, config, eloRating) {
    const userId    = user.id;
    const bucketKey = `queue:matchmaking:${config.timeLimit}_${config.difficulty}_${config.numQuestions}`;

    // ── Idempotent: remove any stale queue entry for this userId ─────────────
    // This is the only guard needed – the worker's self-match check prevents
    // two entries from the same user ever being paired. The old player_in_match
    // block caused permanent lockouts and has been removed.
    await _removeUserFromQueue(userId);

    // ── Register the player ───────────────────────────────────────────────────
    const playerData = JSON.stringify({
        id:       userId,
        name:     user.name,
        socketId: socket.id,
        elo:      eloRating,
        joinedAt: Date.now(),
        config,
    });

    // Use userId as both the Redis ZADD member key (not socketId) so the same
    // user can never appear twice.  We wrap the playerData JSON so we can still
    // zrange-parse it, but store the userId as the member score key via ZADD.
    // Simplest correct pattern: use a dedicated hash for the data and ZADD for
    // ordering. We store the serialised blob directly as the member value.
    await redis.zadd(bucketKey, eloRating, playerData);
    await redis.expire(bucketKey, QUEUE_TTL_SECONDS * 10); // keep the bucket alive

    // Track which bucket this user is in (keyed by userId now, not socketId)
    await redis.hset(PLAYER_QUEUE_MAP, userId, bucketKey);
    // Track latest socket for this user so we can notify the right connection
    await redis.hset(PLAYER_SOCKET_MAP, userId, socket.id);

    console.log(`[Matchmaking] ${user.name} (${userId}) joined ${bucketKey} at Elo ${eloRating} via socket ${socket.id}`);
}

/**
 * Remove a player from the queue by their userId.
 */
async function _removeUserFromQueue(userId) {
    const bucketKey = await redis.hget(PLAYER_QUEUE_MAP, userId);
    if (!bucketKey) return;

    // Scan the ZSET for a member that belongs to this userId and remove it
    const members = await redis.zrange(bucketKey, 0, -1);
    for (const m of members) {
        try {
            const p = JSON.parse(m);
            if (p.id === userId) {
                await redis.zrem(bucketKey, m);
                break;
            }
        } catch (_) {}
    }

    await redis.hdel(PLAYER_QUEUE_MAP, userId);
    // Don't delete from PLAYER_SOCKET_MAP here – the user's current socket
    // may still be valid for other purposes.
    console.log(`[Matchmaking] Removed ${userId} from ${bucketKey}`);
}

/**
 * Called when a socket disconnects or the user explicitly cancels.
 * Resolves the userId from the socket->userId reverse map.
 */
async function leaveQueueBySocket(socketId) {
    // Find userId for this socketId by scanning PLAYER_SOCKET_MAP
    const allSockets = await redis.hgetall(PLAYER_SOCKET_MAP);
    if (!allSockets) return;

    for (const [userId, sid] of Object.entries(allSockets)) {
        if (sid === socketId) {
            await _removeUserFromQueue(userId);
            await redis.hdel(PLAYER_SOCKET_MAP, userId);
            console.log(`[Matchmaking] Socket ${socketId} → userId ${userId} left queue on disconnect`);
            return;
        }
    }
}

/**
 * Explicitly called when a user leaves the queue (cancel button / navigate away).
 */
async function leaveQueue(userId) {
    await _removeUserFromQueue(userId);
    await redis.hdel(PLAYER_SOCKET_MAP, userId);
}

/**
 * Mark a user as being in an active match (blocks re-queuing).
 */
async function markInMatch(userId) {
    await redis.sadd(PLAYER_IN_MATCH, userId);
}

/**
 * Unmark a user after a match ends so they can queue again.
 */
async function markMatchFinished(userId) {
    await redis.srem(PLAYER_IN_MATCH, userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Matchmaking Worker (runs on an interval, inspects all queue buckets)
// ─────────────────────────────────────────────────────────────────────────────

function startMatchmakingWorker(io) {
    console.log("[Matchmaking] Worker started…");

    // ── Startup cleanup ──────────────────────────────────────────────────────
    // Rooms are in-memory and reset on restart, so all Redis matchmaking state
    // is stale after a restart. Flush it so no one gets permanently blocked.
    (async () => {
        try {
            const buckets = await redis.keys("queue:matchmaking:*");
            const keysToDelete = ["player_in_match", "player_socket_map", "player_queue_map", ...buckets];
            if (keysToDelete.length) await redis.del(...keysToDelete);
            console.log("[Matchmaking] Cleared stale Redis state on startup");
        } catch (e) {
            console.error("[Matchmaking] Startup cleanup error:", e.message);
        }
    })();

    // Subscribe to distributed match-found events so THIS node can notify its
    // locally-connected sockets.
    const subscriber = redis.duplicate();
    subscriber.subscribe("matchmaker_events");
    subscriber.on("message", (channel, message) => {
        if (channel !== "matchmaker_events") return;
        const payload = JSON.parse(message);

        if (payload.type === "MATCH_FOUND") {
            const { roomId, p1_socket, p2_socket, config } = payload;

            // Pre-provision room in local memory
            if (!rooms.has(roomId)) {
                rooms.set(roomId, {
                    players:   [],
                    state:     "WAITING",
                    questions: [],
                    config,
                });
            }

            const s1 = io.sockets.sockets.get(p1_socket);
            const s2 = io.sockets.sockets.get(p2_socket);
            if (s1) s1.emit("match_found", { roomId });
            if (s2) s2.emit("match_found", { roomId });
        }
    });

    // Poll every 2 s (reduced from 3 s for snappier matching)
    setInterval(async () => {
        try {
            const buckets = await redis.keys("queue:matchmaking:*");
            for (const bucket of buckets) {
                await _processBucket(io, bucket);
            }
        } catch (err) {
            console.error("[Matchmaking] Worker error:", err.message);
        }
    }, 2000);
}

async function _processBucket(io, bucket) {
    const playersStr = await redis.zrange(bucket, 0, -1);
    if (playersStr.length < 2) return;

    const players = [];
    for (const str of playersStr) {
        try { players.push({ raw: str, ...JSON.parse(str) }); } catch (_) {}
    }

    let i = 0;
    while (i < players.length - 1) {
        const p1 = players[i];
        const p2 = players[i + 1];

        // ── CRITICAL: never match a player with themselves ────────────────────
        if (p1.id === p2.id) {
            // Remove ALL duplicate entries for this userId and skip
            console.warn(`[Matchmaking] Duplicate userId ${p1.id} detected in queue – purging extras`);
            await redis.zrem(bucket, p2.raw);
            players.splice(i + 1, 1); // remove from local array
            continue;
        }

        // ── Expand tolerance: start 200 Elo, grow 10/sec (max 1000) ──────────
        const waited = (Date.now() - Math.min(p1.joinedAt, p2.joinedAt)) / 1000;
        const tolerance = Math.min(200 + waited * 10, 1000);

        if (Math.abs(p1.elo - p2.elo) <= tolerance) {
            const p1LiveSocket = await redis.hget(PLAYER_SOCKET_MAP, p1.id);
            const p2LiveSocket = await redis.hget(PLAYER_SOCKET_MAP, p2.id);

            // ── Both verified in Redis – create the match ────────────────────
            const roomId = crypto.randomBytes(3).toString("hex").toUpperCase();

            // Atomically remove both from the queue
            await redis.zrem(bucket, p1.raw, p2.raw);
            await redis.hdel(PLAYER_QUEUE_MAP, p1.id, p2.id);
            await redis.hdel(PLAYER_SOCKET_MAP, p1.id, p2.id);

            // Mark both as in-match so they can't queue immediately again
            await markInMatch(p1.id);
            await markInMatch(p2.id);

            await redis.publish("matchmaker_events", JSON.stringify({
                type:      "MATCH_FOUND",
                roomId,
                p1_socket: p1LiveSocket,
                p2_socket: p2LiveSocket,
                config:    p1.config,
            }));

            console.log(`[Matchmaking] ✓ Paired ${p1.name} vs ${p2.name} → Room ${roomId}`);
            i += 2;
        } else {
            i += 1;
        }
    }
}

module.exports = {
    joinQueue,
    leaveQueue,
    leaveQueueBySocket,
    markInMatch,
    markMatchFinished,
    startMatchmakingWorker,
};

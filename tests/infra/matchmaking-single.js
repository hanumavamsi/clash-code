const { io } = require("socket.io-client");
const Redis = require("ioredis");

const redis = new Redis("redis://localhost:6379");

async function test() {
    console.log("Connecting to socket server...");
    const socket = io("http://localhost:3000", { transport: ["websocket"] });

    socket.on("connect", async () => {
        console.log("Socket connected:", socket.id);

        const testUser = { id: "test_user_id_" + Date.now(), name: "TestUser" };
        const config = { timeLimit: 15, difficulty: "easy", numQuestions: 5 };

        console.log("Emitting join_queue...");
        socket.emit("join_queue", { user: testUser, config });

        setTimeout(async () => {
            console.log("Checking Redis for keys...");
            const keys = await redis.keys("queue:matchmaking:*");
            console.log("Redis keys found:", keys);

            if (keys.length > 0) {
                console.log("✓ Matchmaking key created successfully in Redis!");
                const data = await redis.zrange(keys[0], 0, -1);
                console.log("Data in key:", data);
            } else {
                console.log("✗ Matchmaking key NOT found in Redis.");
                
                const socketMap = await redis.hget("player_socket_map", testUser.id);
                console.log("Player socket map for user:", socketMap);
                if (socketMap === socket.id) {
                    console.log("✓ Socket ID found in Redis PLAYER_SOCKET_MAP.");
                } else {
                    console.log("✗ Socket ID NOT found in Redis PLAYER_SOCKET_MAP.");
                }
            }

            process.exit(0);
        }, 5000);
    });

    socket.on("connect_error", (err) => {
        console.error("Connection error:", err.message);
        process.exit(1);
    });
}

test();

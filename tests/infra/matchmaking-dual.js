const { io } = require("socket.io-client");
const Redis = require("ioredis");

const redis = new Redis("redis://localhost:6379");

async function test() {
    console.log("Connecting two sockets...");
    const s1 = io("http://localhost:3000", { transport: ["websocket"] });
    const s2 = io("http://localhost:3000", { transport: ["websocket"] });

    let matchCount = 0;

    const onMatch = (name, data) => {
        console.log(`✓ MATCH FOUND for ${name}:`, data);
        matchCount++;
        if (matchCount === 2) {
            console.log("✓ SUCCESS: Both players matched!");
            process.exit(0);
        }
    };

    s1.on("match_found", (data) => onMatch("Player 1", data));
    s2.on("match_found", (data) => onMatch("Player 2", data));

    const connectPromise = (s) => new Promise(res => s.on("connect", res));

    await Promise.all([connectPromise(s1), connectPromise(s2)]);
    console.log("Both sockets connected.");

    const config = { timeLimit: 15, difficulty: "easy", numQuestions: 5 };
    
    console.log("Player 1 joining queue...");
    s1.emit("join_queue", { user: { id: "u1_" + Date.now(), name: "P1" }, config });
    
    console.log("Player 2 joining queue...");
    s2.emit("join_queue", { user: { id: "u2_" + Date.now(), name: "P2" }, config });

    setTimeout(() => {
        if (matchCount < 2) {
            console.log("✗ FAILURE: Matching timed out after 10 seconds.");
            process.exit(1);
        }
    }, 10000);
}

test();

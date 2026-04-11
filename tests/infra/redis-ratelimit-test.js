const { io } = require("socket.io-client");

async function testRateLimit() {
  console.log("----------------------------------------");
  console.log("   REDIS RATE LIMIT TEST              ");
  console.log("----------------------------------------");
  
  const socket = io("http://localhost:3000", { transport: ["websocket"] });
  
  socket.on("connect", async () => {
    console.log("Socket connected:", socket.id);
    
    const user = { id: "rate_limit_tester", name: "Spammy" };
    const room = "test_room";
    
    console.log("Sending rapid-fire submissions (should limit after 10)...");
    
    let errorCount = 0;
    
    socket.on("judge_error", (err) => {
        if (err.message.includes("Rate limit")) {
            console.log("✅ Successfully hit rate limit!", err.message);
            errorCount++;
        }
    });

    for (let i = 0; i < 15; i++) {
        socket.emit("submit_code", { roomId: room, userId: user.id, code: "console.log(1)", language: "javascript" });
        await new Promise(r => setTimeout(r, 100)); // tight loop
    }

    setTimeout(() => {
        if (errorCount > 0) {
            console.log(`TEST PASSED: Caught ${errorCount} rate-limited requests.`);
            process.exit(0);
        } else {
            console.log("TEST FAILED: No rate limit encountered.");
            process.exit(1);
        }
    }, 3000);
  });
}

testRateLimit();

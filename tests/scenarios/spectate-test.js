const { io } = require("socket.io-client");

async function testSpectate() {
  console.log("----------------------------------------");
  console.log("   SPECTATOR BROADCAST TEST           ");
  console.log("----------------------------------------");
  
  const p1 = io("http://localhost:3000", { transport: ["websocket"] });
  const spectator = io("http://localhost:3000", { transport: ["websocket"] });
  
  let p1Ready = false;
  let spectateReady = false;

  await Promise.all([
    new Promise(res => p1.on("connect", res)),
    new Promise(res => spectator.on("connect", res))
  ]);

  console.log("Both connected.");
  const roomId = "SPECTATE_TEST_ROOM";
  const user1 = { id: "p1", name: "Player1" };

  // Set up room p1 is in
  p1.emit("join_room", { roomId, user: user1 });

  // Spectator joins later
  setTimeout(() => {
    console.log("Spectator joining...");
    spectator.emit("spectate_room", { roomId });
  }, 500);

  let updatesCaught = 0;
  spectator.on("code_update", (data) => {
    console.log("✅ Spectator caught broadcast update!", data);
    updatesCaught++;
  });

  setTimeout(() => {
    console.log("P1 syncing code...");
    p1.emit("code_sync", { roomId, userId: "p1", code: "const x = 10;" });
  }, 1000);

  setTimeout(() => {
    if (updatesCaught > 0) {
      console.log("TEST PASSED: Spectator successfully mirrored code.");
      process.exit(0);
    } else {
      console.log("TEST FAILED: No updates received by spectator.");
      process.exit(1);
    }
  }, 3000);
}

testSpectate();

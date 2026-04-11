const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const { setupSocketEvents } = require("./server/socket/events");
const { setupJudgeWorker } = require("./server/services/judgeWorker");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  // Delegate all socket listeners to our robust modularized events service
  setupSocketEvents(io, prisma);
  // Setup the BullMQ worker for executing code
  setupJudgeWorker(io, prisma);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

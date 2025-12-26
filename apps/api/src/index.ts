import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { ExpressPeerServer } from "peer";
import { executeCode } from "./execute";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
const app = express();
app.use(cors());
app.use(express.json());


const httpServer = createServer(app);
const peerServer = ExpressPeerServer(httpServer, {
  path: "/myapp"
});

app.use("/peerjs", peerServer)
const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
const subClient = pubClient.duplicate();
pubClient.on("error", (err) => console.error("Redis Pub Error:", err));
subClient.on("error", (err) => console.error("Redis Sub Error:", err));
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  console.log("✅ Redis Connected");
  // Only attach adapter if Redis is ready
  io.adapter(createAdapter(pubClient, subClient));
})
  .catch((err) => console.error("❌ Redis Error (App will run without it):", err));
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  // 👇 TELL SOCKET.IO TO USE REDIS
});
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    socket.to(roomId).emit("user-connected", userId);
  });

  //share code with everyone in room
  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", code);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });


});
app.post("/execute", async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const output = await executeCode(language || "javascript", code);
    res.json({ output });
  } catch (error) {
    res.status(500).json({ error: "Execution failed" });
  }
});
console.log("PeerServer running on port 9000");

const PORT = process.env.PORT || 4000;


httpServer.listen(PORT, () => {
  console.log(`sever is running on port ${PORT}`);
});


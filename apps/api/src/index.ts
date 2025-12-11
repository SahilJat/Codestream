import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";



const app = express();
app.use(cors());



const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

const PORT = process.env.PORT || 4000;


httpServer.listen(PORT, () => {
  console.log(`sever is running on port ${PORT}`);
});

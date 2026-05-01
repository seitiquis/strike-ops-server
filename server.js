const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  console.log("Player conectado:", socket.id);

  socket.on("createRoom", (username) => {
    const roomId = Math.random().toString(36).substring(2, 7);
    socket.join(roomId);

    socket.emit("roomCreated", roomId);
    console.log("Sala criada:", roomId);
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando");
});

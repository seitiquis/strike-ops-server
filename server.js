const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Strike Ops Server Online 🚀");
});

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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});

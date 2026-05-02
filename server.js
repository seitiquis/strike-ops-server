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

  socket.on("zombies_sync", (data) => {
  socket.to(data.room).emit("zombies_sync", {
    zombies: data.zombies
  });
  });
  socket.on("zombie_hit", (data) => {
  socket.to(data.room).emit("zombie_hit", {
    zombieIndex: data.zombieIndex,
    damage: data.damage
  });
  });

  socket.on("zombie_spawn", (data) => {
  socket.to(data.room).emit("zombie_spawn", data.zombie);
   });
  
  socket.on("player_shoot", (data) => {
  socket.to(data.room).emit("player_shoot", {
    id: socket.id,
    x: data.x,
    y: data.y,
    angle: data.angle,
    weaponName: data.weaponName || "Pistol"
    });
    });

  // 🔥 CRIAR SALA
  socket.on("createRoom", (username) => {
    const roomId = Math.random().toString(36).substring(2, 7);
    socket.join(roomId);

    socket.emit("roomCreated", roomId);
    console.log("Sala criada:", roomId);
  });

  // 🔥 ENTRAR NA SALA (CORRETO)
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log("Player entrou na sala:", roomId);
  });

  // 🔥 MOVIMENTO DOS PLAYERS
socket.on("player_move", (data) => {
  socket.to(data.room).emit("player_move", {
    id: socket.id,
    x: data.x,
    y: data.y,
    angle: data.angle,
    username: data.username || "Player"
  });
});

  // 🔥 DESCONECTAR
  socket.on("disconnect", () => {
    console.log("Player saiu:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const waitingRooms = {};

app.get("/", (req, res) => {
  res.send("Strike Ops Server Online 🚀");
});

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

function updateRoom(room) {
  const state = waitingRooms[room];
  if (!state) return;

  io.to(room).emit("room_update", {
    room,
    players: state.players.length,
    countdown: state.countdown || 0
  });
}

function startMatch(room) {
  const state = waitingRooms[room];
  if (!state || state.started) return;

  state.started = true;

  io.to(room).emit("match_start", {
    room
  });

  console.log("Partida iniciada:", room);
}

function startCountdown(room) {
  const state = waitingRooms[room];
  if (!state || state.timer || state.started) return;

  state.countdown = 10;
  updateRoom(room);

  state.timer = setInterval(() => {
    state.countdown--;

    updateRoom(room);

    if (state.countdown <= 0) {
      clearInterval(state.timer);
      state.timer = null;
      startMatch(room);
    }
  }, 1000);
}

io.on("connection", (socket) => {
  console.log("Player conectado:", socket.id);

  socket.on("joinWaitingRoom", (data) => {
    const room = data.room;
    if (!room) return;

    socket.join(room);
    socket.data.room = room;
    socket.data.username = data.username || "Player";

    if (!waitingRooms[room]) {
      waitingRooms[room] = {
        players: [],
        countdown: 0,
        timer: null,
        started: false
      };
    }

    const state = waitingRooms[room];

    if (!state.players.includes(socket.id)) {
      state.players.push(socket.id);
    }

    console.log(`Player entrou na fila ${room}:`, state.players.length);

    updateRoom(room);

    if (state.players.length >= 4) {
      if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
      }

      startMatch(room);
      return;
    }

    if (state.players.length >= 2) {
      startCountdown(room);
    }
  });

  socket.on("leaveWaitingRoom", (data) => {
    const room = data.room || socket.data.room;
    if (!room || !waitingRooms[room]) return;

    const state = waitingRooms[room];
    state.players = state.players.filter(id => id !== socket.id);

    if (state.players.length < 2 && state.timer) {
      clearInterval(state.timer);
      state.timer = null;
      state.countdown = 0;
    }

    updateRoom(room);
  });

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

  socket.on("player_move", (data) => {
    socket.to(data.room).emit("player_move", {
      id: socket.id,
      x: data.x,
      y: data.y,
      angle: data.angle,
      username: data.username || "Player"
    });
  });

  socket.on("disconnect", () => {
    const room = socket.data.room;

    if (room && waitingRooms[room]) {
      const state = waitingRooms[room];
      state.players = state.players.filter(id => id !== socket.id);

      if (state.players.length < 2 && state.timer) {
        clearInterval(state.timer);
        state.timer = null;
        state.countdown = 0;
      }

      updateRoom(room);

      if (state.players.length === 0) {
        delete waitingRooms[room];
      }
    }

    console.log("Player saiu:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});

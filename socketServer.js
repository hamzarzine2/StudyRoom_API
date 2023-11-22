const { instrument } = require("@socket.io/admin-ui");
const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const { log } = require("console");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (origin.includes("127.0.0.1:")) {
        callback(null, true);
      } else if (origin === "https://admin.socket.io") {
        // Allow requests from the specified origin
        callback(null, true);
      } else {
        // Block all other origins
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  let joinedRoom = -1;
  console.log("Nouvelle connexion établie");

  const disconnectIfConnected = () => {
    if (joinedRoom != -1) {
      socket.leave(joinedRoom);
      joinedRoom = -1;
    }
  };

  // Fait penser à un 3-way handshake
  // Moyen de communication en peer-to-peer, pour éviter de stocker le serveur
  socket.on("join room", async (room) => {
    disconnectIfConnected();
    const sockets = await io.in(room).fetchSockets();
    socket.join(room);
    console.log("Client connecté à la room " + room);
    if (sockets.length !== 0) {
      io.to(sockets[0].id).emit("get-todolist", socket.id);
      io.to(sockets[0].id).emit("get-chat", socket.id);
    }

    joinedRoom = room;
  });

  socket.on("return-todolist", (toDoList, socketId) => {
    io.to(socketId).emit("updated-todolist", toDoList);
  });

  socket.on("update-todolist", (toDoList) => {
    console.log("return-todolist = " , toDoList);
    console.log("joinedRoom = " , joinedRoom);
    socket.broadcast.to(joinedRoom).emit("updated-todolist", toDoList);
  });

  socket.on("return-chat", (chat, socketId) => {
    io.to(socketId).emit("updated-chat", chat);
  });

  socket.on("update-chat", (chat) => {
    io.to(joinedRoom).emit("updated-chat", chat);
  });

  
  socket.on("disconnect", () => {
    disconnectIfConnected();
    console.log("Client déconnecté");
  });


});

instrument(io, { auth: false });


const userIo = io.of("/user");

userIo.on("connection", (socket) => {
  console.log("New User Connected to user space");
});


userIo.use((socket, next) => {
  log("userIo.use");
  console.log( socket.handshake.auth);
  const username = socket.handshake.auth.user;
  console.log("username = " , username);
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  console.log("username = " , username);
  next();
});

const port = 4001; // Port sur lequel votre serveur Socket.io écoutera
httpServer.listen(port, () => {
  console.log(`Le serveur Socket.io écoute sur le port ${port}`);
});







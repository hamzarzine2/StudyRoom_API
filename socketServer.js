const { instrument } = require("@socket.io/admin-ui");
const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const { log } = require("console");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io","*"],
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
      io.to(sockets[0].id).emit("get-custom", socket.id);
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

   
  socket.on("return-custom", (custom, socketId) => {
    console.log("return-custom = " , custom);
    io.to(socketId).emit("updated-custom", custom);
  });

  socket.on("update-custom", (custom) => {
    console.log("return-custom = " , custom);
    socket.broadcast.to(joinedRoom).emit("updated-custom", custom);
    //to sent to everyone in the room but the one that emited first
  });

  
  socket.on("disconnect", () => {
    disconnectIfConnected();
    console.log("Client déconnecté");
  });


});

instrument(io, { auth: false });

const port = 4001; // Port sur lequel votre serveur Socket.io écoutera
httpServer.listen(port, () => {
  console.log(`Le serveur Socket.io écoute sur le port ${port}`);
});




const userIo = io.of("/user");

userIo.on("connection-userSpace", (socket) => {
  log("New User Connected to user space");
});


userIo.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});




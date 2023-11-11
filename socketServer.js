const { instrument } = require("@socket.io/admin-ui");
const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const { JsonDB, Config } = require("node-json-db");
const { log } = require("console");

const app = express();
const httpServer = createServer(app);
const db = new JsonDB(new Config("room_data", true, false, "/"));

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Autorisez toutes les origines
  },
});

io.on("connection", (socket) => {
  let joinedRoom = -1;
  console.log("Nouvelle connexion établie");

  const disconnectIfConnected = () => {
    if (joinedRoom != -1) {
      socket.leave(`room${joinedRoom}`);
      joinedRoom = -1;
    }
  };

  socket.on("join room", (room) => {
    disconnectIfConnected();
    console.log("join  ", room);
    socket.join(room);
    joinedRoom = room;
  });

  socket.on("chat message", (message) => {
    console.log(message);
    console.log(joinedRoom);
    /*const defaultMessages =
      db.getObjectDefault(`room${joinedRoom}/messages`, [1, 2, 3]) || [];
    db.push(`${joinedRoom}/messages`, defaultMessages); */
    io.to(joinedRoom).emit("chat message", message);
  });

  socket.on("update-todolist", (toDoList) => {
    console.log(toDoList, joinedRoom);
    io.to(joinedRoom).emit("updated-todolist", toDoList);
  });

  socket.on("disconnect", () => {
    disconnectIfConnected();
    console.log("Client déconnecté");
  });
});

const port = 4001; // Port sur lequel votre serveur Socket.io écoutera
httpServer.listen(port, () => {
  console.log(`Le serveur Socket.io écoute sur le port ${port}`);
});

instrument(io, { auth: false });
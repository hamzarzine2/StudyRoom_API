const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
import { JsonDB, Config } from 'node-json-db';

const app = express();
const httpServer = createServer(app);
const db = new JsonDB(new Config("room_data", true, false, '/'));

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Autorisez toutes les origines
    methods: ["GET", "POST"],
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
  }

  socket.on("join room", (roomID) => {
    disconnectIfConnected();
    socket.join(`room${roomID}`);
    joinedRoom = roomID;
  });

  socket.on("todolist element", (message) =>  {
    db.push(`room${joinedRoom}/`);
    io.to(`room${joinedRoom}`).emit("todolist element", message); // Diffusez le message à tous les clients connectés
  });

  socket.on("chat message", (message) => {
    db.push(`room${joinedRoom}/messages`, [...db.getData(`room${joinedRoom}/messages`), ]);
    io.to(`room${joinedRoom}`).emit("chat message", message); // Diffusez le message à tous les clients connectés
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

const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Autorisez toutes les origines
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Nouvelle connexion établie");
  socket.on("chat message", (message) => {
    io.emit("chat message", message); // Diffusez le message à tous les clients connectés
  });

  socket.on("disconnect", () => {
    console.log("Client déconnecté");
  });
});

const port = 4001; // Port sur lequel votre serveur Socket.io écoutera
httpServer.listen(port, () => {
  console.log(`Le serveur Socket.io écoute sur le port ${port}`);
});

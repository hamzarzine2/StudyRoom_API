const {instrument} = require("@socket.io/admin-ui")
const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const { JsonDB, Config } = require ('node-json-db');

const app = express();
const httpServer = createServer(app);
const db = new JsonDB(new Config("room_data", true, false, '/'));

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Autorisez toutes les origines
  },
});
instrument(io,{auth:false})

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
    console.log(roomID);
    socket.join(roomID);
    joinedRoom = roomID;
  });

  socket.on("todolist element", (message) =>  {
    db.push(`room${joinedRoom}/`);
    io.to(`room${joinedRoom}`).emit("todolist element", message); // Diffusez le message à tous les clients connectés
  });

  socket.on("chat message", (message) => {
    console.log("watashi ga kita");
    console.log(joinedRoom);
    const defaultMessages = db.getObjectDefault(`room${joinedRoom}/messages`, [1, 2, 3]) || [];
    db.push(`${joinedRoom}/messages`, defaultMessages);    
    io.to(joinedRoom).emit("chat message", "ningazazgzae GA KITA"); // Diffusez le message à tous les clients connectés
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





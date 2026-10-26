const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true, app: "HAMS" }));

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join", (rawName) => {
    const name = String(rawName || "ضيف").trim().slice(0, 24) || "ضيف";
    onlineUsers.set(socket.id, name);
    socket.emit("system", { text: `أهلاً ${name} في دردشة HAMS!` });
    io.emit("online", [...onlineUsers.values()]);
    socket.broadcast.emit("system", { text: `${name} دخل الدردشة.` });
  });

  socket.on("public-message", (rawText) => {
    const name = onlineUsers.get(socket.id);
    if (!name) return;
    const text = String(rawText || "").trim().slice(0, 1000);
    if (!text) return;
    io.emit("public-message", {
      id: `${Date.now()}-${socket.id}`,
      name,
      text,
      time: new Date().toISOString()
    });
  });

  socket.on("disconnect", () => {
    const name = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    io.emit("online", [...onlineUsers.values()]);
    if (name) socket.broadcast.emit("system", { text: `${name} غادر الدردشة.` });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HAMS running on port ${PORT}`);
});

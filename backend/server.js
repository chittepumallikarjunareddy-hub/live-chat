const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { registerSocketHandlers, connectDB } = require("./socketHandler");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const messageRoutes = require("./routes/messageRoutes");

app.set("io", io);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
const publicDir = path.join(__dirname, "..", "frontend", "public");
const indexHtml = path.join(publicDir, "index.html");

app.get(["/login", "/app"], (_req, res) => {
  res.sendFile(indexHtml);
});

app.use("/src", express.static(path.join(__dirname, "..", "frontend", "src")));
app.use(express.static(publicDir));

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", service: "SivionChat" });
});

registerSocketHandlers(io);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`SivionChat running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});

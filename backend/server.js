const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { registerSocketHandlers, connectDB } = require("./socketHandler");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

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

// File Upload Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
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

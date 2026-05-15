const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { registerSocketHandlers, connectDB, qrSessions } = require("./socketHandler");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { getUser, getQRSession, updateQRSessionStatus, deleteQRSession } = require("./models/store");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "sivionchat_super_secret_key";
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const messageRoutes = require("./routes/messageRoutes");

app.set("trust proxy", true);
app.set("io", io);
app.use(express.json());

// Lenient CSP for development
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Static files
app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use("/src", express.static(path.join(__dirname, "../frontend/src")));

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

app.get("/favicon.ico", (_req, res) => res.status(204).end());

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_APP_URL) {
    return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  }
  const proto = (req.get("x-forwarded-proto") || req.protocol || "http").split(",")[0].trim();
  const host = req.get("host") || "";
  const [hostname, port] = host.split(":");
  const isLocalhost = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);

  if (!isLocalhost) {
    return `${proto}://${host}`;
  }

  const lanAddress = getLanIPv4Address();
  if (!lanAddress) {
    return `${proto}://${host}`;
  }

  return `${proto}://${lanAddress}${port ? `:${port}` : ""}`;
}

function getLanIPv4Address() {
  const interfaces = os.networkInterfaces();
  const addresses = Object.values(interfaces)
    .flat()
    .filter(Boolean)
    .filter((entry) => entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address)
    .filter((address) => !address.startsWith("169.254."));

  return (
    addresses.find((address) => address.startsWith("192.168.")) ||
    addresses.find((address) => address.startsWith("10.")) ||
    addresses.find((address) => /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) ||
    addresses[0] ||
    ""
  );
}

// ── QR Code Image Generator ──────────────────────────────────────────────────
// Called by frontend to get QR image as base64 PNG for a given token
app.get("/api/qr-image/:token", async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ error: "Missing token" });

  const session = await getQRSession(token);
  if (!session) return res.status(404).json({ error: "Invalid or expired QR session" });

  try {
    const qrData = `${getPublicBaseUrl(req)}/qr-login/${encodeURIComponent(token)}`;
    const dataUrl = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" }
    });
    res.json({ dataUrl });
  } catch (err) {
    console.error("QR generation error:", err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// ── QR Scan Endpoint (called by the mobile/logged-in device) ─────────────────
// Body: { token: "<qr-token>", username: "<logged-in-username>" }
app.post("/api/qr-scan", async (req, res) => {
  const { token, username } = req.body;
  if (!token || !username) {
    return res.status(400).json({ error: "Missing token or username" });
  }

  const session = await getQRSession(token);
  if (!session) {
    return res.status(404).json({ error: "Invalid or expired QR code" });
  }
  if (session.status !== "waiting") {
    return res.status(400).json({ error: "QR code already processed" });
  }

  // Validate the scanning user actually exists
  try {
    const user = await getUser(username);
    if (!user) {
      return res.status(401).json({ error: "User not found. Please log in on mobile first." });
    }

    // 1. Mark as scanned — web browser shows "Authorizing..."
    await updateQRSessionStatus(token, "scanned");
    io.to(session.socketId).emit("qr:status", { status: "scanned" });

    // Generate JWT token
    const authToken = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: "7d" });

    // 2. After brief delay, mark as connected and send the authenticated username
    setTimeout(async () => {
      const s = await getQRSession(token);
      if (s) {
        await updateQRSessionStatus(token, "authenticated", user.username);
        io.to(session.socketId).emit("qr:status", {
          status: "connected",
          username: user.username,
          token: authToken
        });
        await deleteQRSession(token);
      }
    }, 1200);

    return res.json({ success: true, message: "Scan accepted. Web session will log in shortly." });
  } catch (err) {
    console.error("QR scan error:", err);
    return res.status(500).json({ error: "Server error during QR authentication." });
  }
});

// ── File Upload ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Frontend Static ───────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, "..", "frontend", "public");
const indexHtml = path.join(publicDir, "index.html");

app.get("/qr-login/:token", (_req, res) => res.sendFile(indexHtml));
app.get(["/login", "/app"], (_req, res) => res.sendFile(indexHtml));
app.use("/src", express.static(path.join(__dirname, "..", "frontend", "src")));
app.use(express.static(publicDir));

app.get("/health", (_, res) => res.status(200).json({ status: "ok", service: "SivionChat" }));

// ── Boot ──────────────────────────────────────────────────────────────────────
registerSocketHandlers(io);

global._ioInstance = io; // used by scheduled message cron in socketHandler.js

connectDB().then(async () => {
  // Seed basic data for "full functional" experience if empty
  try {
    const { getAllUsers, addUser, createStory, createGroup, addMessage } = require("./models/store");
    const users = await getAllUsers();
    if (users.length < 3) {
      console.log("Seeding initial application data...");
      // Add some system users
      await addUser("AI Assistant", "password123");
      await addUser("Support", "password123");
      await addUser("Mallikarjuna", "password123");

      // Add some sample stories
      await createStory({ id: "s1", author: "AI Assistant", text: "Welcome to SivionChat 2.0! 🌟", bgColor: "#3b82f6" });
      await createStory({ id: "s2", author: "Support", text: "Need help? Check the settings panel.", bgColor: "#8b5cf6" });

      // Add a sample group
      await createGroup("General Lounge", "Support", ["Mallikarjuna", "AI Assistant", "Support"]);

      // Add an initial message
      await addMessage({
        id: "msg_welcome",
        sender: "Support",
        receiver: "group_General Lounge",
        text: "Welcome everyone to the official SivionChat General Lounge! Feel free to test out reactions and voice messages here.",
        time: new Date().toISOString()
      });
      console.log("Database seeding complete.");
    }
  } catch (err) {
    console.warn("Seeding failed (non-critical):", err);
  }

  server.listen(PORT, () => {
    console.log(`SivionChat running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});

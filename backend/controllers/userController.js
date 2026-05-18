const { getUserDirectory, getUser } = require("../models/store");
const mongoose = require("mongoose");

async function listUsers(_, res) {
  try {
    const directory = await getUserDirectory();
    res.status(200).json({ success: true, users: directory });
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ success: false, message: "Error retrieving users" });
  }
}

async function getSettings(req, res) {
  const username = req.headers["x-acting-user"] || req.query.username;
  if (!username) return res.status(400).json({ success: false, message: "Username required" });
  try {
    const user = await getUser(username);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const settings = {
      theme: user.theme || "dark_classic",
      language: user.language || "en",
      bio: user.bio || "",
      phone: user.phone || "",
      email: user.email || "",
      autoLaunch: user.autoLaunch || false,
      readReceipts: user.readReceipts !== false,
      enterToSend: user.enterToSend !== false,
      avatar: user.avatar || ""
    };
    res.json({ success: true, settings });
  } catch (err) {
    console.error("getSettings error:", err);
    res.status(500).json({ success: false, message: "Error loading settings" });
  }
}

async function updateSettings(req, res) {
  const username = req.headers["x-acting-user"] || req.body.username;
  if (!username) return res.status(400).json({ success: false, message: "Username required" });
  try {
    const allowed = ["theme", "language", "bio", "phone", "email", "autoLaunch", "readReceipts", "enterToSend", "avatar"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const User = mongoose.model("User");
    await User.updateOne({ username: username.toLowerCase() }, { $set: updates });
    res.json({ success: true, message: "Settings saved" });
  } catch (err) {
    console.error("updateSettings error:", err);
    res.status(500).json({ success: false, message: "Error saving settings" });
  }
}

module.exports = { listUsers, getSettings, updateSettings };

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { addUser, getUser, getUserDirectory } = require("../models/store");
const { GLOBAL_ROOM } = require("../socketHandler");

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "sivionchat_super_secret_key";
const JWT_EXPIRES = "30d";

function normalizeUsername(input = "") {
  return input.trim().toLowerCase();
}

function validateCredentials(username, password) {
  if (!username || !password) return "Username and password are required.";
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (password.length < 4) return "Password must be at least 4 characters.";
  return null;
}

async function signup(req, res) {
  const username = normalizeUsername(req.body.username || "");
  const password = req.body.password || "";
  const phone = req.body.phone || "";

  const validationError = validateCredentials(username, password);
  if (validationError) return res.status(400).json({ success: false, message: validationError });

  try {
    const existing = await getUser(username);
    if (existing) return res.status(409).json({ success: false, message: "User already exists. Please sign in." });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await addUser(username, hashedPassword);

    const directory = await getUserDirectory();
    req.app.get("io")?.to(GLOBAL_ROOM).emit("users:directory", directory);

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: { username }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: "Error creating account. Please try again." });
  }
}

async function login(req, res) {
  const username = normalizeUsername(req.body.username || "");
  const password = req.body.password || "";

  const validationError = validateCredentials(username, password);
  if (validationError) return res.status(400).json({ success: false, message: validationError });

  try {
    const user = await getUser(username);
    if (!user) return res.status(401).json({ success: false, message: "Invalid username or password." });

    // Support both bcrypt hashes and legacy plain-text passwords
    let valid = false;
    if (user.password.startsWith("$2")) {
      valid = await bcrypt.compare(password, user.password);
    } else {
      valid = user.password === password;
      if (valid) {
        // Upgrade to bcrypt hash
        user.password = await bcrypt.hash(password, SALT_ROUNDS);
        await user.save();
      }
    }

    if (!valid) return res.status(401).json({ success: false, message: "Invalid username or password." });

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: { username: user.username }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Error during login. Please try again." });
  }
}

module.exports = { signup, login };

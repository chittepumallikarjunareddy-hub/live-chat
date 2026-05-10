const { addUser, getUser, getUserDirectory } = require("../models/store");
const { GLOBAL_ROOM } = require("../socketHandler");

function normalizeUsername(input = "") {
  return input.trim();
}

function validateCredentials(username, password) {
  if (!username || !password) {
    return "Username and password are required.";
  }
  if (username.length < 3) {
    return "Username must be at least 3 characters.";
  }
  if (password.length < 4) {
    return "Password must be at least 4 characters.";
  }
  return null;
}

async function signup(req, res) {
  const username = normalizeUsername(req.body.username);
  const password = req.body.password || "";
  const validationError = validateCredentials(username, password);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const existingUser = await getUser(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists. Please sign in."
      });
    }

    await addUser(username, password);
    const directory = await getUserDirectory();
    req.app.get("io")?.to(GLOBAL_ROOM).emit("users:directory", directory);
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: { username: username.trim().toLowerCase() }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error creating account. Please try again." 
    });
  }
}

async function login(req, res) {
  const username = normalizeUsername(req.body.username);
  const password = req.body.password || "";
  const validationError = validateCredentials(username, password);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const user = await getUser(username);
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: { username: user.username }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Error during login. Please try again." 
    });
  }
}

module.exports = {
  signup,
  login
};

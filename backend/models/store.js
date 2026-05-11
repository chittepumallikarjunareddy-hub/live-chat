const mongoose = require("mongoose");

// MongoDB Connection
const defaultConnectOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000
};

async function connectDB() {
  const atlasUri = process.env.MONGODB_URI;
  const localUri = process.env.MONGODB_URI_LOCAL || "mongodb://127.0.0.1:27017/sivionchat";
  const uriToUse = atlasUri || localUri;
  const isAtlas = atlasUri && atlasUri.startsWith("mongodb+srv://");

  try {
    console.log("Connecting to MongoDB using:", uriToUse);
    await mongoose.connect(uriToUse, defaultConnectOptions);
    console.log("MongoDB connected successfully to:", uriToUse);
    await seedDefaultUsers();
    return;
  } catch (error) {
    console.error("MongoDB connection error:", error);

    if (isAtlas) {
      console.warn("Atlas connection failed, attempting local MongoDB fallback...");
      try {
        await mongoose.connect(localUri, defaultConnectOptions);
        console.log("MongoDB connected successfully to local fallback:", localUri);
        await seedDefaultUsers();
        return;
      } catch (fallbackError) {
        console.error("Local MongoDB fallback failed:", fallbackError);
        throw fallbackError;
      }
    }

    if (!atlasUri) {
      console.warn("No Atlas URI configured; ensure local MongoDB is running at:", localUri);
    }

    throw error;
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Message Schema (receiver + time required for per-conversation threads on the client)
const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  receiver: { type: String, default: "" },
  text: { type: String, default: "" },
  type: { type: String, default: "text" },
  fileUrl: { type: String, default: "" },
  fileName: { type: String, default: "" },
  fileSize: { type: Number, default: 0 },
  isDeleted: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);

// In-memory tracking for real-time features
const sockets = new Map();
const userSockets = new Map();
const activeUsers = new Set();

const seededUsers = [
  { username: "sivion.alice", password: "Alice@123" },
  { username: "sivion.bob", password: "Bob@1234" }
];

// User functions
async function addUser(username, password) {
  try {
    const user = new User({
      username: username.toLowerCase(),
      password
    });
    await user.save();
    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("User already exists");
    }
    throw error;
  }
}

async function getUser(username) {
  try {
    return await User.findOne({ username: username.toLowerCase() });
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

async function getAllUsers() {
  try {
    const users = await User.find({}, { username: 1 });
    return users.map((user) => ({ username: user.username }));
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

async function getUserDirectory() {
  try {
    const users = await User.find({}, { username: 1 });
    return users.map((user) => ({
      username: user.username,
      online: activeUsers.has(user.username)
    }));
  } catch (error) {
    console.error("Error getting user directory:", error);
    return [];
  }
}

// Message functions
async function addMessage(message) {
  try {
    const payload = {
      id: message.id,
      sender: message.sender,
      receiver: message.receiver != null ? String(message.receiver) : "",
      text: message.text != null ? String(message.text) : "",
      type: message.type || "text",
      fileUrl: message.fileUrl || "",
      fileName: message.fileName || "",
      fileSize: message.fileSize || 0,
      time: message.time ? new Date(message.time) : new Date(),
      isDeleted: Boolean(message.isDeleted)
    };
    const newMessage = new Message(payload);
    await newMessage.save();
    return newMessage;
  } catch (error) {
    console.error("Error adding message:", error);
    return null;
  }
}

function toClientMessage(doc) {
  const o = doc && typeof doc.toObject === "function" ? doc.toObject() : doc;
  if (!o) {
    return null;
  }
  const timeSrc = o.time || o.createdAt;
  return {
    id: o.id,
    sender: o.sender || "",
    receiver: o.receiver || "",
    text: o.text || "",
    type: o.type || "text",
    fileUrl: o.fileUrl || "",
    fileName: o.fileName || "",
    fileSize: o.fileSize || 0,
    time: timeSrc ? new Date(timeSrc).toISOString() : new Date().toISOString(),
    isDeleted: Boolean(o.isDeleted),
    editedAt: o.editedAt ? new Date(o.editedAt).toISOString() : undefined
  };
}

async function getMessages() {
  try {
    const rows = await Message.find({}).sort({ createdAt: 1 }).lean();
    return rows.map(toClientMessage).filter(Boolean);
  } catch (error) {
    console.error("Error getting messages:", error);
    return [];
  }
}

async function deleteAllMessages() {
  const result = await Message.deleteMany({});
  return result.deletedCount;
}

async function deleteThreadBetween(user1, user2) {
  const a = String(user1 || "").toLowerCase();
  const b = String(user2 || "").toLowerCase();
  if (!a || !b || a === b) {
    return 0;
  }
  const result = await Message.deleteMany({
    $or: [
      { sender: a, receiver: b },
      { sender: b, receiver: a }
    ]
  });
  return result.deletedCount;
}

async function deleteMessageForEveryone(messageId) {
  try {
    const message = await Message.findOneAndUpdate(
      { id: messageId },
      { isDeleted: true, text: "" },
      { new: true }
    );
    return message;
  } catch (error) {
    console.error("Error deleting message:", error);
    return null;
  }
}

async function editMessageForEveryone(messageId, nextText) {
  try {
    const message = await Message.findOneAndUpdate(
      { id: messageId, isDeleted: false },
      { text: nextText, editedAt: new Date() },
      { new: true }
    );
    return message;
  } catch (error) {
    console.error("Error editing message:", error);
    return null;
  }
}

// Socket functions (in-memory)
function bindSocketUser(socketId, username) {
  sockets.set(socketId, username);
  if (!userSockets.has(username)) {
    userSockets.set(username, new Set());
  }
  userSockets.get(username).add(socketId);
  activeUsers.add(username);
}

function unbindSocketUser(socketId) {
  const username = sockets.get(socketId);
  if (!username) {
    return null;
  }
  sockets.delete(socketId);
  
  const set = userSockets.get(username);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) {
      userSockets.delete(username);
      activeUsers.delete(username);
    }
  }
  
  return activeUsers.has(username) ? null : username; // Only return username if completely offline
}

function getActiveUsers() {
  return Array.from(activeUsers);
}

function getSocketIdsForUser(username) {
  return Array.from(userSockets.get(username) || []);
}

// Seed default users
async function seedDefaultUsers() {
  try {
    for (const { username, password } of seededUsers) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (!existingUser) {
        await addUser(username, password);
        console.log(`Seeded user: ${username}`);
      }
    }
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

module.exports = {
  connectDB,
  addUser,
  getUser,
  addMessage,
  getMessages,
  deleteAllMessages,
  deleteThreadBetween,
  deleteMessageForEveryone,
  editMessageForEveryone,
  bindSocketUser,
  unbindSocketUser,
  getActiveUsers,
  getAllUsers,
  getUserDirectory,
  getSocketIdsForUser
};

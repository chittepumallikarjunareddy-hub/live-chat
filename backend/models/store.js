const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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
    await mongoose.connect(uriToUse, defaultConnectOptions);
    console.log("MongoDB connected:", uriToUse);
    await seedDefaultUsers();
    return;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    if (isAtlas) {
      try {
        await mongoose.connect(localUri, defaultConnectOptions);
        console.log("MongoDB connected (local fallback):", localUri);
        await seedDefaultUsers();
        return;
      } catch (fallbackError) {
        console.error("Local MongoDB fallback failed:", fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

// ── Schemas ────────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  avatar: { type: String, default: "" },
  status: { type: String, default: "Hey there! I am using SivionChat." },
  statusMode: { type: String, enum: ["online", "away", "busy", "offline"], default: "online" },
  theme: { type: String, default: "dark_classic" },
  language: { type: String, default: "en" },
  autoLaunch: { type: Boolean, default: false },
  readReceipts: { type: Boolean, default: true },
  enterToSend: { type: Boolean, default: true },
  publicKey: { type: String, default: "" },
  friends: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  receiver: { type: String, default: "" },
  text: { type: String, default: "" },
  type: { type: String, default: "text" },
  fileUrl: { type: String, default: "" },
  fileName: { type: String, default: "" },
  fileSize: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  editedAt: Date,
  readBy: [{ type: String }],
  reactions: [{ emoji: String, users: [String] }],
  createdAt: { type: Date, default: Date.now }
});

const groupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  members: [{ type: String }],
  admins: [{ type: String }],
  createdBy: { type: String, required: true },
  avatar: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const friendRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

const callLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  caller: { type: String, required: true },
  callee: { type: String, required: true },
  type: { type: String, enum: ["audio", "video"], default: "audio" },
  status: { type: String, enum: ["missed", "answered", "declined", "ended"], default: "missed" },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  duration: { type: Number, default: 0 }
});

const storySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  author: { type: String, required: true },
  content: { type: String, default: "" },
  type: { type: String, enum: ["text", "image", "video"], default: "text" },
  viewedBy: [{ type: String }],
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const scheduledMessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  text: { type: String, default: "" },
  type: { type: String, default: "text" },
  scheduledFor: { type: Date, required: true },
  fired: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const qrSessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  socketId: { type: String, default: "" },
  ip: { type: String, default: "" },
  status: { type: String, enum: ["pending", "scanned", "authenticated", "expired"], default: "pending" },
  username: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

// ── Models ─────────────────────────────────────────────────────────────────

const User = mongoose.model("User", userSchema);
const Message = mongoose.model("Message", messageSchema);
const Group = mongoose.model("Group", groupSchema);
const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
const CallLog = mongoose.model("CallLog", callLogSchema);
const Story = mongoose.model("Story", storySchema);
const ScheduledMessage = mongoose.model("ScheduledMessage", scheduledMessageSchema);
const QRSession = mongoose.model("QRSession", qrSessionSchema);

// ── In-memory socket tracking ──────────────────────────────────────────────

const sockets = new Map();
const userSockets = new Map();
const activeUsers = new Set();

function bindSocketUser(socketId, username) {
  sockets.set(socketId, username);
  if (!userSockets.has(username)) userSockets.set(username, new Set());
  userSockets.get(username).add(socketId);
  activeUsers.add(username);
}

function unbindSocketUser(socketId) {
  const username = sockets.get(socketId);
  if (!username) return null;
  sockets.delete(socketId);
  const set = userSockets.get(username);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) { userSockets.delete(username); activeUsers.delete(username); }
  }
  return activeUsers.has(username) ? null : username;
}

function getActiveUsers() { return Array.from(activeUsers); }
function getSocketIdsForUser(username) { return Array.from(userSockets.get(username) || []); }

// ── User functions ─────────────────────────────────────────────────────────

async function addUser(username, password) {
  try {
    const user = new User({ username: username.toLowerCase(), password });
    await user.save();
    return user;
  } catch (error) {
    if (error.code === 11000) throw new Error("User already exists");
    throw error;
  }
}

async function getUser(username) {
  try { return await User.findOne({ username: username.toLowerCase() }); }
  catch (e) { console.error("getUser error:", e); return null; }
}

async function getAllUsers() {
  try {
    const users = await User.find({}, { username: 1 });
    return users.map(u => ({ username: u.username }));
  } catch (e) { return []; }
}

async function getUserDirectory() {
  try {
    const users = await User.find({}, { username: 1 });
    return users.map(u => ({ username: u.username, online: activeUsers.has(u.username) }));
  } catch (e) { return []; }
}

async function updateUserStatus(username, update) {
  try {
    const u = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: update },
      { new: true }
    );
    return u;
  } catch (e) { console.error("updateUserStatus error:", e); return null; }
}

async function getUserStatus(username) {
  try {
    const u = await User.findOne({ username: username.toLowerCase() }, { status: 1, statusMode: 1, avatar: 1, bio: 1 });
    if (!u) return { status: "", statusMode: "online" };
    return { status: u.status || "", statusMode: u.statusMode || "online", avatar: u.avatar || "", bio: u.bio || "" };
  } catch (e) { return { status: "", statusMode: "online" }; }
}

async function savePublicKey(username, publicKey) {
  try {
    await User.findOneAndUpdate({ username: username.toLowerCase() }, { publicKey }, { new: true });
    return true;
  } catch (e) { return false; }
}

async function getPublicKey(username) {
  try {
    const u = await User.findOne({ username: username.toLowerCase() }, { publicKey: 1 });
    return u?.publicKey || null;
  } catch (e) { return null; }
}

// ── Message functions ──────────────────────────────────────────────────────

function toClientMessage(doc) {
  const o = doc && typeof doc.toObject === "function" ? doc.toObject() : doc;
  if (!o) return null;
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
    editedAt: o.editedAt ? new Date(o.editedAt).toISOString() : undefined,
    readBy: Array.isArray(o.readBy) ? o.readBy : [],
    reactions: Array.isArray(o.reactions)
      ? o.reactions.map(r => ({ emoji: r.emoji, users: Array.isArray(r.users) ? r.users : [] }))
      : []
  };
}

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
      isDeleted: Boolean(message.isDeleted)
    };
    const doc = new Message(payload);
    await doc.save();
    return doc;
  } catch (e) { console.error("addMessage error:", e); return null; }
}

async function getMessages() {
  try {
    const rows = await Message.find({}).sort({ createdAt: 1 }).lean();
    return rows.map(toClientMessage).filter(Boolean);
  } catch (e) { return []; }
}

async function getMessagesForUser(username) {
  try {
    const groups = await Group.find({ members: username }, { id: 1 }).lean();
    const groupIds = groups.map(g => g.id);
    const rows = await Message.find({
      $or: [
        { sender: username },
        { receiver: username },
        ...(groupIds.length ? [{ receiver: { $in: groupIds } }] : [])
      ]
    }).sort({ createdAt: 1 }).lean();
    return rows.map(toClientMessage).filter(Boolean);
  } catch (e) { console.error("getMessagesForUser error:", e); return []; }
}

async function deleteAllMessages() {
  const r = await Message.deleteMany({});
  return r.deletedCount;
}

async function deleteThreadBetween(user1, user2) {
  const a = String(user1 || "").toLowerCase();
  const b = String(user2 || "").toLowerCase();
  if (!a || !b || a === b) return 0;
  const r = await Message.deleteMany({ $or: [{ sender: a, receiver: b }, { sender: b, receiver: a }] });
  return r.deletedCount;
}

async function deleteMessageForEveryone(messageId) {
  try {
    return await Message.findOneAndUpdate({ id: messageId }, { isDeleted: true, text: "" }, { new: true });
  } catch (e) { console.error("deleteMessageForEveryone error:", e); return null; }
}

async function editMessageForEveryone(messageId, nextText) {
  try {
    return await Message.findOneAndUpdate(
      { id: messageId, isDeleted: false },
      { text: nextText, editedAt: new Date() },
      { new: true }
    );
  } catch (e) { console.error("editMessageForEveryone error:", e); return null; }
}

async function markMessagesAsRead(chatId, username) {
  try {
    await Message.updateMany(
      { receiver: chatId, sender: chatId === username ? { $ne: username } : chatId, readBy: { $ne: username } },
      { $addToSet: { readBy: username } }
    );
    return true;
  } catch (e) { console.error("markMessagesAsRead error:", e); return false; }
}

async function addReaction(messageId, emoji, username) {
  try {
    const message = await Message.findOne({ id: messageId });
    if (!message) return null;
    const reactions = Array.isArray(message.reactions) ? message.reactions : [];
    const existing = reactions.find(r => r.emoji === emoji);
    if (existing) {
      const idx = existing.users.indexOf(username);
      if (idx >= 0) existing.users.splice(idx, 1);
      else existing.users.push(username);
    } else {
      reactions.push({ emoji, users: [username] });
    }
    message.reactions = reactions.filter(r => r.users.length > 0);
    message.markModified("reactions");
    await message.save();
    return message;
  } catch (e) { console.error("addReaction error:", e); return null; }
}

// ── Group functions ────────────────────────────────────────────────────────

async function createGroup(name, members, createdBy, description) {
  try {
    const id = "group_" + uuidv4().replace(/-/g, "").slice(0, 16);
    const allMembers = Array.from(new Set([createdBy, ...(members || [])]));
    const doc = new Group({ id, name, description: description || "", members: allMembers, admins: [createdBy], createdBy });
    await doc.save();
    return doc.toObject();
  } catch (e) { console.error("createGroup error:", e); return null; }
}

async function getUserGroups(username) {
  try {
    const groups = await Group.find({ members: username }).lean();
    return groups;
  } catch (e) { return []; }
}

async function getGroup(groupId) {
  try { return await Group.findOne({ id: groupId }).lean(); }
  catch (e) { return null; }
}

async function addGroupMember(groupId, username) {
  try {
    return await Group.findOneAndUpdate({ id: groupId }, { $addToSet: { members: username } }, { new: true }).lean();
  } catch (e) { return null; }
}

async function removeGroupMember(groupId, username) {
  try {
    return await Group.findOneAndUpdate({ id: groupId }, { $pull: { members: username, admins: username } }, { new: true }).lean();
  } catch (e) { return null; }
}

async function promoteGroupMember(groupId, username) {
  try {
    return await Group.findOneAndUpdate({ id: groupId }, { $addToSet: { admins: username } }, { new: true }).lean();
  } catch (e) { return null; }
}

// ── Friend functions ───────────────────────────────────────────────────────

async function sendFriendRequest(from, to) {
  try {
    const existing = await FriendRequest.findOne({ from, to, status: "pending" });
    if (existing) return { alreadySent: true };
    const doc = new FriendRequest({ id: uuidv4(), from, to });
    await doc.save();
    return doc.toObject();
  } catch (e) { console.error("sendFriendRequest error:", e); return null; }
}

async function acceptFriendRequest(from, to) {
  try {
    const req = await FriendRequest.findOneAndUpdate({ from, to, status: "pending" }, { status: "accepted" }, { new: true });
    if (!req) return null;
    await User.updateOne({ username: from }, { $addToSet: { friends: to } });
    await User.updateOne({ username: to }, { $addToSet: { friends: from } });
    return req.toObject();
  } catch (e) { console.error("acceptFriendRequest error:", e); return null; }
}

async function declineFriendRequest(from, to) {
  try {
    return await FriendRequest.findOneAndUpdate({ from, to, status: "pending" }, { status: "declined" }, { new: true });
  } catch (e) { return null; }
}

async function getPendingRequests(username) {
  try {
    const reqs = await FriendRequest.find({ to: username, status: "pending" }).lean();
    return reqs.map(r => ({ id: r.id, from: r.from, to: r.to, createdAt: r.createdAt }));
  } catch (e) { return []; }
}

async function getFriends(username) {
  try {
    const u = await User.findOne({ username }, { friends: 1 });
    return u?.friends || [];
  } catch (e) { return []; }
}

// ── Call log functions ─────────────────────────────────────────────────────

async function saveCallLog(log) {
  try {
    const doc = new CallLog({ id: log.id || uuidv4(), caller: log.caller, callee: log.callee, type: log.type || "audio", status: log.status || "missed", startedAt: log.startedAt || new Date() });
    await doc.save();
    return doc.toObject();
  } catch (e) { console.error("saveCallLog error:", e); return null; }
}

async function updateCallLog(id, update) {
  try {
    return await CallLog.findOneAndUpdate({ id }, { $set: update }, { new: true }).lean();
  } catch (e) { return null; }
}

async function getCallLogsForUser(username) {
  try {
    const logs = await CallLog.find({ $or: [{ caller: username }, { callee: username }] }).sort({ startedAt: -1 }).limit(50).lean();
    return logs.map(l => ({
      id: l.id, caller: l.caller, callee: l.callee, type: l.type,
      status: l.status, startedAt: l.startedAt, endedAt: l.endedAt, duration: l.duration || 0
    }));
  } catch (e) { return []; }
}

// ── Story functions ────────────────────────────────────────────────────────

async function createStory(author, content, type) {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const doc = new Story({ id: uuidv4(), author, content, type: type || "text", expiresAt });
    await doc.save();
    return doc.toObject();
  } catch (e) { console.error("createStory error:", e); return null; }
}

async function getActiveStories() {
  try {
    const stories = await Story.find({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean();
    return stories;
  } catch (e) { return []; }
}

async function markStoryViewed(storyId, username) {
  try {
    await Story.findOneAndUpdate({ id: storyId }, { $addToSet: { viewedBy: username } });
    return true;
  } catch (e) { return false; }
}

// ── Scheduled message functions ────────────────────────────────────────────

async function createScheduledMessage(sender, receiver, text, type, scheduledFor) {
  try {
    const doc = new ScheduledMessage({ id: uuidv4(), sender, receiver, text, type: type || "text", scheduledFor: new Date(scheduledFor) });
    await doc.save();
    return doc.toObject();
  } catch (e) { return null; }
}

async function getAndFirePendingScheduled() {
  try {
    const now = new Date();
    const pending = await ScheduledMessage.find({ scheduledFor: { $lte: now }, fired: false }).lean();
    if (pending.length) {
      await ScheduledMessage.updateMany({ _id: { $in: pending.map(p => p._id) } }, { fired: true });
    }
    return pending;
  } catch (e) { return []; }
}

async function cancelScheduledMessage(id) {
  try {
    const r = await ScheduledMessage.deleteOne({ id });
    return r.deletedCount > 0;
  } catch (e) { return false; }
}

async function getScheduledMessagesForUser(username) {
  try {
    return await ScheduledMessage.find({ sender: username, fired: false }).sort({ scheduledFor: 1 }).lean();
  } catch (e) { return []; }
}

// ── QR Session functions ───────────────────────────────────────────────────

async function createQRSession(token, ip) {
  return await QRSession.create({ token, ip: ip || "" });
}

async function getQRSession(token) {
  try { return await QRSession.findOne({ token }).lean(); }
  catch (e) { return null; }
}

async function updateQRSessionStatus(token, status, username, socketId) {
  try {
    const update = { status };
    if (username) update.username = username;
    if (socketId) update.socketId = socketId;
    return await QRSession.findOneAndUpdate({ token }, update, { new: true }).lean();
  } catch (e) { return null; }
}

async function deleteQRSessionsBySocket(socketId) {
  try { await QRSession.deleteMany({ socketId }); }
  catch (e) { }
}

// ── Seed ───────────────────────────────────────────────────────────────────

const seededUsers = [
  { username: "sivion.alice", password: "Alice@123" },
  { username: "sivion.bob", password: "Bob@1234" }
];

async function seedDefaultUsers() {
  const bcrypt = require("bcryptjs");
  try {
    for (const { username, password } of seededUsers) {
      const existing = await User.findOne({ username: username.toLowerCase() });
      if (!existing) {
        const hash = await bcrypt.hash(password, 10);
        await addUser(username, hash);
        console.log("Seeded user:", username);
      }
    }
  } catch (e) { console.error("seedDefaultUsers error:", e); }
}

module.exports = {
  connectDB,
  addUser,
  getUser,
  getAllUsers,
  getUserDirectory,
  updateUserStatus,
  getUserStatus,
  savePublicKey,
  getPublicKey,
  addMessage,
  getMessages,
  getMessagesForUser,
  deleteAllMessages,
  deleteThreadBetween,
  deleteMessageForEveryone,
  editMessageForEveryone,
  markMessagesAsRead,
  addReaction,
  createGroup,
  getUserGroups,
  getGroup,
  addGroupMember,
  removeGroupMember,
  promoteGroupMember,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getPendingRequests,
  getFriends,
  saveCallLog,
  updateCallLog,
  getCallLogsForUser,
  createStory,
  getActiveStories,
  markStoryViewed,
  createScheduledMessage,
  getAndFirePendingScheduled,
  cancelScheduledMessage,
  getScheduledMessagesForUser,
  createQRSession,
  getQRSession,
  updateQRSessionStatus,
  deleteQRSessionsBySocket,
  bindSocketUser,
  unbindSocketUser,
  getActiveUsers,
  getSocketIdsForUser
};

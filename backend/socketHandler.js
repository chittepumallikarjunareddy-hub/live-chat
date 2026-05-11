const {
  fetchMessages,
  createMessage,
  deleteMessage,
  editMessage
} = require("./controllers/messageController");
const {
  connectDB,
  bindSocketUser,
  unbindSocketUser,
  getActiveUsers,
  getUserDirectory,
  getSocketIdsForUser
} = require("./models/store");

const GLOBAL_ROOM = "sivionchat:global";

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("user:join", async ({ username }) => {
      if (!username) {
        return;
      }

      socket.join(GLOBAL_ROOM);
      bindSocketUser(socket.id, username);
      const messages = await fetchMessages();
      socket.emit("chat:history", messages);
      io.to(GLOBAL_ROOM).emit("users:active", getActiveUsers());
      const directory = await getUserDirectory();
      io.to(GLOBAL_ROOM).emit("users:directory", directory);
      io.to(GLOBAL_ROOM).emit("system:notice", {
        text: `${username} joined the chat.`,
        time: new Date().toISOString()
      });
    });

    socket.on("message:send", async (message) => {
      if (!message || !message.id || !message.sender) {
        return;
      }
      await createMessage(message);
      io.to(GLOBAL_ROOM).emit("message:new", message);
    });

    socket.on("message:delete", async ({ id, deletedBy }) => {
      if (!id) {
        return;
      }
      const updatedMessage = await deleteMessage(id);
      if (!updatedMessage) {
        return;
      }
      io.to(GLOBAL_ROOM).emit("message:deleted", {
        id,
        deletedBy: deletedBy || "Unknown",
        deletedAt: new Date().toISOString()
      });
    });

    socket.on("message:edit", async ({ id, text, editedBy }) => {
      if (!id || !text || !String(text).trim()) {
        return;
      }
      const updatedMessage = await editMessage(id, String(text).trim());
      if (!updatedMessage) {
        return;
      }
      io.to(GLOBAL_ROOM).emit("message:edited", {
        id,
        text: updatedMessage.text,
        editedAt: updatedMessage.editedAt,
        editedBy: editedBy || "Unknown"
      });
    });

    socket.on("typing:start", ({ username }) => {
      if (!username) {
        return;
      }
      socket.to(GLOBAL_ROOM).emit("typing:update", { username, isTyping: true });
    });

    socket.on("typing:stop", ({ username }) => {
      if (!username) {
        return;
      }
      socket.to(GLOBAL_ROOM).emit("typing:update", { username, isTyping: false });
    });

    // --- WebRTC Signaling ---
    socket.on("webrtc:call-initiate", ({ targetUser, caller, type }) => {
      const targetSockets = getSocketIdsForUser(targetUser);
      if (targetSockets.length === 0) {
        // User is offline, decline immediately
        socket.emit("webrtc:call-declined", { responder: targetUser, reason: "offline" });
        return;
      }
      targetSockets.forEach(id => {
        io.to(id).emit("webrtc:incoming-call", { caller, type });
      });
    });

    socket.on("webrtc:call-accept", ({ targetUser, responder }) => {
      const targetSockets = getSocketIdsForUser(targetUser);
      targetSockets.forEach(id => {
        io.to(id).emit("webrtc:call-accepted", { responder });
      });
    });

    socket.on("webrtc:call-decline", ({ targetUser, responder }) => {
      const targetSockets = getSocketIdsForUser(targetUser);
      targetSockets.forEach(id => {
        io.to(id).emit("webrtc:call-declined", { responder });
      });
    });

    socket.on("webrtc:offer", ({ targetUser, caller, offer }) => {
      const targetSockets = getSocketIdsForUser(targetUser);
      targetSockets.forEach(id => {
        io.to(id).emit("webrtc:offer", { caller, offer });
      });
    });

    socket.on("webrtc:answer", ({ targetUser, responder, answer }) => {
      const targetSockets = getSocketIdsForUser(targetUser);
      targetSockets.forEach(id => {
        io.to(id).emit("webrtc:answer", { responder, answer });
      });
    });

    socket.on("webrtc:ice-candidate", ({ targetUser, sender, candidate }) => {
      const targetSockets = getSocketIdsForUser(targetUser);
      targetSockets.forEach(id => {
        io.to(id).emit("webrtc:ice-candidate", { sender, candidate });
      });
    });

    socket.on("webrtc:call-end", ({ targetUser, sender }) => {
      const targetSockets = getSocketIdsForUser(targetUser);
      targetSockets.forEach(id => {
        io.to(id).emit("webrtc:call-ended", { sender });
      });
    });
    // --- End WebRTC Signaling ---

    socket.on("disconnect", async () => {
      const username = unbindSocketUser(socket.id);
      if (!username) {
        return;
      }
      io.to(GLOBAL_ROOM).emit("users:active", getActiveUsers());
      const directory = await getUserDirectory();
      io.to(GLOBAL_ROOM).emit("users:directory", directory);
      io.to(GLOBAL_ROOM).emit("system:notice", {
        text: `${username} left the chat.`,
        time: new Date().toISOString()
      });
    });
  });
}

module.exports = {
  registerSocketHandlers,
  connectDB,
  GLOBAL_ROOM
};

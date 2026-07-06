const {
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
  getSocketIdsForUser,
  createGroup,
  getUserGroups,
  getGroup,
  addGroupMember,
  removeGroupMember,
  promoteGroupMember,
  markMessagesAsRead,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getPendingRequests,
  getFriends,
  getMessagesForUser,
  createQRSession,
  updateQRSessionStatus,
  deleteQRSessionsBySocket,
  saveCallLog,
  updateCallLog,
  getCallLogsForUser,
  clearCallLogsForUser,
  addReaction,
  createScheduledMessage,
  getAndFirePendingScheduled,
  cancelScheduledMessage,
  getScheduledMessagesForUser,
  createStory,
  getActiveStories,
  markStoryViewed,
  updateUserStatus,
  getUserStatus,
  savePublicKey,
  getPublicKey
} = require("./models/store");
const { v4: uuidv4 } = require("uuid");

const GLOBAL_ROOM = "sivionchat:global";

// In-memory call tracking: "caller:callee" -> callId, callId -> { caller, callee, answeredAt }
const pendingCallByUsers = new Map();
const activeCallsData = new Map();

async function emitCallHistory(io, ...usernames) {
  for (const username of usernames) {
    if (!username || username.startsWith("group_")) continue;
    const logs = await getCallLogsForUser(username);
    getSocketIdsForUser(username).forEach(id => io.to(id).emit("calls:history", logs));
  }
}

function registerSocketHandlers(io) {
  global._ioInstance = io;

  io.on("connection", (socket) => {
    // ── User join ──────────────────────────────────────────────
    socket.on("user:join", async ({ username }) => {
      if (!username) return;

      socket.join(GLOBAL_ROOM);
      bindSocketUser(socket.id, username);

      const messages = await getMessagesForUser(username);
      socket.emit("chat:history", messages);
      // Notify online senders that their unread messages to this user were delivered
      const uniqueSenders = [...new Set(messages.filter(m => m.receiver === username).map(m => m.sender))];
      uniqueSenders.forEach(sender => {
        if (sender !== username && getSocketIdsForUser(sender).length > 0) {
          getSocketIdsForUser(sender).forEach(id =>
            io.to(id).emit("message:delivered-bulk", { deliveredTo: username })
          );
        }
      });
      io.to(GLOBAL_ROOM).emit("users:active", getActiveUsers());
      const directory = await getUserDirectory();
      io.to(GLOBAL_ROOM).emit("users:directory", directory);

      const userGroups = await getUserGroups(username);
      socket.emit("groups:directory", userGroups);

      // Emit friends data
      const friendsList = await getFriends(username);
      const activeUsers = getActiveUsers();
      const friendsWithStatus = friendsList.map(f => ({ username: f, online: activeUsers.includes(f) }));
      socket.emit("friends:directory", friendsWithStatus);

      const pending = await getPendingRequests(username);
      socket.emit("friends:pending", pending);

      const callLogs = await getCallLogsForUser(username);
      socket.emit("calls:history", callLogs);

      // Emit scheduled messages for this user
      const scheduled = await getScheduledMessagesForUser(username);
      socket.emit("scheduled:directory", scheduled);

      // Emit active stories
      const stories = await getActiveStories();
      socket.emit("stories:directory", stories);

      // Emit own status
      const userStatus = await getUserStatus(username);
      socket.emit("user:status-self", userStatus);

      // Broadcast this user's status to everyone
      io.to(GLOBAL_ROOM).emit("user:status-update", { username, ...userStatus });

      io.to(GLOBAL_ROOM).emit("system:notice", {
        text: `${username} joined the chat.`,
        time: new Date().toISOString()
      });
    });

    // ── Messaging ──────────────────────────────────────────────
    socket.on("message:send", async (message) => {
      if (!message || !message.id || !message.sender) return;
      await createMessage(message);

      if (message.receiver && message.receiver.startsWith("group_")) {
        const group = await getGroup(message.receiver);
        if (group) {
          group.members.forEach(member => {
            getSocketIdsForUser(member).forEach(id => {
              io.to(id).emit("message:new", message);
            });
          });
        }
      } else if (message.receiver) {
        const allSockets = new Set([
          ...getSocketIdsForUser(message.sender),
          ...getSocketIdsForUser(message.receiver)
        ]);
        allSockets.forEach(id => io.to(id).emit("message:new", message));
        // If receiver is online, emit delivery receipt to sender
        if (getSocketIdsForUser(message.receiver).length > 0) {
          getSocketIdsForUser(message.sender).forEach(id =>
            io.to(id).emit("message:delivered", { messageId: message.id })
          );
        }
      } else {
        io.to(GLOBAL_ROOM).emit("message:new", message);
      }
    });

    // ── Message Reactions ─────────────────────────────────────
    socket.on("message:react", async ({ messageId, emoji, username }) => {
      if (!messageId || !emoji || !username) return;
      const updated = await addReaction(messageId, emoji, username);
      if (!updated) return;
      // Broadcast reaction update to sender and receiver
      io.to(GLOBAL_ROOM).emit("message:reaction-update", {
        messageId: updated.id,
        reactions: updated.reactions
      });
    });

    socket.on("message:delete", async ({ id, deletedBy }) => {
      if (!id) return;
      const updated = await deleteMessage(id);
      if (!updated) return;
      io.to(GLOBAL_ROOM).emit("message:deleted", {
        id,
        deletedBy: deletedBy || "Unknown",
        deletedAt: new Date().toISOString()
      });
    });

    socket.on("message:edit", async ({ id, text, editedBy }) => {
      if (!id || !text || !String(text).trim()) return;
      const updated = await editMessage(id, String(text).trim());
      if (!updated) return;
      io.to(GLOBAL_ROOM).emit("message:edited", {
        id,
        text: updated.text,
        editedAt: updated.editedAt,
        editedBy: editedBy || "Unknown"
      });
    });

    // Typing indicator with auto-stop timeout to avoid stale "is typing" states
    const typingTimers = new Map();
    socket.on("typing:start", ({ username }) => {
      if (!username) return;
      socket.to(GLOBAL_ROOM).emit("typing:update", { username, isTyping: true });
      if (typingTimers.has(username)) clearTimeout(typingTimers.get(username));
      typingTimers.set(username, setTimeout(() => {
        socket.to(GLOBAL_ROOM).emit("typing:update", { username, isTyping: false });
        typingTimers.delete(username);
      }, 8000));
    });

    socket.on("typing:stop", ({ username }) => {
      if (!username) return;
      if (typingTimers.has(username)) { clearTimeout(typingTimers.get(username)); typingTimers.delete(username); }
      socket.to(GLOBAL_ROOM).emit("typing:update", { username, isTyping: false });
    });

    socket.on("message:read", async ({ chatId, username }) => {
      if (!chatId || !username) return;
      const success = await markMessagesAsRead(chatId, username);
      if (success) {
        if (chatId.startsWith("group_")) {
          socket.to(GLOBAL_ROOM).emit("message:read-update", { chatId, reader: username });
        } else {
          getSocketIdsForUser(chatId).forEach(id => {
            io.to(id).emit("message:read-update", { chatId: username, reader: username });
          });
        }
      }
    });

    // ── Groups ────────────────────────────────────────────────
    socket.on("group:create", async ({ name, members, createdBy, description }) => {
      const group = await createGroup(name, members, createdBy, description || "");
      if (group) {
        const cleanGroup = JSON.parse(JSON.stringify(group));
        cleanGroup.members.forEach(member => {
          getSocketIdsForUser(String(member)).forEach(id => {
            io.to(id).emit("group:created", cleanGroup);
          });
        });
      } else {
        socket.emit("system:notice", { text: "Failed to create group. Please try again.", time: new Date() });
      }
    });

    socket.on("group:add-member", async ({ groupId, username, byAdmin }) => {
      const result = await addGroupMember(groupId, username, byAdmin);
      if (!result || result.reason) {
        socket.emit("group:admin-result", { ok: false, reason: result?.reason || "error", action: "add-member" });
        return;
      }
      const cleanGroup = JSON.parse(JSON.stringify(result));
      cleanGroup.members.forEach(member => {
        getSocketIdsForUser(String(member)).forEach(id => io.to(id).emit("group:updated", cleanGroup));
      });
    });

    socket.on("group:remove-member", async ({ groupId, username, byAdmin }) => {
      const result = await removeGroupMember(groupId, username, byAdmin);
      if (!result || result.reason) {
        socket.emit("group:admin-result", { ok: false, reason: result?.reason || "error", action: "remove-member" });
        return;
      }
      const cleanGroup = JSON.parse(JSON.stringify(result));
      // Notify the removed user
      getSocketIdsForUser(username).forEach(id => io.to(id).emit("group:removed", { groupId, removedBy: byAdmin }));
      // Notify remaining members
      cleanGroup.members.forEach(member => {
        getSocketIdsForUser(String(member)).forEach(id => io.to(id).emit("group:updated", cleanGroup));
      });
    });

    socket.on("group:promote-member", async ({ groupId, username, byAdmin }) => {
      const result = await promoteGroupMember(groupId, username, byAdmin);
      if (!result || result.reason) {
        socket.emit("group:admin-result", { ok: false, reason: result?.reason || "error", action: "promote" });
        return;
      }
      const cleanGroup = JSON.parse(JSON.stringify(result));
      cleanGroup.members.forEach(member => {
        getSocketIdsForUser(String(member)).forEach(id => io.to(id).emit("group:updated", cleanGroup));
      });
    });

    // ── Friend Requests ───────────────────────────────────────
    socket.on("friend:send", async ({ from, to }) => {
      if (!from || !to) return;
      
      const targetUser = await require("./models/store").getUserDirectory().then(dirs => dirs.find(d => d.username === to));
      if (!targetUser) {
        socket.emit("friend:send-result", { ok: false, reason: "User does not exist" });
        return;
      }

      const result = await sendFriendRequest(from, to);
      if (!result) {
        socket.emit("friend:send-result", { ok: false, reason: "Failed to send request" });
        return;
      }
      
      if (result.alreadySent) {
        socket.emit("friend:send-result", { ok: false, reason: "Friend request already sent" });
        return;
      }

      socket.emit("friend:send-result", { ok: true, to });

      if (result.autoAccepted) {
        const activeUsers = getActiveUsers();
        getSocketIdsForUser(to).forEach(id =>
          io.to(id).emit("friend:accepted", { friend: from, online: activeUsers.includes(from) })
        );
        getSocketIdsForUser(from).forEach(id =>
          io.to(id).emit("friend:accepted", { friend: to, online: activeUsers.includes(to) })
        );
      } else {
        // Send a notification to the target user
        getSocketIdsForUser(to).forEach(id =>
          io.to(id).emit("friend:request-received", { from })
        );
      }
    });

    socket.on("friend:accept", async ({ from, to }) => {
      if (!from || !to) return;
      const result = await acceptFriendRequest(from, to);
      if (!result) {
        socket.emit("friend:accept-result", { ok: false });
        return;
      }
      const activeUsers = getActiveUsers();
      getSocketIdsForUser(to).forEach(id =>
        io.to(id).emit("friend:accepted", { friend: from, online: activeUsers.includes(from) })
      );
      getSocketIdsForUser(from).forEach(id =>
        io.to(id).emit("friend:accepted", { friend: to, online: activeUsers.includes(to) })
      );
    });

    socket.on("friend:decline", async ({ from, to }) => {
      if (!from || !to) return;
      await declineFriendRequest(from, to);
      socket.emit("friend:decline-result", { ok: true, from });
    });

    // ── WebRTC Signaling ──────────────────────────────────────
    socket.on("webrtc:call-initiate", async ({ targetUser, caller, type }) => {
      if (targetUser.startsWith("group_")) {
        const group = await getGroup(targetUser);
        if (group) {
          let onlineCount = 0;
          group.members.forEach(member => {
            if (member !== caller) {
              const targetSockets = getSocketIdsForUser(member);
              if (targetSockets.length > 0) {
                onlineCount++;
                targetSockets.forEach(id =>
                  io.to(id).emit("webrtc:call-incoming", { caller, type, groupCallId: targetUser })
                );
              }
            }
          });
          if (onlineCount === 0) {
            socket.emit("webrtc:call-declined", { responder: targetUser, reason: "offline" });
          }
        }
      } else {
        const targetSockets = getSocketIdsForUser(targetUser);
        if (targetSockets.length === 0) {
          const callId = uuidv4();
          await saveCallLog({ id: callId, caller, callee: targetUser, type });
          await emitCallHistory(io, caller, targetUser);
          socket.emit("webrtc:call-declined", { responder: targetUser, reason: "offline" });
          return;
        }
        const callId = uuidv4();
        await saveCallLog({ id: callId, caller, callee: targetUser, type });
        pendingCallByUsers.set(`${caller}:${targetUser}`, callId);
        activeCallsData.set(callId, { caller, callee: targetUser });
        targetSockets.forEach(id =>
          io.to(id).emit("webrtc:call-incoming", { caller, type })
        );
      }
    });

    socket.on("webrtc:call-accept", async ({ targetUser, responder }) => {
      const key = `${targetUser}:${responder}`;
      const callId = pendingCallByUsers.get(key);
      if (callId) {
        const now = new Date();
        await updateCallLog(callId, { status: "answered", answeredAt: now });
        const data = activeCallsData.get(callId) || {};
        activeCallsData.set(callId, { ...data, answeredAt: now });
        await emitCallHistory(io, targetUser, responder);
      }
      getSocketIdsForUser(targetUser).forEach(id =>
        io.to(id).emit("webrtc:call-accepted", { responder })
      );
    });

    socket.on("webrtc:call-decline", async ({ targetUser, responder }) => {
      const key = `${targetUser}:${responder}`;
      const callId = pendingCallByUsers.get(key);
      if (callId) {
        await updateCallLog(callId, { status: "declined", endedAt: new Date() });
        pendingCallByUsers.delete(key);
        activeCallsData.delete(callId);
        await emitCallHistory(io, targetUser, responder);
      }
      getSocketIdsForUser(targetUser).forEach(id =>
        io.to(id).emit("webrtc:call-declined", { responder })
      );
    });

    socket.on("webrtc:offer", ({ targetUser, caller, offer }) => {
      getSocketIdsForUser(targetUser).forEach(id =>
        io.to(id).emit("webrtc:offer", { caller, offer })
      );
    });

    socket.on("webrtc:answer", ({ targetUser, responder, answer }) => {
      getSocketIdsForUser(targetUser).forEach(id =>
        io.to(id).emit("webrtc:answer", { responder, answer })
      );
    });

    socket.on("webrtc:ice-candidate", ({ targetUser, sender, candidate }) => {
      getSocketIdsForUser(targetUser).forEach(id =>
        io.to(id).emit("webrtc:ice-candidate", { sender, candidate })
      );
    });

    socket.on("webrtc:call-end", async ({ targetUser, sender }) => {
      if (targetUser && targetUser.startsWith("group_")) {
        const group = await getGroup(targetUser);
        if (group) {
          group.members.forEach(member => {
            if (member !== sender) {
              getSocketIdsForUser(member).forEach(id =>
                io.to(id).emit("webrtc:call-ended", { sender, groupCallId: targetUser })
              );
            }
          });
        }
      } else {
        // Resolve call log — check both key orderings (either party may end the call)
        const key1 = `${sender}:${targetUser}`;
        const key2 = `${targetUser}:${sender}`;
        const callId = pendingCallByUsers.get(key1) || pendingCallByUsers.get(key2);
        if (callId) {
          const data = activeCallsData.get(callId) || {};
          const now = new Date();
          const duration = data.answeredAt ? Math.round((now - new Date(data.answeredAt)) / 1000) : 0;
          const status = data.answeredAt ? "ended" : "missed";
          await updateCallLog(callId, { status, endedAt: now, duration });
          pendingCallByUsers.delete(key1);
          pendingCallByUsers.delete(key2);
          activeCallsData.delete(callId);
          await emitCallHistory(io, sender, targetUser);
        }
        getSocketIdsForUser(targetUser).forEach(id =>
          io.to(id).emit("webrtc:call-ended", { sender })
        );
      }
    });

    // ── QR Login ──────────────────────────────────────────────
    // Web browser (login screen) requests a fresh QR token
    socket.on("qr:request-token", async () => {
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 120000); // 2 minutes

      await createQRSession(token, socket.id, expiresAt);

      // Send the raw token — frontend will build the QR image URL
      socket.emit("qr:token", { token, expiresAt: expiresAt.getTime() });
      socket.emit("qr:status", { status: "waiting", expiresAt: expiresAt.getTime() });

      // We rely on MongoDB TTL index to clean up expired sessions from the database
      setTimeout(async () => {
        const session = await require("./models/store").getQRSession(token);
        if (session && session.status === "waiting") {
          await updateQRSessionStatus(token, "expired");
          io.to(session.socketId).emit("qr:status", { status: "expired" });
        }
      }, 120000);
    });

    // ── Scheduled Messages ────────────────────────────────────
    socket.on("message:schedule", async ({ id, sender, receiver, text, scheduledAt }) => {
      if (!id || !sender || !receiver || !text || !scheduledAt) return;
      const msg = await createScheduledMessage({ id, sender, receiver, text, scheduledAt: new Date(scheduledAt) });
      if (!msg) { socket.emit("message:schedule-result", { ok: false }); return; }
      socket.emit("message:schedule-result", { ok: true, message: msg });
      // Refresh all sockets for this user
      getSocketIdsForUser(sender).forEach(sid => {
        io.to(sid).emit("scheduled:new", msg);
      });
    });

    socket.on("message:schedule-cancel", async ({ id, sender }) => {
      if (!id || !sender) return;
      await cancelScheduledMessage(id);
      getSocketIdsForUser(sender).forEach(sid => {
        io.to(sid).emit("scheduled:cancelled", { id });
      });
    });

    // ── Stories ───────────────────────────────────────────────
    socket.on("story:post", async ({ id, author, text, bgColor }) => {
      if (!id || !author) return;
      const story = await createStory({ id, author, text, bgColor });
      if (!story) return;
      io.to(GLOBAL_ROOM).emit("story:new", story);
    });

    socket.on("story:view", async ({ storyId, username }) => {
      if (!storyId || !username) return;
      await markStoryViewed(storyId, username);
      // Notify the story author
      const stories = await getActiveStories();
      const story = stories.find(s => s.id === storyId);
      if (story) {
        getSocketIdsForUser(story.author).forEach(sid => {
          io.to(sid).emit("story:viewed", { storyId, viewer: username });
        });
      }
    });

    // ── User Status ───────────────────────────────────────────
    socket.on("user:set-status", async ({ username, statusText, statusEmoji, statusPreset }) => {
      if (!username) return;
      await updateUserStatus(username, { statusText, statusEmoji, statusPreset });
      io.to(GLOBAL_ROOM).emit("user:status-update", { username, statusText, statusEmoji, statusPreset });
    });

    // ── E2EE Public Key Exchange ──────────────────────────────
    socket.on("e2ee:register-key", async ({ username, publicKey }) => {
      if (!username || !publicKey) return;
      await savePublicKey(username, publicKey);
      socket.emit("e2ee:key-registered", { ok: true });
    });

    socket.on("e2ee:get-key", async ({ username, forUser }) => {
      if (!username || !forUser) return;
      const key = await getPublicKey(forUser);
      socket.emit("e2ee:public-key", { username: forUser, publicKey: key });
    });

    // ── Screen Sharing Signaling ──────────────────────────────
    socket.on("webrtc:screen-share-start", ({ targetUser, sender }) => {
      getSocketIdsForUser(targetUser).forEach(id =>
        io.to(id).emit("webrtc:screen-share-started", { sender })
      );
    });

    socket.on("webrtc:screen-share-stop", ({ targetUser, sender }) => {
      getSocketIdsForUser(targetUser).forEach(id =>
        io.to(id).emit("webrtc:screen-share-stopped", { sender })
      );
    });

    // ── Call Log: Clear ────────────────────────────────────────
    socket.on("calls:clear", async ({ username }) => {
      if (!username) return;
      await clearCallLogsForUser(username);
      await emitCallHistory(io, username);
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on("disconnect", async () => {
      // Clean up any pending QR sessions for this socket
      await deleteQRSessionsBySocket(socket.id);

      const username = unbindSocketUser(socket.id);
      if (!username) return;

      io.to(GLOBAL_ROOM).emit("users:active", getActiveUsers());
      const directory = await getUserDirectory();
      io.to(GLOBAL_ROOM).emit("users:directory", directory);
      io.to(GLOBAL_ROOM).emit("user:status-update", { username, statusPreset: "offline" });
      io.to(GLOBAL_ROOM).emit("system:notice", {
        text: `${username} left the chat.`,
        time: new Date().toISOString()
      });
    });
  });

  // ── Scheduled message server-side cron (every 30s) ────────
  setInterval(async () => {
    try {
      const due = await getAndFirePendingScheduled();
      if (!due || due.length === 0) return;

      for (const s of due) {
        const payload = {
          id: `msg_sched_${s.id}_${Date.now()}`,
          sender: s.sender,
          receiver: s.receiver,
          text: s.text,
          type: s.type || "text",
          time: new Date().toISOString(),
          isDeleted: false
        };
        await createMessage(payload);

        // Deliver to both sender and receiver sockets
        const allTargetSockets = new Set([
          ...getSocketIdsForUser(s.sender),
          ...getSocketIdsForUser(s.receiver)
        ]);

        allTargetSockets.forEach(id => {
          if (global._ioInstance) {
            global._ioInstance.to(id).emit("message:new", payload);
          }
        });

        // Notify sender the scheduled message was sent
        getSocketIdsForUser(s.sender).forEach(id => {
          if (global._ioInstance) {
            global._ioInstance.to(id).emit("scheduled:fired", { id: s.id });
          }
        });
      }
    } catch (err) {
      console.error("Scheduled message cron error:", err);
    }
  }, 30000);
}

module.exports = {
  registerSocketHandlers,
  connectDB,
  GLOBAL_ROOM
};

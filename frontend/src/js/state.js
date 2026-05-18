export const state = {
  authMode: "login",
  currentUser: null,
  activeUsers: [],
  registeredUsers: [],
  groups: [],
  friends: [],
  friendRequests: [],
  stories: [],
  selectedContact: "",
  typingUser: "",
  messages: [],
  callLogs: [],
  systemNotices: []
};

export function setCurrentUser(u) { state.currentUser = u; }
export function setSelectedContact(c) { state.selectedContact = c || ""; }
export function setTypingUser(u = "") { state.typingUser = u; }
export function setActiveUsers(u) { state.activeUsers = Array.isArray(u) ? u : []; }
export function setRegisteredUsers(u) { state.registeredUsers = Array.isArray(u) ? u : []; }
export function setGroups(g) { state.groups = Array.isArray(g) ? g : []; }
export function setFriends(f) { state.friends = Array.isArray(f) ? f : []; }
export function setFriendRequests(r) { state.friendRequests = Array.isArray(r) ? r : []; }
export function setStories(s) { state.stories = Array.isArray(s) ? s : []; }

export function setMessages(messages) {
  state.messages = Array.isArray(messages) ? messages : [];
}

export function addMessage(message) {
  if (!message || !message.id) return;
  if (state.messages.some(m => m.id === message.id)) return;
  state.messages = [...state.messages, message];
}

export function markMessageDeleted(messageId) {
  state.messages = state.messages.map(m =>
    m.id === messageId ? { ...m, isDeleted: true, text: "" } : m
  );
}

export function patchMessageEdit(messageId, nextText, editedAt) {
  state.messages = state.messages.map(m =>
    m.id === messageId
      ? { ...m, text: nextText, editedAt: editedAt || new Date().toISOString() }
      : m
  );
}

export function patchReaction(messageId, reactions) {
  state.messages = state.messages.map(m =>
    m.id === messageId ? { ...m, reactions } : m
  );
}

export function patchMessageStatus(messageId, status) {
  state.messages = state.messages.map(m =>
    m.id === messageId ? { ...m, status } : m
  );
}

export function addSystemNotice(text, time) {
  state.systemNotices = [...state.systemNotices, { text, time }].slice(-40);
}

export function clearSystemNotices() { state.systemNotices = []; }

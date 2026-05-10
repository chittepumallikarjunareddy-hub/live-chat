export const state = {
  authMode: "login",
  currentUser: null,
  activeUsers: [],
  registeredUsers: [],
  selectedContact: "",
  typingUser: "",
  messages: [],
  systemNotices: []
};

export function setCurrentUser(username) {
  state.currentUser = username;
}

export function setMessages(messages) {
  state.messages = Array.isArray(messages) ? messages : [];
}

export function addMessage(message) {
  if (!message || !message.id) {
    return;
  }
  if (state.messages.some((entry) => entry.id === message.id)) {
    return;
  }
  state.messages = [...state.messages, message];
}

export function clearSystemNotices() {
  state.systemNotices = [];
}

export function addSystemNotice(text, time) {
  state.systemNotices = [...state.systemNotices, { text, time }].slice(-40);
}

export function markMessageDeleted(messageId) {
  state.messages = state.messages.map((message) =>
    message.id === messageId ? { ...message, isDeleted: true, text: "" } : message
  );
}

export function patchMessageEdit(messageId, nextText, editedAt) {
  state.messages = state.messages.map((message) =>
    message.id === messageId
      ? { ...message, text: nextText, editedAt: editedAt || new Date().toISOString() }
      : message
  );
}

export function setActiveUsers(users) {
  state.activeUsers = users;
}

export function setRegisteredUsers(users) {
  state.registeredUsers = Array.isArray(users) ? users : [];
}

export function setSelectedContact(contact) {
  state.selectedContact = contact || "";
}

export function setTypingUser(username = "") {
  state.typingUser = username;
}

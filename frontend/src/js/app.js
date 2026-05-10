import { createSocketClient } from "./socket.js";
import { login, signup, fetchUsers, clearThreadWithUser } from "./auth.js";
import {
  state,
  setCurrentUser,
  setMessages,
  addMessage,
  markMessageDeleted,
  patchMessageEdit,
  setActiveUsers,
  setRegisteredUsers,
  setSelectedContact,
  setTypingUser,
  clearSystemNotices
} from "./state.js";
import {
  renderAuthScreen,
  renderAppShell,
  setAuthModeUi,
  setAuthFeedback,
  renderMessages,
  renderContacts,
  pushSystemNotice,
  updateChatHeader,
  updateComposerAvailability,
  updateThreadActionButtons
} from "./ui.js";

const root = document.getElementById("app");
const socket = createSocketClient();
let typingStopTimer = null;
let contactSearchText = "";

function getSelectedContactOnlineState() {
  const selected = state.registeredUsers.find(
    (entry) => entry.username === state.selectedContact
  );
  return Boolean(selected?.online);
}

function ensureSelectedContact() {
  const visibleUsers = state.registeredUsers.filter(
    (entry) => entry.username !== state.currentUser
  );
  if (visibleUsers.length === 0) {
    setSelectedContact("");
    return;
  }
  const isCurrentSelectionValid = visibleUsers.some(
    (entry) => entry.username === state.selectedContact
  );
  if (!isCurrentSelectionValid) {
    setSelectedContact(visibleUsers[0].username);
  }
}

function sanitizeDirectory(directory) {
  if (!Array.isArray(directory)) {
    return [];
  }
  return directory.filter((entry) => entry && typeof entry.username === "string" && entry.username.trim());
}

// Returns the timestamp (ms) of the most recent message between currentUser and partner.
function getLastMessageTime(partnerUsername) {
  const msgs = state.messages.filter(
    (m) =>
      !m.isDeleted &&
      ((m.sender === state.currentUser && m.receiver === partnerUsername) ||
       (m.sender === partnerUsername && m.receiver === state.currentUser))
  );
  if (msgs.length === 0) return 0;
  return Math.max(...msgs.map((m) => new Date(m.time).getTime()));
}

// Returns the last non-deleted message text between currentUser and partner.
function getLastMessagePreview(partnerUsername) {
  const msgs = state.messages.filter(
    (m) =>
      !m.isDeleted &&
      ((m.sender === state.currentUser && m.receiver === partnerUsername) ||
       (m.sender === partnerUsername && m.receiver === state.currentUser))
  );
  if (msgs.length === 0) return "";
  const last = msgs[msgs.length - 1];
  const prefix = last.sender === state.currentUser ? "You: " : "";
  return prefix + (last.text.length > 40 ? last.text.slice(0, 40) + "…" : last.text);
}

function getUnreadCount(partnerUsername) {
  if (!state.currentUser || !partnerUsername) return 0;
  const lastReadTime = Number(localStorage.getItem(`sivionchat:read:${state.currentUser}:${partnerUsername}`)) || 0;
  return state.messages.filter(m => 
    !m.isDeleted &&
    m.sender === partnerUsername &&
    m.receiver === state.currentUser &&
    new Date(m.time).getTime() > lastReadTime
  ).length;
}

function markAsRead(partnerUsername) {
  if (!state.currentUser || !partnerUsername) return;
  localStorage.setItem(`sivionchat:read:${state.currentUser}:${partnerUsername}`, Date.now().toString());
}

function getVisibleContacts() {
  const rawQuery = contactSearchText.trim();
  const query = rawQuery.toLowerCase();
  // Guard: only work with entries that have a valid username string
  const validUsers = sanitizeDirectory(state.registeredUsers);
  const others = validUsers.filter((entry) => entry.username !== state.currentUser);

  let list = query
    ? validUsers.filter((entry) => entry.username.toLowerCase().includes(query))
    : [...validUsers];

  // Sort: contacts with recent messages first (desc by last message time),
  // then unread contacts above others, then alphabetical fallback.
  list.sort((a, b) => {
    const tA = getLastMessageTime(a.username);
    const tB = getLastMessageTime(b.username);
    if (tB !== tA) return tB - tA;  // most recent first
    return (a.username || "").localeCompare(b.username || "", undefined, { sensitivity: "base" });
  });

  const selected = state.selectedContact;
  if (
    selected &&
    selected !== state.currentUser &&
    query &&
    !list.some((entry) => entry.username === selected)
  ) {
    const pinned = validUsers.find((entry) => entry.username === selected);
    if (pinned) {
      list = [
        { ...pinned, _searchPinned: true },
        ...list.filter((entry) => entry.username !== selected)
      ];
    }
  }

  return { list, searchQuery: rawQuery, hasOtherUsers: others.length > 0 };
}

function renderContactSection() {
  const { list, searchQuery, hasOtherUsers } = getVisibleContacts();
  // Attach last-message preview, time, and unread count to each contact entry
  const enriched = list.map((entry) => {
    const timeMs = getLastMessageTime(entry.username);
    let timeStr = "";
    if (timeMs > 0) {
      const d = new Date(timeMs);
      const isToday = new Date().toDateString() === d.toDateString();
      timeStr = isToday
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return {
      ...entry,
      lastMessagePreview: getLastMessagePreview(entry.username),
      lastMessageTimeFormatted: timeStr,
      unread: getUnreadCount(entry.username)
    };
  });
  renderContacts(enriched, state.currentUser, state.selectedContact, searchQuery, hasOtherUsers);
}

function syncMobileChatVisibility() {
  const sidebar = document.getElementById("sidebar");
  const chatPanel = document.getElementById("chat-panel");
  const tabContacts = document.getElementById("tab-contacts");
  const tabChat = document.getElementById("tab-chat");
  if (!sidebar || !chatPanel || window.innerWidth >= 768) {
    return;
  }
  if (state.selectedContact) {
    sidebar.classList.add("hidden");
    chatPanel.classList.remove("hidden");
    tabContacts?.classList.remove("border-b-2", "border-sivion-emerald", "text-slate-100");
    tabContacts?.classList.add("text-slate-400");
    tabChat?.classList.add("border-b-2", "border-sivion-emerald", "text-slate-100");
    tabChat?.classList.remove("text-slate-400");
  } else {
    sidebar.classList.remove("hidden");
    chatPanel.classList.add("hidden");
    tabContacts?.classList.add("border-b-2", "border-sivion-emerald", "text-slate-100");
    tabContacts?.classList.remove("text-slate-400");
    tabChat?.classList.remove("border-b-2", "border-sivion-emerald", "text-slate-100");
    tabChat?.classList.add("text-slate-400");
  }
}

function createMessagePayload(text) {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sender: state.currentUser,
    receiver: state.selectedContact,
    text: text.trim(),
    time: new Date().toISOString(),
    isDeleted: false
  };
}

function hydrateAuth() {
  const raw = localStorage.getItem("sivionchat:user");
  if (!raw) {
    return;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized !== raw) {
    localStorage.setItem("sivionchat:user", normalized);
  }
  setCurrentUser(normalized);
}

function bootAuthScreen() {
  renderAuthScreen(root);
  setAuthModeUi(state.authMode);
  wireAuthEvents();
}

function wireAuthEvents() {
  const loginTab = document.getElementById("tab-login");
  const signupTab = document.getElementById("tab-signup");
  const authForm = document.getElementById("auth-form");

  loginTab.addEventListener("click", () => {
    state.authMode = "login";
    setAuthModeUi("login");
    setAuthFeedback("");
  });

  signupTab.addEventListener("click", () => {
    state.authMode = "signup";
    setAuthModeUi("signup");
    setAuthFeedback("");
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(authForm);
    const payload = {
      username: String(formData.get("username") || "").trim(),
      password: String(formData.get("password") || "")
    };

    if (!payload.username || !payload.password) {
      setAuthFeedback("Please fill in both fields.");
      return;
    }

    try {
      if (state.authMode === "signup") {
        const result = await signup(payload);
        if (!result.success) {
          setAuthFeedback(result.message || "Sign up failed.");
          return;
        }
        // Switch to login tab and show success message
        state.authMode = "login";
        setAuthModeUi("login");
        authForm.reset();
        setAuthFeedback("Successfully signed up. Now login.", false);
        return;
      }

      // Login flow
      const result = await login(payload);
      if (!result.success) {
        setAuthFeedback(result.message || "Authentication failed.");
        return;
      }

      setCurrentUser(result.user.username);
      localStorage.setItem("sivionchat:user", result.user.username);
      goToAppUrl();
      bootAppShell();
    } catch (error) {
      setAuthFeedback("Server error. Please try again.");
    }
  });
}

function normalizeAppPath() {
  return (window.location.pathname || "/").replace(/\/+$/, "") || "/";
}

function goToAppUrl() {
  if (normalizeAppPath() !== "/app") {
    history.replaceState(null, "", "/app");
  }
}

function goToLoginUrl() {
  if (normalizeAppPath() !== "/login") {
    history.replaceState(null, "", "/login");
  }
}

function bootAppShell() {
  goToAppUrl();
  renderAppShell(root, state.currentUser);
  registerSocketEvents();
  wireAppEvents();
  hydrateRegisteredUsers();
  updateChatHeader(
    state.selectedContact,
    state.typingUser,
    getSelectedContactOnlineState()
  );
  socket.emit("user:join", { username: state.currentUser });
  renderMessages(state.messages, state.currentUser, state.selectedContact);
  updateComposerAvailability(Boolean(state.selectedContact));
  updateThreadActionButtons(Boolean(state.selectedContact));
  syncMobileChatVisibility();
  window.addEventListener("resize", syncMobileChatVisibility);
}

async function hydrateRegisteredUsers() {
  try {
    const payload = await fetchUsers();
    if (!payload.success) {
      return;
    }
    const onlineSet = new Set(state.activeUsers);
    const raw = Array.isArray(payload.users) ? payload.users : [];
    const directory = raw
      .filter((user) => user && typeof user.username === "string" && user.username.trim())
      .map((user) => ({
        username: user.username.trim().toLowerCase(),
        online: onlineSet.has(user.username.trim().toLowerCase())
      }));
    setRegisteredUsers(directory);
    ensureSelectedContact();
    renderContactSection();
    updateChatHeader(
      state.selectedContact,
      state.typingUser,
      getSelectedContactOnlineState()
    );
    renderMessages(state.messages, state.currentUser, state.selectedContact);
    syncMobileChatVisibility();
  } catch (error) {
    // No-op fallback for offline API scenario.
    console.error("hydrateRegisteredUsers error:", error);
  }
}

function registerSocketEvents() {
  socket.off("chat:history");
  socket.off("message:new");
  socket.off("message:deleted");
  socket.off("message:edited");
  socket.off("users:active");
  socket.off("users:directory");
  socket.off("system:notice");
  socket.off("typing:update");

  socket.on("chat:history", (messages) => {
    clearSystemNotices();
    setMessages(messages);
    if (state.selectedContact) {
      markAsRead(state.selectedContact);
    }
    renderMessages(state.messages, state.currentUser, state.selectedContact);
    renderContactSection();
  });

  socket.on("message:new", (message) => {
    addMessage(message);
    if (message.sender === state.selectedContact || message.receiver === state.selectedContact) {
      markAsRead(state.selectedContact);
    }
    renderMessages(state.messages, state.currentUser, state.selectedContact);
    // Re-render contacts so the chat bubbles to the top and badges update
    renderContactSection();
  });

  socket.on("message:deleted", ({ id }) => {
    markMessageDeleted(id);
    renderMessages(state.messages, state.currentUser, state.selectedContact);
  });

  socket.on("message:edited", ({ id, text, editedAt }) => {
    patchMessageEdit(id, text, editedAt);
    renderMessages(state.messages, state.currentUser, state.selectedContact);
  });

  socket.on("users:active", (users) => {
    setActiveUsers(users);
    const onlineSet = new Set(users);
    const directory = sanitizeDirectory(state.registeredUsers).map((entry) => ({
      ...entry,
      online: onlineSet.has(entry.username)
    }));
    setRegisteredUsers(directory);
    ensureSelectedContact();
    renderContactSection();
    updateChatHeader(
      state.selectedContact,
      state.typingUser,
      getSelectedContactOnlineState()
    );
    renderMessages(state.messages, state.currentUser, state.selectedContact);
    syncMobileChatVisibility();
  });

  socket.on("users:directory", (directory) => {
    setRegisteredUsers(sanitizeDirectory(directory));
    ensureSelectedContact();
    renderContactSection();
    updateChatHeader(
      state.selectedContact,
      state.typingUser,
      getSelectedContactOnlineState()
    );
    renderMessages(state.messages, state.currentUser, state.selectedContact);
    syncMobileChatVisibility();
  });

  socket.on("system:notice", ({ text, time }) => {
    pushSystemNotice(text, time);
  });

  socket.on("typing:update", ({ username, isTyping }) => {
    setTypingUser(isTyping ? username : "");
    updateChatHeader(
      state.selectedContact,
      state.typingUser,
      getSelectedContactOnlineState()
    );
  });
}

function wireAppEvents() {
  const composerForm = document.getElementById("composer-form");
  const composerInput = document.getElementById("composer-input");
  const logoutBtn = document.getElementById("logout-btn");
  const headerLogoutBtn = document.getElementById("header-logout-btn");
  const navMenuBtn = document.getElementById("nav-menu-btn");
  const navMenuPanel = document.getElementById("nav-menu-panel");
  const navMenuWrap = document.getElementById("nav-menu-wrap");
  const navLogoutBtn = document.getElementById("nav-logout-btn");
  const headerClearThreadBtn = document.getElementById("header-clear-thread-btn");
  const profileMenuBtn = document.getElementById("profile-menu-btn");
  const profileMenuPanel = document.getElementById("profile-menu-panel");
  const profileMenuWrap = document.getElementById("profile-menu-wrap");
  const profileOpenAbout = document.getElementById("profile-open-about");
  const profileOpenPrivacy = document.getElementById("profile-open-privacy");
  const profileLogoutBtn = document.getElementById("profile-logout-btn");
  const aboutModal = document.getElementById("about-modal");
  const privacyModal = document.getElementById("privacy-modal");
  const closeAboutBtn = document.getElementById("close-about-btn");
  const closePrivacyBtn = document.getElementById("close-privacy-btn");
  const chatFeed = document.getElementById("chat-feed");
  const contactsList = document.getElementById("contacts-list");
  const contactSearch = document.getElementById("contact-search");
  const appMenuBtn = document.getElementById("app-menu-btn");
  const appMenuPanel = document.getElementById("app-menu-panel");
  const appMenuWrap = document.getElementById("app-menu-wrap");

  function closeAppMenu() {
    appMenuPanel?.classList.add("hidden");
  }

  function closeNavMenu() {
    navMenuPanel?.classList.add("hidden");
  }

  function closeProfileMenu() {
    profileMenuPanel?.classList.add("hidden");
  }

  function closeAllMenus() {
    closeAppMenu();
    closeNavMenu();
    closeProfileMenu();
  }

  function doLogout() {
    localStorage.removeItem("sivionchat:user");
    goToLoginUrl();
    window.location.reload();
  }

  async function handleClearThisChat() {
    closeAllMenus();
    const partner = state.selectedContact;
    if (!partner) {
      return;
    }
    if (
      !window.confirm(
        `Delete all messages in this chat with ${partner}? Other conversations are not affected.`
      )
    ) {
      return;
    }
    const result = await clearThreadWithUser(state.currentUser, partner);
    if (!result.success) {
      window.alert(result.message || "Could not clear this chat.");
      return;
    }
    clearSystemNotices();
    setMessages(
      state.messages.filter(
        (m) =>
          !(
            (m.sender === state.currentUser && m.receiver === partner) ||
            (m.sender === partner && m.receiver === state.currentUser)
          )
      )
    );
    renderMessages(state.messages, state.currentUser, state.selectedContact);
  }

  appMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeNavMenu();
    closeProfileMenu();
    appMenuPanel?.classList.toggle("hidden");
  });

  navMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAppMenu();
    closeProfileMenu();
    navMenuPanel?.classList.toggle("hidden");
  });

  navLogoutBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeNavMenu();
    doLogout();
  });

  headerClearThreadBtn?.addEventListener("click", async (event) => {
    event.stopPropagation();
    await handleClearThisChat();
  });

  profileMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAppMenu();
    closeNavMenu();
    profileMenuPanel?.classList.toggle("hidden");
  });

  profileOpenAbout?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeProfileMenu();
    aboutModal?.classList.remove("hidden");
  });

  profileOpenPrivacy?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeProfileMenu();
    privacyModal?.classList.remove("hidden");
  });

  closeAboutBtn?.addEventListener("click", () => {
    aboutModal?.classList.add("hidden");
  });

  closePrivacyBtn?.addEventListener("click", () => {
    privacyModal?.classList.add("hidden");
  });

  aboutModal?.addEventListener("click", (event) => {
    if (event.target === aboutModal) {
      aboutModal.classList.add("hidden");
    }
  });

  privacyModal?.addEventListener("click", (event) => {
    if (event.target === privacyModal) {
      privacyModal.classList.add("hidden");
    }
  });

  profileLogoutBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeProfileMenu();
    doLogout();
  });

  headerLogoutBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAppMenu();
    doLogout();
  });

  document.addEventListener("click", () => {
    closeAllMenus();
  });

  appMenuWrap?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  navMenuWrap?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  profileMenuWrap?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    closeAllMenus();
    aboutModal?.classList.add("hidden");
    privacyModal?.classList.add("hidden");
  });

  composerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.selectedContact) {
      return;
    }
    const text = composerInput.value.trim();
    if (!text) {
      return;
    }
    const payload = createMessagePayload(text);
    addMessage(payload);
    socket.emit("message:send", payload);
    socket.emit("typing:stop", { username: state.currentUser });
    composerInput.value = "";
    renderMessages(state.messages, state.currentUser, state.selectedContact);
  });

  composerInput.addEventListener("input", () => {
    socket.emit("typing:start", { username: state.currentUser });
    if (typingStopTimer) {
      clearTimeout(typingStopTimer);
    }
    typingStopTimer = setTimeout(() => {
      socket.emit("typing:stop", { username: state.currentUser });
    }, 900);
  });

  chatFeed.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const menuId = target.dataset.menuId;
    if (menuId) {
      document.querySelectorAll("[data-menu-panel]").forEach((panel) => {
        if (!(panel instanceof HTMLElement)) {
          return;
        }
        if (panel.dataset.menuPanel === menuId) {
          panel.classList.toggle("hidden");
        } else {
          panel.classList.add("hidden");
        }
      });
      return;
    }

    const editId = target.dataset.editId;
    if (editId) {
      const original = state.messages.find((message) => message.id === editId);
      if (!original || original.sender !== state.currentUser || original.isDeleted) {
        return;
      }
      const nextText = window.prompt("Edit your message:", original.text);
      if (!nextText || !nextText.trim()) {
        return;
      }
      socket.emit("message:edit", {
        id: editId,
        text: nextText.trim(),
        editedBy: state.currentUser
      });
      return;
    }

    const messageId = target.dataset.deleteId;
    if (!messageId) {
      document.querySelectorAll("[data-menu-panel]").forEach((panel) => {
        if (panel instanceof HTMLElement) {
          panel.classList.add("hidden");
        }
      });
      return;
    }
    socket.emit("message:delete", {
      id: messageId,
      deletedBy: state.currentUser
    });
  });

  logoutBtn?.addEventListener("click", doLogout);

  contactsList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const item = target.closest(".contact-item");
    if (!(item instanceof HTMLElement)) {
      return;
    }
    const nextContact = item.dataset.contact || "";
    if (nextContact === state.currentUser) {
      return;
    }
    setSelectedContact(nextContact);
    markAsRead(nextContact);
    renderContactSection();
    updateChatHeader(
      state.selectedContact,
      state.typingUser,
      getSelectedContactOnlineState()
    );
    renderMessages(state.messages, state.currentUser, state.selectedContact);
    syncMobileChatVisibility();
  });

  contactSearch?.addEventListener("input", () => {
    contactSearchText = contactSearch.value || "";
    renderContactSection();
  });

  contactSearch?.addEventListener("search", () => {
    contactSearchText = contactSearch.value || "";
    renderContactSection();
  });
}

hydrateAuth();
if (!state.currentUser) {
  goToLoginUrl();
  bootAuthScreen();
} else {
  goToAppUrl();
  bootAppShell();
}

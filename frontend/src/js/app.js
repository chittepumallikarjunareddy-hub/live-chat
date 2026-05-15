import { state, setCurrentUser, addMessage, setSelectedContact, setTypingUser } from "./state.js";
import { renderAuthScreen, renderAppShell, renderContacts, renderMessages, setAuthModeUi, setAuthFeedback, showToast } from "./ui.js";
import { initSocket } from "./socket.js";
import { formatTimeHHMM } from "../utils/time.js";
import { applyTheme } from "./themes.js";
import { isRecording, startRecording, stopRecording } from "./voiceRecorder.js";
import { 
  initWebRTCUI, 
  startCall, 
  handleIncomingCall, 
  handleCallAccepted, 
  handleCallDeclined, 
  handleOffer, 
  handleAnswer, 
  handleIceCandidate, 
  handleCallEnded 
} from "./webrtc.js";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app");
  renderAuthScreen(root);
  wireAuthEvents();
});

function wireAuthEvents() {
  const authForm = document.getElementById("auth-form");
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");

  tabLogin?.addEventListener("click", () => {
    state.authMode = "login";
    setAuthModeUi("login");
  });

  tabSignup?.addEventListener("click", () => {
    state.authMode = "signup";
    setAuthModeUi("signup");
  });

  authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(authForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const endpoint = state.authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (result.success) {
        const username = result.user?.username || result.username;
        localStorage.setItem("sivionchat:user", username);
        initApp(username);
      } else {
        setAuthFeedback(result.message || "Authentication failed");
      }
    } catch (err) {
      setAuthFeedback("Connection error");
    }
  });

  const qrLoginBtn = document.getElementById("qr-login-btn");
  let qrSocket = null;
  let qrExpiryInterval = null;

  qrLoginBtn?.addEventListener("click", () => {
    initQRLoginFlow();
  });

  // Gmail Login Logic
  const gmailBtn = document.getElementById("gmail-login-btn");
  const gmailModal = document.getElementById("gmail-login-modal");
  const closeGmailModal = document.getElementById("close-gmail-modal");
  const gmailSubmit = document.getElementById("gmail-submit-btn");
  const gmailInput = document.getElementById("gmail-input");
  const gmailFeedback = document.getElementById("gmail-feedback");

  gmailBtn?.addEventListener("click", () => {
    gmailModal?.classList.remove("hidden");
    if(gmailInput) gmailInput.value = "";
    if(gmailFeedback) gmailFeedback.classList.add("hidden");
  });

  closeGmailModal?.addEventListener("click", () => {
    gmailModal?.classList.add("hidden");
  });

  gmailSubmit?.addEventListener("click", () => {
    const email = gmailInput?.value.trim() || "";
    if (email && email.toLowerCase().endsWith("@gmail.com")) {
      // Simulate OAuth success
      const username = email.split("@")[0];
      localStorage.setItem("sivionchat:user", username);
      gmailModal?.classList.add("hidden");
      initApp(username);
    } else {
      if(gmailFeedback) {
        gmailFeedback.textContent = "Please enter a valid @gmail.com address.";
        gmailFeedback.classList.remove("hidden");
      }
    }
  });

  // Allow enter key in gmail input
  gmailInput?.addEventListener("keypress", (e) => {
    if(e.key === "Enter") {
      gmailSubmit?.click();
    }
  });

  function initQRLoginFlow() {
    const modal = document.getElementById("qr-login-modal");
    const closeBtn = document.getElementById("close-qr-modal");
    const refreshBtn = document.getElementById("refresh-qr-btn");
    const qrImg = document.getElementById("qr-image");
    const loading = document.getElementById("qr-loading");
    const expiredOverlay = document.getElementById("qr-overlay-expired");
    const statusText = document.getElementById("qr-status-text");
    const expiryText = document.getElementById("qr-expiry-text");

    modal?.classList.remove("hidden");

    if (!qrSocket) {
      qrSocket = window.io(); // io() is globally available
      
      qrSocket.on("qr:token", async ({ token, expiresAt }) => {
        try {
          const res = await fetch(`/api/qr-image/${token}`);
          const { dataUrl } = await res.json();
          if (dataUrl) {
            qrImg.src = dataUrl;
            qrImg.classList.remove("opacity-0");
            qrImg.classList.add("opacity-100");
            loading.classList.add("hidden");
            expiredOverlay.classList.add("hidden");
            startExpiryCountdown(expiresAt);
          }
        } catch (err) {
          console.error("QR Fetch error:", err);
        }
      });

      qrSocket.on("qr:status", ({ status, username, token }) => {
        if (status === "waiting" || status === "pending") {
          statusText.textContent = "Waiting for scan...";
          statusText.classList.add("animate-pulse");
          statusText.classList.remove("text-amber-400");
          statusText.classList.add("text-sivion-emerald");
        } else if (status === "scanned") {
          statusText.textContent = "QR Scanned! Authorizing...";
          statusText.classList.remove("text-sivion-emerald");
          statusText.classList.add("text-amber-400");
        } else if (status === "connected" && username && token) {
          statusText.textContent = "Authenticated! Logging in...";
          statusText.classList.remove("animate-pulse");
          statusText.classList.remove("text-amber-400");
          statusText.classList.add("text-sivion-emerald");
          
          localStorage.setItem("sivionchat:user", username);
          localStorage.setItem("sivionchat:token", token);
          
          setTimeout(() => {
            modal.classList.add("hidden");
            cleanupQR();
            initApp(username);
          }, 800);
        } else if (status === "expired") {
          expiredOverlay.classList.remove("hidden");
          statusText.textContent = "QR Code Expired";
          statusText.classList.remove("animate-pulse");
          statusText.classList.add("text-rose-400");
          clearInterval(qrExpiryInterval);
        }
      });
    }

    qrSocket.emit("qr:request-token");

    const cleanupQR = () => {
      clearInterval(qrExpiryInterval);
      if (qrSocket) {
        qrSocket.disconnect();
        qrSocket = null;
      }
    };

    closeBtn?.addEventListener("click", () => {
      modal.classList.add("hidden");
      cleanupQR();
    }, { once: true });

    refreshBtn?.addEventListener("click", () => {
      loading.classList.remove("hidden");
      qrImg.classList.add("opacity-0");
      qrSocket.emit("qr:request-token");
    });

    function startExpiryCountdown(expiresAt) {
      clearInterval(qrExpiryInterval);
      const update = () => {
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        expiryText.textContent = `Expires in ${remaining}s`;
        if (remaining <= 0) {
          clearInterval(qrExpiryInterval);
        }
      };
      update();
      qrExpiryInterval = setInterval(update, 1000);
    }
  }
}

function initApp(username) {
  setCurrentUser(username);
  renderAppShell(document.getElementById("app"), username);
  const socket = initSocket(username);
  initWebRTCUI(socket);
  wireAppEvents(socket);
}

function wireAppEvents(socket) {
  const composerForm = document.getElementById("composer-form");
  const composerInput = document.getElementById("composer-input");
  const openSettingsBtn = document.getElementById("open-settings-btn");
  const settingsOverlay = document.getElementById("settings-overlay");
  const closeSettingsOverlayBtn = document.getElementById("close-settings-overlay-btn");
  const settingsBackBtn = document.getElementById("settings-back-btn");

  // --- Settings UI Logic ---
  openSettingsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (settingsOverlay) {
      settingsOverlay.classList.remove("hidden");
      setTimeout(() => {
        settingsOverlay.classList.remove("opacity-0");
        settingsOverlay.classList.add("opacity-100");
      }, 10);
      loadUserSettings();
    }
  });

  const closeSettings = () => {
    if (settingsOverlay) {
      settingsOverlay.classList.remove("opacity-100");
      settingsOverlay.classList.add("opacity-0");
      setTimeout(() => settingsOverlay.classList.add("hidden"), 300);
    }
  };

  closeSettingsOverlayBtn?.addEventListener("click", closeSettings);
  settingsBackBtn?.addEventListener("click", closeSettings);

  // --- WebRTC Socket Events ---
  socket.on("webrtc:call-incoming", ({ caller, type }) => {
    handleIncomingCall(socket, state.currentUser, caller, type);
  });
  
  socket.on("webrtc:call-accepted", ({ responder }) => {
    handleCallAccepted(socket, state.currentUser, responder);
  });
  
  socket.on("webrtc:call-declined", ({ reason }) => {
    handleCallDeclined(reason);
  });
  
  socket.on("webrtc:offer", ({ caller, offer }) => {
    handleOffer(socket, state.currentUser, caller, offer);
  });
  
  socket.on("webrtc:answer", ({ responder, answer }) => {
    handleAnswer(responder, answer);
  });
  
  socket.on("webrtc:ice-candidate", ({ sender, candidate }) => {
    handleIceCandidate(sender, candidate);
  });
  
  socket.on("webrtc:call-ended", () => {
    handleCallEnded();
  });

  // Logout Logic
  const handleLogout = () => {
    localStorage.removeItem("sivionchat:user");
    localStorage.removeItem("sivionchat:token");
    window.location.reload();
  };

  document.getElementById("nav-logout-btn")?.addEventListener("click", handleLogout);
  document.getElementById("settings-logout-btn")?.addEventListener("click", handleLogout);

  // --- New Group Logic Setup ---
  const newGroupModal = document.getElementById("new-group-modal");
  const closeNewGroupModalBtn = document.getElementById("close-new-group-modal");
  const cancelGroupBtn = document.getElementById("cancel-group-btn");
  const createGroupSubmitBtn = document.getElementById("create-group-submit-btn");
  const groupMembersList = document.getElementById("group-members-list");
  const newGroupName = document.getElementById("new-group-name");
  const newGroupDesc = document.getElementById("new-group-desc");
  let selectedGroupMembers = new Set();

  const closeGroupModal = () => {
    const modal = document.getElementById("new-group-modal");
    modal?.classList.add("hidden");
    selectedGroupMembers.clear();
    const nameInput = document.getElementById("new-group-name");
    const descInput = document.getElementById("new-group-desc");
    if (nameInput) nameInput.value = "";
    if (descInput) descInput.value = "";
  };

  closeNewGroupModalBtn?.addEventListener("click", closeGroupModal);
  cancelGroupBtn?.addEventListener("click", closeGroupModal);

  createGroupSubmitBtn?.addEventListener("click", () => {
    const nameInput = document.getElementById("new-group-name");
    const descInput = document.getElementById("new-group-desc");
    const name = nameInput?.value.trim();
    if (!name) {
      showToast("Group name is required", "error");
      return;
    }
    if (selectedGroupMembers.size === 0) {
      showToast("Please select at least one friend to add to the group", "error");
      return;
    }
    
    socket.emit("group:create", {
      name: name,
      description: descInput?.value.trim() || "",
      members: Array.from(selectedGroupMembers),
      createdBy: state.currentUser
    });
    
    closeGroupModal();
    showToast("Creating group...", "success");
  });

  // Settings Section Toggling
  const navBtns = document.querySelectorAll(".settings-nav-btn");
  const sections = document.querySelectorAll(".settings-section");
  const contentArea = document.getElementById("settings-content-area");
  const navSidebar = document.getElementById("settings-nav-sidebar");

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");

      // Update active state
      navBtns.forEach(b => {
        b.classList.remove("active", "text-sivion-emerald", "bg-[#202c33]");
        b.classList.add("text-slate-300");
      });
      btn.classList.add("active", "text-sivion-emerald", "bg-[#202c33]");
      btn.classList.remove("text-slate-300");

      // Show section
      sections.forEach(sec => {
        if (sec.id === target) {
          sec.classList.remove("hidden");
          sec.classList.add("block");
        } else {
          sec.classList.add("hidden");
          sec.classList.remove("block");
        }
      });

      // Mobile transitions
      if (window.innerWidth < 768) {
        navSidebar?.classList.add("-translate-x-full");
        contentArea?.classList.remove("hidden");
        contentArea?.classList.add("flex");
      }
    });
  });

  const mobileBackBtn = document.getElementById("settings-mobile-back-btn");
  mobileBackBtn?.addEventListener("click", () => {
    navSidebar?.classList.remove("-translate-x-full");
    contentArea?.classList.add("hidden");
    contentArea?.classList.remove("flex");
  });

  // --- Sidebar Panel Toggling ---
  const navChats = document.getElementById("nav-chats-btn");
  const navFriends = document.getElementById("nav-friends-btn");
  const navCalls = document.getElementById("nav-calls-btn");
  const panelChats = document.getElementById("sidebar-panel-chats");
  const panelFriends = document.getElementById("sidebar-panel-friends");
  const panelCalls = document.getElementById("sidebar-panel-calls");

  const switchPanel = (panelId, btn) => {
    [panelChats, panelFriends, panelCalls].forEach(p => {
      if (p.id === panelId) {
        p.classList.remove("translate-x-full", "opacity-0", "pointer-events-none");
        p.classList.add("translate-x-0", "opacity-100");
      } else {
        p.classList.add("translate-x-full", "opacity-0", "pointer-events-none");
        p.classList.remove("translate-x-0", "opacity-100");
      }
    });
    document.querySelectorAll(".nav-rail-btn").forEach(b => {
      b.classList.remove("active", "text-sivion-emerald", "bg-white/5");
      b.classList.add("text-slate-400");
    });
    btn.classList.add("active", "text-sivion-emerald", "bg-white/5");
    btn.classList.remove("text-slate-400");
  };

  navChats?.addEventListener("click", () => switchPanel("sidebar-panel-chats", navChats));
  navFriends?.addEventListener("click", () => switchPanel("sidebar-panel-friends", navFriends));
  navCalls?.addEventListener("click", () => switchPanel("sidebar-panel-calls", navCalls));

  // --- Messaging ---
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("#composer-form");
    if (!form) return;
    e.preventDefault();
    
    const composerInput = document.getElementById("composer-input");
    if (!composerInput) return;
    
    const text = composerInput.value.trim();
    if (!text || !state.selectedContact) return;

    const payload = {
      id: Date.now().toString(),
      sender: state.currentUser,
      receiver: state.selectedContact,
      text,
      type: "text",
      timestamp: new Date().toISOString()
    };

    socket.emit("message:send", payload);
    addMessage(payload);
    renderMessages(state.messages, state.currentUser, state.selectedContact);
    
    composerInput.value = "";
    composerInput.style.height = "auto";
    
    const sendBtn = document.getElementById("send-btn");
    const voiceBtn = document.getElementById("voice-record-btn");
    if (sendBtn && voiceBtn) {
      sendBtn.classList.add("hidden");
      voiceBtn.classList.remove("hidden");
    }
  });

  document.addEventListener("keydown", (e) => {
    const input = e.target.closest("#composer-input");
    if (!input) return;
    
    // Auto-submit on Enter if no shift key is pressed
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("composer-form")?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  });

  document.addEventListener("input", (e) => {
    const input = e.target.closest("#composer-input");
    if (!input) return;
    
    // Auto resize
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 150) + "px";

    // Toggle send vs voice button
    const sendBtn = document.getElementById("send-btn");
    const voiceBtn = document.getElementById("voice-record-btn");
    if (sendBtn && voiceBtn) {
      if (input.value.trim().length > 0) {
        sendBtn.classList.remove("hidden");
        voiceBtn.classList.add("hidden");
      } else {
        sendBtn.classList.add("hidden");
        voiceBtn.classList.remove("hidden");
      }
    }
  });
  // --- Helpers ---
  function getCombinedContacts() {
    const friendsList = state.friends ? state.friends.map(f => typeof f === "string" ? f : f.username) : [];
    const messagedUsers = new Set();
    if (state.messages) {
       state.messages.forEach(m => {
          if (m.sender && m.sender !== state.currentUser) messagedUsers.add(m.sender);
          if (m.receiver && m.receiver !== state.currentUser) messagedUsers.add(m.receiver);
       });
    }

    const visibleUsers = (state.registeredUsers || []).filter(u => {
      return friendsList.includes(u.username) || messagedUsers.has(u.username);
    });

    const combined = [...visibleUsers];
    const groups = state.groups || [];
    groups.forEach(g => {
      combined.push({
        isGroup: true,
        id: g.id,
        username: g.name,
        description: g.description,
        members: g.members,
        avatar: g.avatar
      });
    });
    return combined;
  }

  // --- Socket Events ---
  socket.on("users:directory", (users) => {
    state.registeredUsers = users;
    renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
  });

  socket.on("message:new", (msg) => {
    addMessage(msg);
    renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
    if (msg.sender === state.selectedContact || msg.receiver === state.selectedContact) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
  });

  socket.on("users:active", (users) => {
    state.activeUsers = users;
    renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
  });

  // Group Events
  socket.on("groups:directory", (groups) => {
    state.groups = groups || [];
    renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
  });

  socket.on("group:created", (group) => {
    if (group) {
      state.groups = [...(state.groups || []), group];
      renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
    }
  });

  socket.on("group:updated", (group) => {
    if (group) {
      state.groups = (state.groups || []).map(g => g.id === group.id ? group : g);
      renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
    }
  });

  socket.on("group:removed", (data) => {
    if (data && data.groupId) {
      state.groups = (state.groups || []).filter(g => g.id !== data.groupId);
      renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
      if (state.selectedContact === data.groupId) {
         setSelectedContact("");
         document.getElementById("chat-area").innerHTML = `<div class="flex-1 flex flex-col items-center justify-center opacity-50"><svg viewBox="0 0 24 24" width="80" height="80" fill="currentColor" class="mb-4 text-slate-500"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg><p class="text-xl font-medium text-slate-300 tracking-tight">Select a conversation</p></div>`;
      }
    }
  });

  // --- Settings Logic ---
  async function loadUserSettings() {
    try {
      const res = await fetch("/api/users/settings", {
        headers: { "x-acting-user": state.currentUser }
      });
      const data = await res.json();
      if (data.success && data.settings) {
        populateSettingsForm(data.settings);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }

  function populateSettingsForm(settings) {
    const keys = ["theme", "language", "bio", "phone", "email"];
    keys.forEach(k => {
      const el = document.getElementById(`setting-${k}`);
      if (el) el.value = settings[k] || "";
    });

    const boolKeys = ["autoLaunch", "readReceipts", "enterToSend"];
    boolKeys.forEach(k => {
      const el = document.getElementById(`setting-${k}`);
      if (el) el.checked = Boolean(settings[k]);
    });
  }

  // Handle section clicks via delegation to ensure contact list interaction works
  document.addEventListener("click", (e) => {
    // New Group Button
    const newGroupBtnClick = e.target.closest("#new-group-btn");
    if (newGroupBtnClick) {
      const modal = document.getElementById("new-group-modal");
      modal?.classList.remove("hidden");
      selectedGroupMembers.clear();
      const nameInput = document.getElementById("new-group-name");
      const descInput = document.getElementById("new-group-desc");
      if (nameInput) nameInput.value = "";
      if (descInput) descInput.value = "";
      
      const listEl = document.getElementById("group-members-list");
      if (listEl) {
        listEl.innerHTML = "";
        const friends = state.friends || [];
        if (friends.length === 0) {
           listEl.innerHTML = `<p class="text-sm text-slate-500 italic p-2 text-center">You have no friends to add.</p>`;
        } else {
          friends.forEach(f => {
            const fname = typeof f === "string" ? f : (f.username || "Unknown");
            const div = document.createElement("div");
            div.className = "flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition";
            div.innerHTML = `
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-sivion-emerald/20 text-sivion-emerald flex items-center justify-center font-bold">
                  ${fname.substring(0,2).toUpperCase()}
                </div>
                <span class="text-white font-medium">${fname}</span>
              </div>
              <div class="w-5 h-5 rounded border border-white/20 flex items-center justify-center member-checkbox pointer-events-none transition-colors"></div>
            `;
            div.addEventListener("click", () => {
              const checkbox = div.querySelector('.member-checkbox');
              if (selectedGroupMembers.has(fname)) {
                selectedGroupMembers.delete(fname);
                checkbox.classList.remove('bg-sivion-emerald', 'border-sivion-emerald');
                checkbox.innerHTML = '';
              } else {
                selectedGroupMembers.add(fname);
                checkbox.classList.add('bg-sivion-emerald', 'border-sivion-emerald');
                checkbox.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="#0b141a"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>';
              }
            });
            listEl.appendChild(div);
          });
        }
      }
      return;
    }

    // Call Buttons
    const voiceCallBtn = e.target.closest("#header-voice-call");
    if (voiceCallBtn) {
      if (state.selectedContact && !state.selectedContact.startsWith("group_")) {
        startCall(socket, state.currentUser, state.selectedContact, "audio");
      } else if (state.selectedContact) {
        showToast("Cannot call groups right now.", "error");
      }
      return;
    }

    const videoCallBtn = e.target.closest("#header-video-call");
    if (videoCallBtn) {
      if (state.selectedContact && !state.selectedContact.startsWith("group_")) {
        startCall(socket, state.currentUser, state.selectedContact, "video");
      } else if (state.selectedContact) {
        showToast("Cannot call groups right now.", "error");
      }
      return;
    }

    // Add Friend Overlay Buttons
    const addFriendBtn = e.target.closest("#add-friend-btn");
    if (addFriendBtn) {
      document.getElementById("add-friend-overlay")?.classList.remove("hidden");
      return;
    }

    const cancelAddFriendBtn = e.target.closest("#add-friend-cancel");
    if (cancelAddFriendBtn) {
      document.getElementById("add-friend-overlay")?.classList.add("hidden");
      const input = document.getElementById("add-friend-input");
      if(input) input.value = "";
      const fb = document.getElementById("add-friend-feedback");
      if(fb) fb.textContent = "";
      return;
    }

    const sendRequestBtn = e.target.closest("#add-friend-submit");
    if (sendRequestBtn) {
      const input = document.getElementById("add-friend-input");
      const fb = document.getElementById("add-friend-feedback");
      const username = input?.value.trim();
      if (!username) {
        if (fb) fb.textContent = "Enter a username";
        return;
      }
      socket.emit("friend:send", { from: state.currentUser, to: username });
      if(fb) fb.textContent = "Sending request...";
      return;
    }

    // Friend Tabs
    const friendsTabs = ["friends-tab-all", "friends-tab-pending", "friends-tab-blocked"];
    const clickedTab = friendsTabs.find(t => e.target.closest(`#${t}`));
    if (clickedTab) {
      friendsTabs.forEach(t => {
        const btn = document.getElementById(t);
        if(!btn) return;
        btn.classList.remove("text-sivion-emerald", "border-b-2", "border-sivion-emerald", "active");
        btn.classList.add("text-slate-400");
        if(t === clickedTab) {
          btn.classList.add("text-sivion-emerald", "border-b-2", "border-sivion-emerald", "active");
          btn.classList.remove("text-slate-400");
        }
      });

      if (clickedTab === "friends-tab-all") renderFriendsList(state.friends || []);
      else if (clickedTab === "friends-tab-pending") renderPendingRequests(state.friendRequests || []);
      else if (clickedTab === "friends-tab-blocked") renderBlockedList();
      return;
    }

    const contactItem = e.target.closest(".contact-item");
    if (contactItem) {
      const username = contactItem.getAttribute("data-username");
      const displayName = contactItem.getAttribute("data-name") || username;
      const isGroup = contactItem.getAttribute("data-is-group") === "true";
      setSelectedContact(username);
      document.getElementById("chat-empty-state")?.classList.add("hidden");
      document.getElementById("chat-header")?.classList.remove("opacity-0", "translate-y-[-10px]");
      document.getElementById("chat-footer")?.classList.remove("opacity-0", "translate-y-[10px]");
      const nameEl = document.getElementById("chat-header-name");
      if(nameEl) nameEl.textContent = displayName;
      renderMessages(state.messages, state.currentUser, username);
      renderContacts(getCombinedContacts(), state.currentUser, username);
      return;
    }

    const acceptBtn = e.target.closest("[data-accept]");
    if (acceptBtn) {
      const fromUser = acceptBtn.getAttribute("data-accept");
      socket.emit("friend:accept", { from: fromUser, to: state.currentUser });
      if (state.friendRequests) {
        state.friendRequests = state.friendRequests.filter(r => (r.from || r.username || r) !== fromUser);
        renderPendingRequests(state.friendRequests);
      }
      return;
    }

    const declineBtn = e.target.closest("[data-decline]");
    if (declineBtn) {
      const fromUser = declineBtn.getAttribute("data-decline");
      socket.emit("friend:decline", { from: fromUser, to: state.currentUser });
      if (state.friendRequests) {
        state.friendRequests = state.friendRequests.filter(r => (r.from || r.username || r) !== fromUser);
        renderPendingRequests(state.friendRequests);
      }
      return;
    }
  });

  // --- Friends System UI ---
  const escapeHtml = (unsafe) => (unsafe || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  function renderFriendsList(friends) {
    const list = document.getElementById("friends-list");
    if (!list) return;
    if (!friends?.length) {
      list.innerHTML = `<li class="text-slate-500 text-sm text-center py-8">No friends yet. Add someone!</li>`;
      return;
    }
    list.innerHTML = friends.map(f => {
      const name = typeof f === "string" ? f : f.username;
      return `<li class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition cursor-pointer">
        <img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=00a884" class="w-10 h-10 rounded-full" />
        <span class="text-white font-medium text-sm">${escapeHtml(name)}</span>
      </li>`;
    }).join("");
  }

  function renderPendingRequests(requests) {
    const list = document.getElementById("friends-list");
    if (!list) return;
    if (!requests?.length) {
      list.innerHTML = `<li class="text-slate-500 text-sm text-center py-8">No pending requests</li>`;
      return;
    }
    list.innerHTML = requests.map(r => {
      const name = typeof r === "string" ? r : r.from || r.username;
      return `<li class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition">
        <img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=00a884" class="w-10 h-10 rounded-full" />
        <span class="text-white font-medium text-sm flex-1">${escapeHtml(name)}</span>
        <button class="px-3 py-1 rounded-lg bg-sivion-emerald text-sivion-dark text-xs font-bold hover:brightness-95 transition" data-accept="${escapeHtml(name)}">Accept</button>
        <button class="px-3 py-1 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 transition" data-decline="${escapeHtml(name)}">Decline</button>
      </li>`;
    }).join("");
  }

  function renderBlockedList() {
    const list = document.getElementById("friends-list");
    if (!list) return;
    const blocked = state.blockedUsers || [];
    if (!blocked.length) {
      list.innerHTML = `<li class="text-slate-500 text-sm text-center py-8">No blocked users</li>`;
      return;
    }
    list.innerHTML = blocked.map(u => {
      const name = typeof u === "string" ? u : u.username;
      return `<li class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition">
        <img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=64748b" class="w-10 h-10 rounded-full opacity-50" />
        <span class="text-slate-400 font-medium text-sm flex-1">${escapeHtml(name)}</span>
        <span class="text-xs text-rose-400 font-bold uppercase tracking-wider">Blocked</span>
      </li>`;
    }).join("");
  }

  // Event listeners for Add Friend have been moved to the delegated document click listener


  // Friends socket events
  socket.on("friends:directory", (friends) => {
    state.friends = friends;
    if(document.getElementById("friends-tab-all")?.classList.contains("active")) {
      renderFriendsList(friends);
    }
    // Update the main contacts list since friends have loaded
    renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
  });

  socket.on("friends:pending", (requests) => {
    state.friendRequests = requests;
    const badge = document.getElementById("pending-badge");
    if (badge) {
      const count = requests?.length || 0;
      badge.textContent = count;
      badge.classList.toggle("hidden", count === 0);
    }
    if(document.getElementById("friends-tab-pending")?.classList.contains("active")) {
      renderPendingRequests(requests);
    }
  });

  socket.on("friend:send-result", (result) => {
    const fb = document.getElementById("add-friend-feedback");
    const input = document.getElementById("add-friend-input");
    if (result.ok) {
      showToast(`Friend request sent to ${result.to}`, "success");
      document.getElementById("add-friend-overlay")?.classList.add("hidden");
      if (input) input.value = "";
      if (fb) fb.textContent = "";
    } else {
      if (fb) fb.textContent = result.reason || "Could not send request";
    }
  });

  socket.on("friend:request-received", (data) => {
    showToast(`${data.from} sent you a friend request`, "info");
    if (!state.friendRequests) state.friendRequests = [];
    state.friendRequests.push(data);
    const badge = document.getElementById("pending-badge");
    if (badge) {
      const count = state.friendRequests.length;
      badge.textContent = count;
      badge.classList.toggle("hidden", count === 0);
    }
    if(document.getElementById("friends-tab-pending")?.classList.contains("active")) {
      renderPendingRequests(state.friendRequests);
    }
  });

  socket.on("friend:accepted", (data) => {
    showToast(`You and ${data.friend} are now friends`, "success");
    if (!state.friends) state.friends = [];
    if (!state.friends.find(f => (f.username || f) === data.friend)) {
      state.friends.push({ username: data.friend, online: data.online });
    }
    if(document.getElementById("friends-tab-all")?.classList.contains("active")) {
      renderFriendsList(state.friends);
    }
    // Update contacts list so the new friend appears
    renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact);
    
    if (state.friendRequests) {
      state.friendRequests = state.friendRequests.filter(r => (r.from || r.username || r) !== data.friend);
      if(document.getElementById("friends-tab-pending")?.classList.contains("active")) {
        renderPendingRequests(state.friendRequests);
      }
      const badge = document.getElementById("pending-badge");
      if (badge) {
        const count = state.friendRequests.length;
        badge.textContent = count;
        badge.classList.toggle("hidden", count === 0);
      }
    }
  });

  socket.on("friend:decline-result", (data) => {
    if (data.ok) {
      showToast(`Declined request from ${data.from}`, "info");
      if (state.friendRequests) {
        state.friendRequests = state.friendRequests.filter(r => (r.from || r.username || r) !== data.from);
        if(document.getElementById("friends-tab-pending")?.classList.contains("active")) {
          renderPendingRequests(state.friendRequests);
        }
        const badge = document.getElementById("pending-badge");
        if (badge) {
          const count = state.friendRequests.length;
          badge.textContent = count;
          badge.classList.toggle("hidden", count === 0);
        }
      }
    }
  });
}

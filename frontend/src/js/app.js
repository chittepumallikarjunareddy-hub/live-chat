import { state, setCurrentUser, addMessage, setMessages, setSelectedContact, setTypingUser, patchMessageStatus, markMessageDeleted, patchMessageEdit, patchReaction } from "./state.js";
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

  let settingsQRCleanup = null;

  const closeSettings = () => {
    settingsQRCleanup?.();
    if (settingsOverlay) {
      settingsOverlay.classList.remove("opacity-100");
      settingsOverlay.classList.add("opacity-0");
      setTimeout(() => settingsOverlay.classList.add("hidden"), 300);
    }
  };

  closeSettingsOverlayBtn?.addEventListener("click", closeSettings);
  settingsBackBtn?.addEventListener("click", closeSettings);

  // ── Mobile panel switching ─────────────────────────────────────────────────
  const tabContactsBtn = document.getElementById("tab-contacts");
  const tabChatBtn = document.getElementById("tab-chat");
  const mobileBackBtnEl = document.getElementById("mobile-back-btn");
  const navMenuBtn = document.getElementById("nav-menu-btn");
  const navMenuPanel = document.getElementById("nav-menu-panel");

  function setMobileTab(active) {
    if (window.innerWidth >= 768) return;
    const sidebarEl = document.getElementById("sidebar");
    const chatPanelEl = document.getElementById("chat-panel");
    const isChat = active === "chat";
    if (isChat) {
      sidebarEl?.classList.add("hidden");
      chatPanelEl?.classList.remove("hidden");
      chatPanelEl?.classList.add("flex");
    } else {
      chatPanelEl?.classList.add("hidden");
      chatPanelEl?.classList.remove("flex");
      sidebarEl?.classList.remove("hidden");
    }
    if (tabContactsBtn) {
      tabContactsBtn.classList.toggle("text-slate-100", !isChat);
      tabContactsBtn.classList.toggle("border-b-2", !isChat);
      tabContactsBtn.classList.toggle("border-[#00a884]", !isChat);
      tabContactsBtn.classList.toggle("text-slate-400", isChat);
    }
    if (tabChatBtn) {
      tabChatBtn.classList.toggle("text-slate-100", isChat);
      tabChatBtn.classList.toggle("border-b-2", isChat);
      tabChatBtn.classList.toggle("border-[#00a884]", isChat);
      tabChatBtn.classList.toggle("text-slate-400", !isChat);
    }
  }

  tabContactsBtn?.addEventListener("click", () => setMobileTab("contacts"));
  tabChatBtn?.addEventListener("click", () => setMobileTab("chat"));
  mobileBackBtnEl?.addEventListener("click", () => setMobileTab("contacts"));

  navMenuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    navMenuPanel?.classList.toggle("hidden");
  });

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

  // --- Notification Bell ---
  if (!state.notifications) state.notifications = [];

  function openNotifPanel() {
    const panel = document.getElementById("notif-panel");
    const backdrop = document.getElementById("notif-backdrop");
    panel?.classList.remove("hidden");
    backdrop?.classList.remove("hidden");
    renderNotifList();
    // Mark as read: clear the badge dot
    const badge = document.getElementById("notif-badge");
    if (badge) badge.classList.add("hidden");
  }

  function closeNotifPanel() {
    document.getElementById("notif-panel")?.classList.add("hidden");
    document.getElementById("notif-backdrop")?.classList.add("hidden");
  }

  function pushNotification(notif) {
    // notif: { type, title, body, contact, time }
    if (!state.notifications) state.notifications = [];
    state.notifications.unshift({ ...notif, time: notif.time || new Date().toISOString(), id: Date.now() });
    if (state.notifications.length > 50) state.notifications = state.notifications.slice(0, 50);
    // Show badge
    const badge = document.getElementById("notif-badge");
    if (badge) badge.classList.remove("hidden");
    // Re-render if panel is open
    if (!document.getElementById("notif-panel")?.classList.contains("hidden")) {
      renderNotifList();
    }
  }

  function playNotificationSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      [880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, t + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, t + i * 0.12 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.15);
        osc.start(t + i * 0.12);
        osc.stop(t + i * 0.12 + 0.15);
      });
    } catch { /* audio not available */ }
  }

  function renderNotifList() {
    const list = document.getElementById("notif-list");
    const countLabel = document.getElementById("notif-count-label");
    const clearBtn = document.getElementById("notif-clear-all-btn");
    if (!list) return;
    const notifs = state.notifications || [];
    if (countLabel) countLabel.textContent = notifs.length ? `${notifs.length} notification${notifs.length > 1 ? "s" : ""}` : "No new notifications";
    if (clearBtn) clearBtn.classList.toggle("hidden", notifs.length === 0);
    if (notifs.length === 0) {
      list.innerHTML = `<li class="px-4 py-10 text-center text-slate-600 text-[13px]">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" class="mx-auto mb-3 opacity-40"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
        All caught up!
      </li>`;
      return;
    }
    list.innerHTML = notifs.map(n => {
      const iconMap = {
        message: { bg: "bg-[#00a884]/15", color: "text-[#00a884]", svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>` },
        friend_request: { bg: "bg-blue-500/15", color: "text-blue-400", svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>` },
        friend_accepted: { bg: "bg-emerald-500/15", color: "text-emerald-400", svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>` },
        group: { bg: "bg-violet-500/15", color: "text-violet-400", svg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>` },
      };
      const icon = iconMap[n.type] || iconMap.message;
      const timeStr = n.time ? new Date(n.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
      return `<li class="notif-item flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition cursor-pointer border-b border-white/[0.04] last:border-0" data-contact="${n.contact || ""}">
        <div class="w-9 h-9 rounded-2xl ${icon.bg} ${icon.color} flex items-center justify-center shrink-0 mt-0.5">${icon.svg}</div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-semibold text-white leading-snug">${n.title || ""}</p>
          <p class="text-[12px] text-slate-500 truncate mt-0.5">${n.body || ""}</p>
        </div>
        <span class="text-[10px] text-slate-600 shrink-0 mt-1">${timeStr}</span>
      </li>`;
    }).join("");

    // Click on notification → open that chat
    list.querySelectorAll(".notif-item").forEach(item => {
      item.addEventListener("click", () => {
        const contact = item.getAttribute("data-contact");
        if (contact) {
          closeNotifPanel();
          // Simulate clicking on the contact
          const contactEl = document.querySelector(`.contact-item[data-username="${contact}"]`);
          if (contactEl) {
            contactEl.click();
          } else {
            setSelectedContact(contact);
            document.getElementById("chat-empty-state")?.classList.add("hidden");
            document.getElementById("chat-header")?.classList.remove("opacity-0", "translate-y-[-10px]");
            document.getElementById("chat-footer")?.classList.remove("opacity-0");
            const nameEl = document.getElementById("chat-header-name");
            if (nameEl) nameEl.textContent = contact;
            renderMessages(state.messages, state.currentUser, contact);
            setMobileTab("chat");
          }
        }
      });
    });
  }

  document.getElementById("notif-bell-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const panel = document.getElementById("notif-panel");
    if (panel?.classList.contains("hidden")) {
      openNotifPanel();
    } else {
      closeNotifPanel();
    }
  });

  document.getElementById("notif-close-btn")?.addEventListener("click", closeNotifPanel);
  document.getElementById("notif-backdrop")?.addEventListener("click", closeNotifPanel);
  document.getElementById("notif-clear-all-btn")?.addEventListener("click", () => {
    state.notifications = [];
    renderNotifList();
  });

  // --- Attachment System ---
  const attachBtn = document.getElementById("attachment-btn");
  const attachPanel = document.getElementById("attachment-menu-panel");

  function closeAttachMenu() {
    attachPanel?.classList.add("hidden");
  }

  attachBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    attachPanel?.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (attachPanel && !attachPanel.classList.contains("hidden")) {
      const wrap = attachBtn?.parentElement;
      if (wrap && !wrap.contains(e.target)) attachPanel.classList.add("hidden");
    }
  });

  function uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    return fetch("/api/upload", { method: "POST", body: fd })
      .then(r => { if (!r.ok) throw new Error("Upload failed"); return r.json(); });
  }

  function sendAttachmentMessage(payload) {
    if (!state.selectedContact) { showToast("Select a contact first", "error"); return; }
    const msg = {
      id: Date.now().toString(),
      sender: state.currentUser,
      receiver: state.selectedContact,
      timestamp: new Date().toISOString(),
      status: "sent",
      ...payload
    };
    socket.emit("message:send", msg);
    addMessage(msg);
    renderMessages(state.messages, state.currentUser, state.selectedContact);
  }

  // ── Document ──────────────────────────────────────────────────────────────
  document.getElementById("attach-doc-btn")?.addEventListener("click", () => {
    closeAttachMenu();
    document.getElementById("file-doc-input")?.click();
  });
  document.getElementById("file-doc-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast("Uploading document...", "info");
    try {
      const d = await uploadFile(file);
      sendAttachmentMessage({ type: "document", url: d.url, filename: d.filename, filesize: d.size, mimetype: d.mimetype });
      showToast("Document sent", "success");
    } catch { showToast("Upload failed", "error"); }
    e.target.value = "";
  });

  // ── Photos & Videos ───────────────────────────────────────────────────────
  document.getElementById("attach-photo-btn")?.addEventListener("click", () => {
    closeAttachMenu();
    document.getElementById("file-photo-input")?.click();
  });
  document.getElementById("file-photo-input")?.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    showToast(`Uploading ${files.length > 1 ? files.length + " files" : "file"}...`, "info");
    for (const file of files) {
      try {
        const d = await uploadFile(file);
        sendAttachmentMessage({ type: file.type.startsWith("video/") ? "video" : "image", url: d.url, filename: d.filename });
      } catch { showToast("Upload failed", "error"); }
    }
    e.target.value = "";
  });

  // ── Audio ─────────────────────────────────────────────────────────────────
  document.getElementById("attach-audio-btn")?.addEventListener("click", () => {
    closeAttachMenu();
    document.getElementById("file-audio-input")?.click();
  });
  document.getElementById("file-audio-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast("Uploading audio...", "info");
    try {
      const d = await uploadFile(file);
      sendAttachmentMessage({ type: "audio", url: d.url, filename: d.filename });
      showToast("Audio sent", "success");
    } catch { showToast("Upload failed", "error"); }
    e.target.value = "";
  });

  // ── Camera ────────────────────────────────────────────────────────────────
  let cameraStream = null;
  let capturedBlob = null;

  function openCameraModal() {
    const modal = document.getElementById("camera-modal");
    if (!modal) return;
    document.getElementById("camera-captured-preview")?.classList.add("hidden");
    document.getElementById("camera-controls-live")?.classList.remove("hidden");
    document.getElementById("camera-controls-captured")?.classList.add("hidden");
    capturedBlob = null;
    modal.classList.remove("hidden");
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
        cameraStream = stream;
        const preview = document.getElementById("camera-preview");
        if (preview) preview.srcObject = stream;
      })
      .catch(() => { showToast("Cannot access camera", "error"); modal.classList.add("hidden"); });
  }

  function closeCameraModal() {
    document.getElementById("camera-modal")?.classList.add("hidden");
    if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
    capturedBlob = null;
  }

  document.getElementById("attach-camera-btn")?.addEventListener("click", () => { closeAttachMenu(); openCameraModal(); });
  document.getElementById("camera-input-btn")?.addEventListener("click", () => { document.getElementById("file-photo-input")?.click(); });
  document.getElementById("close-camera-modal")?.addEventListener("click", closeCameraModal);
  document.getElementById("camera-cancel-btn")?.addEventListener("click", closeCameraModal);

  document.getElementById("camera-capture-btn")?.addEventListener("click", () => {
    const preview = document.getElementById("camera-preview");
    const canvas = document.getElementById("camera-canvas");
    const capturedImg = document.getElementById("camera-captured-img");
    if (!preview || !canvas) return;
    canvas.width = preview.videoWidth;
    canvas.height = preview.videoHeight;
    canvas.getContext("2d").drawImage(preview, 0, 0);
    canvas.toBlob(blob => {
      capturedBlob = blob;
      if (capturedImg) capturedImg.src = URL.createObjectURL(blob);
      document.getElementById("camera-captured-preview")?.classList.remove("hidden");
      document.getElementById("camera-controls-live")?.classList.add("hidden");
      document.getElementById("camera-controls-captured")?.classList.remove("hidden");
    }, "image/jpeg", 0.92);
  });

  document.getElementById("camera-retake-btn")?.addEventListener("click", () => {
    document.getElementById("camera-captured-preview")?.classList.add("hidden");
    document.getElementById("camera-controls-live")?.classList.remove("hidden");
    document.getElementById("camera-controls-captured")?.classList.add("hidden");
    capturedBlob = null;
  });

  document.getElementById("camera-send-btn")?.addEventListener("click", async () => {
    if (!capturedBlob) return;
    showToast("Sending photo...", "info");
    try {
      const d = await uploadFile(new File([capturedBlob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" }));
      sendAttachmentMessage({ type: "image", url: d.url });
      showToast("Photo sent", "success");
      closeCameraModal();
    } catch { showToast("Upload failed", "error"); }
  });

  // ── Contact Picker ────────────────────────────────────────────────────────
  let pickedContact = null;

  function renderContactPickerList(query) {
    const list = document.getElementById("contact-picker-list");
    if (!list) return;
    const friends = (state.friends || []).map(f => typeof f === "string" ? f : f.username);
    const filtered = query ? friends.filter(f => f.toLowerCase().includes(query.toLowerCase())) : friends;
    if (!filtered.length) {
      list.innerHTML = `<li class="text-center text-slate-600 text-[13px] py-4">No contacts found</li>`;
      return;
    }
    const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    list.innerHTML = filtered.map(name => `
      <li class="contact-pick-item flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition cursor-pointer border ${pickedContact === name ? "bg-[#00a884]/10 border-[#00a884]/20" : "border-transparent"}" data-name="${esc(name)}">
        <img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=00a884" class="w-9 h-9 rounded-full shrink-0" loading="lazy" />
        <span class="text-[13px] font-medium text-white flex-1">${esc(name)}</span>
        ${pickedContact === name ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="text-[#00a884] shrink-0"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>` : ""}
      </li>`).join("");
    list.querySelectorAll(".contact-pick-item").forEach(item => {
      item.addEventListener("click", () => {
        pickedContact = item.getAttribute("data-name");
        const btn = document.getElementById("contact-send-btn");
        if (btn) btn.disabled = false;
        renderContactPickerList(document.getElementById("contact-search-input")?.value || "");
      });
    });
  }

  document.getElementById("attach-contact-btn")?.addEventListener("click", () => {
    closeAttachMenu();
    pickedContact = null;
    const btn = document.getElementById("contact-send-btn");
    if (btn) btn.disabled = true;
    const si = document.getElementById("contact-search-input");
    if (si) si.value = "";
    document.getElementById("contact-modal")?.classList.remove("hidden");
    renderContactPickerList("");
  });
  document.getElementById("close-contact-modal")?.addEventListener("click", () => {
    document.getElementById("contact-modal")?.classList.add("hidden");
    pickedContact = null;
  });
  document.getElementById("contact-search-input")?.addEventListener("input", (e) => renderContactPickerList(e.target.value));
  document.getElementById("contact-send-btn")?.addEventListener("click", () => {
    if (!pickedContact) return;
    sendAttachmentMessage({ type: "contact", contactName: pickedContact });
    document.getElementById("contact-modal")?.classList.add("hidden");
    pickedContact = null;
    showToast("Contact shared", "success");
  });

  // ── Poll Creator ──────────────────────────────────────────────────────────
  document.getElementById("attach-poll-btn")?.addEventListener("click", () => {
    closeAttachMenu();
    const qi = document.getElementById("poll-question");
    const ol = document.getElementById("poll-options-list");
    if (qi) qi.value = "";
    if (ol) ol.innerHTML = [1, 2].map(n =>
      `<input type="text" placeholder="Option ${n}" class="poll-option-input w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none" />`
    ).join("");
    document.getElementById("poll-modal")?.classList.remove("hidden");
  });
  document.getElementById("close-poll-modal")?.addEventListener("click", () => document.getElementById("poll-modal")?.classList.add("hidden"));
  document.getElementById("poll-add-option-btn")?.addEventListener("click", () => {
    const list = document.getElementById("poll-options-list");
    if (!list) return;
    const count = list.querySelectorAll(".poll-option-input").length;
    if (count >= 4) { showToast("Maximum 4 options", "info"); return; }
    const inp = document.createElement("input");
    inp.type = "text";
    inp.placeholder = `Option ${count + 1}`;
    inp.className = "poll-option-input w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none";
    list.appendChild(inp);
  });
  document.getElementById("poll-send-btn")?.addEventListener("click", () => {
    const question = document.getElementById("poll-question")?.value.trim();
    const options = Array.from(document.querySelectorAll("#poll-options-list .poll-option-input")).map(i => i.value.trim()).filter(Boolean);
    if (!question) { showToast("Enter a question", "error"); return; }
    if (options.length < 2) { showToast("Add at least 2 options", "error"); return; }
    sendAttachmentMessage({ type: "poll", pollQuestion: question, pollOptions: options.map(text => ({ text, votes: 0 })) });
    document.getElementById("poll-modal")?.classList.add("hidden");
    showToast("Poll sent", "success");
  });

  // ── Event Creator ─────────────────────────────────────────────────────────
  document.getElementById("attach-event-btn")?.addEventListener("click", () => {
    closeAttachMenu();
    ["event-title", "event-location", "event-desc"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    document.getElementById("event-modal")?.classList.remove("hidden");
  });
  document.getElementById("close-event-modal")?.addEventListener("click", () => document.getElementById("event-modal")?.classList.add("hidden"));
  document.getElementById("event-send-btn")?.addEventListener("click", () => {
    const title = document.getElementById("event-title")?.value.trim();
    if (!title) { showToast("Enter event title", "error"); return; }
    sendAttachmentMessage({
      type: "event",
      eventTitle: title,
      eventDatetime: document.getElementById("event-datetime")?.value || null,
      eventLocation: document.getElementById("event-location")?.value.trim() || null
    });
    document.getElementById("event-modal")?.classList.add("hidden");
    showToast("Event shared", "success");
  });

  // ── Sticker Picker ────────────────────────────────────────────────────────
  document.getElementById("attach-sticker-btn")?.addEventListener("click", () => {
    closeAttachMenu();
    document.getElementById("sticker-modal")?.classList.remove("hidden");
  });
  document.getElementById("close-sticker-modal")?.addEventListener("click", () => document.getElementById("sticker-modal")?.classList.add("hidden"));
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".sticker-btn");
    if (!btn) return;
    sendAttachmentMessage({ type: "sticker", sticker: btn.getAttribute("data-sticker") });
    document.getElementById("sticker-modal")?.classList.add("hidden");
  });

  // ── Image Lightbox ────────────────────────────────────────────────────────
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".msg-image");
    if (img) {
      const lb = document.getElementById("img-lightbox");
      const lbImg = document.getElementById("img-lightbox-src");
      if (lb && lbImg) { lbImg.src = img.getAttribute("data-src") || img.src; lb.classList.remove("hidden"); }
      return;
    }
    if (e.target.closest("#img-lightbox-close") || e.target.id === "img-lightbox") {
      document.getElementById("img-lightbox")?.classList.add("hidden");
    }
  });

  // ── Message Actions (react · reply · forward · edit · delete) ────────────
  let activeReply = null;

  function closeAllPickers() {
    document.querySelectorAll(".msg-emoji-picker").forEach(p => p.classList.add("hidden"));
  }

  function setReplyState(reply) {
    activeReply = reply;
    let bar = document.getElementById("reply-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "reply-bar";
      const footer = document.getElementById("chat-footer");
      const inner = footer?.querySelector(".max-w-5xl");
      if (inner) footer.insertBefore(bar, inner);
      else footer?.prepend(bar);
    }
    bar.className = "flex items-center gap-3 px-4 py-2 bg-[#0f1c26] border-t border-white/[0.06] animate-slide-up";
    bar.innerHTML = `
      <div class="w-[3px] self-stretch rounded-full bg-[#00a884] shrink-0"></div>
      <div class="flex-1 min-w-0">
        <p class="text-[11px] font-bold text-[#00a884] truncate">${escapeHtml(reply.sender || "You")}</p>
        <p class="text-[12px] text-slate-400 truncate">${reply.type && reply.type !== "text" ? "📎 " + reply.type : escapeHtml(reply.text || "")}</p>
      </div>
      <button id="reply-bar-close" class="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition shrink-0">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    `;
    document.getElementById("reply-bar-close")?.addEventListener("click", clearReplyState);
    document.getElementById("composer-input")?.focus();
  }

  function clearReplyState() {
    activeReply = null;
    document.getElementById("reply-bar")?.remove();
  }

  function openForwardModal({ text, type, url }) {
    const existing = document.getElementById("msg-forward-modal");
    if (existing) existing.remove();
    const contacts = getCombinedContacts().filter(c => c.isGroup || c.username !== state.currentUser);
    const modal = document.createElement("div");
    modal.id = "msg-forward-modal";
    modal.className = "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in";
    modal.innerHTML = `
      <div class="w-full max-w-sm bg-[#0d1929] rounded-2xl border border-white/[0.1] shadow-2xl animate-scale-in overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 class="text-[15px] font-bold text-white">Forward to…</h3>
          <button id="fwd-close" class="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="max-h-60 overflow-y-auto sivion-scroll px-2 py-2" id="fwd-contacts-list">
          ${contacts.length ? contacts.map(c => {
            const label = escapeHtml(c.isGroup ? (c.name || c.username) : c.username);
            const val = escapeHtml(c.isGroup ? c.id : c.username);
            return `<label class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] cursor-pointer transition has-[:checked]:bg-[#00a884]/10">
              <input type="radio" name="fwd-contact" value="${val}" class="sr-only" />
              <div class="w-9 h-9 rounded-full overflow-hidden bg-[#1a2733] shrink-0">
                <img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(label)}&backgroundColor=00a884&fontFamily=Inter&fontSize=40" class="w-full h-full" />
              </div>
              <span class="text-[14px] font-medium text-white flex-1 truncate">${label}</span>
              <div class="fwd-radio-dot w-4 h-4 rounded-full border-2 border-slate-600 transition shrink-0"></div>
            </label>`;
          }).join("") : `<p class="px-4 py-6 text-xs text-slate-500 text-center">No contacts found.</p>`}
        </div>
        <div class="px-4 py-3 border-t border-white/[0.06]">
          <button id="fwd-send" class="w-full py-2.5 rounded-xl bg-[#00a884] text-[#0b141a] text-[14px] font-black hover:brightness-105 transition active:scale-95">Forward</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Highlight selected radio visually
    modal.querySelectorAll("input[name='fwd-contact']").forEach(r => {
      r.addEventListener("change", () => {
        modal.querySelectorAll(".fwd-radio-dot").forEach(d => {
          d.style.cssText = "";
          d.className = "fwd-radio-dot w-4 h-4 rounded-full border-2 border-slate-600 transition shrink-0";
        });
        const dot = r.closest("label")?.querySelector(".fwd-radio-dot");
        if (dot) dot.style.cssText = "background:#00a884;border-color:#00a884";
      });
    });

    modal.querySelector("#fwd-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (ev) => { if (ev.target === modal) modal.remove(); });

    modal.querySelector("#fwd-send").addEventListener("click", () => {
      const selected = modal.querySelector("input[name='fwd-contact']:checked")?.value;
      if (!selected) { showToast("Select a contact first", "error"); return; }
      const fwdMsg = {
        id: Date.now().toString(),
        sender: state.currentUser,
        receiver: selected,
        text: type === "text" ? text : "",
        type,
        ...(url ? { url, fileUrl: url } : {}),
        status: "sent",
        timestamp: new Date().toISOString()
      };
      socket.emit("message:send", fwdMsg);
      addMessage(fwdMsg);
      if (state.selectedContact === selected) {
        renderMessages(state.messages, state.currentUser, selected);
      }
      refreshContacts();
      modal.remove();
      showToast("Forwarded", "success");
    });
  }

  function showMobileActionSheet(msgEl) {
    const id = msgEl.getAttribute("data-id");
    const isMine = msgEl.getAttribute("data-mine") === "true";
    const type = msgEl.getAttribute("data-type") || "text";
    const text = decodeURIComponent(msgEl.getAttribute("data-text") || "");
    const sender = msgEl.getAttribute("data-sender") || "";
    const url = msgEl.getAttribute("data-url") || "";
    const existing = document.getElementById("msg-action-sheet");
    if (existing) existing.remove();
    const sheet = document.createElement("div");
    sheet.id = "msg-action-sheet";
    sheet.innerHTML = `
      <div id="msg-sheet-backdrop" class="fixed inset-0 bg-black/50 z-[150] animate-fade-in"></div>
      <div id="msg-sheet-panel" class="fixed bottom-0 left-0 right-0 z-[151] bg-[#0d1929] rounded-t-2xl border-t border-white/[0.08] shadow-2xl" style="padding-bottom:env(safe-area-inset-bottom,16px);transform:translateY(100%)">
        <div class="flex justify-center pt-3 pb-1"><div class="w-10 h-1 rounded-full bg-white/20"></div></div>
        <div class="px-5 py-2 border-b border-white/[0.06]">
          <p class="text-[12px] text-slate-400 truncate">${type === "text" ? escapeHtml(text) : "📎 " + type}</p>
        </div>
        <div class="flex items-center justify-around px-4 py-3 border-b border-white/[0.06]">
          ${["👍","❤️","😂","😮","😢","👏","🔥","😊"].map(em => `
            <button class="sheet-react-btn text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-transform" data-emoji="${em}">${em}</button>
          `).join("")}
        </div>
        <div class="py-1">
          <button class="sheet-reply-btn w-full flex items-center gap-4 px-5 py-3.5 text-[15px] font-medium text-white active:bg-white/[0.06] transition">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="text-slate-400 shrink-0"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg> Reply
          </button>
          <button class="sheet-fwd-btn w-full flex items-center gap-4 px-5 py-3.5 text-[15px] font-medium text-white active:bg-white/[0.06] transition">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="text-slate-400 shrink-0"><path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z"/></svg> Forward
          </button>
          ${isMine && (type === "text" || !type) ? `
          <button class="sheet-edit-btn w-full flex items-center gap-4 px-5 py-3.5 text-[15px] font-medium text-white active:bg-white/[0.06] transition">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 shrink-0"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit
          </button>` : ""}
          ${isMine ? `
          <button class="sheet-del-btn w-full flex items-center gap-4 px-5 py-3.5 text-[15px] font-medium text-rose-400 active:bg-rose-500/10 transition">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="shrink-0"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg> Delete
          </button>` : ""}
        </div>
      </div>
    `;
    document.body.appendChild(sheet);
    const panel = sheet.querySelector("#msg-sheet-panel");
    requestAnimationFrame(() => {
      panel.style.transition = "transform 0.28s cubic-bezier(.16,1,.3,1)";
      panel.style.transform = "translateY(0)";
    });
    const closeSheet = () => {
      panel.style.transform = "translateY(100%)";
      setTimeout(() => sheet.remove(), 300);
    };
    sheet.querySelector("#msg-sheet-backdrop").addEventListener("click", closeSheet);
    sheet.querySelectorAll(".sheet-react-btn").forEach(b => {
      b.addEventListener("click", () => {
        socket.emit("message:react", { messageId: id, emoji: b.getAttribute("data-emoji"), username: state.currentUser });
        closeSheet();
      });
    });
    sheet.querySelector(".sheet-reply-btn")?.addEventListener("click", () => { setReplyState({ id, sender, text, type }); closeSheet(); });
    sheet.querySelector(".sheet-fwd-btn")?.addEventListener("click", () => { openForwardModal({ text, type, url }); closeSheet(); });
    sheet.querySelector(".sheet-edit-btn")?.addEventListener("click", () => { openEditModal(id, text); closeSheet(); });
    sheet.querySelector(".sheet-del-btn")?.addEventListener("click", () => { socket.emit("message:delete", { id, deletedBy: state.currentUser }); closeSheet(); });
  }

  // Desktop click handler for all message actions
  document.addEventListener("click", (e) => {
    // React → toggle emoji picker
    const reactBtn = e.target.closest(".msg-react-btn");
    if (reactBtn) {
      e.stopPropagation();
      const picker = reactBtn.parentElement.querySelector(".msg-emoji-picker");
      const wasHidden = picker?.classList.contains("hidden");
      closeAllPickers();
      if (wasHidden) picker?.classList.remove("hidden");
      return;
    }
    // Reaction emoji chosen
    const reactionBtn = e.target.closest(".reaction-btn");
    if (reactionBtn) {
      e.stopPropagation();
      const id = reactionBtn.getAttribute("data-id");
      const emoji = reactionBtn.getAttribute("data-emoji");
      if (id && emoji) socket.emit("message:react", { messageId: id, emoji, username: state.currentUser });
      closeAllPickers();
      return;
    }
    // Reply
    const replyBtn = e.target.closest(".msg-reply-btn");
    if (replyBtn) {
      e.stopPropagation();
      closeAllPickers();
      setReplyState({
        id: replyBtn.getAttribute("data-id"),
        sender: replyBtn.getAttribute("data-sender") || "",
        text: decodeURIComponent(replyBtn.getAttribute("data-text") || ""),
        type: replyBtn.getAttribute("data-type") || "text"
      });
      return;
    }
    // Forward
    const fwdBtn = e.target.closest(".msg-forward-btn");
    if (fwdBtn) {
      e.stopPropagation();
      closeAllPickers();
      openForwardModal({
        text: decodeURIComponent(fwdBtn.getAttribute("data-text") || ""),
        type: fwdBtn.getAttribute("data-type") || "text",
        url: fwdBtn.getAttribute("data-url") || ""
      });
      return;
    }
    // Edit
    const editBtn = e.target.closest(".msg-edit-btn");
    if (editBtn) {
      e.stopPropagation();
      closeAllPickers();
      const id = editBtn.getAttribute("data-id");
      if (id) openEditModal(id, decodeURIComponent(editBtn.getAttribute("data-text") || ""));
      return;
    }
    // Delete
    const deleteBtn = e.target.closest(".msg-delete-btn");
    if (deleteBtn) {
      e.stopPropagation();
      closeAllPickers();
      const id = deleteBtn.getAttribute("data-id");
      if (id) socket.emit("message:delete", { id, deletedBy: state.currentUser });
      return;
    }
    // Reply-quote → scroll to original
    const quoteEl = e.target.closest(".reply-quote");
    if (quoteEl) {
      const targetId = quoteEl.getAttribute("data-scroll-to");
      if (targetId) {
        const orig = document.querySelector(`.long-press-target[data-id="${targetId}"]`);
        if (orig) {
          orig.scrollIntoView({ behavior: "smooth", block: "center" });
          orig.style.transition = "background 0.3s ease";
          orig.style.background = "rgba(0,168,132,0.12)";
          setTimeout(() => { orig.style.background = ""; }, 1400);
        }
      }
      return;
    }
    // Close pickers on outside click
    if (!e.target.closest(".msg-react-btn") && !e.target.closest(".msg-emoji-picker")) {
      closeAllPickers();
    }
  });

  // Mobile long-press on messages
  let lpTimer = null;
  const msgList = document.getElementById("messages-list");
  msgList?.addEventListener("touchstart", (e) => {
    const msgEl = e.target.closest(".long-press-target");
    if (!msgEl) return;
    lpTimer = setTimeout(() => {
      lpTimer = null;
      navigator.vibrate?.(40);
      showMobileActionSheet(msgEl);
    }, 480);
  }, { passive: true });
  msgList?.addEventListener("touchmove", () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }, { passive: true });
  msgList?.addEventListener("touchend", () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }, { passive: true });

  function openEditModal(messageId, currentText) {
    const existing = document.getElementById("msg-edit-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "msg-edit-modal";
    modal.className = "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in";
    modal.innerHTML = `
      <div class="w-full max-w-md bg-[#0d1929] rounded-2xl border border-white/[0.1] shadow-2xl p-5 animate-scale-in">
        <h3 class="text-[15px] font-bold text-white mb-3">Edit Message</h3>
        <textarea id="msg-edit-textarea" rows="3"
          class="w-full bg-[#1a2733] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:border-[#00a884]/50 sivion-scroll"
          style="min-height:80px">${currentText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
        <div class="flex gap-2 mt-3 justify-end">
          <button id="msg-edit-cancel" class="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition">Cancel</button>
          <button id="msg-edit-save" class="px-4 py-2 rounded-xl bg-[#00a884] text-[#0b141a] text-[13px] font-black hover:brightness-105 transition active:scale-95">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const textarea = modal.querySelector("#msg-edit-textarea");
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    modal.querySelector("#msg-edit-cancel").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector("#msg-edit-save").addEventListener("click", () => {
      const newText = textarea.value.trim();
      if (!newText) return;
      socket.emit("message:edit", { id: messageId, text: newText, editedBy: state.currentUser });
      modal.remove();
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        modal.querySelector("#msg-edit-save").click();
      }
      if (e.key === "Escape") modal.remove();
    });
  }

  // ── Poll Voting ───────────────────────────────────────────────────────────
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".poll-vote-btn");
    if (!btn) return;
    const msgId = btn.getAttribute("data-msg-id");
    const optIdx = parseInt(btn.getAttribute("data-opt-idx"), 10);
    const msg = state.messages.find(m => m.id === msgId);
    if (!msg?.pollOptions) return;
    if (!msg.votedBy) msg.votedBy = {};
    const prev = msg.votedBy[state.currentUser];
    if (prev === optIdx) return;
    if (prev !== undefined) msg.pollOptions[prev].votes = Math.max(0, (msg.pollOptions[prev].votes || 0) - 1);
    msg.votedBy[state.currentUser] = optIdx;
    msg.pollOptions[optIdx].votes = (msg.pollOptions[optIdx].votes || 0) + 1;
    socket.emit("poll:vote", { msgId, optIdx, voter: state.currentUser });
    renderMessages(state.messages, state.currentUser, state.selectedContact);
  });

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
      settingsQRCleanup?.();

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

      if (target === "settings-link-device") initSettingsQRFlow();
    });
  });

  const mobileBackBtn = document.getElementById("settings-mobile-back-btn");
  mobileBackBtn?.addEventListener("click", () => {
    navSidebar?.classList.remove("-translate-x-full");
    contentArea?.classList.add("hidden");
    contentArea?.classList.remove("flex");
  });

  function initSettingsQRFlow() {
    const qrImg = document.getElementById("settings-qr-image");
    const loadingEl = document.getElementById("settings-qr-loading");
    const expiredEl = document.getElementById("settings-qr-expired");
    const statusEl = document.getElementById("settings-qr-status");
    const expiryEl = document.getElementById("settings-qr-expiry");
    const refreshBtn = document.getElementById("settings-qr-refresh");

    let expiryInterval = null;

    const resetUI = () => {
      loadingEl?.classList.remove("hidden");
      loadingEl?.classList.add("flex");
      expiredEl?.classList.remove("flex");
      expiredEl?.classList.add("hidden");
      if (qrImg) { qrImg.src = ""; qrImg.classList.add("opacity-0"); qrImg.classList.remove("opacity-100"); }
      if (statusEl) { statusEl.textContent = "Generating QR code..."; statusEl.className = "text-sivion-emerald text-[13px] animate-pulse mb-1"; }
      if (expiryEl) expiryEl.textContent = "";
    };

    const onToken = async ({ token, expiresAt }) => {
      try {
        const res = await fetch(`/api/qr-image/${token}`);
        const { dataUrl } = await res.json();
        if (dataUrl && qrImg) {
          qrImg.src = dataUrl;
          qrImg.classList.remove("opacity-0");
          qrImg.classList.add("opacity-100");
          loadingEl?.classList.add("hidden");
          loadingEl?.classList.remove("flex");
          startCountdown(expiresAt);
        }
      } catch (e) { console.error("Settings QR fetch error:", e); }
    };

    const onStatus = ({ status }) => {
      if (status === "waiting" || status === "pending") {
        if (statusEl) { statusEl.textContent = "Waiting for scan..."; statusEl.className = "text-sivion-emerald text-[13px] animate-pulse mb-1"; }
      } else if (status === "scanned") {
        if (statusEl) { statusEl.textContent = "QR Scanned! Authorizing..."; statusEl.className = "text-amber-400 text-[13px] mb-1"; }
      } else if (status === "connected") {
        if (statusEl) { statusEl.textContent = "Device linked successfully!"; statusEl.className = "text-sivion-emerald text-[13px] font-bold mb-1"; }
        clearInterval(expiryInterval);
        if (expiryEl) expiryEl.textContent = "";
      } else if (status === "expired") {
        expiredEl?.classList.remove("hidden");
        expiredEl?.classList.add("flex");
        if (statusEl) { statusEl.textContent = "QR Code Expired"; statusEl.className = "text-rose-400 text-[13px] mb-1"; }
        clearInterval(expiryInterval);
        if (expiryEl) expiryEl.textContent = "";
      }
    };

    const startCountdown = (expiresAt) => {
      clearInterval(expiryInterval);
      const tick = () => {
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        if (expiryEl) expiryEl.textContent = `Expires in ${remaining}s`;
        if (remaining <= 0) clearInterval(expiryInterval);
      };
      tick();
      expiryInterval = setInterval(tick, 1000);
    };

    const handleRefresh = () => {
      resetUI();
      socket.emit("qr:request-token");
    };

    socket.on("qr:token", onToken);
    socket.on("qr:status", onStatus);
    refreshBtn?.addEventListener("click", handleRefresh);

    settingsQRCleanup = () => {
      socket.off("qr:token", onToken);
      socket.off("qr:status", onStatus);
      refreshBtn?.removeEventListener("click", handleRefresh);
      clearInterval(expiryInterval);
      settingsQRCleanup = null;
    };

    resetUI();
    socket.emit("qr:request-token");
  }

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
  const sendBtn = document.getElementById("send-btn");
  const voiceBtn = document.getElementById("voice-record-btn");

  function syncSendButton() {
    const hasText = (composerInput?.value.trim().length || 0) > 0;
    sendBtn?.classList.toggle("hidden", !hasText);
    voiceBtn?.classList.toggle("hidden", hasText);
  }

  function sendTextMessage() {
    const text = composerInput?.value.trim();
    if (!text || !state.selectedContact) return;
    const payload = {
      id: Date.now().toString(),
      sender: state.currentUser,
      receiver: state.selectedContact,
      text,
      type: "text",
      status: "sent",
      timestamp: new Date().toISOString()
    };
    socket.emit("message:send", payload);
    addMessage(payload);
    renderMessages(state.messages, state.currentUser, state.selectedContact);
    composerInput.value = "";
    composerInput.style.height = "auto";
    syncSendButton();
  }

  // Send button click / form submit
  composerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    sendTextMessage();
  });

  // Enter → send; Shift+Enter → newline (default textarea behavior)
  composerInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  });

  // Auto-resize + mic↔send toggle on every keystroke
  composerInput?.addEventListener("input", () => {
    composerInput.style.height = "auto";
    composerInput.style.height = Math.max(44, Math.min(composerInput.scrollHeight, 150)) + "px";
    syncSendButton();
  });
  // --- Helpers ---
  function getCombinedContacts() {
    const friendsList = state.friends ? state.friends.map(f => typeof f === "string" ? f : f.username) : [];
    const messagedUsers = new Set();
    const lastMsgMap = {};

    if (state.messages) {
      state.messages.forEach(m => {
        const isGroup = m.receiver?.startsWith("group_");
        const key = isGroup ? m.receiver : (m.sender === state.currentUser ? m.receiver : m.sender);
        if (!key) return;

        if (!isGroup) {
          if (m.sender && m.sender !== state.currentUser) messagedUsers.add(m.sender);
          if (m.receiver && m.receiver !== state.currentUser) messagedUsers.add(m.receiver);
        }

        const ts = m.timestamp ? new Date(m.timestamp).getTime() : 0;
        if (!lastMsgMap[key] || ts > lastMsgMap[key].ts) {
          lastMsgMap[key] = {
            ts,
            time: m.timestamp,
            preview: m.type === "text" ? (m.text || "") : `📎 ${m.type}`
          };
        }
      });
    }

    const visibleUsers = (state.registeredUsers || []).filter(u => {
      return friendsList.includes(u.username) || messagedUsers.has(u.username);
    });

    const unread = state.unreadCounts || {};
    const combined = visibleUsers.map(u => ({
      ...u,
      lastMessageTime: lastMsgMap[u.username]?.time || null,
      lastMessagePreview: lastMsgMap[u.username]?.preview || "",
      unread: unread[u.username] || 0
    }));

    const groups = state.groups || [];
    groups.forEach(g => {
      combined.push({
        isGroup: true,
        id: g.id,
        username: g.name,
        description: g.description,
        members: g.members,
        avatar: g.avatar,
        lastMessageTime: lastMsgMap[g.id]?.time || null,
        lastMessagePreview: lastMsgMap[g.id]?.preview || "",
        unread: unread[g.id] || 0
      });
    });

    combined.sort((a, b) =>
      (b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0) -
      (a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0)
    );

    return combined;
  }

  let contactFilter = "all";

  function refreshContacts() {
    renderContacts(getCombinedContacts(), state.currentUser, state.selectedContact, "", contactFilter);
    updateUnreadFilterBadge();
  }

  function updateUnreadFilterBadge() {
    const badge = document.getElementById("unread-filter-badge");
    if (!badge) return;
    const combined = getCombinedContacts();
    const unreadCount = combined.filter(e => (e.unread || 0) > 0).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  function wireFilterChips() {
    ["filter-all", "filter-unread", "filter-groups"].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", () => {
        contactFilter = btn.dataset.filter;
        ["filter-all", "filter-unread", "filter-groups"].forEach(bid => {
          const b = document.getElementById(bid);
          if (!b) return;
          const isActive = bid === id;
          b.className = isActive
            ? "px-3.5 py-1 rounded-full bg-[#00a884]/20 text-[#00a884] text-[12px] font-semibold whitespace-nowrap hover:bg-[#00a884]/30 transition shrink-0"
            : "px-3.5 py-1 rounded-full bg-white/[0.05] text-slate-400 text-[12px] font-semibold whitespace-nowrap hover:bg-white/[0.09] transition shrink-0";
        });
        refreshContacts();
      });
    });
  }

  wireFilterChips();

  // --- Socket Events ---
  socket.on("users:directory", (users) => {
    state.registeredUsers = users;
    refreshContacts();
  });

  socket.on("chat:history", (messages) => {
    setMessages(messages);
    // Seed unread counts from historical messages not yet read by current user
    const counts = {};
    messages.forEach(m => {
      if (m.sender === state.currentUser) return;
      const isRead = Array.isArray(m.readBy) && m.readBy.includes(state.currentUser);
      if (!isRead) {
        const key = m.receiver?.startsWith("group_") ? m.receiver : m.sender;
        if (key) counts[key] = (counts[key] || 0) + 1;
      }
    });
    state.unreadCounts = counts;
    refreshContacts();
    if (state.selectedContact) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
  });

  socket.on("message:new", (msg) => {
    addMessage(msg);
    // Increment unread count when message is from someone else and their chat isn't open
    if (msg.sender !== state.currentUser) {
      const chatKey = msg.receiver?.startsWith("group_") ? msg.receiver : msg.sender;
      if (chatKey !== state.selectedContact) {
        if (!state.unreadCounts) state.unreadCounts = {};
        state.unreadCounts[chatKey] = (state.unreadCounts[chatKey] || 0) + 1;
      }
    }
    refreshContacts();
    if (msg.sender === state.selectedContact || msg.receiver === state.selectedContact) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
    // Auto-read if this chat is currently open and message is from the contact
    if (msg.sender !== state.currentUser && msg.sender === state.selectedContact) {
      socket.emit("message:read", { chatId: msg.sender, username: state.currentUser });
    }
    // Notify only for messages from others, when that chat isn't currently open
    if (msg.sender !== state.currentUser && msg.sender !== state.selectedContact) {
      playNotificationSound();
      pushNotification({
        type: "message",
        title: msg.sender,
        body: msg.type === "text" ? (msg.text || "").slice(0, 60) : `Sent a ${msg.type}`,
        contact: msg.sender,
        time: msg.timestamp
      });
    }
  });

  socket.on("users:active", (users) => {
    state.activeUsers = users;
    refreshContacts();
  });

  socket.on("message:delivered", ({ messageId }) => {
    patchMessageStatus(messageId, "delivered");
    if (state.selectedContact) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
  });

  socket.on("message:delivered-bulk", ({ deliveredTo }) => {
    const toUpdate = state.messages.filter(m => m.receiver === deliveredTo && m.status === "sent");
    toUpdate.forEach(m => patchMessageStatus(m.id, "delivered"));
    if (toUpdate.length > 0 && state.selectedContact === deliveredTo) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
  });

  socket.on("message:read-update", ({ chatId, reader }) => {
    const toUpdate = state.messages.filter(m => m.receiver === reader && (m.status === "sent" || m.status === "delivered"));
    toUpdate.forEach(m => patchMessageStatus(m.id, "read"));
    if (toUpdate.length > 0 && (state.selectedContact === chatId || state.selectedContact === reader)) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
  });

  socket.on("message:deleted", ({ id }) => {
    markMessageDeleted(id);
    if (state.selectedContact) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
    refreshContacts();
  });

  socket.on("message:edited", ({ id, text, editedAt }) => {
    patchMessageEdit(id, text, editedAt);
    if (state.selectedContact) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
    refreshContacts();
  });

  socket.on("message:reaction-update", ({ messageId, reactions }) => {
    const reactionMap = {};
    (reactions || []).forEach(r => { if (r.users?.length) reactionMap[r.emoji] = r.users.length; });
    patchReaction(messageId, reactionMap);
    if (state.selectedContact) {
      renderMessages(state.messages, state.currentUser, state.selectedContact);
    }
  });

  // Group Events
  socket.on("groups:directory", (groups) => {
    state.groups = groups || [];
    refreshContacts();
  });

  socket.on("group:created", (group) => {
    if (group) {
      state.groups = [...(state.groups || []), group];
      refreshContacts();
      if (group.createdBy !== state.currentUser) {
        pushNotification({
          type: "group",
          title: "Added to Group",
          body: `${group.createdBy} added you to "${group.name}"`,
          contact: group.id
        });
      }
    }
  });

  socket.on("group:updated", (group) => {
    if (group) {
      state.groups = (state.groups || []).map(g => g.id === group.id ? group : g);
      refreshContacts();
    }
  });

  socket.on("group:removed", (data) => {
    if (data && data.groupId) {
      state.groups = (state.groups || []).filter(g => g.id !== data.groupId);
      refreshContacts();
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

    if (settings.avatar) {
      const preview = document.getElementById("settings-avatar-preview");
      if (preview) preview.src = settings.avatar;
    }
  }

  // Avatar upload
  document.getElementById("avatar-upload-btn")?.addEventListener("click", () => {
    document.getElementById("avatar-file-input")?.click();
  });

  document.getElementById("avatar-file-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showToast("Uploading photo...", "info");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      if (!r.ok) throw new Error("Upload failed");
      const { url } = await r.json();
      const preview = document.getElementById("settings-avatar-preview");
      if (preview) preview.src = url;
      await fetch("/api/users/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-acting-user": state.currentUser },
        body: JSON.stringify({ avatar: url })
      });
      showToast("Profile photo updated", "success");
    } catch {
      showToast("Upload failed", "error");
    }
    e.target.value = "";
  });

  // Handle section clicks via delegation to ensure contact list interaction works
  document.addEventListener("click", (e) => {
    // Close mobile nav menu when clicking outside
    if (navMenuPanel && !navMenuPanel.classList.contains("hidden") &&
        !navMenuPanel.contains(e.target) && e.target !== navMenuBtn) {
      navMenuPanel.classList.add("hidden");
    }

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
      // Clear unread badge for this contact
      if (!state.unreadCounts) state.unreadCounts = {};
      state.unreadCounts[username] = 0;
      document.getElementById("chat-empty-state")?.classList.add("hidden");
      document.getElementById("chat-header")?.classList.remove("opacity-0", "translate-y-[-10px]");
      document.getElementById("chat-footer")?.classList.remove("opacity-0");
      const nameEl = document.getElementById("chat-header-name");
      if(nameEl) nameEl.textContent = displayName;
      renderMessages(state.messages, state.currentUser, username);
      renderContacts(getCombinedContacts(), state.currentUser, username, "", contactFilter);
      if (!isGroup) {
        socket.emit("message:read", { chatId: username, username: state.currentUser });
      }
      setMobileTab("chat");
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
    refreshContacts();
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
    pushNotification({
      type: "friend_request",
      title: "Friend Request",
      body: `${data.from} wants to connect with you`,
      contact: data.from
    });
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
    pushNotification({
      type: "friend_accepted",
      title: "New Connection",
      body: `You and ${data.friend} are now friends`,
      contact: data.friend
    });
    if (!state.friends) state.friends = [];
    if (!state.friends.find(f => (f.username || f) === data.friend)) {
      state.friends.push({ username: data.friend, online: data.online });
    }
    if(document.getElementById("friends-tab-all")?.classList.contains("active")) {
      renderFriendsList(state.friends);
    }
    // Update contacts list so the new friend appears
    refreshContacts();
    
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

import { authTemplate, appShellTemplate } from "../components/templates.js";
import { formatTimeHHMM } from "../utils/time.js";
import { state, addSystemNotice } from "./state.js";
import { getCurrentTheme, applyTheme } from "./themes.js";

export function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderAuthScreen(root) {
  root.innerHTML = authTemplate();
}

export function renderAppShell(root, username) {
  root.innerHTML = appShellTemplate(username);
}

export function setAuthModeUi(mode) {
  const loginTab  = document.getElementById("tab-login");
  const signupTab = document.getElementById("tab-signup");
  const phoneField = document.getElementById("phone-field");
  const isLogin   = mode === "login";

  if (loginTab) {
    loginTab.className = isLogin
      ? "auth-tab flex-1 py-2.5 rounded-xl bg-sivion-emerald text-sivion-dark text-sm font-bold shadow-sm"
      : "auth-tab flex-1 py-2.5 rounded-xl text-slate-400 text-sm font-semibold hover:text-slate-200";
  }
  if (signupTab) {
    signupTab.className = !isLogin
      ? "auth-tab flex-1 py-2.5 rounded-xl bg-sivion-emerald text-sivion-dark text-sm font-bold shadow-sm"
      : "auth-tab flex-1 py-2.5 rounded-xl text-slate-400 text-sm font-semibold hover:text-slate-200";
  }
  if (phoneField) {
    phoneField.classList.toggle("hidden", isLogin);
  }
}

export function setAuthFeedback(message = "", isError = true) {
  const feedback = document.getElementById("auth-feedback");
  if (feedback) {
    feedback.textContent = message;
    feedback.className = `text-sm mt-6 text-center min-h-6 font-medium ${isError ? "text-rose-300" : "text-emerald-300"}`;
  }
}

export function renderContacts(users, currentUser, selectedContact = "", searchQuery = "") {
  const contactsList = document.getElementById("contacts-list");
  if (!contactsList) return;

  const visibleEntries = users.filter((entry) => entry.isGroup || entry.username !== currentUser);

  if (visibleEntries.length === 0) {
    contactsList.innerHTML = `<li class="px-3 py-10 text-xs text-slate-500 text-center font-medium">No conversations found.</li>`;
    return;
  }

  contactsList.innerHTML = visibleEntries
    .map((entry) => {
      const user = entry.username;
      const isSelected = selectedContact === (entry.isGroup ? entry.id : user);
      const unread = entry.unread || 0;
      const isOnline = !entry.isGroup && state.activeUsers.some(u => u.username === user);

      return `
        <li class="contact-item px-2 py-2.5 flex items-center gap-3 cursor-pointer ${isSelected ? "bg-sivion-emerald/[0.12] border border-sivion-emerald/20 shadow-sm" : "hover:bg-white/[0.04] border border-transparent"}" data-username="${entry.isGroup ? entry.id : user}" data-name="${escapeHtml(user)}" data-is-group="${!!entry.isGroup}">
          <div class="relative shrink-0">
            <div class="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center bg-[#1a2733] border border-white/[0.06] shadow-sm">
              ${entry.isGroup
                ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" class="text-sivion-emerald/70"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8L4 12c0-4.42 3.58-8 8-8 2.21 0 4.21.9 5.66 2.34L20 4v6h-6l2.65-2.65zM12 20c2.21 0 4.21-.9 5.66-2.34L15 15.35C13.79 16.38 12.21 17 10.5 17 7.42 17 4.92 14.77 4.54 11.81L2.05 14.3C3.45 17.62 7.08 20 12 20z"/></svg>`
                : `<img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user)}&backgroundColor=00a884&fontFamily=Inter&fontSize=40" class="w-full h-full object-cover" loading="lazy" />`}
            </div>
            ${isOnline ? `<div class="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0b141a] absolute -bottom-0.5 -right-0.5"></div>` : ""}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start gap-2">
              <p class="text-[14px] font-semibold text-white truncate leading-tight">${escapeHtml(entry.isGroup ? (entry.name || user) : user)}</p>
              <p class="text-[10px] text-slate-500 font-medium uppercase tracking-tight shrink-0">${entry.lastMessageTime ? formatTimeHHMM(entry.lastMessageTime) : ""}</p>
            </div>
            <div class="flex items-center justify-between gap-2 mt-0.5">
              <p class="text-[12px] text-slate-400 truncate">${escapeHtml(entry.lastMessagePreview || "No messages yet")}</p>
              ${unread > 0 ? `<span class="bg-sivion-emerald text-sivion-dark text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center shrink-0">${unread}</span>` : ""}
            </div>
          </div>
        </li>
      `;
    })
    .join("");
}

// ── Date label helper ─────────────────────────────────────────────────────────
function getDateLabel(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function renderMessages(messages, currentUser, selectedContact) {
  const container = document.getElementById("messages-list");
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-center py-12 opacity-60">
        <div class="w-16 h-16 rounded-2xl bg-sivion-emerald/10 border border-sivion-emerald/20 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" class="text-sivion-emerald/60">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <p class="text-slate-300 font-semibold mb-1">Start the conversation</p>
        <p class="text-slate-500 text-[13px]">Say hello to ${escapeHtml(selectedContact)}!</p>
      </div>
    `;
    return;
  }

  let lastDateLabel = "";
  let lastSender = "";
  let html = "";

  messages.forEach((msg) => {
    const isMine = msg.sender === currentUser;
    const reactions = msg.reactions || {};

    // ── Date separator ────────────────────────────────────────────────────────
    const dateLabel = getDateLabel(msg.timestamp);
    if (dateLabel && dateLabel !== lastDateLabel) {
      html += `
        <div class="flex items-center justify-center my-4">
          <span class="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.06] text-[11px] font-semibold text-slate-500">${dateLabel}</span>
        </div>
      `;
      lastDateLabel = dateLabel;
    }

    // ── Consecutive sender detection ──────────────────────────────────────────
    const isFirstInSequence = msg.sender !== lastSender;
    lastSender = msg.sender;
    const spacingClass = isFirstInSequence ? "mb-3" : "mb-0.5";

    // ── Reaction pills HTML ───────────────────────────────────────────────────
    const reactionHtml = Object.entries(reactions)
      .map(([emoji, count]) =>
        `<span class="px-1.5 py-0.5 bg-[#1e2d3a] border border-white/[0.08] rounded-full text-[11px] flex items-center gap-0.5 cursor-pointer hover:bg-white/10 transition">${emoji} <span class="text-slate-400 text-[10px]">${count}</span></span>`
      )
      .join("");

    // ── Message content ───────────────────────────────────────────────────────
    let messageContent = "";
    let noPadding = false;
    if (msg.deleted) {
      messageContent = `<em class="text-slate-500 text-[13px] italic">Message deleted</em>`;
    } else if (msg.type === "audio" && msg.url) {
      messageContent = `
        <div class="flex items-center gap-3 min-w-[180px]">
          <audio controls src="${escapeHtml(msg.url)}" class="hidden" id="aud-${msg.id}"></audio>
          <button onclick="const a=document.getElementById('aud-${msg.id}');a.paused?a.play():a.pause()" class="w-8 h-8 rounded-full ${isMine ? "bg-sivion-dark/30" : "bg-white/10"} flex items-center justify-center shrink-0 hover:brightness-110 transition">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <div class="flex-1 flex items-center gap-0.5 h-8">
            ${Array(16).fill(0).map((_, i) => `<div class="flex-1 rounded-full ${isMine ? "bg-sivion-dark/40" : "bg-white/20"}" style="height:${20 + Math.sin(i * 0.8) * 50}%"></div>`).join("")}
          </div>
          <span class="text-[11px] ${isMine ? "text-sivion-dark/60" : "text-slate-500"} font-medium">${msg.duration || "0:00"}</span>
        </div>
      `;
    } else if (msg.type === "audio") {
      messageContent = `
        <div class="flex items-center gap-3 min-w-[180px]">
          <button class="w-8 h-8 rounded-full ${isMine ? "bg-sivion-dark/30" : "bg-white/10"} flex items-center justify-center shrink-0 hover:brightness-110 transition">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <div class="flex-1 flex items-center gap-0.5 h-8">
            ${Array(16).fill(0).map((_, i) => `<div class="flex-1 rounded-full ${isMine ? "bg-sivion-dark/40" : "bg-white/20"}" style="height:${20 + Math.sin(i * 0.8) * 50}%"></div>`).join("")}
          </div>
          <span class="text-[11px] ${isMine ? "text-sivion-dark/60" : "text-slate-500"} font-medium">${msg.duration || "0:00"}</span>
        </div>
      `;
    } else if (msg.type === "image") {
      noPadding = true;
      messageContent = `<img src="${escapeHtml(msg.url)}" class="msg-image block max-w-full rounded-2xl cursor-zoom-in object-cover max-h-[320px]" style="min-width:160px" data-src="${escapeHtml(msg.url)}" alt="image" loading="lazy" />`;
    } else if (msg.type === "video") {
      noPadding = true;
      messageContent = `<video src="${escapeHtml(msg.url)}" controls class="block max-w-full rounded-2xl max-h-[320px]" style="min-width:200px"></video>`;
    } else if (msg.type === "document") {
      const fname = escapeHtml(msg.filename || "Document");
      const size = msg.filesize ? ` · ${(msg.filesize / 1024).toFixed(1)} KB` : "";
      messageContent = `
        <a href="${escapeHtml(msg.url)}" download="${fname}" target="_blank" class="flex items-center gap-3 min-w-[200px] hover:opacity-80 transition">
          <div class="w-10 h-10 rounded-xl ${isMine ? "bg-sivion-dark/30" : "bg-white/10"} flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="${isMine ? "text-sivion-dark/70" : "text-slate-400"}"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold truncate ${isMine ? "text-sivion-dark" : "text-white"}">${fname}</p>
            <p class="text-[11px] ${isMine ? "text-sivion-dark/60" : "text-slate-500"}">${msg.mimetype || "File"}${size}</p>
          </div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="${isMine ? "text-sivion-dark/60" : "text-slate-500"} shrink-0"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        </a>
      `;
    } else if (msg.type === "contact") {
      const cname = escapeHtml(msg.contactName || "Contact");
      messageContent = `
        <div class="flex items-center gap-3 min-w-[200px]">
          <div class="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.contactName || "U")}&backgroundColor=00a884" class="w-full h-full" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold ${isMine ? "text-sivion-dark" : "text-white"}">${cname}</p>
            <p class="text-[11px] ${isMine ? "text-sivion-dark/60" : "text-slate-500"}">Sivion Technologies</p>
          </div>
        </div>
      `;
    } else if (msg.type === "poll") {
      const totalVotes = (msg.pollOptions || []).reduce((s, o) => s + (o.votes || 0), 0);
      messageContent = `
        <div class="min-w-[220px]">
          <p class="text-[14px] font-bold ${isMine ? "text-sivion-dark" : "text-white"} mb-3">${escapeHtml(msg.pollQuestion || "")}</p>
          <div class="space-y-2">
            ${(msg.pollOptions || []).map((opt, idx) => {
              const pct = totalVotes > 0 ? Math.round((opt.votes || 0) / totalVotes * 100) : 0;
              return `
                <button class="poll-vote-btn w-full text-left rounded-xl overflow-hidden relative border ${isMine ? "border-sivion-dark/20" : "border-white/[0.1]"} transition hover:brightness-110 active:scale-[0.98]" data-msg-id="${msg.id}" data-opt-idx="${idx}">
                  <div class="absolute inset-0 ${isMine ? "bg-sivion-dark/20" : "bg-white/[0.07]"}" style="width:${pct}%;transition:width 0.4s ease"></div>
                  <div class="relative flex items-center justify-between px-3 py-2.5">
                    <span class="text-[13px] font-medium ${isMine ? "text-sivion-dark" : "text-slate-200"}">${escapeHtml(opt.text || opt)}</span>
                    <span class="text-[11px] ${isMine ? "text-sivion-dark/60" : "text-slate-500"} font-bold">${pct}%</span>
                  </div>
                </button>
              `;
            }).join("")}
          </div>
          <p class="text-[11px] ${isMine ? "text-sivion-dark/60" : "text-slate-500"} mt-2">${totalVotes} vote${totalVotes !== 1 ? "s" : ""}</p>
        </div>
      `;
    } else if (msg.type === "event") {
      const evDate = msg.eventDatetime ? new Date(msg.eventDatetime).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
      messageContent = `
        <div class="min-w-[220px]">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg ${isMine ? "bg-sivion-dark/20" : "bg-rose-500/15"} flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="${isMine ? "text-sivion-dark/70" : "text-rose-400"}"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            </div>
            <span class="text-[11px] font-bold uppercase tracking-wider ${isMine ? "text-sivion-dark/60" : "text-rose-400"}">Event</span>
          </div>
          <p class="text-[14px] font-bold ${isMine ? "text-sivion-dark" : "text-white"} mb-1">${escapeHtml(msg.eventTitle || "")}</p>
          ${evDate ? `<p class="text-[12px] ${isMine ? "text-sivion-dark/70" : "text-slate-400"} mb-1">${escapeHtml(evDate)}</p>` : ""}
          ${msg.eventLocation ? `<p class="text-[12px] ${isMine ? "text-sivion-dark/60" : "text-slate-500"} flex items-center gap-1"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>${escapeHtml(msg.eventLocation)}</p>` : ""}
        </div>
      `;
    } else if (msg.type === "sticker") {
      noPadding = true;
      messageContent = `<span class="text-6xl leading-none block p-2">${escapeHtml(msg.sticker || "")}</span>`;
    } else {
      messageContent = escapeHtml(msg.text || "");
    }

    // ── Quick reaction buttons ────────────────────────────────────────────────
    const reactionButtons = `
      <button class="reaction-btn w-7 h-7 rounded-full hover:bg-white/10 text-base transition flex items-center justify-center hover:scale-125 active:scale-90" data-id="${msg.id}" data-emoji="👍">👍</button>
      <button class="reaction-btn w-7 h-7 rounded-full hover:bg-white/10 text-base transition flex items-center justify-center hover:scale-125 active:scale-90" data-id="${msg.id}" data-emoji="❤️">❤️</button>
      <button class="reaction-btn w-7 h-7 rounded-full hover:bg-white/10 text-base transition flex items-center justify-center hover:scale-125 active:scale-90" data-id="${msg.id}" data-emoji="😂">😂</button>
    `;

    if (isMine) {
      html += `
        <div class="flex justify-end group px-2 ${spacingClass} animate-fade-in" data-id="${msg.id}">
          <div class="max-w-[72%] md:max-w-[60%] flex flex-col items-end">
            ${isFirstInSequence ? `<p class="text-[11px] font-semibold text-slate-500 mb-1 mr-1">You</p>` : ""}
            <div class="relative">
              <div class="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-sivion-emerald text-sivion-dark text-[14px] leading-relaxed font-medium shadow-[0_2px_8px_rgba(0,168,132,0.25)] break-words">
                ${messageContent}
              </div>
              <button class="msg-delete-btn opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -left-8 w-6 h-6 rounded-full bg-[#1e2d3a] border border-white/[0.08] flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-slate-500" data-id="${msg.id}">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
              <div class="absolute top-0 right-full mr-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 items-center">
                ${reactionButtons}
              </div>
            </div>
            <div class="flex items-center gap-1.5 mt-1 mr-1">
              <span class="text-[10px] text-slate-500 font-medium">${formatTimeHHMM(msg.timestamp)}</span>
              <svg viewBox="0 0 16 11" width="14" height="10" fill="none" class="text-sivion-emerald/70">
                <path d="M1 5.5L5.5 10L15 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            ${reactionHtml ? `<div class="flex flex-wrap gap-1 mt-1 justify-end">${reactionHtml}</div>` : ""}
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="flex justify-start group px-2 ${spacingClass} animate-fade-in" data-id="${msg.id}">
          <div class="max-w-[72%] md:max-w-[60%] flex flex-col items-start">
            ${isFirstInSequence ? `<p class="text-[11px] font-semibold text-sivion-emerald/80 mb-1 ml-1">${escapeHtml(msg.sender)}</p>` : ""}
            <div class="relative">
              <div class="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[#1e2d3a] text-slate-100 text-[14px] leading-relaxed border border-white/[0.06] shadow-sm break-words">
                ${messageContent}
              </div>
              <button class="msg-delete-btn opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-8 w-6 h-6 rounded-full bg-[#1e2d3a] border border-white/[0.08] flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-colors text-slate-500" data-id="${msg.id}">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
              <div class="absolute top-0 left-full ml-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 items-center">
                ${reactionButtons}
              </div>
            </div>
            <div class="flex items-center gap-1.5 mt-1 ml-1">
              <span class="text-[10px] text-slate-500 font-medium">${formatTimeHHMM(msg.timestamp)}</span>
            </div>
            ${reactionHtml ? `<div class="flex flex-wrap gap-1 mt-1 justify-start">${reactionHtml}</div>` : ""}
          </div>
        </div>
      `;
    }
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

export function showToast(message, type = "info") {
  const icons = {
    success: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const colorMap = {
    info:    "bg-[#1e2d3a] border-sivion-emerald/30 text-white",
    success: "bg-sivion-emerald/95 text-sivion-dark border-transparent",
    error:   "bg-rose-500/95 text-white border-transparent",
  };

  const toast = document.createElement("div");
  toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-2xl z-[200] border backdrop-blur-xl animate-scale-in flex items-center gap-2.5 ${colorMap[type] || colorMap.info}`;
  toast.innerHTML = `
    <span class="shrink-0 flex items-center">${icons[type] || icons.info}</span>
    <span class="text-sm font-semibold whitespace-nowrap">${escapeHtml(message)}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(8px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

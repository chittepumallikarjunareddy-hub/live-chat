import { authTemplate, appShellTemplate } from "../components/templates.js";
import { formatTimeHHMM } from "../utils/time.js";
import { state, addSystemNotice } from "./state.js";

function escapeHtml(value = "") {
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
  const loginTab = document.getElementById("tab-login");
  const signupTab = document.getElementById("tab-signup");
  const isLogin = mode === "login";

  loginTab.className = isLogin
    ? "auth-tab flex-1 py-2 rounded-lg bg-sivion-emerald text-sivion-dark font-semibold"
    : "auth-tab flex-1 py-2 rounded-lg text-slate-300";

  signupTab.className = !isLogin
    ? "auth-tab flex-1 py-2 rounded-lg bg-sivion-emerald text-sivion-dark font-semibold"
    : "auth-tab flex-1 py-2 rounded-lg text-slate-300";
}

export function setAuthFeedback(message = "", isError = true) {
  const feedback = document.getElementById("auth-feedback");
  feedback.textContent = message;
  feedback.className = `text-sm mt-4 min-h-6 ${isError ? "text-rose-300" : "text-emerald-300"}`;
}

export function renderContacts(
  users,
  currentUser,
  selectedContact = "",
  searchQuery = "",
  hasOtherUsers = true
) {
  const contactsList = document.getElementById("contacts-list");
  if (!contactsList) {
    return;
  }

  const visibleUsers = users.filter((entry) => entry.username !== currentUser);

  if (visibleUsers.length === 0) {
    const q = escapeHtml(searchQuery.trim());
    if (hasOtherUsers && searchQuery.trim()) {
      contactsList.innerHTML = `
        <li class="px-3 py-5 text-xs text-slate-400 text-center">
          No one matches “${q}”. Try another name.
        </li>
      `;
    } else {
      contactsList.innerHTML = `
        <li class="px-3 py-5 text-xs text-slate-400 text-center">
          No other registered users yet.
        </li>
      `;
    }
    return;
  }

  contactsList.innerHTML = visibleUsers
    .map((entry) => {
      const user = entry.username;
      const online = Boolean(entry.online);
      const isSelected = selectedContact === user;
      const unread = entry.unread || 0;
      const preview = entry.lastMessagePreview || "";
      const pinHint = entry._searchPinned
        ? '<span class="text-[10px] text-emerald-400/90 font-normal shrink-0 ml-1">· current</span>'
        : "";

      const activeClass = isSelected
        ? "bg-[#2a3942]" // WhatsApp Web dark mode active color
        : "hover:bg-[#202c33]";

      const unreadBadge = unread > 0
        ? `<span style="flex-shrink:0; min-width:20px; height:20px; padding:0 6px; border-radius:9999px; background-color:#00a884; color:#111b21; font-size:12px; font-weight:600; display:flex; align-items:center; justify-content:center; margin-left: 6px;">${unread > 99 ? "99+" : unread}</span>`
        : "";

      // Generate a vibrant pseudo-random color based on the username
      const colors = [
        "linear-gradient(135deg, #FF6B6B, #C0392B)",
        "linear-gradient(135deg, #4834D4, #686DE0)",
        "linear-gradient(135deg, #10AC84, #1DD1A1)",
        "linear-gradient(135deg, #F368E0, #FF9FF3)",
        "linear-gradient(135deg, #FF9F43, #EE5253)",
        "linear-gradient(135deg, #0ABDE3, #01A3A4)",
        "linear-gradient(135deg, #9B59B6, #8E44AD)",
        "linear-gradient(135deg, #22A6B3, #7ED6DF)",
      ];
      let hash = 0;
      for (let i = 0; i < user.length; i++) {
        hash = user.charCodeAt(i) + ((hash << 5) - hash);
      }
      const avatarGradient = colors[Math.abs(hash) % colors.length];
      const timeStr = entry.lastMessageTimeFormatted || "";

      return `
        <li data-contact="${escapeHtml(user)}" class="contact-item cursor-pointer flex items-stretch transition-colors ${activeClass}" style="height: 72px;">
          <!-- Left side: Avatar -->
          <div style="display:flex; align-items:center; padding: 0 15px 0 13px;">
            <div style="width:49px; height:49px; border-radius:50%; background:${avatarGradient}; display:flex; align-items:center; justify-content:center; color:white; font-size:20px; font-weight:500; text-transform:uppercase;">
              ${escapeHtml(user.charAt(0))}
            </div>
          </div>
          
          <!-- Right side: Name, Time, Preview, Unread -->
          <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; padding-right:15px; border-bottom: 1px solid #222d34;">
            
            <!-- Top row: Name & Time -->
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom: 3px;">
              <span style="font-size:17px; color:#e9edef; font-weight:400; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(user)}">
                ${escapeHtml(user)}${pinHint}
              </span>
              ${timeStr ? `<span style="font-size:12px; color:${unread > 0 ? '#00a884' : '#8696a0'}; flex-shrink:0; margin-left: 6px;">${escapeHtml(timeStr)}</span>` : ''}
            </div>
            
            <!-- Bottom row: Preview & Unread Badge -->
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:14px; color:${unread > 0 ? '#e9edef' : '#8696a0'}; ${unread > 0 ? 'font-weight:500;' : ''} white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">
                ${preview ? escapeHtml(preview) : ""}
              </span>
              ${unreadBadge}
            </div>

          </div>
        </li>
      `;
    })
    .join("");

}

function messageBubble(message, currentUser) {
  const isSelf = message.sender === currentUser;
  const wrapperClass = isSelf ? "justify-end" : "justify-start";
  const bubbleClass = isSelf
    ? "bg-[#d3f4cf] text-slate-900 rounded-br-md"
    : "bg-white text-slate-900 border border-slate-200 rounded-bl-md";
  const safeSender = escapeHtml(message.sender);
  const timeText = formatTimeHHMM(message.time);
  const editedLabel = message.editedAt ? '<span class="text-[10px] text-slate-500 mr-1">(edited)</span>' : "";

  return `
    <article data-id="${message.id}" class="flex ${wrapperClass} message-enter">
      <div class="relative max-w-[90%] lg:max-w-[68%] rounded-2xl px-4 py-3 shadow-sm ${bubbleClass}">
        <div class="flex items-start justify-between gap-4">
          <p class="text-xs font-semibold text-slate-600">${safeSender}</p>
          <div class="flex items-center gap-2">
            ${
              isSelf && !message.isDeleted
                ? `<button data-menu-id="${message.id}" class="text-slate-500 hover:text-slate-700 text-xs">⋯</button>`
                : ""
            }
            <p class="text-[11px] text-slate-500 whitespace-nowrap">${timeText}</p>
          </div>
        </div>
        ${
          message.isDeleted
            ? `<p class="mt-1 italic text-slate-500">This message was deleted.</p>`
            : `<p class="mt-1 break-words">${escapeHtml(message.text)}</p>`
        }
        <div class="mt-2 flex justify-end items-center gap-1">
          ${editedLabel}
          ${isSelf ? '<span class="text-[11px] text-slate-500">✓✓</span>' : ""}
        </div>
        ${
          isSelf && !message.isDeleted
            ? `<div data-menu-panel="${message.id}" class="hidden absolute top-8 right-3 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[132px] z-20">
                <button data-edit-id="${message.id}" class="block w-full text-left px-3 py-2 text-xs hover:bg-slate-100">Edit message</button>
                <button data-delete-id="${message.id}" class="block w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50">Delete for Everyone</button>
              </div>`
            : ""
        }
      </div>
    </article>
  `;
}

export function updateThreadActionButtons(hasSelectedContact) {
  document.querySelectorAll(".js-clear-thread-btn").forEach((el) => {
    if (!(el instanceof HTMLButtonElement)) {
      return;
    }
    el.disabled = !hasSelectedContact;
    el.classList.toggle("opacity-40", !hasSelectedContact);
    el.classList.toggle("cursor-not-allowed", !hasSelectedContact);
  });
}

export function updateComposerAvailability(hasContact) {
  const input = document.getElementById("composer-input");
  const form = document.getElementById("composer-form");
  const sendBtn = form?.querySelector("button[type='submit']") ?? form?.querySelector("button:last-of-type");
  if (input) {
    input.disabled = !hasContact;
    input.placeholder = hasContact ? "Write a message..." : "Pick someone from Contacts to chat";
  }
  if (sendBtn) {
    sendBtn.disabled = !hasContact;
    sendBtn.classList.toggle("opacity-40", !hasContact);
    sendBtn.classList.toggle("pointer-events-none", !hasContact);
  }
}

export function renderMessages(messages, currentUser, selectedContact) {
  const feed = document.getElementById("chat-feed");
  if (!feed) {
    return;
  }
  updateComposerAvailability(Boolean(selectedContact));
  updateThreadActionButtons(Boolean(selectedContact));
  if (!selectedContact) {
    feed.innerHTML = `
      <div class="h-full grid place-items-center text-center text-slate-500 px-4">
        <div>
          <p class="text-sm font-medium text-slate-600">Select a contact</p>
          <p class="text-xs mt-2 text-slate-500">On your phone, open Contacts, tap a name, then use the Chat tab.</p>
        </div>
      </div>
    `;
    return;
  }
  const scopedMessages = messages.filter(
    (message) =>
      (message.sender === currentUser && message.receiver === selectedContact) ||
      (message.sender === selectedContact && message.receiver === currentUser)
  );
  const noticesHtml = state.systemNotices
    .map(
      (entry) =>
        `<div class="text-center text-xs text-slate-500 py-1">${formatTimeHHMM(entry.time)} • ${escapeHtml(entry.text)}</div>`
    )
    .join("");
  feed.innerHTML =
    noticesHtml + scopedMessages.map((message) => messageBubble(message, currentUser)).join("");
  feed.scrollTop = feed.scrollHeight;
}

export function pushSystemNotice(text, isoTime) {
  addSystemNotice(text, isoTime);
  renderMessages(state.messages, state.currentUser, state.selectedContact);
}

export function updateChatHeader(selectedContact, typingUser = "", isSelectedContactOnline = false) {
  const title = document.getElementById("chat-room-title");
  const indicator = document.getElementById("typing-indicator");
  if (!title || !indicator) {
    return;
  }
  if (!selectedContact) {
    title.textContent = "Select a contact";
    indicator.textContent = "Choose a person from the left panel";
    return;
  }

  title.textContent = selectedContact;
  const typingForThisChat =
    typingUser && selectedContact && typingUser === selectedContact ? typingUser : "";
  indicator.textContent = typingForThisChat
    ? "typing…"
    : isSelectedContactOnline
      ? "Online"
      : "Offline";
}

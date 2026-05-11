import { theme } from "../styles/theme.js";

export function authTemplate() {
  return `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-sivion-dark via-[#111b21] to-[#0f2527] p-4">
      <div class="w-full max-w-md bg-[#111b21]/95 border border-white/10 rounded-2xl shadow-2xl p-8">
        <p class="text-sm uppercase tracking-[0.32em] text-sivion-emerald/80 mb-3">Enterprise Messaging</p>
        <h1 class="text-3xl font-bold mb-2">${theme.appName}</h1>
        <p class="text-slate-300 mb-7">Securely connect, collaborate, and chat in real time.</p>

        <div class="flex bg-black/20 rounded-xl p-1 mb-6">
          <button id="tab-login" class="auth-tab flex-1 py-2 rounded-lg bg-sivion-emerald text-sivion-dark font-semibold">Login</button>
          <button id="tab-signup" class="auth-tab flex-1 py-2 rounded-lg text-slate-300">Sign up</button>
        </div>

        <form id="auth-form" class="space-y-4">
          <div>
            <label for="username" class="block text-sm text-slate-300 mb-1">Username</label>
            <input id="username" name="username" class="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sivion-emerald/70" placeholder="your.name" required />
          </div>
          <div>
            <label for="password" class="block text-sm text-slate-300 mb-1">Password</label>
            <input id="password" name="password" type="password" class="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sivion-emerald/70" placeholder="••••••••" required />
          </div>
          <button type="submit" class="w-full py-3 rounded-xl bg-sivion-emerald text-sivion-dark font-bold hover:brightness-95 transition">Continue</button>
        </form>

        <p id="auth-feedback" class="text-sm mt-4 text-rose-300 min-h-6"></p>
      </div>
    </div>
  `;
}

export function appShellTemplate(username) {
  return `
    <div class="h-screen w-full p-2 md:p-4 bg-gradient-to-br from-[#0a1014] via-[#0d171d] to-[#0a2023] flex flex-col relative">
      <div class="flex-1 min-h-0 rounded-2xl overflow-hidden bg-[#0d161c] border border-white/10 flex flex-col md:grid md:grid-cols-[280px_minmax(0,1fr)] shadow-[0_10px_60px_rgba(0,0,0,0.45)]">

        <!-- Mobile tab bar: extra ⋯ so About / Privacy / Logout are always reachable (not only on Chat) -->
        <div class="md:hidden flex items-stretch border-b border-white/10 bg-[#0b141a] shrink-0">
          <button type="button" id="tab-contacts" onclick="document.getElementById('sidebar').classList.remove('hidden'); document.getElementById('chat-panel').classList.add('hidden'); this.classList.add('border-b-2','border-sivion-emerald','text-slate-100'); this.classList.remove('text-slate-400'); document.getElementById('tab-chat').classList.remove('border-b-2','border-sivion-emerald','text-slate-100'); document.getElementById('tab-chat').classList.add('text-slate-400')" class="flex-1 py-2.5 text-sm font-semibold border-b-2 border-sivion-emerald text-slate-100 min-w-0">Contacts</button>
          <button type="button" id="tab-chat" onclick="document.getElementById('chat-panel').classList.remove('hidden'); document.getElementById('sidebar').classList.add('hidden'); this.classList.add('border-b-2','border-sivion-emerald','text-slate-100'); this.classList.remove('text-slate-400'); document.getElementById('tab-contacts').classList.remove('border-b-2','border-sivion-emerald','text-slate-100'); document.getElementById('tab-contacts').classList.add('text-slate-400')" class="flex-1 py-2.5 text-sm font-semibold text-slate-400 min-w-0">Chat</button>
          <div class="relative flex items-center border-l border-white/10 pl-1 pr-2 shrink-0" id="nav-menu-wrap">
            <button
              type="button"
              id="nav-menu-btn"
              class="px-2 py-2 rounded-lg text-slate-300 hover:bg-white/10 text-xl leading-none"
              aria-label="More options"
              title="More"
            >
              ⋯
            </button>
            <div
              id="nav-menu-panel"
              class="hidden absolute right-2 top-full mt-0.5 min-w-[200px] py-1 rounded-xl bg-[#0d161c] border border-white/15 shadow-xl z-40"
            >
              <button type="button" id="nav-logout-btn" class="w-full text-left px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10">Log out</button>
            </div>
          </div>
        </div>

        <!-- Sidebar: flex-1 + min-h-0 so the list scrolls and profile/Logout stay visible on small screens -->
        <aside id="sidebar" class="flex flex-col flex-1 min-h-0 border-r border-white/10 bg-[#0b141a] md:flex md:flex-none md:h-full md:min-h-0">
          <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold tracking-tight">Chats</h2>
              <p class="text-xs text-slate-400">People on SivionChat</p>
            </div>
          </div>
          <div class="px-3 py-2 border-b border-white/10">
            <input id="contact-search" type="search" autocomplete="off" placeholder="Search by username…" class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sivion-emerald/70" />
          </div>
          <ul id="contacts-list" class="flex-1 overflow-y-auto sivion-scroll p-2"></ul>
          <div class="p-3 border-t border-white/10">
            <div class="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] text-slate-400">Your profile</p>
                  <p class="text-sm font-semibold truncate">@${username}</p>
                  <p class="text-[11px] text-sivion-emerald">Status: Connected</p>
                </div>
                <div class="relative shrink-0" id="profile-menu-wrap">
                  <button
                    type="button"
                    id="profile-menu-btn"
                    class="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 text-lg leading-none"
                    aria-label="Profile menu"
                    title="Menu"
                  >
                    ⋯
                  </button>
                  <div
                    id="profile-menu-panel"
                    class="hidden absolute bottom-full right-0 mb-1 min-w-[230px] py-1 rounded-xl bg-[#0d161c] border border-white/15 shadow-xl z-40"
                  >
                    <button type="button" id="profile-open-about" class="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10">About</button>
                    <button type="button" id="profile-open-privacy" class="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10">Privacy</button>
                    <div class="my-1 border-t border-white/10"></div>
                    <button type="button" id="profile-logout-btn" class="w-full text-left px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10">Log out</button>
                  </div>
                </div>
              </div>
              <button id="logout-btn" class="w-full py-2 rounded-lg border border-rose-400/40 text-rose-300 hover:bg-rose-400/10 transition text-xs font-semibold">
                Logout
              </button>
            </div>
          </div>
        </aside>

        <!-- Chat panel -->
        <main id="chat-panel" class="hidden md:flex flex-col min-w-0 min-h-0 flex-1">
          <header class="bg-[#111b21] text-slate-100 px-3 sm:px-4 md:px-6 py-3 md:py-4 border-b border-white/10 flex items-center gap-2 justify-between">
            <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button type="button" id="back-to-contacts" class="md:hidden shrink-0 text-slate-400 hover:text-slate-100 transition" onclick="document.getElementById('sidebar').classList.remove('hidden'); document.getElementById('chat-panel').classList.add('hidden'); document.getElementById('tab-contacts').classList.add('border-b-2','border-sivion-emerald','text-slate-100'); document.getElementById('tab-contacts').classList.remove('text-slate-400'); document.getElementById('tab-chat').classList.remove('border-b-2','border-sivion-emerald','text-slate-100'); document.getElementById('tab-chat').classList.add('text-slate-400')">&#8592;</button>
              <div class="min-w-0 flex-1">
                <h2 id="chat-room-title" class="font-semibold truncate">Select a contact</h2>
                <p id="typing-indicator" class="text-xs text-slate-400 truncate">Choose a person from the left panel</p>
              </div>
            </div>
            <div class="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
              <span class="text-xs md:text-sm font-semibold text-slate-300 hidden sm:inline truncate max-w-[100px] md:max-w-none">@${username}</span>
              
              <!-- Call Menu Button -->
              <div class="relative" id="call-menu-wrap">
                <button
                  type="button"
                  id="call-menu-btn"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 text-slate-300 hover:bg-white/10 transition"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                  <span class="text-sm font-medium hidden sm:inline">Call</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </button>
                <div
                  id="call-menu-panel"
                  class="hidden absolute right-0 top-full mt-2 w-[280px] sm:w-[320px] rounded-2xl bg-white shadow-[0_15px_30px_rgba(0,0,0,0.15)] overflow-hidden z-40 border border-slate-100"
                >
                  <div class="p-4 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                        <img src="" id="call-menu-avatar" class="w-full h-full object-cover bg-sivion-emerald" />
                      </div>
                      <span id="call-menu-contact-name" class="font-medium text-slate-800 text-lg truncate">Select a contact</span>
                    </div>
                    <div class="flex gap-2 mt-4">
                      <button type="button" id="action-voice-call" class="flex-1 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center gap-2 font-medium transition">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
                        Voice
                      </button>
                      <button type="button" id="action-video-call" class="flex-1 py-2.5 rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center gap-2 font-medium transition">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                        Video
                      </button>
                    </div>
                  </div>
                  <div class="py-2">
                    <button type="button" class="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-4 transition">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="text-slate-500"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      New group call
                    </button>
                    <button type="button" class="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-4 transition">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="text-slate-500"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
                      Send call link
                    </button>
                    <button type="button" class="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center gap-4 transition">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="text-slate-500"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                      Schedule call
                    </button>
                  </div>
                </div>
              </div>

              <!-- md+: menu in chat header. Below md the tab bar ⋯ has the same actions -->
              <div class="relative hidden md:block" id="app-menu-wrap">
                <button
                  type="button"
                  id="app-menu-btn"
                  class="p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-slate-100 text-lg leading-none"
                  aria-label="App menu"
                  title="Menu"
                >
                  ⋯
                </button>
                <div
                  id="app-menu-panel"
                  class="hidden absolute right-0 top-full mt-1 min-w-[180px] py-1 rounded-xl bg-[#0d161c] border border-white/15 shadow-xl z-30"
                >
                  <button
                    type="button"
                    id="header-clear-thread-btn"
                    class="js-clear-thread-btn w-full text-left px-4 py-2.5 text-sm text-amber-200/90 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled
                  >
                    Clear this conversation
                  </button>
                  <div class="my-1 border-t border-white/10"></div>
                  <button
                    type="button"
                    id="header-logout-btn"
                    class="w-full text-left px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </header>

          <section id="chat-feed" class="flex-1 min-h-0 overflow-y-auto sivion-scroll bg-[#e7ddd1] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_40%)] p-4 md:p-6 space-y-3"></section>

          <form id="composer-form" class="p-3 md:p-4 bg-[#111b21] border-t border-white/10 flex gap-2 md:gap-3 items-end relative">
            <div class="relative shrink-0">
              <button type="button" id="attachment-menu-btn" class="p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-white/10 transition leading-none w-[42px] h-[42px] flex items-center justify-center text-2xl font-light">
                +
              </button>
              <div id="attachment-menu-panel" class="hidden absolute bottom-full left-0 mb-2 w-[240px] bg-white rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] py-2 z-40 flex flex-col gap-1 px-2 border border-slate-100">
                <button type="button" id="attach-doc-btn" class="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition group">
                  <div class="w-10 h-10 rounded-full bg-[#7F66FF] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
                  </div>
                  <span class="text-slate-700 font-medium text-sm">Document</span>
                </button>
                <button type="button" id="attach-media-btn" class="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition group">
                  <div class="w-10 h-10 rounded-full bg-[#007DFC] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"></path></svg>
                  </div>
                  <span class="text-slate-700 font-medium text-sm">Photos & videos</span>
                </button>
                <button type="button" id="attach-camera-btn" class="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition group">
                  <div class="w-10 h-10 rounded-full bg-[#FF2E74] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="12" r="3.2"></circle><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"></path></svg>
                  </div>
                  <span class="text-slate-700 font-medium text-sm">Camera</span>
                </button>
                <button type="button" id="attach-audio-btn" class="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition group">
                  <div class="w-10 h-10 rounded-full bg-[#FF8A00] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"></path></svg>
                  </div>
                  <span class="text-slate-700 font-medium text-sm">Audio</span>
                </button>
                <button type="button" id="attach-contact-btn" class="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition group">
                  <div class="w-10 h-10 rounded-full bg-[#009DE2] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
                  </div>
                  <span class="text-slate-700 font-medium text-sm">Contact</span>
                </button>
                <button type="button" id="attach-poll-btn" class="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition group">
                  <div class="w-10 h-10 rounded-full bg-[#FFC000] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"></path></svg>
                  </div>
                  <span class="text-slate-700 font-medium text-sm">Poll</span>
                </button>
                <button type="button" id="attach-event-btn" class="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition group">
                  <div class="w-10 h-10 rounded-full bg-[#FF2E74] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"></path></svg>
                  </div>
                  <span class="text-slate-700 font-medium text-sm">Event</span>
                </button>
                <button type="button" id="attach-sticker-btn" class="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl transition group">
                  <div class="w-10 h-10 rounded-full bg-[#00C5A0] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path></svg>
                  </div>
                  <span class="text-slate-700 font-medium text-sm">New sticker</span>
                </button>
              </div>
            </div>
            
            <div class="flex-1 flex flex-col gap-2 relative bg-[#0d161c] rounded-3xl border border-white/10 focus-within:ring-2 focus-within:ring-sivion-emerald/70 disabled:opacity-50 transition-all overflow-hidden">
              <div id="attachment-preview-container" class="hidden px-4 pt-3 pb-1 border-b border-white/10">
                 <div class="relative inline-block">
                   <img id="attachment-preview-img" class="max-h-24 max-w-full rounded-lg object-cover hidden" />
                   <video id="attachment-preview-video" class="max-h-24 max-w-full rounded-lg object-cover hidden" controls></video>
                   <div id="attachment-preview-doc" class="hidden flex items-center gap-2 bg-[#202c33] p-2 rounded-lg text-sm text-slate-300">
                     <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
                     <span id="attachment-preview-filename" class="truncate max-w-[150px]"></span>
                   </div>
                   <button type="button" id="remove-attachment-btn" class="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-700 shadow-md">
                     <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                   </button>
                 </div>
              </div>
              <input id="composer-input" autocomplete="off" placeholder="Write a message..." class="w-full bg-transparent px-4 py-3 focus:outline-none disabled:opacity-50" />
            </div>
            
            <button type="submit" class="px-5 py-3 rounded-full bg-sivion-emerald text-sivion-dark font-semibold hover:brightness-95 transition h-[48px] shrink-0">Send</button>
            <input type="file" id="hidden-file-input" class="hidden" />
          </form>
        </main>

      </div>
      <!-- About modal -->
      <div id="about-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
        <div class="w-full max-w-md rounded-2xl border border-white/15 bg-[#0d161c] shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
          <h2 id="about-modal-title" class="text-lg font-semibold text-slate-100 mb-3">${theme.appName}</h2>
          <p class="text-sm text-slate-300 leading-relaxed mb-4">
            SivionChat is a real-time messaging app. It uses Node.js, Express, Socket.io, and MongoDB on the server, with a lightweight HTML and JavaScript front end.
          </p>
          <p class="text-sm text-slate-400 leading-relaxed mb-6">
            Messages are delivered live to all connected clients. User accounts and message history are stored in the configured database.
          </p>
          <button type="button" id="close-about-btn" class="w-full py-2.5 rounded-xl bg-sivion-emerald text-sivion-dark font-semibold hover:brightness-95 transition">
            Close
          </button>
        </div>
      </div>

      <!-- Privacy modal -->
      <div id="privacy-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
        <div class="w-full max-w-md rounded-2xl border border-white/15 bg-[#0d161c] shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
          <h2 id="privacy-modal-title" class="text-lg font-semibold text-slate-100 mb-3">Privacy</h2>
          <ul class="text-sm text-slate-300 space-y-3 list-disc pl-5 mb-6">
            <li>Your username and password are stored on the server.</li>
            <li>Messages you send are persisted in the database and delivered to connected users.</li>
            <li>No third-party analytics are used; your data stays on your server.</li>
            <li>Use Logout or clear browser local storage to remove your saved session on this device.</li>
          </ul>
          <button type="button" id="close-privacy-btn" class="w-full py-2.5 rounded-xl bg-sivion-emerald text-sivion-dark font-semibold hover:brightness-95 transition">
            Close
          </button>
        </div>
      </div>

      <!-- Incoming Call Dialog -->
      <div id="incoming-call-dialog" class="hidden fixed top-6 right-6 z-[60] bg-[#111b21] border border-white/10 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.4)] p-4 flex flex-col gap-4 min-w-[280px] animate-bounce-short">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
            <img id="incoming-call-avatar" src="" class="w-full h-full object-cover bg-sivion-emerald" />
          </div>
          <div>
            <h3 id="incoming-call-name" class="text-slate-100 font-semibold text-lg">Caller Name</h3>
            <p id="incoming-call-type" class="text-slate-400 text-sm">Incoming voice call...</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button id="decline-call-btn" class="flex-1 py-2.5 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition font-medium">Decline</button>
          <button id="accept-call-btn" class="flex-1 py-2.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition font-medium">Accept</button>
        </div>
        <audio id="incoming-ringtone" loop src=""></audio>
      </div>

      <!-- Active Call Modal -->
      <div id="active-call-modal" class="hidden fixed inset-0 z-[70] bg-[#0b141a] flex flex-col">
        <div class="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
          <!-- Remote Video -->
          <video id="remote-video" autoplay playsinline class="w-full h-full object-contain hidden"></video>
          <!-- Remote Audio (only for voice calls) -->
          <audio id="remote-audio" autoplay></audio>
          
          <!-- Avatar fallback when video is off -->
          <div id="call-avatar-fallback" class="absolute inset-0 flex flex-col items-center justify-center bg-[#0b141a]">
            <img id="active-call-avatar" src="" class="w-32 h-32 rounded-full object-cover shadow-2xl mb-6 bg-sivion-emerald" />
            <h2 id="active-call-name" class="text-2xl font-bold text-slate-100 mb-2">Contact Name</h2>
            <p id="active-call-status" class="text-slate-400">Calling...</p>
          </div>

          <!-- Local Video (PiP) -->
          <div id="local-video-container" class="absolute bottom-6 right-6 w-32 h-48 md:w-48 md:h-64 bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 hidden">
            <video id="local-video" autoplay playsinline muted class="w-full h-full object-cover"></video>
          </div>
        </div>
        
        <!-- Call Controls -->
        <div class="h-24 bg-[#111b21] border-t border-white/10 flex items-center justify-center gap-6 px-6">
          <button id="toggle-mic-btn" class="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>
          </button>
          <button id="toggle-video-btn" class="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          </button>
          <button id="end-call-btn" class="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
          </button>
        </div>
      </div>

    </div>
  `;
}

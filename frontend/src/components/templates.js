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

          <form id="composer-form" class="p-3 md:p-4 bg-[#111b21] border-t border-white/10 flex gap-2 md:gap-3">
            <input id="composer-input" autocomplete="off" placeholder="Write a message..." class="flex-1 rounded-full px-4 py-3 bg-[#0d161c] border border-white/10 focus:outline-none focus:ring-2 focus:ring-sivion-emerald/70 disabled:opacity-50" />
            <button type="submit" class="px-5 rounded-full bg-sivion-emerald text-sivion-dark font-semibold hover:brightness-95 transition">Send</button>
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

    </div>
  `;
}

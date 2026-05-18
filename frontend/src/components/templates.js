export function appShellTemplate(username) {
  return `
    <div class="h-screen w-full bg-gradient-to-br from-[#060d18] via-[#0b141a] to-[#061018] flex flex-col relative overflow-hidden">
      <!-- Ambient glow -->
      <div class="absolute top-[-15%] right-[-8%] w-[38%] h-[38%] bg-[#00a884]/[0.06] blur-[140px] rounded-full pointer-events-none"></div>
      <div class="absolute bottom-[-15%] left-[-8%] w-[32%] h-[32%] bg-blue-500/[0.04] blur-[140px] rounded-full pointer-events-none"></div>

      <div class="flex-1 min-h-0 overflow-hidden flex flex-col md:grid md:grid-cols-[68px_320px_minmax(0,1fr)] relative z-10 md:m-3 md:rounded-3xl md:border md:border-white/[0.07] md:shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-[#0d161c]">

        <!-- Mobile top bar -->
        <div class="md:hidden flex items-stretch border-b border-white/[0.07] bg-[#0b141a] shrink-0 z-30">
          <button type="button" id="tab-contacts" class="flex-1 py-3 text-sm font-bold border-b-2 border-[#00a884] text-slate-100 min-w-0 transition">Contacts</button>
          <button type="button" id="tab-chat" class="flex-1 py-3 text-sm font-bold text-slate-400 min-w-0 transition hover:text-slate-200">Chat</button>
          <div class="relative flex items-center border-l border-white/[0.07] pl-1 pr-2 shrink-0" id="nav-menu-wrap">
            <button type="button" id="nav-menu-btn" class="px-2 py-2 rounded-lg text-slate-300 hover:bg-white/10 text-xl leading-none" aria-label="More options">⋯</button>
            <div id="nav-menu-panel" class="hidden absolute right-2 top-full mt-2 min-w-[200px] py-2 rounded-2xl bg-[#0d1929] border border-white/[0.1] shadow-2xl z-[60] backdrop-blur-xl">
              <button type="button" id="nav-logout-btn" class="w-full text-left px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10 font-medium">Log out</button>
            </div>
          </div>
        </div>

        <!-- NavRail: desktop only, 68px -->
        <nav class="hidden md:flex flex-col items-center gap-1 bg-[#0d1929] border-r border-white/[0.05] py-4 px-2 shrink-0 overflow-visible" style="width:68px">
          <!-- ST monogram -->
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00a884] to-[#00b894] text-white font-black text-lg flex items-center justify-center mx-auto mb-1 shadow-[0_4px_16px_rgba(0,168,132,0.4)] select-none">ST</div>
          <div class="w-8 h-px bg-white/[0.07] my-2 shrink-0"></div>

          <button type="button" title="Chats" id="nav-chats-btn"
            class="nav-rail-btn active w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 relative group bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/20">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            <div class="absolute left-[calc(100%+10px)] bg-[#0d1929]/95 border border-white/[0.1] text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-[100] shadow-xl font-semibold">Chats</div>
          </button>

          <button type="button" title="Friends" id="nav-friends-btn"
            class="nav-rail-btn w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 shrink-0 relative group">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            <div class="absolute left-[calc(100%+10px)] bg-[#0d1929]/95 border border-white/[0.1] text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-[100] shadow-xl font-semibold">Friends</div>
          </button>

          <button type="button" title="Calls" id="nav-calls-btn"
            class="nav-rail-btn w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 shrink-0 relative group">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            <div class="absolute left-[calc(100%+10px)] bg-[#0d1929]/95 border border-white/[0.1] text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-[100] shadow-xl font-semibold">Calls</div>
          </button>

          <div class="flex-1"></div>

          <!-- Notification bell -->
          <div class="relative mb-1">
            <button id="notif-bell-btn" class="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            </button>
            <span id="notif-badge" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-[#0d1929]"></span>
          </div>

          <div class="w-8 h-px bg-white/[0.07] my-1 shrink-0"></div>

          <button id="nav-stories-btn" class="w-10 h-10 rounded-full border-2 border-[#00a884]/40 p-0.5 hover:border-[#00a884] transition group relative mb-1">
            <img src="https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=00a884" class="w-full h-full rounded-full object-cover" />
            <div class="absolute left-[calc(100%+10px)] bg-[#0d1929]/95 border border-white/[0.1] text-white text-[11px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-[100] shadow-xl font-semibold">Profile</div>
          </button>
        </nav>

        <!-- Sidebar -->
        <aside id="sidebar" class="flex flex-col flex-1 min-h-0 border-r border-white/[0.05] bg-[#0b141a] md:flex md:flex-none md:h-full md:min-h-0 z-20">
          <div id="sidebar-panels" class="flex-1 flex flex-col min-h-0 relative">

            <!-- Chats Panel -->
            <div id="sidebar-panel-chats" class="flex flex-col flex-1 min-h-0 absolute inset-0 transition-all duration-300 opacity-100 translate-x-0">

              <!-- Header -->
              <div class="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-[#00a884]/10 border border-[#00a884]/20 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="text-[#00a884]"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                  </div>
                  <div>
                    <p class="font-bold text-white text-[15px] leading-tight">Sivion Technologies</p>
                    <p class="text-[11px] text-slate-500 leading-tight">IT Division · 25 members</p>
                  </div>
                </div>
                <div class="flex items-center gap-1 text-slate-500">
                  <button class="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center transition hover:text-slate-200" title="New Chat">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                  </button>
                  <button class="w-9 h-9 rounded-xl hover:bg-white/[0.06] flex items-center justify-center transition hover:text-slate-200" title="More">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </button>
                </div>
              </div>

              <!-- Search -->
              <div class="px-4 py-2 shrink-0">
                <div class="relative group">
                  <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#00a884] transition-colors">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  </div>
                  <input id="contact-search" type="search" autocomplete="off" placeholder="Search or start new chat"
                    class="w-full rounded-xl bg-[#1a2733] border-none pl-9 pr-4 py-2.5 text-[13px] focus:outline-none text-slate-200 placeholder-slate-500 transition-all" />
                </div>
              </div>

              <!-- Filter chips -->
              <div class="px-4 py-2 flex items-center gap-2 overflow-x-auto sivion-scroll shrink-0 border-b border-white/[0.05] pb-3">
                <button id="filter-all" data-filter="all" class="px-3.5 py-1 rounded-full bg-[#00a884]/20 text-[#00a884] text-[12px] font-semibold whitespace-nowrap hover:bg-[#00a884]/30 transition shrink-0">All</button>
                <button id="filter-unread" data-filter="unread" class="px-3.5 py-1 rounded-full bg-white/[0.05] text-slate-400 text-[12px] font-semibold whitespace-nowrap hover:bg-white/[0.09] transition shrink-0">Unread <span id="unread-filter-badge" class="hidden ml-0.5 bg-[#00a884] text-[#0b141a] text-[10px] font-black px-1.5 py-0.5 rounded-full"></span></button>
                <button id="filter-groups" data-filter="groups" class="px-3.5 py-1 rounded-full bg-white/[0.05] text-slate-400 text-[12px] font-semibold whitespace-nowrap hover:bg-white/[0.09] transition shrink-0">Groups</button>
              </div>

              <ul id="contacts-list" class="flex-1 overflow-y-auto sivion-scroll p-2 space-y-0.5"></ul>
            </div>

            <!-- Friends Panel -->
            <div id="sidebar-panel-friends" class="flex flex-col flex-1 min-h-0 absolute inset-0 transition-all duration-300 translate-x-full opacity-0 pointer-events-none">
              <div class="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between shrink-0">
                <h2 class="text-[17px] font-bold tracking-tight text-white">Friends</h2>
                <button id="add-friend-btn" class="px-3.5 py-1.5 rounded-xl bg-[#00a884] text-[#0b141a] text-xs font-black hover:brightness-95 transition shadow-sm active:scale-95">+ Add New</button>
              </div>
              <div class="flex border-b border-white/[0.05] px-2 shrink-0">
                <button id="friends-tab-all" class="flex-1 py-3 text-xs font-bold text-[#00a884] border-b-2 border-[#00a884]">All</button>
                <button id="friends-tab-pending" class="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-slate-200 transition relative">
                  Pending
                  <span id="pending-badge" class="hidden absolute top-2 right-3 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">0</span>
                </button>
                <button id="friends-tab-blocked" class="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-slate-200 transition">Blocked</button>
              </div>
              <ul id="friends-list" class="flex-1 overflow-y-auto sivion-scroll p-3"></ul>
            </div>

            <!-- Calls Panel -->
            <div id="sidebar-panel-calls" class="flex flex-col flex-1 min-h-0 absolute inset-0 transition-all duration-300 translate-x-full opacity-0 pointer-events-none">
              <div class="px-5 py-4 border-b border-white/[0.05] shrink-0">
                <h2 class="text-[17px] font-bold tracking-tight text-white">Recent Calls</h2>
              </div>
              <ul id="calls-history" class="flex-1 overflow-y-auto sivion-scroll p-3"></ul>
            </div>
          </div>

          <!-- Bottom profile card -->
          <div class="p-4 border-t border-white/[0.05] shrink-0">
            <div class="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div class="flex items-center gap-3 mb-3">
                <div class="relative shrink-0">
                  <div class="w-10 h-10 rounded-full border-2 border-[#00a884]/40 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=00a884" class="w-full h-full object-cover" />
                  </div>
                  <div class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0b141a]"></div>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[13px] font-bold text-white truncate leading-tight">@${username}</p>
                  <p class="text-[11px] text-slate-500 leading-tight">Software Engineer</p>
                </div>
                <span class="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 shrink-0">Online</span>
              </div>
              <button id="open-settings-btn" class="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 flex items-center gap-2.5 hover:bg-white/[0.08] hover:border-white/[0.12] transition group">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" class="text-slate-500 group-hover:text-[#00a884] transition shrink-0"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0014 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
                <span class="text-[12px] font-bold text-slate-400 group-hover:text-white transition">Settings &amp; Profile</span>
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Chat Panel -->
        <main id="chat-panel" class="hidden md:flex flex-col flex-1 min-h-0 min-w-0 bg-[#0b141a] relative">

          <!-- Empty state -->
          <div id="chat-empty-state" class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[#0b141a] z-10 transition-all duration-500 opacity-100">
            <div class="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#00a884]/20 to-[#00b894]/10 border border-[#00a884]/20 flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(0,168,132,0.15)]">
              <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
                <path d="M16 4C9.373 4 4 9.373 4 16c0 2.12.522 4.12 1.44 5.878L4 28l6.28-1.42A11.944 11.944 0 0016 28c6.627 0 12-5.373 12-12S22.627 4 16 4z" fill="#00a884" fill-opacity="0.7"/>
                <path d="M11 13h10M11 17h7" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-2 tracking-tight">Welcome to Sivion Chat</h3>
            <p class="text-slate-500 max-w-xs leading-relaxed text-[14px]">Your secure enterprise workspace for Sivion Technologies IT team.</p>
            <div class="mt-8 flex flex-wrap gap-3 justify-center">
              <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="text-[#00a884]"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                <span class="text-[12px] font-semibold text-slate-400">Encrypted</span>
              </div>
              <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="text-amber-400"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>
                <span class="text-[12px] font-semibold text-slate-400">Real-time</span>
              </div>
              <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="text-blue-400"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                <span class="text-[12px] font-semibold text-slate-400">Secure</span>
              </div>
            </div>
          </div>

          <!-- Chat header -->
          <header id="chat-header" class="h-16 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#0d1929]/80 shrink-0 relative z-20 transition-all opacity-0 translate-y-[-10px] backdrop-blur-sm">
            <div class="flex items-center gap-3 min-w-0">
              <button id="mobile-back-btn" class="md:hidden p-2 -ml-1 rounded-full text-slate-400 hover:text-white transition">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              </button>
              <div class="relative shrink-0" id="chat-header-avatar-wrap">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a884]/20 to-blue-500/20 border border-white/[0.1] flex items-center justify-center overflow-hidden">
                  <img id="chat-header-avatar" src="" class="w-full h-full object-cover hidden" />
                  <span id="chat-header-initials" class="text-[15px] font-bold text-white">SC</span>
                </div>
                <div id="chat-header-online-dot" class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-[#0d1929]"></div>
              </div>
              <div class="min-w-0">
                <h3 id="chat-header-name" class="font-bold text-white truncate text-[15px] leading-tight">Select a conversation</h3>
                <div class="flex items-center gap-2">
                  <p id="chat-header-status" class="text-[12px] text-slate-500 truncate">—</p>
                  <div id="typing-indicator" class="hidden text-[12px] text-[#00a884] font-bold animate-pulse">typing...</div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button id="header-voice-call" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white/[0.06] hover:text-[#00a884] transition" title="Voice Call">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </button>
              <button id="header-video-call" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white/[0.06] hover:text-[#00a884] transition" title="Video Call">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              </button>
              <div class="w-px h-5 bg-white/[0.07] mx-1"></div>
              <div class="relative">
                <button id="chat-header-menu-btn" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white/[0.06] hover:text-white transition">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </button>
                <div id="chat-header-menu-panel" class="hidden absolute top-full right-0 mt-2 min-w-[220px] py-1.5 rounded-2xl bg-[#0d1929] border border-white/[0.1] shadow-2xl z-[60] backdrop-blur-xl animate-scale-in">
                  <button id="header-view-profile" class="w-full text-left px-4 py-2.5 text-[13px] text-slate-200 hover:bg-white/[0.07] flex items-center gap-3 transition">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" class="text-slate-500"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    Contact Info
                  </button>
                  <button id="header-clear-thread-btn" class="w-full text-left px-4 py-2.5 text-[13px] text-slate-200 hover:bg-white/[0.07] flex items-center gap-3 transition">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" class="text-slate-500"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    Clear Chat
                  </button>
                  <div class="my-1 border-t border-white/[0.06]"></div>
                  <button id="header-block-user" class="w-full text-left px-4 py-2.5 text-[13px] text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z"/></svg>
                    Block Contact
                  </button>
                </div>
              </div>
            </div>
          </header>

          <!-- Messages -->
          <div id="messages-list" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 sivion-scroll bg-[#0b1926]/50 relative z-10 scroll-smooth"></div>

          <!-- Voice recorder UI -->
          <div id="voice-recorder-ui" class="hidden px-5 py-3 border-t border-white/[0.06] bg-black/20 shrink-0 z-20 flex items-center gap-4">
            <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"></div>
            <span id="voice-timer" class="text-rose-400 font-mono text-sm font-bold min-w-[40px]">00:00</span>
            <div id="voice-waveform" class="flex-1 flex items-center gap-0.5 h-8"></div>
            <button id="voice-cancel-btn" type="button" class="px-3 py-1.5 rounded-lg bg-white/[0.06] text-slate-400 text-xs hover:bg-white/[0.1] transition font-semibold">Cancel</button>
          </div>

          <!-- Composer footer -->
          <footer id="chat-footer" class="px-3 py-3 border-t border-white/[0.06] bg-[#0b141a] shrink-0 relative z-20 transition-opacity opacity-0">
            <div class="max-w-5xl mx-auto flex items-end gap-2">
              <!-- Emoji button (outside pill, left) -->
              <button type="button" id="emoji-picker-btn" class="shrink-0 w-10 h-10 flex items-center justify-center text-slate-500 hover:text-[#00a884] transition rounded-full hover:bg-white/[0.06] mb-0.5">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
              </button>

              <!-- Hidden file inputs -->
              <input type="file" id="file-doc-input" class="hidden" accept="*/*" />
              <input type="file" id="file-photo-input" class="hidden" accept="image/*,video/*" multiple />
              <input type="file" id="file-audio-input" class="hidden" accept="audio/*" />

              <!-- Pill input area -->
              <div class="flex-1 relative">
                <div id="attachment-menu-panel" class="hidden absolute bottom-full left-0 mb-3 w-[280px] p-3 rounded-2xl bg-[#0d1929] border border-white/[0.1] shadow-2xl z-[60] backdrop-blur-xl animate-scale-in">
                  <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] px-1 mb-3">Attach</p>
                  <div class="grid grid-cols-4 gap-2">
                    <button id="attach-doc-btn" class="attach-grid-item flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.07] transition active:scale-90 group">
                      <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/25 transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium leading-tight text-center">Document</span>
                    </button>
                    <button id="attach-photo-btn" class="attach-grid-item flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.07] transition active:scale-90 group">
                      <div class="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-500/25 transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium leading-tight text-center">Photos</span>
                    </button>
                    <button id="attach-camera-btn" class="attach-grid-item flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.07] transition active:scale-90 group">
                      <div class="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-500/20 text-violet-400 flex items-center justify-center group-hover:bg-violet-500/25 transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/></svg>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium leading-tight text-center">Camera</span>
                    </button>
                    <button id="attach-audio-btn" class="attach-grid-item flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.07] transition active:scale-90 group">
                      <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500/25 transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium leading-tight text-center">Audio</span>
                    </button>
                    <button id="attach-contact-btn" class="attach-grid-item flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.07] transition active:scale-90 group">
                      <div class="w-11 h-11 rounded-2xl bg-pink-500/15 border border-pink-500/20 text-pink-400 flex items-center justify-center group-hover:bg-pink-500/25 transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium leading-tight text-center">Contact</span>
                    </button>
                    <button id="attach-poll-btn" class="attach-grid-item flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.07] transition active:scale-90 group">
                      <div class="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500/25 transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M5 9h2v10H5zm4-4h2v14H9zm4 8h2v6h-2zm4-6h2v12h-2z"/></svg>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium leading-tight text-center">Poll</span>
                    </button>
                    <button id="attach-event-btn" class="attach-grid-item flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.07] transition active:scale-90 group">
                      <div class="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:bg-rose-500/25 transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium leading-tight text-center">Event</span>
                    </button>
                    <button id="attach-sticker-btn" class="attach-grid-item flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.07] transition active:scale-90 group">
                      <div class="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:bg-orange-500/25 transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium leading-tight text-center">Sticker</span>
                    </button>
                  </div>
                </div>
                <form id="composer-form">
                  <div class="flex items-center bg-[#1a2733] rounded-3xl border border-white/[0.06] focus-within:border-[#00a884]/40 transition-all px-4 gap-2">
                    <textarea id="composer-input" rows="1" placeholder="Type a message..."
                      class="flex-1 bg-transparent focus:outline-none text-[14px] text-slate-100 placeholder-slate-600 resize-none sivion-scroll min-h-[44px] max-h-[150px] py-3"></textarea>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button id="attachment-btn" type="button" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>
                      </button>
                      <button id="camera-input-btn" type="button" class="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white transition">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/></svg>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Circular mic/send button -->
              <div class="shrink-0 relative w-11 h-11">
                <button type="button" id="voice-record-btn" class="absolute inset-0 w-full h-full rounded-full bg-[#00a884] text-[#0b141a] flex items-center justify-center shadow-[0_4px_16px_rgba(0,168,132,0.4)] hover:brightness-105 transition active:scale-90">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                </button>
                <button type="submit" form="composer-form" id="send-btn" class="hidden absolute inset-0 w-full h-full rounded-full bg-[#00a884] text-[#0b141a] flex items-center justify-center shadow-[0_4px_16px_rgba(0,168,132,0.4)] hover:brightness-105 transition active:scale-90">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
                <div id="composer-more-options" class="absolute bottom-full right-0 mb-3 hidden p-2 rounded-2xl bg-[#0d1929] border border-white/[0.1] shadow-2xl animate-scale-in">
                  <button id="schedule-message-btn" type="button" class="flex items-center gap-3 px-4 py-2.5 text-[13px] text-slate-200 hover:bg-white/[0.07] rounded-xl whitespace-nowrap">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="text-amber-400"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    Schedule Message
                  </button>
                </div>
              </div>
            </div>
          </footer>

          <!-- Active call modal -->
          <div id="active-call-modal" class="hidden absolute inset-0 z-[100] bg-[#060d18]/97 flex flex-col animate-fade-in">
            <div class="relative flex-1 flex items-center justify-center overflow-hidden">
              <video id="remote-video" autoplay playsinline class="hidden w-full h-full object-cover"></video>
              <audio id="remote-audio" autoplay></audio>
              <div id="call-avatar-fallback" class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-[#0d1929] to-[#060d18]">
                <div class="relative mb-6">
                  <div class="w-28 h-28 rounded-full border-4 border-[#00a884]/50 overflow-hidden shadow-[0_0_48px_rgba(0,168,132,0.3)] animate-pulse">
                    <img id="active-call-avatar" src="" class="w-full h-full object-cover" alt="" />
                  </div>
                  <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00a884] text-[#0b141a] text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">On Call</div>
                </div>
                <h2 id="active-call-name" class="text-3xl font-bold text-white mb-2 tracking-tight">...</h2>
                <p id="active-call-status" class="text-slate-400 text-base animate-pulse">Connecting...</p>
              </div>
              <div id="local-video-container" class="hidden absolute bottom-6 right-6 w-32 h-44 bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20">
                <video id="local-video" autoplay muted playsinline class="w-full h-full object-cover"></video>
              </div>
            </div>
            <div class="h-28 bg-gradient-to-t from-black/80 to-transparent shrink-0 flex items-center justify-center gap-6 px-6 pb-6">
              <button id="toggle-mic-btn" class="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition active:scale-90 backdrop-blur-md" title="Mute">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              </button>
              <button id="end-call-btn" class="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white hover:bg-rose-600 transition active:scale-90 shadow-[0_0_24px_rgba(244,63,94,0.5)]" title="End Call">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
              </button>
              <button id="toggle-video-btn" class="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition active:scale-90 backdrop-blur-md" title="Camera">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              </button>
            </div>
          </div>
        </main>

        <!-- Add Friend Overlay -->
        <div id="add-friend-overlay" class="hidden absolute inset-0 z-[110] flex items-center justify-center p-6 bg-[#0b141a]/85 backdrop-blur-sm animate-fade-in">
          <div class="w-full max-w-sm bg-[#111b21] rounded-[24px] border border-white/[0.08] shadow-[0_32px_64px_rgba(0,0,0,0.7)] p-7 animate-scale-in">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-9 h-9 rounded-xl bg-[#00a884]/10 border border-[#00a884]/20 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="text-[#00a884]"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <h3 class="text-[17px] font-bold text-white">Add a Friend</h3>
            </div>
            <p class="text-[13px] text-slate-500 mb-5">Enter their exact username to send a friend request.</p>
            <input id="add-friend-input" type="text" placeholder="Username..."
              class="w-full rounded-xl bg-black/30 border border-white/[0.08] px-4 py-3 text-[14px] focus:outline-none focus:border-[#00a884]/60 text-slate-100 placeholder-slate-600 transition mb-2" />
            <p id="add-friend-feedback" class="text-[12px] text-rose-400 min-h-4 mb-4"></p>
            <div class="flex gap-2 justify-end">
              <button id="add-friend-cancel" class="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition">Cancel</button>
              <button id="add-friend-submit" class="px-5 py-2 rounded-xl bg-[#00a884] text-[#0b141a] text-[13px] font-black hover:brightness-105 transition shadow-[0_4px_16px_rgba(0,168,132,0.3)] active:scale-95">Send Request</button>
            </div>
          </div>
        </div>

        <!-- Incoming call dialog -->
        <div id="incoming-call-dialog" class="hidden fixed bottom-6 right-6 z-[150] w-80 rounded-3xl border border-white/[0.1] shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-5 backdrop-blur-xl animate-scale-in bg-[#0f1923]/95">
          <div class="flex items-center gap-4 mb-5">
            <div class="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#00a884]/50 shadow-lg shrink-0">
              <img id="incoming-call-avatar" src="" class="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <p class="text-white font-bold text-[15px] mb-0.5" id="incoming-call-name">Unknown</p>
              <p class="text-[11px] font-bold text-[#00a884] uppercase tracking-wider" id="incoming-call-type">Voice Call</p>
            </div>
          </div>
          <div class="flex gap-3">
            <button id="decline-call-btn" class="flex-1 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/20 text-rose-400 font-bold text-[13px] hover:bg-rose-500/25 transition active:scale-95">Decline</button>
            <button id="accept-call-btn" class="flex-1 py-2.5 rounded-2xl bg-[#00a884] text-[#0b141a] font-bold text-[13px] hover:brightness-105 transition active:scale-95 shadow-[0_4px_16px_rgba(0,168,132,0.35)]">Accept</button>
          </div>
        </div>

        <!-- Settings Overlay -->
        <div id="settings-overlay" class="hidden fixed inset-0 z-[100] bg-[#0a1628] flex transition-opacity duration-300 opacity-0">
          <!-- Left nav -->
          <div class="w-full md:w-[300px] bg-[#0d1929] border-r border-white/[0.06] flex flex-col shrink-0 absolute md:relative z-20 h-full" id="settings-nav-sidebar">
            <!-- Header -->
            <div class="px-5 pt-7 pb-4 shrink-0 flex items-center gap-3 border-b border-white/[0.06]">
              <button id="settings-back-btn" class="md:hidden text-slate-400 hover:text-white transition mr-1">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              </button>
              <div class="w-8 h-8 rounded-xl bg-[#00a884]/10 border border-[#00a884]/20 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="text-[#00a884]"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0014 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
              </div>
              <h2 class="text-[17px] font-bold text-white">Settings</h2>
            </div>

            <!-- Nav list -->
            <div class="flex-1 overflow-y-auto sivion-scroll py-3 px-2 space-y-0.5" id="settings-nav-list">
              <button class="settings-nav-btn active flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[#00a884] bg-[#00a884]/10 transition text-[13px] font-semibold" data-target="settings-general">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0014 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
                General
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-profile">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                Profile
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-account">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                Account
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-privacy">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                Privacy
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-chats">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                Chats
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-video-voice">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                Video &amp; Voice
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-notifications">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
                Notifications
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-link-device">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v4h-2v-4zm3 3h3v2h-3v-2z"/></svg>
                Link a Device
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-shortcuts">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>
                Keyboard Shortcuts
              </button>
              <button class="settings-nav-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 transition text-[13px] font-semibold" data-target="settings-help">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>
                Help &amp; Feedback
              </button>

              <div class="h-px w-full bg-white/[0.06] my-2"></div>
              <button id="settings-logout-btn" class="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition text-[13px] font-semibold">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="shrink-0"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
                Log out
              </button>
            </div>
          </div>

          <!-- Right content area -->
          <div class="flex-1 bg-[#0b141a] flex flex-col relative overflow-hidden hidden md:flex" id="settings-content-area">
            <div class="absolute top-5 right-6 z-20 flex flex-col items-center">
              <button id="close-settings-overlay-btn" class="w-9 h-9 rounded-full border border-slate-600/60 text-slate-500 flex items-center justify-center hover:bg-white/[0.06] hover:text-white hover:border-slate-400 transition">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
              <span class="text-[9px] text-slate-600 font-bold mt-1">ESC</span>
            </div>

            <div class="flex-1 overflow-y-auto sivion-scroll p-8 md:p-12 max-w-[760px] mx-auto w-full">
              <button id="settings-mobile-back-btn" class="md:hidden flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                <span class="text-sm font-semibold">Back to Settings</span>
              </button>

              <!-- General -->
              <div id="settings-general" class="settings-section animate-fade-in block">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">General</h3>
                <div class="space-y-4">
                  <div class="bg-[#111b21] rounded-2xl p-6 border border-white/[0.06]">
                    <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-5">App Preferences</h4>
                    <div class="flex items-center justify-between mb-5">
                      <div>
                        <p class="text-white text-[14px] font-medium mb-0.5">Theme</p>
                        <p class="text-slate-500 text-[12px]">Choose your preferred appearance</p>
                      </div>
                      <select id="setting-theme" class="bg-[#1a2733] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition">
                        <option value="system">System Default</option>
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>
                    <div class="flex items-center justify-between mb-5">
                      <div>
                        <p class="text-white text-[14px] font-medium mb-0.5">Language</p>
                        <p class="text-slate-500 text-[12px]">App display language</p>
                      </div>
                      <select id="setting-language" class="bg-[#1a2733] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition">
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-white text-[14px] font-medium mb-0.5">Auto Launch</p>
                        <p class="text-slate-500 text-[12px]">Start SivionChat when you log in</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="setting-autoLaunch" class="sr-only peer">
                        <div class="w-11 h-6 bg-[#1a2733] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                      </label>
                    </div>
                  </div>
                  <div class="bg-[#111b21] rounded-2xl p-6 border border-white/[0.06]">
                    <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-5">Typing</h4>
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-white text-[14px] font-medium mb-0.5">Enter to Send</p>
                        <p class="text-slate-500 text-[12px]">Send messages by pressing Enter</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="setting-enterToSend" class="sr-only peer" checked>
                        <div class="w-11 h-6 bg-[#1a2733] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <button id="settings-save-general-btn" class="mt-5 w-full py-3 rounded-xl bg-[#00a884] text-[#0b141a] font-black text-[13px] hover:brightness-105 transition active:scale-[0.99] shadow-[0_4px_16px_rgba(0,168,132,0.25)]">Save Changes</button>
              </div>

              <!-- Profile -->
              <div id="settings-profile" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Profile</h3>
                <div class="bg-[#111b21] rounded-2xl p-7 border border-white/[0.06] flex flex-col items-center text-center mb-5">
                  <div id="avatar-upload-btn" class="w-28 h-28 rounded-full border-[3px] border-[#00a884]/60 overflow-hidden mb-4 shadow-xl cursor-pointer group relative">
                    <img src="https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=00a884" id="settings-avatar-preview" class="w-full h-full object-cover group-hover:opacity-70 transition" />
                    <div class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M4 4h3l2-2h6l2 2h3c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm8 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/></svg>
                      <span class="text-[10px] font-bold text-white mt-1 uppercase tracking-wider">Change</span>
                    </div>
                  </div>
                  <input type="file" id="avatar-file-input" accept="image/*" class="hidden" />
                  <h2 class="text-xl font-bold text-white mb-1">@${username}</h2>
                  <span class="text-[#00a884] text-[12px] font-semibold">Online</span>
                </div>
                <div class="space-y-4">
                  <div class="bg-[#111b21] rounded-2xl p-5 border border-white/[0.06]">
                    <label class="block text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-3">About</label>
                    <input id="setting-bio" type="text" class="w-full bg-[#1a2733] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition" placeholder="Hey there! I am using SivionChat." />
                  </div>
                  <div class="bg-[#111b21] rounded-2xl p-5 border border-white/[0.06] space-y-4">
                    <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider">Contact Info</h4>
                    <div>
                      <label class="block text-slate-500 text-[11px] font-semibold mb-2 uppercase tracking-wider">Phone Number</label>
                      <input id="setting-phone" type="tel" class="w-full bg-[#1a2733] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div>
                      <label class="block text-slate-500 text-[11px] font-semibold mb-2 uppercase tracking-wider">Email Address</label>
                      <input id="setting-email" type="email" class="w-full bg-[#1a2733] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition" placeholder="you@siviontech.com" />
                    </div>
                  </div>
                </div>
                <button id="settings-save-profile-btn" class="mt-5 w-full py-3 rounded-xl bg-[#00a884] text-[#0b141a] font-black text-[13px] hover:brightness-105 transition active:scale-[0.99] shadow-[0_4px_16px_rgba(0,168,132,0.25)]">Save Profile</button>
              </div>

              <!-- Account -->
              <div id="settings-account" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Account</h3>
                <div class="space-y-3">
                  <button class="w-full bg-[#111b21] hover:bg-[#15222b] transition rounded-2xl p-5 border border-white/[0.06] flex items-center gap-4 text-left group">
                    <div class="w-9 h-9 rounded-xl bg-[#1a2733] flex items-center justify-center text-slate-400 group-hover:text-white transition shrink-0">
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                    </div>
                    <span class="text-white font-medium text-[14px] flex-1">Change Password</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="text-slate-600"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                  </button>
                  <button class="w-full bg-[#111b21] hover:bg-[#15222b] transition rounded-2xl p-5 border border-white/[0.06] flex items-center gap-4 text-left group">
                    <div class="w-9 h-9 rounded-xl bg-[#1a2733] flex items-center justify-center text-slate-400 group-hover:text-white transition shrink-0">
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                    </div>
                    <span class="text-white font-medium text-[14px] flex-1">Two-step Verification</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="text-slate-600"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                  </button>
                  <button id="settings-save-account-btn" class="hidden"></button>
                  <button class="w-full bg-[#111b21] hover:bg-[#1a1a1a] transition rounded-2xl p-5 border border-rose-500/10 flex items-center gap-4 text-left group">
                    <div class="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:bg-rose-500/20 transition shrink-0">
                      <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12V5z"/></svg>
                    </div>
                    <span class="text-rose-400 font-medium text-[14px] flex-1">Delete Account</span>
                  </button>
                </div>
              </div>

              <!-- Privacy -->
              <div id="settings-privacy" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Privacy</h3>
                <div class="space-y-4">
                  <div class="bg-[#111b21] rounded-2xl p-6 border border-white/[0.06]">
                    <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-5">Visibility</h4>
                    <div class="flex items-center justify-between mb-5">
                      <div>
                        <p class="text-white text-[14px] font-medium mb-0.5">Last Seen and Online</p>
                        <p class="text-slate-500 text-[12px]">Who can see when you were last active</p>
                      </div>
                      <select id="setting-lastSeenVisibility" class="bg-[#1a2733] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition">
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Contacts</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-white text-[14px] font-medium mb-0.5">Profile Photo</p>
                        <p class="text-slate-500 text-[12px]">Who can see your profile photo</p>
                      </div>
                      <select id="setting-profilePhotoVisibility" class="bg-[#1a2733] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition">
                        <option value="everyone">Everyone</option>
                        <option value="contacts">My Contacts</option>
                        <option value="nobody">Nobody</option>
                      </select>
                    </div>
                  </div>
                  <div class="bg-[#111b21] rounded-2xl p-6 border border-white/[0.06]">
                    <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-5">Messaging</h4>
                    <div class="flex items-center justify-between mb-5">
                      <div class="pr-4">
                        <p class="text-white text-[14px] font-medium mb-0.5">Read Receipts</p>
                        <p class="text-slate-500 text-[12px] leading-relaxed">If turned off, you won't send or receive read receipts.</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" id="setting-readReceipts" class="sr-only peer" checked>
                        <div class="w-11 h-6 bg-[#1a2733] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                      </label>
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-white text-[14px] font-medium mb-0.5">Default Message Timer</p>
                        <p class="text-slate-500 text-[12px]">Start new chats with disappearing messages</p>
                      </div>
                      <select id="setting-disappearingMessages" class="bg-[#1a2733] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition">
                        <option value="off">Off</option>
                        <option value="24h">24 hours</option>
                        <option value="7d">7 days</option>
                        <option value="90d">90 days</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Chats -->
              <div id="settings-chats" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Chats</h3>
                <div class="space-y-4">
                  <div class="bg-[#111b21] rounded-2xl p-6 border border-white/[0.06]">
                    <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-5">Chat Themes</h4>
                    <div id="theme-picker-container" class="grid grid-cols-3 gap-3"></div>
                  </div>
                  <div class="bg-[#111b21] rounded-2xl p-6 border border-white/[0.06]">
                    <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-5">Display</h4>
                    <div class="flex items-center justify-between mb-5">
                      <div>
                        <p class="text-white text-[14px] font-medium mb-0.5">Chat Wallpaper</p>
                        <p class="text-slate-500 text-[12px]">Customize chat background</p>
                      </div>
                      <select id="setting-wallpaper" class="bg-[#1a2733] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition">
                        <option value="default">Default</option>
                        <option value="solid_dark">Solid Dark</option>
                        <option value="doodles">Doodles</option>
                      </select>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-white text-[14px] font-medium">Font Size</p>
                      <select id="setting-fontSize" class="bg-[#1a2733] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-[13px] focus:outline-none focus:border-[#00a884]/60 transition">
                        <option value="small">Small</option>
                        <option value="medium" selected>Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                  <div class="bg-[#111b21] rounded-2xl p-5 border border-white/[0.06]">
                    <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-4">Chat Backup</h4>
                    <button class="w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-[13px] font-semibold hover:bg-white/[0.09] transition">Backup Now</button>
                  </div>
                </div>
              </div>

              <!-- Video & Voice -->
              <div id="settings-video-voice" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Video &amp; Voice</h3>
                <div class="bg-[#111b21] rounded-2xl p-6 border border-white/[0.06]">
                  <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-5">Audio Settings</h4>
                  <div class="flex items-center justify-between mb-5">
                    <p class="text-white text-[14px] font-medium">Noise Cancellation</p>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id="setting-noiseCancellation" class="sr-only peer" checked>
                      <div class="w-11 h-6 bg-[#1a2733] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="text-white text-[14px] font-medium">Voice Activity Detection (VAD)</p>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id="setting-vad" class="sr-only peer" checked>
                      <div class="w-11 h-6 bg-[#1a2733] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Notifications -->
              <div id="settings-notifications" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Notifications</h3>
                <div class="bg-[#111b21] rounded-2xl p-6 border border-white/[0.06]">
                  <h4 class="text-[#00a884] text-[11px] font-black uppercase tracking-wider mb-5">Message Notifications</h4>
                  <div class="flex items-center justify-between mb-5">
                    <p class="text-white text-[14px] font-medium">Show Notifications</p>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id="setting-messageNotifications" class="sr-only peer" checked>
                      <div class="w-11 h-6 bg-[#1a2733] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="text-white text-[14px] font-medium">Message Sounds</p>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id="setting-soundToggle" class="sr-only peer" checked>
                      <div class="w-11 h-6 bg-[#1a2733] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Link a Device -->
              <div id="settings-link-device" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Link a Device</h3>
                <div class="bg-[#111b21] rounded-2xl p-8 border border-white/[0.06] text-center">
                  <div class="relative w-48 h-48 bg-white p-3 rounded-2xl mx-auto mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" id="settings-qr-container">
                    <img id="settings-qr-image" src="" alt="QR Code" class="w-full h-full object-contain opacity-0 transition-opacity duration-300" />
                    <div id="settings-qr-loading" class="absolute inset-0 flex items-center justify-center rounded-2xl bg-white">
                      <svg class="animate-spin w-8 h-8 text-sivion-emerald" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    </div>
                    <div id="settings-qr-expired" class="absolute inset-0 hidden flex-col items-center justify-center gap-2 rounded-2xl bg-black/70">
                      <span class="text-white text-xs font-semibold">Expired</span>
                      <button id="settings-qr-refresh" class="px-3 py-1 bg-sivion-emerald text-white text-xs rounded-lg font-bold hover:bg-emerald-500 transition-colors">Refresh</button>
                    </div>
                  </div>
                  <p class="text-white font-bold text-[15px] mb-2">Scan with your mobile app</p>
                  <p class="text-slate-500 text-[13px] mb-3">To link your account to another device securely.</p>
                  <p id="settings-qr-status" class="text-sivion-emerald text-[13px] animate-pulse mb-1">Generating QR code...</p>
                  <p id="settings-qr-expiry" class="text-slate-500 text-[12px]"></p>
                </div>
              </div>

              <!-- Shortcuts -->
              <div id="settings-shortcuts" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Keyboard Shortcuts</h3>
                <div class="bg-[#111b21] rounded-2xl border border-white/[0.06] divide-y divide-white/[0.05]">
                  <div class="p-4 flex items-center justify-between">
                    <span class="text-slate-300 text-[14px]">Close Settings</span>
                    <kbd class="px-2 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[11px] font-bold text-slate-400">ESC</kbd>
                  </div>
                  <div class="p-4 flex items-center justify-between">
                    <span class="text-slate-300 text-[14px]">Search Chats</span>
                    <kbd class="px-2 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[11px] font-bold text-slate-400">CTRL + F</kbd>
                  </div>
                  <div class="p-4 flex items-center justify-between">
                    <span class="text-slate-300 text-[14px]">New Message</span>
                    <kbd class="px-2 py-1 rounded-lg bg-white/[0.05] border border-white/[0.1] text-[11px] font-bold text-slate-400">CTRL + N</kbd>
                  </div>
                </div>
              </div>

              <!-- Help -->
              <div id="settings-help" class="settings-section hidden animate-fade-in">
                <h3 class="text-[26px] font-bold text-white mb-7 tracking-tight">Help &amp; Feedback</h3>
                <div class="space-y-3">
                  <button class="w-full bg-[#111b21] hover:bg-[#15222b] transition rounded-2xl p-5 border border-white/[0.06] flex items-center justify-between text-left group">
                    <span class="text-white font-medium text-[14px]">Help Center</span>
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="text-slate-600 group-hover:text-slate-300 transition"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                  </button>
                  <button class="w-full bg-[#111b21] hover:bg-[#15222b] transition rounded-2xl p-5 border border-white/[0.06] flex items-center justify-between text-left group">
                    <span class="text-white font-medium text-[14px]">Contact Support</span>
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" class="text-slate-600 group-hover:text-slate-300 transition"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Notification Panel ────────────────────────────────────────────── -->
    <div id="notif-panel" class="hidden fixed left-[76px] top-4 bottom-4 w-[320px] z-[120] flex flex-col rounded-[24px] bg-[#0d1929] border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.7)] animate-scale-in overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
        <div>
          <h3 class="text-white font-bold text-[15px]">Notifications</h3>
          <p id="notif-count-label" class="text-[11px] text-slate-500 mt-0.5">No new notifications</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="notif-clear-all-btn" class="text-[11px] font-semibold text-[#00a884] hover:text-[#00b894] transition hidden">Clear all</button>
          <button id="notif-close-btn" class="w-7 h-7 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] transition flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>
      <ul id="notif-list" class="flex-1 overflow-y-auto sivion-scroll py-2">
        <li class="px-4 py-10 text-center text-slate-600 text-[13px]">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" class="mx-auto mb-3 opacity-40"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
          All caught up!
        </li>
      </ul>
    </div>
    <!-- Notif backdrop -->
    <div id="notif-backdrop" class="hidden fixed inset-0 z-[119]"></div>

    <!-- ── Camera Modal ────────────────────────────────────────────────────── -->
    <div id="camera-modal" class="hidden fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div class="bg-[#0d1929] rounded-[28px] border border-white/[0.08] shadow-2xl w-full max-w-lg overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 class="text-white font-bold text-[15px]">Take Photo</h3>
          <button id="close-camera-modal" class="w-8 h-8 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] transition flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="p-4">
          <div class="relative bg-black rounded-2xl overflow-hidden aspect-video mb-4">
            <video id="camera-preview" autoplay playsinline class="w-full h-full object-cover"></video>
            <canvas id="camera-canvas" class="hidden w-full h-full object-cover absolute inset-0"></canvas>
            <div id="camera-captured-preview" class="hidden absolute inset-0">
              <img id="camera-captured-img" src="" class="w-full h-full object-cover" alt="captured" />
            </div>
          </div>
          <div id="camera-controls-live" class="flex gap-3">
            <button id="camera-cancel-btn" class="flex-1 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.07] text-slate-300 font-semibold text-[14px] hover:bg-white/[0.09] transition">Cancel</button>
            <button id="camera-capture-btn" class="flex-1 py-3 rounded-2xl bg-[#00a884] text-[#0b141a] font-bold text-[14px] hover:brightness-105 transition shadow-[0_4px_16px_rgba(0,168,132,0.4)]">
              <span class="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
                Capture
              </span>
            </button>
          </div>
          <div id="camera-controls-captured" class="hidden flex gap-3">
            <button id="camera-retake-btn" class="flex-1 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.07] text-slate-300 font-semibold text-[14px] hover:bg-white/[0.09] transition">Retake</button>
            <button id="camera-send-btn" class="flex-1 py-3 rounded-2xl bg-[#00a884] text-[#0b141a] font-bold text-[14px] hover:brightness-105 transition shadow-[0_4px_16px_rgba(0,168,132,0.4)]">Send Photo</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Contact Picker Modal ────────────────────────────────────────────── -->
    <div id="contact-modal" class="hidden fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div class="bg-[#0d1929] rounded-[28px] border border-white/[0.08] shadow-2xl w-full max-w-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 class="text-white font-bold text-[15px]">Share Contact</h3>
          <button id="close-contact-modal" class="w-8 h-8 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] transition flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="p-4">
          <input id="contact-search-input" type="text" placeholder="Search users..." class="w-full px-4 py-2.5 mb-3 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none" />
          <ul id="contact-picker-list" class="max-h-[240px] overflow-y-auto space-y-1 sivion-scroll mb-4"></ul>
          <button id="contact-send-btn" disabled class="w-full py-3 rounded-2xl bg-[#00a884] disabled:opacity-40 text-[#0b141a] font-bold text-[14px] hover:brightness-105 disabled:cursor-not-allowed transition shadow-[0_4px_16px_rgba(0,168,132,0.4)]">Share Contact</button>
        </div>
      </div>
    </div>

    <!-- ── Poll Creator Modal ──────────────────────────────────────────────── -->
    <div id="poll-modal" class="hidden fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div class="bg-[#0d1929] rounded-[28px] border border-white/[0.08] shadow-2xl w-full max-w-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 class="text-white font-bold text-[15px]">Create Poll</h3>
          <button id="close-poll-modal" class="w-8 h-8 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] transition flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="p-4 space-y-3">
          <input id="poll-question" type="text" placeholder="Ask a question..." class="w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none" />
          <div id="poll-options-list" class="space-y-2">
            <input type="text" placeholder="Option 1" class="poll-option-input w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none" />
            <input type="text" placeholder="Option 2" class="poll-option-input w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none" />
          </div>
          <button id="poll-add-option-btn" class="flex items-center gap-2 text-[12px] text-[#00a884] font-semibold hover:text-[#00b894] transition">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            Add Option
          </button>
          <button id="poll-send-btn" class="w-full py-3 rounded-2xl bg-[#00a884] text-[#0b141a] font-bold text-[14px] hover:brightness-105 transition shadow-[0_4px_16px_rgba(0,168,132,0.4)]">Send Poll</button>
        </div>
      </div>
    </div>

    <!-- ── Event Creator Modal ─────────────────────────────────────────────── -->
    <div id="event-modal" class="hidden fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div class="bg-[#0d1929] rounded-[28px] border border-white/[0.08] shadow-2xl w-full max-w-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 class="text-white font-bold text-[15px]">Create Event</h3>
          <button id="close-event-modal" class="w-8 h-8 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] transition flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="p-4 space-y-3">
          <input id="event-title" type="text" placeholder="Event title" class="w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none" />
          <input id="event-datetime" type="datetime-local" class="w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white focus:border-[#00a884]/50 focus:outline-none" />
          <input id="event-location" type="text" placeholder="Location (optional)" class="w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none" />
          <textarea id="event-desc" rows="2" placeholder="Description (optional)" class="w-full px-4 py-2.5 rounded-xl bg-[#111b21] border border-white/[0.07] text-[13px] text-white placeholder-slate-600 focus:border-[#00a884]/50 focus:outline-none resize-none"></textarea>
          <button id="event-send-btn" class="w-full py-3 rounded-2xl bg-[#00a884] text-[#0b141a] font-bold text-[14px] hover:brightness-105 transition shadow-[0_4px_16px_rgba(0,168,132,0.4)]">Send Event</button>
        </div>
      </div>
    </div>

    <!-- ── Sticker Picker Modal ────────────────────────────────────────────── -->
    <div id="sticker-modal" class="hidden fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div class="bg-[#0d1929] rounded-[28px] border border-white/[0.08] shadow-2xl w-full max-w-xs overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 class="text-white font-bold text-[15px]">Stickers</h3>
          <button id="close-sticker-modal" class="w-8 h-8 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] transition flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-5 gap-2">
            ${["😀","😂","🥰","😎","🤩","😭","🤔","😴","🥳","🤯","👏","🔥","💯","✨","❤️","🎉","🚀","💪","👍","🙏","😅","🤣","😊","😉","🫡"].map(e => `<button class="sticker-btn text-3xl w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white/[0.08] transition active:scale-90" data-sticker="${e}">${e}</button>`).join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- ── Image Lightbox ──────────────────────────────────────────────────── -->
    <div id="img-lightbox" class="hidden fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in cursor-zoom-out">
      <img id="img-lightbox-src" src="" class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" alt="full size" />
      <button id="img-lightbox-close" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
    </div>

  `;
}

export function authTemplate() {
  return `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#060d18] via-[#0b141a] to-[#061018] p-4 relative overflow-hidden">
      <!-- Animated blobs -->
      <div class="auth-blob auth-blob-1"></div>
      <div class="auth-blob auth-blob-2"></div>
      <div class="auth-blob auth-blob-3"></div>

      <!-- Above card: company identity -->
      <div class="relative z-10 flex flex-col items-center mb-8 animate-fade-in">
        <div class="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#00a884] to-[#00b894] flex items-center justify-center mb-4 shadow-[0_8px_32px_rgba(0,168,132,0.45)] sivion-logo-pulse">
          <svg viewBox="0 0 32 32" width="34" height="34" fill="none">
            <path d="M16 4C9.373 4 4 9.373 4 16c0 2.12.522 4.12 1.44 5.878L4 28l6.28-1.42A11.944 11.944 0 0016 28c6.627 0 12-5.373 12-12S22.627 4 16 4z" fill="white" fill-opacity="0.95"/>
            <path d="M11 13h10M11 17h7" stroke="#00a884" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="text-[22px] font-black text-white tracking-tight leading-none mb-1">Sivion Technologies</h1>
        <span class="px-3 py-0.5 rounded-full bg-[#00a884]/15 border border-[#00a884]/25 text-[#00a884] text-[11px] font-bold tracking-[0.12em] uppercase">Enterprise Suite</span>
      </div>

      <!-- Auth card -->
      <div class="w-full max-w-md relative z-10 animate-scale-in">
        <div class="bg-[#111b21] rounded-[28px] border border-white/[0.08] shadow-[0_40px_80px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
          <!-- Top gradient line -->
          <div class="h-px w-full bg-gradient-to-r from-transparent via-[#00a884]/50 to-transparent"></div>

          <div class="p-8">
            <!-- Tabs -->
            <div class="flex bg-black/30 rounded-2xl p-1.5 mb-8 border border-white/[0.05]">
              <button id="tab-login" class="auth-tab flex-1 py-2.5 rounded-xl bg-[#00a884] text-[#0b141a] text-sm font-black transition-all duration-200 shadow-sm">Login</button>
              <button id="tab-signup" class="auth-tab flex-1 py-2.5 rounded-xl text-slate-400 text-sm font-semibold transition-all duration-200 hover:text-slate-200">Sign up</button>
            </div>

            <!-- Form -->
            <form id="auth-form" class="space-y-4">
              <!-- Username -->
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#00a884] transition-colors duration-200">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <input id="username" name="username" type="text" placeholder="Username" required
                  class="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/[0.08] focus:border-[#00a884]/60 focus:outline-none text-white placeholder-slate-600 text-sm transition-all duration-200" />
              </div>

              <!-- Phone (signup only) -->
              <div id="phone-field" class="relative group hidden">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#00a884] transition-colors duration-200">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                </div>
                <input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000"
                  class="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/[0.08] focus:border-[#00a884]/60 focus:outline-none text-white placeholder-slate-600 text-sm transition-all duration-200" />
              </div>

              <!-- Password -->
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#00a884] transition-colors duration-200">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                </div>
                <input id="password" name="password" type="password" placeholder="••••••••" required
                  class="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/[0.08] focus:border-[#00a884]/60 focus:outline-none text-white placeholder-slate-600 text-sm transition-all duration-200" />
              </div>

              <button type="submit"
                class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00a884] to-[#00b894] text-[#0b141a] font-black text-[15px] hover:brightness-105 active:scale-[0.98] transition-all duration-200 shadow-[0_8px_24px_rgba(0,168,132,0.35)] mt-2 tracking-wide">
                Continue →
              </button>
            </form>

            <!-- Divider -->
            <div class="flex items-center gap-3 my-6">
              <div class="flex-1 h-px bg-white/[0.07]"></div>
              <span class="text-slate-600 text-xs font-semibold">or</span>
              <div class="flex-1 h-px bg-white/[0.07]"></div>
            </div>

            <!-- QR Login button -->
            <button id="qr-login-btn"
              class="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] transition-all duration-200 text-slate-300 hover:text-white text-sm font-semibold">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="text-[#00a884]"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v4h-2v-4zm3 3h3v2h-3v-2z"/></svg>
              Sign in with QR Code
            </button>

            <p id="auth-feedback" class="text-sm mt-5 text-rose-300 text-center min-h-5 font-medium animate-pulse"></p>
          </div>
        </div>

        <!-- Trust badges -->
        <div class="flex items-center justify-center gap-6 mt-6">
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-[#00a884]"></div>
            <span class="text-[11px] text-slate-500 font-medium">E2E Encrypted</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            <span class="text-[11px] text-slate-500 font-medium">SOC 2 Certified</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
            <span class="text-[11px] text-slate-500 font-medium">ISO 27001</span>
          </div>
        </div>
        <p class="text-center text-[11px] text-slate-700 mt-3">© 2026 Sivion Technologies. All rights reserved.</p>
      </div>

      <!-- QR Login Modal -->
      <div id="qr-login-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0b141a]/90 backdrop-blur-md animate-fade-in">
        <div class="w-full max-w-[360px] bg-[#0f1923] border border-white/[0.08] rounded-[32px] shadow-[0_40px_80px_rgba(0,0,0,0.8)] p-8 relative animate-scale-in flex flex-col items-center text-center">
          <button id="close-qr-modal" class="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/[0.07] hover:text-white transition">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>

          <div class="w-14 h-14 rounded-2xl bg-[#00a884]/10 border border-[#00a884]/20 flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" class="text-[#00a884]"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v4h-2v-4zm3 3h3v2h-3v-2z"/></svg>
          </div>

          <h3 class="text-xl font-black text-white mb-1 tracking-tight">Scan to Sign In</h3>
          <p class="text-[13px] text-slate-500 mb-6 leading-relaxed">Open Sivion on your phone and scan this QR code</p>

          <!-- Step indicators -->
          <div class="flex items-center gap-2 mb-6">
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.07]">
              <span class="w-4 h-4 rounded-full bg-[#00a884] text-[#0b141a] text-[9px] font-black flex items-center justify-center">1</span>
              <span class="text-[11px] text-slate-400 font-semibold">Open App</span>
            </div>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" class="text-slate-600"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.07]">
              <span class="w-4 h-4 rounded-full bg-[#00a884] text-[#0b141a] text-[9px] font-black flex items-center justify-center">2</span>
              <span class="text-[11px] text-slate-400 font-semibold">Scan</span>
            </div>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" class="text-slate-600"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.07]">
              <span class="w-4 h-4 rounded-full bg-slate-600 text-white text-[9px] font-black flex items-center justify-center">3</span>
              <span class="text-[11px] text-slate-400 font-semibold">Done</span>
            </div>
          </div>

          <div class="w-[200px] h-[200px] bg-white rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] mb-6 relative overflow-hidden">
            <img id="qr-image" src="" class="w-full h-full object-contain opacity-0 transition-opacity duration-300" />
            <div id="qr-loading" class="absolute inset-0 flex items-center justify-center bg-white">
              <div class="w-8 h-8 border-[3px] border-slate-200 border-t-[#00a884] rounded-full animate-spin"></div>
            </div>
            <div id="qr-overlay-expired" class="hidden absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
              <p class="text-slate-900 font-bold text-sm mb-3">QR Code Expired</p>
              <button id="refresh-qr-btn" class="px-4 py-2 bg-[#00a884] text-[#0b141a] text-xs font-black rounded-lg shadow-lg active:scale-95 transition">Refresh</button>
            </div>
          </div>

          <div class="space-y-1">
            <p id="qr-status-text" class="text-[#00a884] text-sm font-bold">Waiting for scan...</p>
            <p id="qr-expiry-text" class="text-slate-500 text-[11px] font-medium tracking-wide">Expires in 120s</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

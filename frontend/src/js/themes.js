/**
 * themes.js — Chat theme manager for SivionChat
 * Applies CSS custom property-based themes to the chat panel
 */

export const THEMES = [
  { id: "dark_classic",  label: "Dark Classic",   preview: ["#0b141a", "#d3f4cf", "#ffffff"] },
  { id: "midnight_blue", label: "Midnight Blue",  preview: ["#0d1b2a", "#1d3557", "#162032"] },
  { id: "rose_gold",     label: "Rose Gold",      preview: ["#1a0f10", "#5c2334", "#2c1620"] },
  { id: "forest",        label: "Forest Green",   preview: ["#0f1f14", "#1b4332", "#162418"] },
  { id: "discord",       label: "Discord",        preview: ["#36393f", "#5865f2", "#2f3136"] },
  { id: "solarized",     label: "Solarized",      preview: ["#002b36", "#073642", "#083741"] },
];

const STORAGE_KEY = "sivionchat:theme";

export function getCurrentTheme() {
  return localStorage.getItem(STORAGE_KEY) || "dark_classic";
}

export function applyTheme(themeId) {
  const chatPanel = document.getElementById("chat-panel");
  if (!chatPanel) return;
  // Remove all existing theme attrs
  THEMES.forEach(t => chatPanel.removeAttribute(`data-theme-${t.id}`));
  chatPanel.dataset.theme = themeId;
  localStorage.setItem(STORAGE_KEY, themeId);
}

export function initTheme() {
  applyTheme(getCurrentTheme());
}

/**
 * Render the theme picker grid into the given container element
 */
export function renderThemePicker(container, onSelect) {
  if (!container) return;
  container.innerHTML = THEMES.map(t => `
    <button
      data-theme-id="${t.id}"
      class="theme-pick-btn flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition hover:scale-105 ${getCurrentTheme() === t.id ? 'border-[#00a884]' : 'border-transparent hover:border-white/20'}"
      title="${t.label}"
    >
      <div class="flex gap-1 rounded-lg overflow-hidden w-full h-10">
        ${t.preview.map(c => `<div style="background:${c};flex:1"></div>`).join("")}
      </div>
      <span class="text-xs font-medium text-slate-300">${t.label}</span>
    </button>
  `).join("");

  container.querySelectorAll(".theme-pick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const themeId = btn.dataset.themeId;
      applyTheme(themeId);
      // Update active border
      container.querySelectorAll(".theme-pick-btn").forEach(b => b.classList.replace("border-[#00a884]", "border-transparent"));
      btn.classList.replace("border-transparent", "border-[#00a884]");
      if (onSelect) onSelect(themeId);
    });
  });
}

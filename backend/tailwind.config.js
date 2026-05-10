/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../frontend/public/**/*.html",
    "../frontend/src/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        "sivion-emerald": "#00a884",
        "sivion-dark":   "#0b141a",
        "sivion-muted":  "#202c33",
        "sivion-chat":   "#efe7de",
        "sivion-panel":  "#111b21"
      }
    }
  },
  plugins: []
};

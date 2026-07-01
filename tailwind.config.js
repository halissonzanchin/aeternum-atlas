export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        blackDeep: "#0A0A0A",
        navyDeep: "#0F172A",
        graphite: "#1F2933",
        panelGray: "#2A2F36",
        agedGold: "#C6A85C",
        techTeal: "#2FB8B5",
        clinicalWhite: "#F5F5F5",
        textMuted: "#A0A7B4",
        anatomyGreen: "#4ADE80"
      },
      fontFamily: {
        display: ["Cinzel", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        premium: "0 24px 76px rgba(0, 0, 0, 0.5)",
        glow: "0 0 34px rgba(47, 184, 181, 0.12), 0 0 24px rgba(198, 168, 92, 0.1)"
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
};

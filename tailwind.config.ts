import type { Config } from "tailwindcss";

// Design tokens — identidade visual "barbearia clássica moderna"
// Fundo carvão profundo, dourado envelhecido como cor de ação,
// vermelho de poste de barbeiro reservado para "chamar próximo".
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0E0D0C",
          900: "#161412",
          800: "#201D1A",
          700: "#2C2822",
        },
        cream: "#F3ECDF",
        muted: "#9C9385",
        gold: {
          400: "#D9B570",
          500: "#C9A15A",
          600: "#A9803D",
        },
        pole: {
          red: "#A83A32",
          blue: "#2E4A5E",
        },
        good: "#5B8A63",
        warn: "#C9A15A",
        bad: "#A83A32",
      },
      fontFamily: {
        display: ["var(--font-oswald)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(0,0,0,0.5)",
      },
      keyframes: {
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(201,161,90,0.45)" },
          "70%": { boxShadow: "0 0 0 14px rgba(201,161,90,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(201,161,90,0)" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.2s ease-out infinite",
        riseIn: "riseIn 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;

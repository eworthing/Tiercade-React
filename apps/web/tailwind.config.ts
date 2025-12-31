import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic surface colors
        surface: {
          DEFAULT: "#020617", // slate-950
          soft: "#0f172a", // slate-900
          raised: "#1e293b", // slate-800
          overlay: "#0f172a", // slate-900
        },
        // Border colors
        border: {
          DEFAULT: "#334155", // slate-700
          soft: "#1e293b", // slate-800
          focus: "#3b82f6", // blue-500
        },
        // Text colors
        text: {
          DEFAULT: "#f1f5f9", // slate-100
          muted: "#94a3b8", // slate-400
          subtle: "#64748b", // slate-500
          inverse: "#020617", // slate-950
        },
        // Accent colors
        accent: {
          DEFAULT: "#3b82f6", // blue-500
          hover: "#60a5fa", // blue-400
          muted: "#1e40af", // blue-800
        },
        // Semantic colors
        success: {
          DEFAULT: "#22c55e", // green-500
          soft: "#16a34a", // green-600
          muted: "#14532d", // green-900
        },
        warning: {
          DEFAULT: "#f59e0b", // amber-500
          soft: "#d97706", // amber-600
          muted: "#78350f", // amber-900
        },
        danger: {
          DEFAULT: "#ef4444", // red-500
          soft: "#dc2626", // red-600
          muted: "#7f1d1d", // red-900
        },
      },
      spacing: {
        "tier-gap": "12px",
        "card-gap": "8px",
        "card-padding": "12px",
        "modal-padding": "24px",
      },
      borderRadius: {
        card: "8px",
        tier: "12px",
        modal: "16px",
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "14px" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["32px", { lineHeight: "40px" }],
      },
      boxShadow: {
        card: "0 2px 4px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 4px 8px rgba(0, 0, 0, 0.4)",
        modal: "0 8px 32px rgba(0, 0, 0, 0.5)",
        dropdown: "0 4px 16px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 150ms ease-out",
        "fade-out": "fadeOut 150ms ease-in",
        "slide-up": "slideUp 200ms ease-out",
        "slide-down": "slideDown 200ms ease-out",
        drop: "drop 200ms ease-out",
        shake: "shake 300ms ease-in-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        drop: {
          "0%": { transform: "scale(1.05)", opacity: "0.8" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};

export default config;

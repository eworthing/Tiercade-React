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
          overlay: "rgba(15, 23, 42, 0.95)", // slate-900 with opacity
          glass: "rgba(30, 41, 59, 0.7)", // glassmorphism
        },
        // Border colors
        border: {
          DEFAULT: "#334155", // slate-700
          soft: "#1e293b", // slate-800
          subtle: "rgba(51, 65, 85, 0.5)", // subtle borders
          focus: "#3b82f6", // blue-500
        },
        // Text colors
        text: {
          DEFAULT: "#f1f5f9", // slate-100
          muted: "#94a3b8", // slate-400
          subtle: "#64748b", // slate-500
          inverse: "#020617", // slate-950
        },
        // Accent colors with glow variants
        accent: {
          DEFAULT: "#3b82f6", // blue-500
          hover: "#60a5fa", // blue-400
          muted: "#1e40af", // blue-800
          glow: "rgba(59, 130, 246, 0.4)", // for shadows
        },
        // Semantic colors
        success: {
          DEFAULT: "#22c55e", // green-500
          soft: "#16a34a", // green-600
          muted: "#14532d", // green-900
          glow: "rgba(34, 197, 94, 0.4)",
        },
        warning: {
          DEFAULT: "#f59e0b", // amber-500
          soft: "#d97706", // amber-600
          muted: "#78350f", // amber-900
          glow: "rgba(245, 158, 11, 0.4)",
        },
        danger: {
          DEFAULT: "#ef4444", // red-500
          soft: "#dc2626", // red-600
          muted: "#7f1d1d", // red-900
          glow: "rgba(239, 68, 68, 0.4)",
        },
      },
      spacing: {
        "tier-gap": "12px",
        "card-gap": "8px",
        "card-padding": "12px",
        "modal-padding": "24px",
      },
      borderRadius: {
        card: "10px",
        tier: "14px",
        modal: "20px",
        button: "10px",
      },
      fontSize: {
        "2xs": ["11px", { lineHeight: "14px", letterSpacing: "0.01em" }],
        xs: ["12px", { lineHeight: "16px", letterSpacing: "0.01em" }],
        sm: ["14px", { lineHeight: "20px", letterSpacing: "0.005em" }],
        base: ["16px", { lineHeight: "24px", letterSpacing: "0" }],
        lg: ["20px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
        xl: ["24px", { lineHeight: "32px", letterSpacing: "-0.015em" }],
        "2xl": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em" }],
        "3xl": ["40px", { lineHeight: "48px", letterSpacing: "-0.025em" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      boxShadow: {
        // Layered shadows for depth
        card: "0 1px 2px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)",
        "card-hover": "0 4px 8px rgba(0, 0, 0, 0.25), 0 12px 24px rgba(0, 0, 0, 0.2)",
        "card-active": "0 1px 2px rgba(0, 0, 0, 0.3)",
        modal: "0 8px 16px rgba(0, 0, 0, 0.3), 0 24px 48px rgba(0, 0, 0, 0.25)",
        dropdown: "0 4px 12px rgba(0, 0, 0, 0.25), 0 8px 24px rgba(0, 0, 0, 0.2)",
        // Glow shadows
        "glow-accent": "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)",
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.3)",
        "glow-danger": "0 0 20px rgba(239, 68, 68, 0.3)",
        // Inner shadows for pressed states
        "inner-sm": "inset 0 1px 2px rgba(0, 0, 0, 0.2)",
        "inner-md": "inset 0 2px 4px rgba(0, 0, 0, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "20px",
        "2xl": "40px",
      },
      animation: {
        // Fade animations
        "fade-in": "fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        "fade-out": "fadeOut 150ms cubic-bezier(0.4, 0, 1, 1)",

        // Slide animations with spring-like overshoot
        "slide-up": "slideUp 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-down": "slideDown 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-right": "slideInRight 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-in-left": "slideInLeft 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",

        // Scale animations (like iOS)
        "scale-in": "scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "scale-out": "scaleOut 200ms cubic-bezier(0.4, 0, 1, 1)",
        "pop": "pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-in": "bounceIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",

        // Modal animations
        "modal-in": "modalIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "modal-out": "modalOut 200ms cubic-bezier(0.4, 0, 1, 1)",
        "backdrop-in": "backdropIn 300ms ease-out",
        "backdrop-out": "backdropOut 200ms ease-in",

        // Micro-interactions
        "press": "press 100ms ease-out",
        "shake": "shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97)",
        "wiggle": "wiggle 500ms ease-in-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",

        // Drag feedback
        "lift": "lift 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "drop": "drop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",

        // Loading
        "spin-slow": "spin 1.5s linear infinite",
        "shimmer": "shimmer 2s linear infinite",

        // Stagger support (use with style delay)
        "stagger-fade": "staggerFade 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
      keyframes: {
        // Fade
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },

        // Slides with spring overshoot
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(24px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-24px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },

        // Scale with spring
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        pop: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "40%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },

        // Modal
        modalIn: {
          "0%": { transform: "scale(0.95) translateY(10px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        modalOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        backdropIn: {
          "0%": { opacity: "0", backdropFilter: "blur(0px)" },
          "100%": { opacity: "1", backdropFilter: "blur(8px)" },
        },
        backdropOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },

        // Micro-interactions
        press: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.97)" },
          "100%": { transform: "scale(1)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" },
        },

        // Drag
        lift: {
          "0%": { transform: "scale(1)", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)" },
          "100%": { transform: "scale(1.03)", boxShadow: "0 12px 24px rgba(0, 0, 0, 0.3)" },
        },
        drop: {
          "0%": { transform: "scale(1.03)" },
          "50%": { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)" },
        },

        // Loading
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },

        // Stagger
        staggerFade: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionTimingFunction: {
        // Custom easing curves
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spring-soft": "cubic-bezier(0.45, 1.45, 0.55, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "snap": "cubic-bezier(0, 1, 0.5, 1)",
      },
      transitionDuration: {
        "50": "50ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
        "300": "300ms",
        "400": "400ms",
        "500": "500ms",
      },
      // Will-change utilities for 60fps
      willChange: {
        transform: "transform",
        opacity: "opacity",
        "transform-opacity": "transform, opacity",
      },
    },
  },
  plugins: [],
};

export default config;

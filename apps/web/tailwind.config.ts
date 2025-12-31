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
          overlay: "rgba(15, 23, 42, 0.95)",
          glass: "rgba(30, 41, 59, 0.7)",
          "glass-bright": "rgba(51, 65, 85, 0.5)",
        },
        // Border colors
        border: {
          DEFAULT: "#334155", // slate-700
          soft: "#1e293b", // slate-800
          subtle: "rgba(51, 65, 85, 0.5)",
          focus: "#3b82f6",
          gradient: "rgba(99, 102, 241, 0.5)", // for gradient borders
        },
        // Text colors
        text: {
          DEFAULT: "#f1f5f9", // slate-100
          muted: "#94a3b8", // slate-400
          subtle: "#64748b", // slate-500
          inverse: "#020617", // slate-950
          gradient: "#818cf8", // indigo-400 for gradient text
        },
        // MORE VIBRANT accent colors
        accent: {
          DEFAULT: "#6366f1", // indigo-500 (more vibrant than blue)
          hover: "#818cf8", // indigo-400
          muted: "#3730a3", // indigo-800
          soft: "#4f46e5", // indigo-600
          glow: "rgba(99, 102, 241, 0.5)",
          "glow-strong": "rgba(99, 102, 241, 0.7)",
        },
        // Gradient colors for premium feel
        gradient: {
          start: "#6366f1", // indigo-500
          mid: "#8b5cf6", // violet-500
          end: "#d946ef", // fuchsia-500
          "blue-start": "#3b82f6",
          "blue-end": "#06b6d4", // cyan-500
          "warm-start": "#f59e0b",
          "warm-end": "#ef4444",
        },
        // Semantic colors - MORE VIBRANT
        success: {
          DEFAULT: "#10b981", // emerald-500
          soft: "#059669", // emerald-600
          muted: "#064e3b", // emerald-900
          glow: "rgba(16, 185, 129, 0.5)",
        },
        warning: {
          DEFAULT: "#f59e0b", // amber-500
          soft: "#d97706", // amber-600
          muted: "#78350f", // amber-900
          glow: "rgba(245, 158, 11, 0.5)",
        },
        danger: {
          DEFAULT: "#ef4444", // red-500
          soft: "#dc2626", // red-600
          muted: "#7f1d1d", // red-900
          glow: "rgba(239, 68, 68, 0.5)",
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
        // PREMIUM LAYERED SHADOWS (multiple layers for realistic depth)
        "card": `
          0 1px 2px rgba(0, 0, 0, 0.06),
          0 2px 4px rgba(0, 0, 0, 0.06),
          0 4px 8px rgba(0, 0, 0, 0.06)
        `,
        "card-hover": `
          0 2px 4px rgba(0, 0, 0, 0.08),
          0 4px 8px rgba(0, 0, 0, 0.08),
          0 8px 16px rgba(0, 0, 0, 0.08),
          0 16px 32px rgba(0, 0, 0, 0.06)
        `,
        "card-lifted": `
          0 4px 6px rgba(0, 0, 0, 0.1),
          0 8px 15px rgba(0, 0, 0, 0.1),
          0 16px 30px rgba(0, 0, 0, 0.1),
          0 24px 45px rgba(0, 0, 0, 0.08)
        `,
        "modal": `
          0 4px 6px rgba(0, 0, 0, 0.1),
          0 10px 15px rgba(0, 0, 0, 0.1),
          0 20px 25px rgba(0, 0, 0, 0.1),
          0 25px 50px rgba(0, 0, 0, 0.15)
        `,
        "dropdown": `
          0 4px 6px rgba(0, 0, 0, 0.1),
          0 10px 20px rgba(0, 0, 0, 0.15),
          0 20px 40px rgba(0, 0, 0, 0.1)
        `,
        // Glow shadows with gradients
        "glow-accent": "0 0 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, 0.2)",
        "glow-accent-strong": "0 0 30px rgba(99, 102, 241, 0.6), 0 0 60px rgba(99, 102, 241, 0.3)",
        "glow-success": "0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)",
        "glow-danger": "0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)",
        "glow-gradient": "0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(99, 102, 241, 0.2)",
        // Inner shadows for pressed states
        "inner-sm": "inset 0 1px 2px rgba(0, 0, 0, 0.15)",
        "inner-md": "inset 0 2px 4px rgba(0, 0, 0, 0.2)",
        // 3D perspective shadow
        "3d": `
          0 1px 1px rgba(0, 0, 0, 0.08),
          0 2px 2px rgba(0, 0, 0, 0.08),
          0 4px 4px rgba(0, 0, 0, 0.08),
          0 8px 8px rgba(0, 0, 0, 0.08),
          0 16px 16px rgba(0, 0, 0, 0.08)
        `,
      },
      backgroundImage: {
        // Gradient backgrounds
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        // Premium gradients
        "gradient-accent": "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
        "gradient-accent-subtle": "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
        "gradient-blue": "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        "gradient-warm": "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
        "gradient-success": "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
        // Mesh gradient for backgrounds
        "gradient-mesh": `
          radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
          radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
          radial-gradient(at 0% 50%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
          radial-gradient(at 80% 50%, rgba(217, 70, 239, 0.08) 0px, transparent 50%),
          radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.1) 0px, transparent 50%)
        `,
        // Noise texture overlay
        "noise": `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        // Shimmer gradient
        "shimmer": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
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

        // Stagger animations - use with animation-delay
        "stagger-fade": "staggerFade 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "stagger-slide": "staggerSlide 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "stagger-scale": "staggerScale 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",

        // Success celebrations
        "confetti": "confetti 1s ease-out forwards",
        "sparkle": "sparkle 700ms ease-out forwards",
        "celebrate": "celebrate 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "success-check": "successCheck 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",

        // Gradient animations
        "gradient-shift": "gradientShift 3s ease infinite",
        "gradient-flow": "gradientFlow 8s ease infinite",

        // 3D perspective
        "tilt-in": "tiltIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "flip-in": "flipIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",

        // Floating/ambient
        "float": "float 3s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
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
          "100%": { opacity: "1", backdropFilter: "blur(12px)" },
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
          "0%, 100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(99, 102, 241, 0.6)" },
        },

        // Drag
        lift: {
          "0%": { transform: "scale(1) perspective(1000px) rotateX(0)", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)" },
          "100%": { transform: "scale(1.05) perspective(1000px) rotateX(2deg)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" },
        },
        drop: {
          "0%": { transform: "scale(1.05)" },
          "50%": { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)" },
        },

        // Loading
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },

        // Stagger animations
        staggerFade: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        staggerSlide: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        staggerScale: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },

        // Success celebrations
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100vh) rotate(720deg)", opacity: "0" },
        },
        sparkle: {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(0) rotate(360deg)", opacity: "0" },
        },
        celebrate: {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.1)" },
          "50%": { transform: "scale(0.95)" },
          "75%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        successCheck: {
          "0%": { transform: "scale(0) rotate(-45deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(10deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },

        // Gradient animations
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        gradientFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },

        // 3D perspective
        tiltIn: {
          "0%": { transform: "perspective(1000px) rotateX(-10deg) translateY(20px)", opacity: "0" },
          "100%": { transform: "perspective(1000px) rotateX(0) translateY(0)", opacity: "1" },
        },
        flipIn: {
          "0%": { transform: "perspective(1000px) rotateY(-90deg)", opacity: "0" },
          "100%": { transform: "perspective(1000px) rotateY(0)", opacity: "1" },
        },

        // Floating
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "spring-soft": "cubic-bezier(0.45, 1.45, 0.55, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "snap": "cubic-bezier(0, 1, 0.5, 1)",
        "expo-out": "cubic-bezier(0.16, 1, 0.3, 1)",
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
      // Perspective utilities for 3D transforms
      perspective: {
        none: "none",
        "500": "500px",
        "1000": "1000px",
        "2000": "2000px",
      },
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

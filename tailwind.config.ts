import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bccfff",
          300: "#8fadff",
          400: "#5b80ff",
          500: "#3b5bfd",
          600: "#2a3fe6",
          700: "#2230c4",
          800: "#212b9e",
          900: "#212a7d",
        },
        accent: {
          400: "#a855f7",
          500: "#9333ea",
          600: "#7e22ce",
        },
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(42, 63, 230, 0.12)",
        glow: "0 8px 30px -6px rgba(59, 91, 253, 0.45)",
        "glow-accent": "0 8px 30px -6px rgba(147, 51, 234, 0.45)",
        card: "0 2px 12px -2px rgba(17, 24, 39, 0.08)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #3b5bfd 0%, #7e22ce 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #eef4ff 0%, #f5edff 100%)",
        "shine": "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(90px) rotate(3deg) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateX(0) rotate(0deg) scale(1)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-90px) rotate(-3deg) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateX(0) rotate(0deg) scale(1)" },
        },
        "pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "bar-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-25%)" },
        },
        "ping-slow": {
          "75%, 100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-down": "fade-down 0.5s ease-out both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right": "slide-in-right 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-left": "slide-in-left 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        pop: "pop 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 4s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        "spin-slow": "spin-slow 1s linear infinite",
        "bounce-soft": "bounce-soft 1.2s ease-in-out infinite",
        "ping-slow": "ping-slow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;

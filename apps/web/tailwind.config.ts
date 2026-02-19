import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        foreground: "#0F172A",
        muted: "#64748B",
        primary: {
          DEFAULT: "#0B1739",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;

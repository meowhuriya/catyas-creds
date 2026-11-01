import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/styles/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          "surface-muted": "var(--color-surface-muted)",
          border: "var(--color-border)",
          ink: "var(--color-ink)",
          "ink-muted": "var(--color-ink-muted)",
          accent: "var(--color-accent)",
          "accent-hover": "var(--color-accent-hover)",
          success: "var(--color-success)",
          warning: "var(--color-warning)",
          danger: "var(--color-danger)",
          info: "var(--color-info)",
        },
        course: {
          slate: "#4A6B82",
          teal: "#367B74",
          olive: "#68753B",
          ochre: "#A27632",
          plum: "#744F6A",
          rust: "#9B4D36",
          graphite: "#5A6065",
          forest: "#3D6B52",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-plus-jakarta-sans)", "Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        control: "6px",
        card: "10px",
      },
      maxWidth: {
        content: "1200px",
        reading: "720px",
      },
      transitionDuration: {
        fast: "150ms",
        modal: "200ms",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        popover: "0 4px 16px -2px rgba(0, 0, 0, 0.12), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        dialog: "0 12px 32px -4px rgba(0, 0, 0, 0.20), 0 4px 8px -2px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

/**
 * Valeria's Creds - Design Tokens
 * Visual design system: Heritage Academic (quiet, serious, high-trust, rich and alive).
 * Single source of truth for colors, typography, spacing, and component geometry.
 * No emojis, no cartoon art, no decorative gradients.
 */

export const TOKENS = {
  name: "Valeria’s Creds",
  tagline: "LEARNING PORTAL",
  colors: {
    light: {
      background: "#F6F3EE", // Warm parchment
      surface: "#FFFFFF",
      surfaceMuted: "#EFEBE4", // Surface-2
      border: "#E2DDD3",
      ink: "#14161F",
      inkMuted: "#5E6472",
      accent: "#A51C30", // Academic Crimson
      accentHover: "#8A1627",
      burgundy: "#3A0F1B",
      gold: "#C79A3B",
      success: "#1F7A4D",
      warning: "#B7791F",
      danger: "#B42318",
      info: "#2F5D8A",
    },
    dark: {
      background: "#0F1117",
      surface: "#171A22",
      surfaceMuted: "#1F232D", // Surface-2
      border: "#282D3A",
      ink: "#F0EDE6",
      inkMuted: "#9BA1B0",
      accent: "#E0657A", // Rose Crimson
      accentHover: "#EA7C8F",
      burgundy: "#2B0D17",
      gold: "#D9B25A",
      success: "#2E9E68",
      warning: "#D9942C",
      danger: "#E0483B",
      info: "#4E85BD",
    },
    hero: {
      gradient: "linear-gradient(135deg, #2B0D17, #5A1426)",
      goldHairline: "1px solid rgba(199, 154, 59, 0.4)",
    },
    // 8 Muted Course Color Tags - shown ONLY as a thin 4px bar or small 6px dot
    courseTags: {
      slate: { id: "slate", label: "Slate Blue", hex: "#3E5C8A" },
      teal: { id: "teal", label: "Teal", hex: "#1F7A7A" },
      olive: { id: "olive", label: "Olive", hex: "#687B2E" },
      ochre: { id: "ochre", label: "Ochre", hex: "#B8821F" },
      plum: { id: "plum", label: "Plum", hex: "#7A3F6E" },
      rust: { id: "rust", label: "Rust", hex: "#B04A2F" },
      graphite: { id: "graphite", label: "Graphite", hex: "#4B5563" },
      forest: { id: "forest", label: "Forest", hex: "#2F6B4A" },
    },
  },
  typography: {
    fonts: {
      serif: "var(--font-source-serif-4)",
      sans: "var(--font-inter)",
    },
    scales: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "20px",
      xl: "24px",
      "2xl": "32px",
      "3xl": "44px",
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      reading: 1.6,
    },
  },
  geometry: {
    radii: {
      control: "6px",
      card: "14px",
    },
    borderWidth: "1px",
    gridUnit: 8, // 8px grid
    maxWidth: {
      content: "1200px",
      reading: "720px",
    },
  },
  motion: {
    hover: "150ms ease",
    dialog: "200ms ease",
    pageTransition: "250ms ease",
  },
} as const;

export type CourseTagKey = keyof typeof TOKENS.colors.courseTags;

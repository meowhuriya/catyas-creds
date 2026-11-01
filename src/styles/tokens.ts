/**
 * Valeria's Creds - Design Tokens
 * Visual design system: Heritage Academic (quiet, serious, high-trust, rich and alive).
 * Single source of truth for colors, typography, spacing, and component geometry.
 * No emojis, no cartoon art, no decorative gradients.
 */

export const TOKENS = {
  name: "Valeria's Creds",
  tagline: "LEARNING PORTAL",
  colors: {
    light: {
      background: "#FAF4EC", // Warm linen cream from gingham & babushka
      surface: "#FFFFFF",
      surfaceMuted: "#F3E8DC", // Soft linen oat
      border: "#E5D5C5", // Warm woven linen border
      ink: "#1D1618", // Deep cat espresso ink
      inkMuted: "#6B575A", // Muted cocoa ink
      accent: "#A6192E", // Vintage Gingham Red / Strawberry
      accentHover: "#881324",
      burgundy: "#3D0D14", // Deep rich berry burgundy
      gold: "#D89520", // Babushka mustard gold
      success: "#44724E", // Scarf strawberry leaf sage
      warning: "#D89520", // Babushka mustard
      danger: "#B3202C", // Gingham red
      info: "#4A7A96", // Cat blue eye azure
    },
    dark: {
      background: "#161113",
      surface: "#201A1C",
      surfaceMuted: "#2B2225",
      border: "#3B2E32",
      ink: "#FAF4EC",
      inkMuted: "#AB9A9D",
      accent: "#E25F70", // Strawberry rose
      accentHover: "#EE7584",
      burgundy: "#280A0E",
      gold: "#F0B533", // Mustard gold
      success: "#558B61",
      warning: "#F0B533",
      danger: "#E84D58",
      info: "#6BA7C7",
    },
    hero: {
      gradient: "linear-gradient(135deg, #380C13, #631724)",
      goldHairline: "1px solid rgba(216, 149, 32, 0.45)",
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

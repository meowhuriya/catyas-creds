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
      background: "#FFF4DE", // Warm cream from Color Hunt
      surface: "#FFFFFF",
      surfaceMuted: "#FFDDDD", // Pale blush pink from Color Hunt
      border: "#FFE8C4", // Soft peach from Color Hunt
      ink: "#14161F",
      inkMuted: "#5E6472",
      accent: "#D85870", // Signature Rose derived from #FFCED8
      accentHover: "#BF4058",
      burgundy: "#4A1521",
      gold: "#FFE8C4", // Soft peach gold from Color Hunt
      success: "#1F7A4D",
      warning: "#B7791F",
      danger: "#B42318",
      info: "#2F5D8A",
    },
    dark: {
      background: "#181113",
      surface: "#22181C",
      surfaceMuted: "#2D2025",
      border: "#3D2C33",
      ink: "#FFF4DE", // Warm cream from Color Hunt
      inkMuted: "#BAA6AA",
      accent: "#FFCED8", // Soft Rose from Color Hunt
      accentHover: "#FFDDDD", // Pale blush pink from Color Hunt
      burgundy: "#2D1016",
      gold: "#FFE8C4", // Soft peach gold from Color Hunt
      success: "#2E9E68",
      warning: "#D9942C",
      danger: "#E0483B",
      info: "#4E85BD",
    },
    hero: {
      gradient: "linear-gradient(135deg, #3D141D, #6B2332)",
      goldHairline: "1px solid rgba(255, 232, 196, 0.45)",
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

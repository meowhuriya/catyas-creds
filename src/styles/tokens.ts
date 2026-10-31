/**
 * Catya's Creds - Design Tokens
 * Visual design system: Quiet, high-trust academic office.
 * Single source of truth for colors, typography, spacing, and component geometry.
 * No emojis, no cartoon art, no decorative gradients.
 */

export const TOKENS = {
  colors: {
    light: {
      background: "#FAFAF8",
      surface: "#FFFFFF",
      surfaceMuted: "#F3F2EE",
      border: "#E4E2DC",
      ink: "#1B1F2A",
      inkMuted: "#5B6070",
      accent: "#A51C30", // Academic Crimson
      accentHover: "#8A1627",
      success: "#1F7A4D",
      warning: "#B7791F",
      danger: "#B42318",
      info: "#2F5D8A",
    },
    dark: {
      background: "#14161B",
      surface: "#1B1E25",
      surfaceMuted: "#232731",
      border: "#2E3340",
      ink: "#ECEAE4",
      inkMuted: "#9AA0AE",
      accent: "#D4586B", // Dark mode Crimson
      accentHover: "#E06D7E",
      success: "#2E9E68",
      warning: "#D9942C",
      danger: "#E0483B",
      info: "#4E85BD",
    },
    // 8 Muted Course Color Tags - shown ONLY as a thin 4px bar or small 6px dot
    courseTags: {
      slate: { id: "slate", label: "Slate Blue", hex: "#4A6B82" },
      teal: { id: "teal", label: "Teal", hex: "#367B74" },
      olive: { id: "olive", label: "Olive", hex: "#68753B" },
      ochre: { id: "ochre", label: "Ochre", hex: "#A27632" },
      plum: { id: "plum", label: "Plum", hex: "#744F6A" },
      rust: { id: "rust", label: "Rust", hex: "#9B4D36" },
      graphite: { id: "graphite", label: "Graphite", hex: "#5A6065" },
      forest: { id: "forest", label: "Forest", hex: "#3D6B52" },
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
      card: "10px",
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
  },
} as const;

export type CourseTagKey = keyof typeof TOKENS.colors.courseTags;
